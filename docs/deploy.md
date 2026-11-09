# Deploy de produção

| Componente | Onde | Endereço |
|---|---|---|
| Frontend | Vercel (integração Git, branch `main`) | https://software.tbfernandes.com.br |
| Backend | AWS EC2 `i-081a4742447fc6d9f` (t3.small, `eu-north-1`), Docker Compose | https://api.software.tbfernandes.com.br |
| Banco | PostgreSQL 17 no mesmo Compose, rede interna, sem porta publicada | — |
| HTTPS da API | Caddy com Let's Encrypt (renovação automática) | — |
| DNS | Hostinger: `software` CNAME para a Vercel, `api.software` A para o Elastic IP `16.170.175.200` | — |

## Como funciona o deploy do backend

1. Push na `main` → workflow **CI** (lint, typecheck, testes, e2e, build, imagens).
2. CI verde → workflow **deploy-api** constrói a imagem do backend e publica no GHCR
   (`ghcr.io/thiagobfernandes/tbfernandes-backend`) com as tags `tree-<hash da pasta tbfernandes-backend>`,
   `sha-<commit>` e `prod`. Se a pasta do backend não mudou, reaproveita a imagem e não reinicia nada.
3. Na EC2, o `tbf-deploy.timer` roda `/srv/tbfernandes/bin/tbf-deploy` a cada minuto: baixa `prod`,
   e se a imagem mudou faz um backup do banco (`backups/pre-deploy/`, ficam os 5 últimos), sobe a
   versão nova e espera o health check. Se não ficar saudável, volta para a imagem anterior.
4. O resultado vai para `https://api.software.tbfernandes.com.br/deploy-status`. O workflow espera esse
   status e falha se o deploy não ficar saudável ou não acontecer em 10 minutos.

Por que pull e não push: o SCP gerenciado do projeto AWS não permite criar o provedor OIDC do GitHub,
e assim nenhuma credencial da AWS ou chave SSH fica no GitHub. O SSH aceita só o IP do Thiago.

As migrações (Flyway) rodam quando o backend sobe; o backup pré-deploy fica antes delas.

O frontend é publicado pela própria Vercel a cada push na `main`, sem workflow no GitHub.
Variáveis na Vercel (Production): `NEXT_PUBLIC_API_URL=https://api.software.tbfernandes.com.br`,
`NEXT_PUBLIC_DATA_SOURCE=api`, `NEXT_PUBLIC_PLUGGY_SANDBOX=false`.

## Arquivos

| No repositório | Na EC2 |
|---|---|
| `deploy/compose.prod.yaml` | `/srv/tbfernandes/compose.prod.yaml` |
| `deploy/Caddyfile` | `/srv/tbfernandes/Caddyfile` |
| `deploy/bin/tbf-deploy` | `/srv/tbfernandes/bin/tbf-deploy` |
| `deploy/systemd/tbf-deploy.{service,timer}` | `/etc/systemd/system/` |
| `tbfernandes-backup/backup.sh` | `/srv/tbfernandes/backup.sh` |
| `deploy/.env.prod.example` | `/srv/tbfernandes/.env` (chmod 600, segredos, fora do git) |

Mudou um desses arquivos? Copie para a EC2 (`scp`) e rode
`docker compose -f compose.prod.yaml --env-file .env up -d`. Só a imagem do backend é automática.

O cookie de sessão e o `XSRF-TOKEN` usam `TBF_COOKIE_DOMAIN=.software.tbfernandes.com.br`: a API e o
frontend ficam em subdomínios diferentes e o frontend precisa ler o token CSRF.

## Operação

```bash
ssh -i ~/dev/thiago-dev.pem ubuntu@16.170.175.200
cd /srv/tbfernandes
alias dc='docker compose -f compose.prod.yaml --env-file .env'

dc ps                                 # estado e health de cada serviço
dc logs -f --tail 200 backend         # logs da API (também caddy, postgres, backup)
journalctl -u tbf-deploy -n 100       # histórico dos deploys automáticos
cat status/deploy-status.json         # último deploy
dc restart backend                    # reinicia a API (encerra as sessões, que ficam em memória)
dc up -d                              # sobe tudo de novo depois de mudar compose ou Caddyfile
bin/tbf-deploy --force                # reaplica a imagem prod agora
```

Sem SSH (IP mudou): AWS Console → EC2 → instância → Connect → Session Manager, ou atualize a regra
da porta 22 no security group `sg-0800c2055eac4aecf` com o novo IP.

Os containers têm `restart: unless-stopped` e o Docker sobe com a máquina. Logs do Docker giram
em 5 arquivos de 10 MB (`/etc/docker/daemon.json`).

## Rollback

- GitHub → Actions → **deploy-api** → *Run workflow* com o commit antigo em `ref`. A imagem daquele
  commit volta a ser `prod` e a EC2 aplica em até um minuto.
- Na EC2, sem GitHub: `docker tag tbfernandes-backend:previous tbfernandes-backend:current && dc up -d backend`.
  O timer reaplica `prod` só quando ela mudar de novo.
- Migração que já rodou não é desfeita pelo rollback da imagem. Se precisar, restaure o backup pré-deploy.

## Backup e restauração

O serviço `backup` faz um `pg_dump` a cada 10 minutos em `/srv/tbfernandes/backups/` (fica só o último)
e o deploy guarda os 5 últimos em `backups/pre-deploy/`. Ficam no mesmo disco da instância: para ter
cópia fora dela, baixe periodicamente:

```bash
scp -i ~/dev/thiago-dev.pem 'ubuntu@16.170.175.200:/srv/tbfernandes/backups/tbfernandes-*.dump' ./backups/
```

Backup manual: `dc exec backup sh /usr/local/bin/backup.sh now`.

Restaurar (substitui os dados atuais):

```bash
dc stop backend
dc exec backup sh /usr/local/bin/backup.sh restore                      # o último
dc exec backup sh /usr/local/bin/backup.sh restore pre-deploy/<arq>.dump  # um específico
dc start backend
```

## Recursos AWS do projeto

Elastic IP `eipalloc-0d665a8731bf01bf7`, disco de 20 GB gp3, perfil de instância `tbfernandes-ec2`
(só `AmazonSSMManagedInstanceCore`), security group com 80/443 abertos e 22 restrito. Todos com a tag
`Project=tbfernandes-software`. Um Elastic IP solto (instância parada ou desassociado) é cobrado.

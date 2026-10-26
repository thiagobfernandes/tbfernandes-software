# Etapa 6 — Login, paginação e perfil de produção

Data: 2026-10-26 · Itens: IDN-01, IDN-02, IDN-03, PLT-09, PLT-11

## Objetivo

Deixar a API pronta para rodar fora da máquina local: login, dados isolados por conta, configurações do usuário, paginação e um perfil `prod` sem nenhum segredo no repositório.

## O que foi feito

| Item | Mudança | Onde |
|---|---|---|
| IDN-01 | Spring Security com dois modos (`tbf.auth.mode`). Em `session`: `POST /auth/login`, `POST /auth/logout`, `GET /auth/session` (diz o modo e entrega o cookie CSRF). Sessão em cookie HttpOnly, SameSite=Lax, 7 dias; CSRF no padrão SPA do Spring Security 7; 401 em Problem Details. | `identity/adapter/in/security`, `AuthController` |
| IDN-02 | O dono da requisição vem da sessão (`SecurityOwnerContext`). Em `single-user`, continua sendo `tbf.auth.owner-id`. Nenhum outro módulo mudou. | `SecurityOwnerContext` |
| IDN-03 | `GET/PUT /me` (nome, e-mail, idioma, fuso) e `PUT /me/password` (exige a senha atual, RN-25). | `ProfileService`, `MeController` |
| — | Conta inicial por configuração (`TBF_AUTH_BOOTSTRAP_EMAIL`, `TBF_AUTH_BOOTSTRAP_PASSWORD`, `TBF_AUTH_BOOTSTRAP_NAME`): cria a conta ou dá senha à conta do seed. Sem cadastro público. | `AccountBootstrap` |
| PLT-09 | Toda listagem aceita `page` e `size` (máx. 200); totais nos cabeçalhos `X-Total-Count`, `X-Page`, `X-Page-Size`. Sem `page`, a lista vem inteira, como o frontend usa hoje. | `PagingAdvice` |
| PLT-11 | `application-prod.yaml`: banco só por variáveis, logs JSON (ECS), Swagger desligado, cookie `Secure`, modo `session` obrigatório, sem seed. | `application-prod.yaml` |

## Banco (V10)

`identity.app_user.password_hash` (BCrypt via `DelegatingPasswordEncoder`, que permite trocar o algoritmo depois sem invalidar senhas antigas).

## Como usar

```bash
# local, sem login (padrão)
./mvnw spring-boot:run

# local, com login
TBF_AUTH_MODE=session TBF_AUTH_BOOTSTRAP_EMAIL=owner@tbfernandes.local \
TBF_AUTH_BOOTSTRAP_PASSWORD='uma frase longa qualquer' ./mvnw spring-boot:run

# produção
SPRING_PROFILES_ACTIVE=prod TBF_DB_URL=jdbc:postgresql://... TBF_DB_USER=... TBF_DB_PASSWORD=... \
TBF_AUTH_BOOTSTRAP_EMAIL=... TBF_AUTH_BOOTSTRAP_PASSWORD=... TBF_CORS_ORIGINS=https://... java -jar target/tbfernandes-api.jar
```

## Decisões

- **Sessão em cookie, não JWT**: o frontend já manda `credentials: "include"`, é um usuário e um servidor. Sessão é revogável no logout e não expõe token ao JavaScript.
- **CSRF ligado em `session`**: `localhost:3000` e `localhost:8080` são o mesmo "site" para o navegador, então SameSite sozinho não protege. O frontend lê `XSRF-TOKEN` e manda `X-XSRF-TOKEN`.
- **Senha por tamanho** (12+), sem regras de composição, seguindo NIST SP 800-63B.
- **Exportar e importar dados (IDN-04, IDN-05) ficam no frontend**: é ele que conhece o formato `AppData` e o `localStorage` do modo simulado. A API já tem todos os endpoints de que ele precisa.
- **Paginação na borda**: a lista é cortada depois da consulta. Com o volume de um usuário isso é suficiente e não muda o formato do corpo; módulos com listas grandes devem paginar em SQL.

## Testes

`SessionAuthIntegrationTests` (2): 401 sem sessão, 403 sem CSRF, 401 com senha errada, login e `/me`, isolamento entre duas contas (404 para o dado do outro). `WorkApiIntegrationTests` ganhou o teste de paginação. Suíte: 35 testes passando.

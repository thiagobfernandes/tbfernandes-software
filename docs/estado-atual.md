# Estado atual

Atualizado em 2026-11-03. Atualize esta página ao terminar uma etapa.

## O que existe

- **Frontend** completo para todos os módulos: Trabalho (empresas, projetos com timeline, tarefas com lista, quadro e agrupamento por projeto), Conhecimento (notas, snippets, grafo, métodos), Crescimento (metas, aprendizado, certificações), Finanças (fluxo de caixa, compras planejadas), Rede (contatos), Assistente, Calendário (mês, semana e dia, com arrastar para agendar e rotinas na grade: do horário até a meta de minutos, marcáveis ali), Apontamentos (cronômetro em tempo real, troca de atividade, lançamento manual e indicador no cabeçalho), Rotinas (atividades diárias marcadas por dia, com sequência, meta de tempo e cronômetro ligado a tarefa e projeto, e vínculo opcional com meta, que mostra as rotinas e a sequência), busca global `Ctrl K`, visão geral com cards de vida, arrastar no quadro (mouse e toque), configurações com exportar/importar.
- **Grafo estilo Obsidian**: links `[[Título]]` entre notas, snippets e métodos, nós de métodos, estudos, habilidades e tags, zoom na roda e na pinça, arrastar nós, grafo local de 1 ou 2 saltos e grafo local na leitura da nota.
- **Interface em pt-BR** (patch 0016) e mensagens da API e respostas do assistente em pt-BR (0017).
- **Backend** (escrito em Java e reescrito em NestJS, abaixo) com as etapas 1 a 11 do [backlog](backend/backlog.md#sequência-sugerida): todos os módulos com API, Flyway, testes (89), CI, OpenAPI, login por sessão, perfil `prod`, assistente por regras, grafo, Open Finance pela Pluggy e assistente com IA por consultas estruturadas (os dois últimos desligados por padrão).
- **Frontend ligado à API** com `NEXT_PUBLIC_DATA_SOURCE=api` (etapa 9). O modo local continua o padrão fora do Docker.
- **Docker Compose na raiz**: banco, backend, frontend e nginx em um comando, com `/` no frontend e `/api` no backend ([como rodar](como-rodar.md)). As pastas agora são `tbfernandes-backend/`, `tbfernandes-frontend/` e `tbfernandes-nginx/`.
- **App desktop para Windows** em andamento (Tauri + PostgreSQL embutido, [desktop.md](desktop.md)). Etapas 1 a 4 feitas: janela Tauri em `tbfernandes-desktop/` com instalador gerado pelo workflow `desktop`, backup diário do banco em `Documentos\TBFernandes\backups`; o frontend exporta como estático com `npm run build:desktop` (páginas de detalhe com `?id=`), e o backend tem o perfil `desktop` com PostgreSQL embutido, token por abertura e desligamento junto com o app.
- **Backend em NestJS** (ADR-009, [migração](backend/implementacao/migracao-nestjs.md)): `tbfernandes-backend/` tem todos os módulos com o mesmo banco e o mesmo JSON do antigo backend Java, que foi removido. O compose, o CI e o app desktop (com Node embutido) usam o NestJS.

Detalhes de cada etapa: [backend/implementacao](backend/implementacao/README.md).

## Em aberto

| Item | Descrição |
|---|---|
| FIN-OF: validação real | Código pronto ([etapa 7](backend/implementacao/etapa-7-open-finance.md)), testado contra o contrato documentado. Falta rodar com credenciais da Pluggy e registrar o webhook. Categorias vêm em inglês |
| AST-03: validação real | Código pronto ([etapa 10](backend/implementacao/etapa-10-assistente-ia.md)), testado contra o contrato da API em um servidor local. Falta rodar com uma chave da Anthropic |
| Deploy com HTTPS | O compose está pronto para deploy, mas o nginx escuta só na porta 80. O certificado ainda não foi definido |
| AST-04: validação real | RAG pronto ([etapa 11](backend/implementacao/etapa-11-rag.md)), testado com servidores locais no lugar da Voyage e da Anthropic. Configuração gratuita (Groq + Ollama) disponível e testada contra a Groq com `openai/gpt-oss-120b`; falta validar as respostas com dados reais |
| Chaves no app desktop | As chaves de IA só entram por variável de ambiente do Windows. Falta uma tela de configurações para elas |
| PLT-07 | Job de verificação de referências órfãs entre módulos |
| IDN-06 | Limitar tentativas de login |
| Datas de exemplo | No modo local o "hoje" é `SAMPLE_TODAY` (2026-10-23); dados de exemplo ainda usam datas fixas |

## Como o código chega ao repositório

- Repositório: `github.com/thiagobfernandes/tbfernandes-software`. Cópia local do Thiago no WSL em `~/projects/tbfernandes-software`.
- O trabalho é feito e commitado direto nessa cópia. O push é o Thiago quem faz. Os patches `00NN-*.patch` ficaram para trás: o último foi o 0018.

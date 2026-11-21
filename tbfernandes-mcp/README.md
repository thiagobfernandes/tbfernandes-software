# tbfernandes-mcp

Servidor MCP (stdio) que deixa o Claude ler e gravar no TBFernandes Software em produção: notas, estudos, materiais, metas e marcos.

## Configuração

Credenciais **fora do repositório**, em `~/.config/tbfernandes-mcp/.env` (permissão 600):

```
TBF_API_URL=https://api.software.tbfernandes.com.br/api/v1
TBF_WEB_URL=https://software.tbfernandes.com.br
TBF_EMAIL=...
TBF_PASSWORD=...
```

Outro caminho: `TBF_ENV_FILE=/caminho/.env`. Variáveis de ambiente já definidas têm prioridade.

## Instalar no Claude Code

```bash
cd tbfernandes-mcp && npm install
claude mcp add --scope user tbfernandes -- node "$PWD/src/index.ts"
npm run smoke   # teste só de leitura contra a API
```

TypeScript estrito rodado direto pelo Node (≥ 22.18, sem etapa de build). Antes de terminar uma mudança:

```bash
npm run lint && npm run typecheck && npm run smoke
```

O ESLint aplica as mesmas regras de clean code do backend ([padrões](../docs/padroes-de-codigo.md#clean-code)).

## Estrutura

```
src/
├── index.ts           sobe o servidor stdio
├── config/            leitura do .env e das variáveis
├── api/               cliente HTTP (sessão, cookies, XSRF, query string)
├── errors/            uma classe de erro por arquivo
└── tools/             uma área por arquivo (<area>.tools.ts), schemas e defineTool
```

## Ferramentas

| Área      | Ferramentas                                                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Notas     | `list_notes`, `get_note`, `create_note`, `update_note`, `append_to_note`, `delete_note`                                                  |
| Snippets  | `list_snippets`, `get_snippet`, `create_snippet`, `update_snippet`                                                                       |
| Estudos   | `list_studies`, `create_study`, `update_study`                                                                                           |
| Materiais | `list_materials`, `create_material`, `update_material`                                                                                   |
| Finanças  | `list_finance_entries`, `create_finance_entries` (parcelas e gastos fixos por N meses), `update_finance_entry`, `delete_finance_entries` |
| Metas     | `list_goals`, `create_goal`, `list_milestones`, `create_milestone`, `update_milestone`                                                   |

Autenticação: modo `session` da API (`GET /auth/session` → cookie `XSRF-TOKEN`, `POST /auth/login` com `X-XSRF-TOKEN` → cookie `TBF_TOKEN`). Em 401 o servidor faz login de novo uma vez. As edições (`update_*`) leem o registro e enviam o `PUT` completo, então campos omitidos são mantidos.

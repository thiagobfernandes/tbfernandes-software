# Estado atual

Atualizado em 2026-10-30. Atualize esta página ao terminar uma etapa.

## O que existe

- **Frontend** completo para todos os módulos: Trabalho (empresas, projetos com timeline, tarefas com lista e quadro), Conhecimento (notas, snippets, grafo, métodos), Crescimento (metas, aprendizado, certificações), Finanças (fluxo de caixa, compras planejadas), Rede (contatos), Assistente, Calendário, busca global `Ctrl K`, visão geral com cards de vida, arrastar no quadro (mouse e toque), configurações com exportar/importar.
- **Interface em pt-BR** (patch 0016) e mensagens da API e respostas do assistente em pt-BR (0017).
- **Backend** com as etapas 1 a 9 do [backlog](backend/backlog.md#sequência-sugerida): todos os módulos com API, Flyway, testes (74), CI, OpenAPI, login por sessão, perfil `prod`, assistente por regras, grafo e Open Finance pela Pluggy (desligado por padrão).
- **Frontend ligado à API** com `NEXT_PUBLIC_DATA_SOURCE=api` (etapa 9). O modo local continua o padrão.

Detalhes de cada etapa: [backend/implementacao](backend/implementacao/README.md).

## Em aberto

| Item | Descrição |
|---|---|
| FIN-OF: validação real | Código pronto ([etapa 7](backend/implementacao/etapa-7-open-finance.md)), testado contra o contrato documentado. Falta rodar com credenciais da Pluggy e registrar o webhook. Categorias vêm em inglês |
| AST-03 | Assistente com IA (porta `LanguageModel` pronta, adaptador `none`) |
| AST-04 | pgvector e embeddings de notas e snippets |
| PLT-07 | Job de verificação de referências órfãs entre módulos |
| IDN-06 | Limitar tentativas de login |
| Datas de exemplo | No modo local o "hoje" é `SAMPLE_TODAY` (2026-10-23); dados de exemplo ainda usam datas fixas |
| Mensagens restantes em inglês | Algumas `BusinessRuleViolation` ainda têm texto em inglês (ex.: RN-02, RN-03, RN-17, RN-19 em `Require`, `ProjectService`, `PurchaseGoal`, `Goal`, `GoalService`) |

## Como o código chega ao repositório

- Repositório: `github.com/thiagobfernandes/tbfernandes-software`. Cópia local do Thiago no WSL em `~/projects/tbfernandes-software`.
- O trabalho é feito e commitado direto nessa cópia. O push é o Thiago quem faz. Os patches `00NN-*.patch` ficaram para trás: o último foi o 0018.

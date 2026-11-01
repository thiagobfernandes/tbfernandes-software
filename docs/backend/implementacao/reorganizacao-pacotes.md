# Reorganização dos pacotes do backend

Pedido do Thiago (2026-11-01): sair do padrão de portas e adaptadores (`adapter/in`, `adapter/out`) e usar pastas mais diretas. Decisão registrada no [ADR-008](../arquitetura.md#adr-008--pacotes-infrastructure-protocols-e-web-no-lugar-de-adapterin-e-adapterout).

## O que mudou

| Antes | Depois |
|---|---|
| `<modulo>/adapter/in/web/*Controller` | `<modulo>/web/*Controller` |
| records de request/response dentro dos controllers | `<modulo>/protocols/<Nome>.java`, um record público por arquivo |
| `<modulo>/adapter/out/persistence` | `<modulo>/infrastructure/persistence` |
| `<Agregado>PersistenceAdapter` | `<Agregado>RepositoryImpl` |
| `finance/adapter/out/pluggy`, `assistant/adapter/out/model` | `finance/infrastructure/pluggy`, `assistant/infrastructure/model` |
| `identity/adapter/in/security` | `identity/infrastructure/security` |
| `application/port/out/OpenFinanceGateway`, `LanguageModel` | `application/OpenFinanceGateway`, `application/LanguageModel` |
| `shared/infrastructure/web/Resource` | `shared/protocols/Resource` (é um DTO usado pelos `protocols` dos módulos) |
| `knowledge/adapter/in/web/Sorted` | `knowledge/protocols/Sorted` (só os DTOs usam) |

Nenhuma rota, JSON, tabela ou migração mudou.

## Testes

`ArchitectureTests` agora verifica:

- `domain` não depende de Spring, JPA, `application`, `infrastructure`, `protocols` nem `web`;
- `application` não depende de `infrastructure`, `protocols`, `web`, JPA nem Spring Web;
- `protocols` não depende de Spring, JPA, `infrastructure` nem `web`;
- não existe nenhum pacote `adapter` ou `port`.

Os testes de integração que estavam em `adapter/...` foram movidos junto (`work/web/WorkApiIntegrationTests`, `finance/infrastructure/pluggy/PluggyOpenFinanceGatewayTest`, `assistant/infrastructure/model/AnthropicLanguageModelTest`).

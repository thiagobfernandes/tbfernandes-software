# Etapa 3 — Knowledge

Data: 2026-10-26 · Itens: KNW-01, KNW-02, KNW-03, KNW-04, KNW-06, KNW-07

## Objetivo

Notas, snippets e métodos na API, com vínculos a projetos e tarefas, busca por texto e por tag, e limpeza automática dos vínculos quando um projeto ou tarefa é excluído.

## O que foi feito

| Item | Mudança | Onde |
|---|---|---|
| KNW-01 | `/notes`: CRUD de notas em Markdown. Tags normalizadas (minúsculas, sem repetição, até 40 caracteres). | `Note`, `NoteService`, `NoteController` |
| KNW-02 | `/snippets`: CRUD; o código é guardado exatamente como enviado, sem trim (RN-11); a linguagem é salva em minúsculas. | `Snippet`, `SnippetService`, `SnippetController` |
| KNW-03 | `projectIds` e `taskIds` em notas e snippets, validados via `WorkLookup` (404 se o item não existir ou for de outro dono). | `KnowledgeLinks`, `LinkValidator` |
| KNW-04 | `GET /notes?q=&tag=` e `GET /snippets?q=&language=&tag=`. Busca de texto com `tsvector` (dicionário `simple`) mais prefixo no título. | `V8__knowledge_links_and_search.sql`, `SpringDataRepositories` |
| KNW-06 | Ouvinte de `TaskDeleted` e `ProjectDeleted` remove o vínculo e mantém a nota/snippet. Roda depois do commit da exclusão, com nova tentativa pelo registro de eventos. | `WorkItemDeletedListener` |
| KNW-07 | `/methods`: CRUD com passos ordenados (pelo menos um) e exemplos literais. | `Method`, `MethodService`, `MethodController` |

## Mudança de banco (V8)

A tabela `knowledge.item_link` usava uma coluna discriminadora (`item_type`) para guardar vínculos de notas e de snippets juntos. O JPA não consegue gravar esse formato como coleção simples, então a V8:

1. cria `knowledge.note_link` e `knowledge.snippet_link`, com FK e `ON DELETE CASCADE`;
2. copia as linhas existentes de `item_link`;
3. apaga `item_link`;
4. adiciona a coluna gerada `search tsvector` com índice GIN em `note` e `snippet`.

A V3 não foi alterada: migrações já aplicadas nunca mudam. Quem já rodou a etapa 1 recebe a V8 normalmente.

## Outras mudanças

- `AuditedEntity` foi para `shared.infrastructure.persistence`, para os módulos não copiarem as colunas comuns.
- O seed de `dev` agora é gerado por um script versionado: `api/scripts/dev-seed/generate.sh` lê `web/src/lib/sample-data` e escreve `R__dev_seed.sql`. Rode de novo sempre que os dados de exemplo do frontend mudarem.

## Decisões

- **Grafo (KNW-05) adiado para o módulo assistant**: o grafo do frontend junta metas, empresas, projetos, tarefas, notas, snippets e contatos. Um endpoint desses lê quase todos os módulos, que é exatamente o papel do assistant (etapa 8). Colocar no knowledge criaria dependências de knowledge para goals e contacts.
- **Busca com dicionário `simple`**: as notas misturam português, inglês e nomes de código. Stemming de um idioma só atrapalharia.

## Testes

`KnowledgeApiIntegrationTests` (4 cenários): busca por texto e tag e remoção do vínculo após excluir o projeto, vínculo para tarefa inexistente, código preservado byte a byte, ordem dos passos do método. Suíte: 19 testes passando.

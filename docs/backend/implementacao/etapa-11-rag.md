# Etapa 11 — RAG: respostas a partir das notas e snippets

Data: 2026-11-01 · Item: AST-04

## Objetivo

Responder perguntas abertas ("como configurei o Docker no WSL?", "o que anotei sobre Raft?") com o conteúdo das notas e snippets, mostrando de qual registro saiu cada parte da resposta. As perguntas de consulta (tarefas, metas, dinheiro) continuam no caminho da etapa 10.

## Fluxo de uma pergunta

1. Se o modelo transforma a pergunta em uma consulta (`StructuredQuery`), ela roda como na etapa 10.
2. Se as regras entendem a pergunta (um projeto pelo nome ou uma das intenções fixas), as regras respondem.
3. Senão, **RAG**:
   1. `KnowledgeRetrieval` atualiza o índice: notas e snippets novos ou alterados são quebrados em trechos e viram vetores; os apagados saem do índice.
   2. A pergunta vira um vetor e `PassageRanker` escolhe até 6 trechos (no máximo 2 por registro) pela busca híbrida.
   3. Com um modelo de IA, `LanguageModel.answerFromPassages` escreve a resposta só com os trechos, citando `[n]`. `GroundedAnswer.fromModel` renumera as citações na ordem das fontes e remove citações de trechos que não existem. `source: "rag"`.
   4. Sem modelo, ou se ele falhar, a resposta lista os registros encontrados com o trecho de cada um. `source: "search"`.
4. Se nenhum trecho for relevante, a busca por palavras das regras responde, como antes.

## O que foi feito

| Mudança | Onde |
|---|---|
| Nota ou snippet como documento do índice, com impressão digital (SHA-256 de título, texto e modelo de embeddings) | `domain/KnowledgeDocument` |
| Quebra em trechos de até 1.200 caracteres, por parágrafo e depois por frase | `domain/TextChunker` |
| Busca híbrida: BM25 sobre as palavras (sem acento, sem palavras vazias) + cosseno dos vetores | `domain/PassageRanker` |
| Resposta com citações renumeradas, ou com os trechos quando não há modelo | `domain/GroundedAnswer` |
| `Reference` ganha `excerpt` (o trecho usado) | `domain/Answer` |
| `RuleBasedAssistant.understands` diz se as regras têm uma resposta específica | `domain/RuleBasedAssistant` |
| Portas `EmbeddingModel` e `KnowledgeIndex`; `LanguageModel.answerFromPassages` | `application/port/out` |
| Sincronização do índice e busca | `application/KnowledgeRetrieval` |
| Adaptadores de embeddings: desligado (padrão) e Voyage AI | `adapter/out/embedding` |
| Índice em `assistant.knowledge_chunk` com JDBC | `adapter/out/persistence/KnowledgeIndexJdbcAdapter`, `V12__assistant_knowledge_index.sql` |
| Tela do assistente: fontes numeradas com o trecho, e de onde veio a resposta | `tbfernandes-frontend/src/features/assistant` |

## Decisões

- **Sem pgvector por enquanto.** O PostgreSQL que vai no instalador do app desktop (binários `io.zonky.test.postgres`) não traz a extensão, e o pgvector não tem build oficial para Windows. O vetor fica numa coluna `real[]` e o cosseno é calculado em Java, sobre os trechos do dono. Para um usuário com milhares de notas isso leva milissegundos. Se um dia precisar de índice (HNSW), a migração é `embedding::vector` e só o `KnowledgeIndexJdbcAdapter` muda.
- **Voyage AI para embeddings.** A Anthropic não tem modelo de embeddings e indica a Voyage. Padrão `voyage-3.5-lite` (multilíngue, bom em português), trocável por `TBF_ASSISTANT_EMBEDDING_NAME`. A requisição usa `input_type` `document` para os trechos e `query` para a pergunta.
- **Funciona sem chave.** Sem provedor de embeddings, a busca é só por palavras (BM25). Sem modelo de IA, a resposta mostra os trechos. Nenhuma das duas peças é obrigatória.
- **Índice atualizado na pergunta.** Antes de cada busca, as impressões digitais são comparadas com as notas atuais. Só o que mudou é processado de novo, em lotes de 64 documentos, com as chamadas ao provedor fora de transação. Não depende de eventos do módulo knowledge, então não cria acoplamento novo. Um registro apagado continua no índice até a próxima pergunta.
- **Falha do provedor não derruba nada.** Se a Voyage falhar, os trechos são gravados sem vetor e com modelo `none`; a próxima pergunta tenta de novo.
- **Trechos são dados.** O prompt manda usar só os trechos, citar cada afirmação e nunca seguir instruções que apareçam neles. As referências vêm dos trechos, então todo link aponta para um registro real (RN-20).
- **O que sai da aplicação.** Com Voyage ligada, o texto das notas e snippets e a pergunta vão para a Voyage. Com o modelo ligado, a pergunta e os até 6 trechos escolhidos vão para a Anthropic.
- **O modelo de consultas encaminha perguntas abertas para o RAG.** O prompt de `toQuery` diz que perguntas sobre o que as notas dizem, ou sobre como algo foi feito, não são consultas (`answerable: false`).

## Banco

`assistant.knowledge_chunk` (novo schema `assistant`): `owner_id`, `source_kind` (`NOTE`, `SNIPPET`), `source_id`, `position`, `title`, `content`, `fingerprint`, `embedding_model`, `embedding real[]`, `indexed_at`. Chave primária `(owner_id, source_kind, source_id, position)`. É dado derivado: pode ser apagado a qualquer momento e é refeito na próxima pergunta. Por isso não tem colunas de auditoria nem `version`.

## Configuração

```bash
TBF_ASSISTANT_EMBEDDING=voyage       # padrão none
VOYAGE_API_KEY=...                   # https://dash.voyageai.com
# TBF_ASSISTANT_EMBEDDING_NAME=voyage-3.5-lite
TBF_ASSISTANT_MODEL=anthropic        # para a resposta escrita pela IA (etapa 10)
ANTHROPIC_API_KEY=...
```

No app desktop, o backend herda as variáveis de ambiente do Windows (variáveis de usuário).

## Testes

| Teste | O que cobre |
|---|---|
| `TextChunkerTest`, `PassageRankerTest`, `GroundedAnswerTest`, `KnowledgeDocumentTest` | regras puras do domínio |
| `KnowledgeRetrievalTest` | índice em memória: indexa uma vez, reindexa o que mudou, remove o apagado, tenta de novo depois de falha |
| `VoyageEmbeddingModelTest` | contrato da Voyage num servidor local |
| `AnthropicLanguageModelTest` | trechos numerados na requisição |
| `AssistantApiIntegrationTests`, `AssistantModelApiIntegrationTests` | pergunta aberta de ponta a ponta, com e sem modelo, no PostgreSQL real |

## Como verificar

```bash
cd tbfernandes-backend && ./mvnw verify
```

Com a API no ar e uma nota criada, pergunte algo sobre o conteúdo dela em `/assistant`. Sem chaves, a resposta mostra os trechos; com as chaves, a IA responde com `[1]`, `[2]` ligados às fontes.

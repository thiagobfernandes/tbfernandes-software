# Etapa 8 — Assistant e grafo

Data: 2026-10-26 · Itens: AST-01, AST-02, KNW-05

## Objetivo

Levar para a API as duas telas que leem todos os módulos: o assistente por regras e o grafo de conhecimento. Com isso, todas as telas do frontend têm um endpoint. A IA e a Pluggy continuam em aberto, atrás de portas.

## O que foi feito

| Item | Mudança | Onde |
|---|---|---|
| AST-01 | `POST /assistant/questions`: mesmas intenções (projeto pelo nome, atrasadas, foco do dia, compras, dinheiro, metas, contatos, estudos e busca de fallback), mesmas palavras-chave em inglês e português, mesmos textos e referências de `answer.ts`. | `RuleBasedAssistant`, `AssistantController` |
| AST-02 | Porta `LanguageModel` e o adaptador `DisabledLanguageModel` (padrão, `TBF_ASSISTANT_MODEL=none`). A resposta diz de onde veio (`source: "rules"` ou `"model"`). | `application/port/out`, `adapter/out/model` |
| KNW-05 | `GET /graph`: os mesmos nós (`kind:id`), arestas e links de `buildGraph`, e as arestas para registros excluídos são descartadas. O layout continua no navegador. | `KnowledgeGraph` |
| — | APIs públicas novas: `KnowledgeLookup` (notas e snippets) e `GoalsLookup` (metas com progresso). `WorkLookup` ganhou `companies()` e a descrição das tarefas. `FinanceLookup` passou a trazer a projeção das compras e os totais de cada escopo. `LearningLookup` agora traz a próxima atividade do estudo e `ContactsLookup` o cargo do contato. | `*/…Lookup.java` |
| — | Progresso da meta no backend, com a mesma regra de `goalProgress`: indicador, depois marcos, depois tarefas ligadas. | `goals/domain/GoalProgress` |

## Decisões

- **Retrato só leitura (`Workspace`)**: o serviço lê tudo pelas APIs públicas e entrega um record imutável para funções puras. As regras do assistente e o grafo são testados sem Spring nem banco, e o módulo não tem como escrever nada (RN-20).
- **A IA reescreve, mas não escolhe as fontes**: a porta recebe a resposta das regras e devolve só o texto. As referências são sempre as que as regras acharam, então nenhum link aponta para um registro inventado. Se o modelo falhar, a resposta das regras é devolvida (RNF-CONF-04).
- **`POST` para perguntas**: a pergunta vai no corpo, não na URL, para não aparecer em logs de acesso.
- **Grafo no assistant, não no knowledge**: o grafo junta sete tipos de registro de cinco módulos. No knowledge, ele criaria dependências de knowledge para goals e contacts. O assistant já depende de todos, e ninguém depende dele.
- **Moeda e datas iguais ao frontend**: `R$ 1.234` (pt-BR, sem centavos) e os rótulos "overdue 2d", "due today", "due in 3d". Os links das tarefas usam a mesma codificação de `encodeURIComponent`.
- **"Hoje" é o relógio da aplicação** (`tbf.time-zone`), não a data fixa de exemplo que o frontend usa no modo simulado.

## Como verificar

```bash
cd api && ./mvnw spring-boot:run
curl -s -X POST localhost:8080/api/v1/assistant/questions \
  -H 'Content-Type: application/json' -d '{"question": "o que está atrasado?"}'
curl -s localhost:8080/api/v1/graph | head -c 400
```

## Testes

- `RuleBasedAssistantTest` (6): cada intenção, perguntas em português, ordem do foco do dia, escopos de dinheiro separados, fallback e codificação dos links.
- `KnowledgeGraphTest` (2): nós e arestas iguais aos do frontend; aresta órfã descartada.
- `AssistantApiIntegrationTests` (3): resposta sobre um projeto com links reais e o grafo pela API, progresso de meta por marcos, pergunta vazia (400).

Suíte: 46 testes passando.

## Em aberto

- AST-03: adaptador de um provedor de IA real (por exemplo a API da Anthropic), ligado por `TBF_ASSISTANT_MODEL`.
- AST-04: embeddings de notas e snippets com pgvector para busca semântica.

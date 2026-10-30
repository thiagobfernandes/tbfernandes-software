# Etapa 10 — Assistente com IA: saída estruturada e construção de consultas

Data: 2026-10-30 · Item: AST-03

## Objetivo

Responder perguntas em linguagem natural sobre os dados de qualquer módulo, sem que o modelo tenha acesso ao banco e sem que invente registros.

## Fluxo de uma pergunta

1. `LanguageModel.toQuery` transforma a pergunta em um `StructuredQuery`. O provedor devolve JSON no esquema do record `QueryPlan` (structured outputs).
2. Se a pergunta não é uma consulta (`answerable: false`, modelo desligado ou falha), as regras de `RuleBasedAssistant` respondem, como antes.
3. `QueryEngine` executa a consulta sobre o `Workspace`, em memória, e monta o texto e as referências.
4. `LanguageModel.answer` reescreve o texto em uma resposta direta, também com saída estruturada. Se falhar, vale o texto do passo 3.

## O que foi feito

| Mudança | Onde |
|---|---|
| Consulta estruturada: assunto (`tasks`, `projects`, `companies`, `notes`, `snippets`, `goals`, `studies`, `purchases`, `contacts`, `cash_flow`), lista ou contagem, texto, status, prioridades, só abertos, projeto, empresa, intervalo de prazo, mês, ordenação e limite (até 50) | `domain/StructuredQuery` |
| Execução pura sobre o retrato dos dados | `domain/QueryEngine` |
| Porta com `toQuery` e `answer`. `answer` não recebe mais o retrato | `application/port/out/LanguageModel` |
| Adaptador Claude com o SDK oficial, ativado por `TBF_ASSISTANT_MODEL=anthropic` e `ANTHROPIC_API_KEY` | `adapter/out/model/AnthropicLanguageModel`, `QueryPlan` |
| A resposta traz `query` e `source` passa a aceitar `query` | `domain/Answer`, `docs/backend/api.md` |
| A chamada ao modelo fica fora da transação | `application/AssistantService` |

## Decisões

- **O modelo descreve, a aplicação lê.** Não existe SQL gerado por IA. A consulta só tem filtros conhecidos, executados sobre dados que já são do dono, então ela não tem como escrever (RN-20) nem alcançar dados de outra pessoa.
- **Links sempre reais.** As referências vêm do `QueryEngine`. A reescrita só troca o texto.
- **Pouco dado sai da aplicação.** O provedor recebe a pergunta e o texto da resposta, que contém os nomes e valores dos registros encontrados. O retrato completo não é enviado. Quem liga o provedor aceita esse envio.
- **Dentro de um mês por vez.** `cash_flow` lê um mês e nunca soma os escopos pessoal e empresa (RN-12).
- **Campos sempre presentes.** O esquema exige todos os campos, e vazio significa "sem filtro". Uma data inválida gera erro e a pergunta cai nas regras.
- **Modelo padrão `claude-opus-5-5`, com esforço baixo**, trocável por `TBF_ASSISTANT_MODEL_NAME`. A requisição pede o fallback do servidor (`fallbacks: "default"`) para recusas dos classificadores de segurança, menos nos modelos Haiku, que não o têm. Uma recusa final cai nas regras.

## Como verificar

```bash
cd tbfernandes-backend && ./mvnw verify
```

`AnthropicLanguageModelTest` confere o contrato em um servidor HTTP local, sem chamar a Anthropic. **Ainda falta uma chamada real**: ela depende de uma chave de API. Com a chave:

```bash
# no .env da raiz
TBF_ASSISTANT_MODEL=anthropic
ANTHROPIC_API_KEY=...

docker compose up -d --build
curl -s -X POST localhost/api/v1/assistant/questions \
  -H 'Content-Type: application/json' \
  -d '{"question": "Quantas tarefas da Zasso estão atrasadas?"}'
```

A resposta deve ter `"source": "model"` e o campo `query` preenchido. `"source": "rules"` significa que o modelo falhou: o motivo está em `docker compose logs backend`.

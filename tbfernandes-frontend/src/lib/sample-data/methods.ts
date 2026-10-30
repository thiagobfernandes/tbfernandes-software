// Initial method library from the frontend architecture doc.
// These are real starting content, kept here until the Methods API exists.

import type { Method } from "@/features/methods/types/method";

export const sampleMethods: Method[] = [
  {
    id: "commit",
    title: "Método de commit",
    summary: "Preparar commits pequenos e revisados, com mensagem consistente.",
    category: "development",
    tags: ["git", "review"],
    lastReviewed: "2026-10-23",
    steps: [
      {
        title: "Revisar o diff",
        detail:
          "Ler cada linha alterada com git diff --staged antes de commitar.",
      },
      {
        title: "Manter a mudança focada",
        detail:
          "Uma intenção por commit. Separe mudanças sem relação com git add -p.",
      },
      {
        title: "Rodar as verificações",
        detail: "Testes, lint e build conforme a mudança.",
      },
      {
        title: "Escrever a mensagem",
        detail:
          "Conventional Commits: tipo(escopo): resumo no imperativo, com menos de 72 caracteres.",
      },
      {
        title: "Explicar o porquê",
        detail: "Adicione um corpo quando o motivo não for óbvio pelo diff.",
      },
    ],
    examples: [
      {
        title: "Mensagens de commit",
        content: [
          "feat(tasks): add board view grouped by status",
          "fix(projects): keep timeline bars inside the visible range",
          "refactor(api): extract Problem Details parsing",
          "docs: record modular monolith decision",
        ].join("\n"),
      },
    ],
  },
  {
    id: "bug-fixing",
    title: "Método de correção de bugs",
    summary: "Da reprodução até uma correção testada e documentada.",
    category: "quality",
    tags: ["debugging", "testing"],
    lastReviewed: "2026-10-23",
    steps: [
      { title: "Reproduzir o bug" },
      { title: "Registrar o comportamento esperado e o real" },
      { title: "Reunir logs e contexto relevante" },
      { title: "Encontrar uma reprodução mínima" },
      {
        title: "Formular e testar uma hipótese",
        detail:
          "Mudar uma coisa por vez e confirmar a causa antes de corrigir.",
      },
      { title: "Implementar a menor correção segura" },
      {
        title: "Adicionar ou atualizar testes de regressão",
        detail: "O teste precisa falhar sem a correção.",
      },
      { title: "Revisar o diff e validar a correção" },
      {
        title: "Registrar a causa raiz e os aprendizados",
        detail: "Vincular a nota ao projeto ou à tarefa.",
      },
    ],
  },
  {
    id: "meeting",
    title: "Método de reunião",
    summary: "Reuniões com objetivo claro, decisões e follow-up.",
    category: "communication",
    tags: ["meetings", "follow-up"],
    lastReviewed: "2026-10-23",
    steps: [
      { title: "Definir o objetivo e a pauta" },
      { title: "Reunir antes o contexto necessário" },
      { title: "Registrar as decisões" },
      { title: "Registrar os encaminhamentos com responsáveis e prazos" },
      { title: "Compartilhar um resumo curto depois" },
      { title: "Acompanhar as ações em aberto" },
    ],
    examples: [
      {
        title: "Modelo de resumo",
        content: [
          "Objetivo:",
          "Decisões:",
          "- ",
          "Encaminhamentos (responsável, prazo):",
          "- ",
          "Dúvidas em aberto:",
          "- ",
        ].join("\n"),
      },
    ],
  },
];

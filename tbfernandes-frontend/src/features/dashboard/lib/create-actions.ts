/**
 * The global "Criar" actions. The overview opens the form for
 * `/?create=<kind>`, so the command palette (Ctrl K) can offer them too.
 */
export type CreateKind =
  | "task"
  | "note"
  | "project"
  | "routine"
  | "time"
  | "goal"
  | "contact"
  | "appointment";

export const createActions: {
  kind: CreateKind;
  label: string;
  keywords: string;
}[] = [
  {
    kind: "task",
    label: "Nova tarefa",
    keywords: "criar adicionar tarefa todo",
  },
  {
    kind: "note",
    label: "Nova nota",
    keywords: "criar adicionar nota conhecimento",
  },
  {
    kind: "project",
    label: "Novo projeto",
    keywords: "criar adicionar projeto",
  },
  {
    kind: "routine",
    label: "Nova rotina",
    keywords: "criar adicionar rotina hábito",
  },
  {
    kind: "time",
    label: "Novo apontamento",
    keywords: "criar lançar apontamento tempo horas",
  },
  {
    kind: "goal",
    label: "Nova meta",
    keywords: "criar adicionar meta objetivo",
  },
  {
    kind: "contact",
    label: "Novo contato",
    keywords: "criar adicionar contato pessoa",
  },
  {
    kind: "appointment",
    label: "Novo compromisso",
    keywords: "criar agendar compromisso reunião agenda",
  },
];

export const createHref = (kind: CreateKind) => `/?create=${kind}`;

export function isCreateKind(value: string | null): value is CreateKind {
  return createActions.some((action) => action.kind === value);
}

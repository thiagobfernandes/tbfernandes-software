/**
 * Widget model of the overview ("command center"). This file only holds data:
 * types, the catalog (title, sizes) and the default profiles. Rendering lives
 * in `components/widget-registry.tsx`, data in the module selectors.
 */

export type WidgetType =
  | "day"
  | "attention"
  | "indicators"
  | "priorityTasks"
  | "overdueTasks"
  | "blockedTasks"
  | "activeProjects"
  | "deliveries"
  | "agenda"
  | "routines"
  | "consistency"
  | "goals"
  | "learning"
  | "recentNotes"
  | "recentSnippets"
  | "finance"
  | "time"
  | "activity"
  | "prospecting"
  | "assistant"
  | "rhythm"
  | "connections";

/** Columns of a 12-column grid. */
export type WidgetSize = 3 | 4 | 6 | 8 | 12;
export const widgetSizes: WidgetSize[] = [3, 4, 6, 8, 12];
export const sizeLabels: Record<WidgetSize, string> = {
  3: "Estreito (¼)",
  4: "Pequeno (⅓)",
  6: "Médio (½)",
  8: "Largo (⅔)",
  12: "Inteiro",
};

export type WidgetGroup =
  | "Dia"
  | "Execução"
  | "Projetos e metas"
  | "Conhecimento"
  | "Análises"
  | "Outros";

export type WidgetMeta = {
  title: string;
  description: string;
  group: WidgetGroup;
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  maxSize: WidgetSize;
};

export const widgetCatalog: Record<WidgetType, WidgetMeta> = {
  day: {
    title: "Hoje",
    description: "Data, compromissos, rotinas e tarefas do dia",
    group: "Dia",
    defaultSize: 12,
    minSize: 6,
    maxSize: 12,
  },
  attention: {
    title: "Precisa de atenção",
    description:
      "Atrasos, bloqueios, entregas e projetos em risco, com o motivo",
    group: "Dia",
    defaultSize: 6,
    minSize: 4,
    maxSize: 12,
  },
  indicators: {
    title: "Indicadores",
    description:
      "Abertas, atrasadas, concluídas na semana, horas e projetos ativos",
    group: "Dia",
    defaultSize: 12,
    minSize: 6,
    maxSize: 12,
  },
  agenda: {
    title: "Agenda",
    description: "Compromissos, prazos e rotinas por dia ou semana",
    group: "Dia",
    defaultSize: 6,
    minSize: 4,
    maxSize: 12,
  },
  priorityTasks: {
    title: "Tarefas prioritárias",
    description: "Urgentes e de prioridade alta ainda abertas",
    group: "Execução",
    defaultSize: 6,
    minSize: 4,
    maxSize: 12,
  },
  overdueTasks: {
    title: "Tarefas atrasadas",
    description: "Abertas com prazo vencido",
    group: "Execução",
    defaultSize: 4,
    minSize: 3,
    maxSize: 12,
  },
  blockedTasks: {
    title: "Tarefas bloqueadas",
    description: "Esperando algo para andar",
    group: "Execução",
    defaultSize: 4,
    minSize: 3,
    maxSize: 12,
  },
  routines: {
    title: "Rotinas de hoje",
    description: "Marcar o que foi feito",
    group: "Execução",
    defaultSize: 4,
    minSize: 3,
    maxSize: 8,
  },
  time: {
    title: "Apontamentos",
    description: "Horas hoje e na semana, por projeto",
    group: "Execução",
    defaultSize: 4,
    minSize: 3,
    maxSize: 8,
  },
  activeProjects: {
    title: "Projetos ativos",
    description: "Progresso e saúde dos projetos em andamento",
    group: "Projetos e metas",
    defaultSize: 6,
    minSize: 4,
    maxSize: 12,
  },
  deliveries: {
    title: "Próximas entregas",
    description: "Entregas de projetos e prazos dos próximos 14 dias",
    group: "Projetos e metas",
    defaultSize: 6,
    minSize: 4,
    maxSize: 12,
  },
  goals: {
    title: "Metas",
    description: "Metas ativas e seus marcos",
    group: "Projetos e metas",
    defaultSize: 6,
    minSize: 4,
    maxSize: 12,
  },
  learning: {
    title: "Aprendizado",
    description: "Estudos em andamento e próxima atividade",
    group: "Projetos e metas",
    defaultSize: 4,
    minSize: 3,
    maxSize: 8,
  },
  recentNotes: {
    title: "Notas recentes",
    description: "Últimas notas editadas",
    group: "Conhecimento",
    defaultSize: 4,
    minSize: 3,
    maxSize: 8,
  },
  recentSnippets: {
    title: "Snippets recentes",
    description: "Últimos snippets editados",
    group: "Conhecimento",
    defaultSize: 4,
    minSize: 3,
    maxSize: 8,
  },
  connections: {
    title: "Como o trabalho se conecta",
    description: "Tarefa → projeto → empresa → meta",
    group: "Conhecimento",
    defaultSize: 12,
    minSize: 6,
    maxSize: 12,
  },
  activity: {
    title: "Atividade recente",
    description: "Tarefas concluídas, apontamentos e notas editadas",
    group: "Análises",
    defaultSize: 6,
    minSize: 4,
    maxSize: 12,
  },
  consistency: {
    title: "Consistência",
    description: "Rotinas feitas por dia nas últimas semanas",
    group: "Análises",
    defaultSize: 6,
    minSize: 4,
    maxSize: 12,
  },
  rhythm: {
    title: "Ritmo",
    description: "Horas, tarefas concluídas, dinheiro e horas por projeto",
    group: "Análises",
    defaultSize: 12,
    minSize: 8,
    maxSize: 12,
  },
  finance: {
    title: "Finanças",
    description: "Saldo do mês e despesas dos próximos 7 dias",
    group: "Outros",
    defaultSize: 4,
    minSize: 3,
    maxSize: 8,
  },
  prospecting: {
    title: "Prospecção",
    description: "Envios esperando aprovação e leads",
    group: "Outros",
    defaultSize: 4,
    minSize: 3,
    maxSize: 8,
  },
  assistant: {
    title: "Assistente",
    description: "Resumo do dia, pendências e metas, a partir dos seus dados",
    group: "Outros",
    defaultSize: 6,
    minSize: 4,
    maxSize: 12,
  },
};

export type WidgetInstance = {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  collapsed?: boolean;
  /** Per-widget options, e.g. the agenda range. */
  config?: Record<string, string>;
};

export type DashboardProfile = {
  id: string;
  name: string;
  widgets: WidgetInstance[];
};

/** Persisted as `tbf:overview`. */
export type DashboardPrefs = {
  /** The profile the overview opens with. */
  defaultId: string;
  favorites: string[];
  profiles: DashboardProfile[];
};

const widget = (type: WidgetType, size?: WidgetSize): WidgetInstance => ({
  id: type,
  type,
  size: size ?? widgetCatalog[type].defaultSize,
});

export const defaultProfiles: DashboardProfile[] = [
  {
    id: "general",
    name: "Workspace geral",
    widgets: [
      widget("day"),
      widget("attention", 6),
      widget("agenda", 6),
      widget("priorityTasks", 8),
      widget("routines", 4),
      widget("activeProjects", 6),
      widget("deliveries", 6),
      widget("goals", 6),
      widget("recentNotes", 3),
      widget("time", 3),
      widget("activity", 6),
      widget("consistency", 6),
    ],
  },
  {
    id: "work",
    name: "Trabalho",
    widgets: [
      widget("attention", 6),
      widget("deliveries", 6),
      widget("priorityTasks", 6),
      widget("blockedTasks", 3),
      widget("overdueTasks", 3),
      widget("activeProjects", 8),
      widget("time", 4),
      widget("rhythm"),
    ],
  },
  {
    id: "study",
    name: "Estudos",
    widgets: [
      widget("learning", 6),
      widget("goals", 6),
      widget("recentNotes", 6),
      widget("recentSnippets", 6),
      widget("routines", 6),
      widget("consistency", 6),
    ],
  },
  {
    id: "finance",
    name: "Finanças",
    widgets: [widget("finance", 6), widget("goals", 6), widget("rhythm")],
  },
];

export const defaultDashboardPrefs: DashboardPrefs = {
  defaultId: "general",
  favorites: [],
  profiles: defaultProfiles,
};

export function clampSize(type: WidgetType, size: WidgetSize): WidgetSize {
  const { minSize, maxSize } = widgetCatalog[type];
  return Math.min(maxSize, Math.max(minSize, size)) as WidgetSize;
}

/** Tailwind classes per size; phones always get the full width. */
export const sizeClass: Record<WidgetSize, string> = {
  3: "col-span-12 md:col-span-6 xl:col-span-3",
  4: "col-span-12 md:col-span-6 xl:col-span-4",
  6: "col-span-12 xl:col-span-6",
  8: "col-span-12 xl:col-span-8",
  12: "col-span-12",
};

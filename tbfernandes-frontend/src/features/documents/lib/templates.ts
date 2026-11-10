import type {
  DocumentDataByTemplate,
  DocumentTemplateId,
  LetterData,
  ProposalData,
} from "@/features/documents/types";

/** How a field is edited in the form. */
export type FieldKind =
  | "text"
  | "textarea"
  | "date"
  | "list" // one item per line
  | "steps" // one "Título: descrição" per line
  | "toggle";

export type FieldConfig = {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  hint?: string;
  rows?: number;
};

export type FieldSection = { title: string; fields: FieldConfig[] };

export type DocumentTemplate<T extends DocumentTemplateId> = {
  id: T;
  name: string;
  description: string;
  pages: string;
  defaults: (today: string, number: string) => DocumentDataByTemplate[T];
  sections: FieldSection[];
  /** Name of a new document, shown in the list. */
  suggestedName: (data: DocumentDataByTemplate[T]) => string;
};

const proposal: DocumentTemplate<"proposal"> = {
  id: "proposal",
  name: "Proposta comercial",
  description:
    "Capa, escopo, etapas, investimento e assinatura. O modelo padrão para enviar a clientes.",
  pages: "3 páginas A4",
  defaults: (today, number): ProposalData => ({
    number,
    date: today,
    validity: "15 dias",
    client: "Nome do cliente",
    clientContact: "Fulano",
    projectType: "Site institucional",
    headline: "Criação do seu",
    headlineAccent: "novo site.",
    subtitle:
      "Um site feito sob medida, rápido, bonito no celular e pronto para aparecer no Google e trazer clientes pelo WhatsApp.",
    objective:
      "Descreva em uma ou duas frases o que o cliente quer alcançar com o projeto.",
    sections: [
      "Início com apresentação e chamada para o WhatsApp",
      "Serviços ou produtos, separados por categoria",
      "Sobre nós, com a história do negócio",
      "Localização com mapa, horário de funcionamento e contatos",
    ],
    included: [
      "Registro e configuração do domínio",
      "Hospedagem rápida e segura (HTTPS)",
      "Layout exclusivo, sem modelo pronto",
      "Versão para celular, tablet e computador",
      "Botão de WhatsApp e links para redes",
      "Configuração básica para o Google",
      "Google Analytics para ver suas visitas",
      "Suporte depois da entrega",
    ],
    steps: [
      {
        title: "Conversa",
        description: "Entendo o seu negócio e o que você espera do projeto.",
      },
      {
        title: "Proposta",
        description: "Escopo, prazo e valor fechados, sem surpresas.",
      },
      {
        title: "Criação",
        description: "Desenvolvo e mostro o andamento. Você pede ajustes.",
      },
      {
        title: "No ar",
        description: "Publico no seu domínio e continuo por perto.",
      },
    ],
    deadline: "15 dias úteis",
    price: "R$ 1.500,00",
    payment: "50% na aprovação da proposta e 50% na entrega",
    maintenance: "R$ 80,00 / mês (opcional)",
    conditions: [
      "Duas rodadas de ajustes no layout estão incluídas.",
      "Textos e fotos são fornecidos pelo cliente; posso ajudar a organizar.",
      "Domínio e hospedagem do primeiro ano já estão no valor.",
      "O site e o domínio ficam no nome do cliente.",
    ],
    nextSteps: [
      {
        title: "Aprovação",
        description: "Responda esta proposta pelo WhatsApp ou e-mail.",
      },
      {
        title: "Início",
        description: "Com o sinal confirmado, marcamos a conversa de briefing.",
      },
      {
        title: "Entrega",
        description: "Projeto publicado, testado e explicado para você.",
      },
    ],
    quote:
      "Você fala direto com quem faz o projeto. Sem intermediários e sem atendimento de robô.",
  }),
  sections: [
    {
      title: "Identificação",
      fields: [
        { key: "number", label: "Número", kind: "text" },
        { key: "date", label: "Data", kind: "date" },
        {
          key: "validity",
          label: "Validade",
          kind: "text",
          placeholder: "15 dias",
        },
        { key: "client", label: "Cliente", kind: "text" },
        {
          key: "clientContact",
          label: "Contato no cliente",
          kind: "text",
          hint: "Usado no “Olá, …”.",
        },
      ],
    },
    {
      title: "Capa",
      fields: [
        { key: "headline", label: "Título", kind: "text" },
        { key: "headlineAccent", label: "Destaque em dourado", kind: "text" },
        { key: "subtitle", label: "Subtítulo", kind: "textarea", rows: 3 },
      ],
    },
    {
      title: "Projeto",
      fields: [
        { key: "projectType", label: "Tipo de projeto", kind: "text" },
        { key: "objective", label: "Objetivo", kind: "textarea", rows: 3 },
        {
          key: "sections",
          label: "Entregáveis (páginas, módulos…)",
          kind: "list",
          hint: "Um por linha.",
          rows: 5,
        },
        {
          key: "included",
          label: "Tudo incluso",
          kind: "list",
          hint: "Um por linha.",
          rows: 6,
        },
        {
          key: "steps",
          label: "Como funciona",
          kind: "steps",
          hint: "Um por linha, no formato Título: descrição.",
          rows: 4,
        },
      ],
    },
    {
      title: "Investimento",
      fields: [
        { key: "price", label: "Valor", kind: "text" },
        { key: "deadline", label: "Prazo", kind: "text" },
        { key: "payment", label: "Pagamento", kind: "text" },
        { key: "maintenance", label: "Manutenção", kind: "text" },
        {
          key: "conditions",
          label: "Condições",
          kind: "list",
          hint: "Uma por linha. A validade entra no fim, sozinha.",
          rows: 4,
        },
        {
          key: "nextSteps",
          label: "Próximos passos",
          kind: "steps",
          hint: "Título: descrição.",
          rows: 3,
        },
        {
          key: "quote",
          label: "Frase da assinatura",
          kind: "textarea",
          rows: 2,
        },
      ],
    },
  ],
  suggestedName: (data) => `Proposta ${data.number} · ${data.client}`,
};

const letter: DocumentTemplate<"letter"> = {
  id: "letter",
  name: "Documento timbrado",
  description:
    "Papel timbrado da empresa para cartas, declarações, contratos simples e comunicados.",
  pages: "Texto livre, quebra de página automática",
  defaults: (today, number): LetterData => ({
    number,
    date: today,
    kicker: "Comunicado",
    title: "Título do documento",
    recipient: "Nome do destinatário",
    recipientDetail: "Empresa ou cargo",
    body: "Escreva o texto aqui.\n\nDeixe uma linha em branco para começar um novo parágrafo.",
    closing: "Atenciosamente,",
    showSignature: true,
  }),
  sections: [
    {
      title: "Cabeçalho",
      fields: [
        { key: "number", label: "Número", kind: "text" },
        { key: "date", label: "Data", kind: "date" },
        {
          key: "kicker",
          label: "Tipo de documento",
          kind: "text",
          placeholder: "Declaração, contrato, comunicado…",
        },
        { key: "title", label: "Título", kind: "text" },
        { key: "recipient", label: "Destinatário", kind: "text" },
        {
          key: "recipientDetail",
          label: "Detalhe do destinatário",
          kind: "text",
        },
      ],
    },
    {
      title: "Conteúdo",
      fields: [
        {
          key: "body",
          label: "Texto",
          kind: "textarea",
          hint: "Linha em branco separa parágrafos.",
          rows: 14,
        },
        { key: "closing", label: "Fecho", kind: "text" },
        { key: "showSignature", label: "Mostrar assinatura", kind: "toggle" },
      ],
    },
  ],
  suggestedName: (data) => `${data.kicker} · ${data.title}`,
};

export const DOCUMENT_TEMPLATES = { proposal, letter } as const;

export const TEMPLATE_LIST = [proposal, letter];

export function templateOf<T extends DocumentTemplateId>(id: T) {
  return DOCUMENT_TEMPLATES[id] as unknown as DocumentTemplate<T>;
}

/** "2026-11-10" → "10 de novembro de 2026". */
export function formatLongDate(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

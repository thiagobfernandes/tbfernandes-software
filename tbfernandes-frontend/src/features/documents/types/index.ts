export type DocumentTemplateId = "proposal" | "letter";

/** A step of a process: "Título: descrição" in the editor. */
export type DocumentStep = { title: string; description: string };

export type ProposalData = {
  number: string;
  /** ISO day (yyyy-mm-dd). */
  date: string;
  validity: string;
  client: string;
  clientContact: string;
  projectType: string;
  headline: string;
  headlineAccent: string;
  subtitle: string;
  objective: string;
  sections: string[];
  included: string[];
  steps: DocumentStep[];
  deadline: string;
  price: string;
  payment: string;
  maintenance: string;
  conditions: string[];
  nextSteps: DocumentStep[];
  quote: string;
};

export type LetterData = {
  number: string;
  /** ISO day (yyyy-mm-dd). */
  date: string;
  kicker: string;
  title: string;
  recipient: string;
  recipientDetail: string;
  /** Paragraphs separated by a blank line. */
  body: string;
  closing: string;
  showSignature: boolean;
};

export type DocumentDataByTemplate = {
  proposal: ProposalData;
  letter: LetterData;
};

export type SavedDocument<T extends DocumentTemplateId = DocumentTemplateId> = {
  id: string;
  templateId: T;
  name: string;
  data: DocumentDataByTemplate[T];
  createdAt: string;
  updatedAt: string;
};

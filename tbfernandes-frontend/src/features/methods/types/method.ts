export type MethodCategory = "development" | "quality" | "communication";

export type MethodStep = {
  title: string;
  detail?: string;
};

export type Method = {
  id: string;
  title: string;
  summary: string;
  category: MethodCategory;
  steps: MethodStep[];
  /** Templates or examples shown verbatim, e.g. commit messages. */
  examples?: { title: string; content: string }[];
  tags: string[];
  lastReviewed: string;
};

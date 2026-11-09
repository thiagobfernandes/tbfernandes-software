export type ProblemDetail = {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  rule?: string;
  errors?: Record<string, string[]>;
};

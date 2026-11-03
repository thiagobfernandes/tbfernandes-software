export class MethodStepResponse {
  title: string;
  detail: string | null;
}

export class MethodExampleResponse {
  title: string;
  content: string;
}

/** Same shape as the frontend's Method type. */
export class MethodResponse {
  id: string;
  title: string;
  summary: string;
  category: string;
  steps: MethodStepResponse[];
  examples: MethodExampleResponse[];
  tags: string[];
  lastReviewed: string;
}

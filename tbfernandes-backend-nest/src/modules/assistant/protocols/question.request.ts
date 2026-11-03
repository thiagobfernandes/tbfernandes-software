import { Joi } from '../../../common/protocols';

/** Body of POST /assistant/questions. The text is checked by the use case (RF-AST-01). */
export class QuestionRequest {
  question: string;
}

export const questionRequestSchema = Joi.object<QuestionRequest>({
  question: Joi.string().allow('', null),
});

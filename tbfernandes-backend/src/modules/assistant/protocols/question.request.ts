import { Joi } from '../../../common/protocols';

export class QuestionRequest {
  question: string;
}

export const questionRequestSchema = Joi.object<QuestionRequest>({
  question: Joi.string().allow('', null),
});

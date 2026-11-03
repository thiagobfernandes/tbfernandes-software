import { LanguageModel } from '../../application/language.model';

/** Default (ADR-005): no AI provider, so the grounded answer is returned as is. */
export class DisabledLanguageModel extends LanguageModel {
  toQuery(): Promise<null> {
    return Promise.resolve(null);
  }

  answer(): Promise<null> {
    return Promise.resolve(null);
  }

  answerFromPassages(): Promise<null> {
    return Promise.resolve(null);
  }
}

import { LanguageModel } from '../../application/language.model';

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

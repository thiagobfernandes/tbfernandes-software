import { IsoDate } from '../../../common/domain';
import { Answer, Passage, StructuredQuery } from '../domain';

/**
 * The AI provider (AST-02, AST-03), whatever vendor serves it. The model never sees the
 * database: it turns the question into a query that the application validates and runs, and
 * then rewrites the text of the answer. The references stay the ones the application found,
 * so every link points to a real record. null means no model is configured or it could not help.
 */
export abstract class LanguageModel {
  abstract toQuery(
    question: string,
    today: IsoDate,
  ): Promise<StructuredQuery | null>;
  abstract answer(question: string, grounded: Answer): Promise<string | null>;
  /**
   * An answer written only from the passages of notes and snippets (AST-04), citing them as
   * [n], where n is the passage's position from 1.
   */
  abstract answerFromPassages(
    question: string,
    passages: Passage[],
  ): Promise<string | null>;
}

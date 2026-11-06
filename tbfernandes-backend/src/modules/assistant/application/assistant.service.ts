import { Injectable, Logger } from '@nestjs/common';
import { Clock, OwnerContext } from '../../../common/application';
import { IsoDate, Require, YearMonths } from '../../../common/domain';
import {
  Answer,
  GroundedAnswer,
  KnowledgeDocuments,
  KnowledgeGraph,
  KnowledgeGraphs,
  QueryEngine,
  RuleBasedAssistant,
  StructuredQuery,
  Workspace,
} from '../domain';
import { AssistantTracer } from './assistant-tracer';
import { KnowledgeRetrievalService } from './knowledge-retrieval.service';
import { LanguageModel } from './language.model';
import { WorkspaceReader } from './workspace-reader';

export const QUESTION_MAX_LENGTH = 500;

const groundedOutput = (answer: Answer) => ({
  text: answer.text,
  references: answer.references,
});

@Injectable()
export class AssistantService {
  private readonly logger = new Logger('Assistant');

  constructor(
    private readonly workspaces: WorkspaceReader,
    private readonly model: LanguageModel,
    private readonly retrieval: KnowledgeRetrievalService,
    private readonly owner: OwnerContext,
    private readonly clock: Clock,
    private readonly tracer: AssistantTracer,
  ) {}

  ask(question: string | null | undefined): Promise<Answer> {
    const text = Require.text(question, 'question', QUESTION_MAX_LENGTH);
    return this.tracer.trace(
      'answer-question',
      { userId: this.owner.currentOwnerId(), input: text },
      async (trace) => {
        const answer = await this.route(text);
        trace.update({
          output: answer.text,
          metadata: {
            source: answer.source,
            references: answer.references.length,
          },
        });
        return answer;
      },
    );
  }

  private async route(text: string): Promise<Answer> {
    const today = this.clock.today();
    const query = await this.queryFor(text, today);
    const workspace = await this.workspaces.read(
      this.owner.currentOwnerId(),
      today,
      query?.month ?? YearMonths.of(today),
    );
    if (query) return this.answerFromData(text, query, workspace);
    if (RuleBasedAssistant.understands(text, workspace))
      return this.answerByRules(text, workspace);
    return this.answerFromKnowledge(text, workspace);
  }

  async graph(): Promise<KnowledgeGraph> {
    const today = this.clock.today();
    const workspace = await this.workspaces.read(
      this.owner.currentOwnerId(),
      today,
      YearMonths.of(today),
    );
    return KnowledgeGraphs.of(workspace);
  }

  private queryFor(
    question: string,
    today: IsoDate,
  ): Promise<StructuredQuery | null> {
    return this.withoutModelOnFailure(
      () => this.model.toQuery(question, today),
      null,
      'Language model could not build a query, answering with rules',
    );
  }

  private async answerFromData(
    question: string,
    query: StructuredQuery,
    workspace: Workspace,
  ): Promise<Answer> {
    const grounded = await this.tracer.step('run-query', 'span', (step) => {
      const answer = QueryEngine.run(query, workspace);
      step.update({ input: query, output: groundedOutput(answer) });
      return Promise.resolve(answer);
    });
    return this.rewrite(question, grounded);
  }

  private async answerByRules(
    question: string,
    workspace: Workspace,
  ): Promise<Answer> {
    const grounded = await this.tracer.step(
      'answer-by-rules',
      'span',
      (step) => {
        const answer = RuleBasedAssistant.answer(question, workspace);
        step.update({ input: question, output: groundedOutput(answer) });
        return Promise.resolve(answer);
      },
    );
    return this.rewrite(question, grounded);
  }

  private async answerFromKnowledge(
    question: string,
    workspace: Workspace,
  ): Promise<Answer> {
    const passages = await this.retrieval.search(
      this.owner.currentOwnerId(),
      question,
      KnowledgeDocuments.ofWorkspace(workspace),
    );
    if (!passages.length) return this.answerByRules(question, workspace);
    const written = await this.withoutModelOnFailure(
      () => this.model.answerFromPassages(question, passages),
      null,
      'Language model failed, answering with the passages',
    );
    if (written) return GroundedAnswer.fromModel(written, passages);
    return GroundedAnswer.excerpts(passages);
  }

  private async rewrite(question: string, grounded: Answer): Promise<Answer> {
    const text = await this.withoutModelOnFailure(
      () => this.model.answer(question, grounded),
      null,
      'Language model failed, answering without it',
    );
    return text ? { ...grounded, text, source: 'model' } : grounded;
  }

  private async withoutModelOnFailure<T>(
    call: () => Promise<T>,
    fallback: T,
    warning: string,
  ): Promise<T> {
    try {
      return await call();
    } catch (error) {
      this.logger.warn(`${warning}: ${String(error)}`);
      return fallback;
    }
  }
}

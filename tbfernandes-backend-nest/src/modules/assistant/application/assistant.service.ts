import { Injectable, Logger } from '@nestjs/common';
import { Clock, OwnerContext } from '../../../common/application';
import {
  IsoDate,
  Require,
  YearMonth,
  YearMonths,
} from '../../../common/domain';
import { ContactsLookup } from '../../contacts';
import { FinanceLookup } from '../../finance';
import { GoalsLookup } from '../../goals';
import { KnowledgeLookup } from '../../knowledge';
import { LearningLookup } from '../../learning';
import { WorkLookup } from '../../work';
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
import { KnowledgeRetrievalService } from './knowledge-retrieval.service';
import { LanguageModel } from './language.model';

export const QUESTION_MAX_LENGTH = 500;

/**
 * Questions over the owner's data (AST-01 to AST-04) and the knowledge graph (KNW-05). Reads
 * only through the other modules' public lookups and never writes to them (RN-20); the only
 * table it writes is its own retrieval index.
 *
 * Routing: a question the model turns into a query runs over the data; one the rules
 * understand gets the rule's answer; any other question is answered from passages of notes
 * and snippets (RAG), and when nothing relevant is found the rules' keyword search answers.
 * The assistant never fails because of the model: every model error falls back to the
 * grounded answer.
 */
@Injectable()
export class AssistantService {
  private readonly logger = new Logger('Assistant');

  constructor(
    private readonly work: WorkLookup,
    private readonly knowledge: KnowledgeLookup,
    private readonly goals: GoalsLookup,
    private readonly learning: LearningLookup,
    private readonly finance: FinanceLookup,
    private readonly contacts: ContactsLookup,
    private readonly model: LanguageModel,
    private readonly retrieval: KnowledgeRetrievalService,
    private readonly owner: OwnerContext,
    private readonly clock: Clock,
  ) {}

  async ask(question: string | null | undefined): Promise<Answer> {
    const text = Require.text(question, 'question', QUESTION_MAX_LENGTH);
    const today = this.clock.today();
    const ownerId = this.owner.currentOwnerId();
    const query = await this.toQuery(text, today);
    const workspace = await this.workspace(
      ownerId,
      today,
      query?.month ?? YearMonths.of(today),
    );
    if (query) return this.rewrite(text, QueryEngine.run(query, workspace));
    if (RuleBasedAssistant.understands(text, workspace)) {
      return this.rewrite(text, RuleBasedAssistant.answer(text, workspace));
    }
    const passages = await this.retrieval.search(
      ownerId,
      text,
      KnowledgeDocuments.ofWorkspace(workspace),
    );
    if (!passages.length) {
      return this.rewrite(text, RuleBasedAssistant.answer(text, workspace));
    }
    try {
      const written = await this.model.answerFromPassages(text, passages);
      if (written) return GroundedAnswer.fromModel(written, passages);
    } catch (error) {
      this.logger.warn(
        `Language model failed, answering with the passages: ${String(error)}`,
      );
    }
    return GroundedAnswer.excerpts(passages);
  }

  async graph(): Promise<KnowledgeGraph> {
    const today = this.clock.today();
    return KnowledgeGraphs.of(
      await this.workspace(
        this.owner.currentOwnerId(),
        today,
        YearMonths.of(today),
      ),
    );
  }

  private async rewrite(question: string, grounded: Answer): Promise<Answer> {
    try {
      const text = await this.model.answer(question, grounded);
      return text ? { ...grounded, text, source: 'model' } : grounded;
    } catch (error) {
      // The grounded answer is always good enough to show.
      this.logger.warn(
        `Language model failed, answering without it: ${String(error)}`,
      );
      return grounded;
    }
  }

  private async toQuery(
    question: string,
    today: IsoDate,
  ): Promise<StructuredQuery | null> {
    try {
      return await this.model.toQuery(question, today);
    } catch (error) {
      this.logger.warn(
        `Language model could not build a query, answering with rules: ${String(error)}`,
      );
      return null;
    }
  }

  private async workspace(
    ownerId: string,
    today: IsoDate,
    month: YearMonth,
  ): Promise<Workspace> {
    const [
      companies,
      projects,
      tasks,
      notes,
      snippets,
      goals,
      studies,
      purchases,
      cashFlow,
      contacts,
    ] = await Promise.all([
      this.work.companies(ownerId),
      this.work.projects(ownerId),
      this.work.tasks(ownerId),
      this.knowledge.notes(ownerId),
      this.knowledge.snippets(ownerId),
      this.goals.goals(ownerId),
      this.learning.studies(ownerId),
      this.finance.purchases(ownerId),
      this.finance.month(ownerId, month),
      this.contacts.contacts(ownerId),
    ]);
    return {
      today,
      companies,
      projects,
      tasks,
      notes,
      snippets,
      goals,
      studies,
      purchases,
      month: cashFlow,
      contacts,
    };
  }
}

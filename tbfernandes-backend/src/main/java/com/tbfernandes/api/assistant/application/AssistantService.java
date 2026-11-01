package com.tbfernandes.api.assistant.application;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.tbfernandes.api.assistant.application.port.out.LanguageModel;
import com.tbfernandes.api.assistant.domain.Answer;
import com.tbfernandes.api.assistant.domain.GroundedAnswer;
import com.tbfernandes.api.assistant.domain.KnowledgeDocument;
import com.tbfernandes.api.assistant.domain.Passage;
import com.tbfernandes.api.assistant.domain.KnowledgeGraph;
import com.tbfernandes.api.assistant.domain.QueryEngine;
import com.tbfernandes.api.assistant.domain.RuleBasedAssistant;
import com.tbfernandes.api.assistant.domain.StructuredQuery;
import com.tbfernandes.api.assistant.domain.Workspace;
import com.tbfernandes.api.contacts.ContactsLookup;
import com.tbfernandes.api.finance.FinanceLookup;
import com.tbfernandes.api.goals.GoalsLookup;
import com.tbfernandes.api.knowledge.KnowledgeLookup;
import com.tbfernandes.api.learning.LearningLookup;
import com.tbfernandes.api.shared.application.OwnerContext;
import com.tbfernandes.api.shared.domain.Require;
import com.tbfernandes.api.work.WorkLookup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Questions over the owner's data (AST-01 to AST-04) and the knowledge graph (KNW-05). Reads
 * only through the other modules' public lookups and never writes to them (RN-20); the only
 * table it writes is its own retrieval index.
 * <p>
 * Routing: a question the model turns into a query runs over the data; one the rules
 * understand gets the rule's answer; any other question is answered from passages of notes and
 * snippets (RAG), and when nothing relevant is found the rules' keyword search answers.
 */
@Service
public class AssistantService {

	private static final Logger log = LoggerFactory.getLogger(AssistantService.class);

	private final WorkLookup work;
	private final KnowledgeLookup knowledge;
	private final GoalsLookup goals;
	private final LearningLookup learning;
	private final FinanceLookup finance;
	private final ContactsLookup contacts;
	private final LanguageModel model;
	private final KnowledgeRetrieval retrieval;
	private final OwnerContext owner;
	private final Clock clock;
	private final TransactionTemplate reading;

	AssistantService(WorkLookup work, KnowledgeLookup knowledge, GoalsLookup goals, LearningLookup learning,
			FinanceLookup finance, ContactsLookup contacts, LanguageModel model, KnowledgeRetrieval retrieval, OwnerContext owner,
			Clock clock, PlatformTransactionManager transactions) {
		this.work = work;
		this.knowledge = knowledge;
		this.goals = goals;
		this.learning = learning;
		this.finance = finance;
		this.contacts = contacts;
		this.model = model;
		this.retrieval = retrieval;
		this.owner = owner;
		this.clock = clock;
		this.reading = new TransactionTemplate(transactions);
		this.reading.setReadOnly(true);
	}

	/** The model is called outside the transaction, so waiting for it does not hold a connection. */
	public Answer ask(String question) {
		String text = Require.text(question, "question", 500);
		LocalDate today = LocalDate.now(clock);
		Optional<StructuredQuery> query = toQuery(text, today);
		YearMonth month = query.map(StructuredQuery::month).orElse(YearMonth.from(today));
		UUID ownerId = owner.currentOwnerId();
		Workspace workspace = reading.execute(status -> workspace(ownerId, today, month));
		if (query.isPresent()) {
			return rewrite(text, QueryEngine.run(query.get(), workspace));
		}
		if (RuleBasedAssistant.understands(text, workspace)) {
			return rewrite(text, RuleBasedAssistant.answer(text, workspace));
		}
		List<Passage> passages = retrieval.search(ownerId, text, KnowledgeDocument.of(workspace));
		if (passages.isEmpty()) {
			return rewrite(text, RuleBasedAssistant.answer(text, workspace));
		}
		try {
			Optional<String> written = model.answerFromPassages(text, passages);
			if (written.isPresent()) {
				return GroundedAnswer.fromModel(written.get(), passages);
			}
		}
		catch (RuntimeException ex) {
			log.warn("Language model failed, answering with the passages", ex);
		}
		return GroundedAnswer.excerpts(passages);
	}

	private Answer rewrite(String text, Answer grounded) {
		try {
			return model.answer(text, grounded).map(t -> grounded.withText(t, "model")).orElse(grounded);
		}
		catch (RuntimeException ex) {
			// The grounded answer is always good enough to show (NFR: the assistant never fails because of the model).
			log.warn("Language model failed, answering without it", ex);
			return grounded;
		}
	}

	public KnowledgeGraph graph() {
		LocalDate today = LocalDate.now(clock);
		UUID ownerId = owner.currentOwnerId();
		return reading.execute(status -> KnowledgeGraph.of(workspace(ownerId, today, YearMonth.from(today))));
	}

	private Optional<StructuredQuery> toQuery(String question, LocalDate today) {
		try {
			return model.toQuery(question, today);
		}
		catch (RuntimeException ex) {
			log.warn("Language model could not build a query, answering with rules", ex);
			return Optional.empty();
		}
	}

	private Workspace workspace(UUID ownerId, LocalDate today, YearMonth month) {
		return new Workspace(today, work.companies(ownerId), work.projects(ownerId), work.tasks(ownerId),
				knowledge.notes(ownerId), knowledge.snippets(ownerId), goals.goals(ownerId), learning.studies(ownerId),
				finance.purchases(ownerId), finance.month(ownerId, month), contacts.contacts(ownerId));
	}

}

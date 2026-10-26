package com.tbfernandes.api.assistant.application;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;

import com.tbfernandes.api.assistant.application.port.out.LanguageModel;
import com.tbfernandes.api.assistant.domain.Answer;
import com.tbfernandes.api.assistant.domain.KnowledgeGraph;
import com.tbfernandes.api.assistant.domain.RuleBasedAssistant;
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
import org.springframework.transaction.annotation.Transactional;

/**
 * Questions over the owner's data (AST-01, AST-02) and the knowledge graph (KNW-05). Reads
 * only through the other modules' public lookups and never writes (RN-20).
 */
@Service
@Transactional(readOnly = true)
public class AssistantService {

	private static final Logger log = LoggerFactory.getLogger(AssistantService.class);

	private final WorkLookup work;
	private final KnowledgeLookup knowledge;
	private final GoalsLookup goals;
	private final LearningLookup learning;
	private final FinanceLookup finance;
	private final ContactsLookup contacts;
	private final LanguageModel model;
	private final OwnerContext owner;
	private final Clock clock;

	AssistantService(WorkLookup work, KnowledgeLookup knowledge, GoalsLookup goals, LearningLookup learning,
			FinanceLookup finance, ContactsLookup contacts, LanguageModel model, OwnerContext owner,
			Clock clock) {
		this.work = work;
		this.knowledge = knowledge;
		this.goals = goals;
		this.learning = learning;
		this.finance = finance;
		this.contacts = contacts;
		this.model = model;
		this.owner = owner;
		this.clock = clock;
	}

	public Answer ask(String question) {
		String text = Require.text(question, "question", 500);
		Workspace workspace = workspace();
		Answer grounded = RuleBasedAssistant.answer(text, workspace);
		try {
			return model.answer(text, grounded, workspace).map(t -> grounded.withText(t, "model")).orElse(grounded);
		}
		catch (RuntimeException ex) {
			// The rule-based answer is always good enough to show (NFR: the assistant never fails because of the model).
			log.warn("Language model failed, answering with rules", ex);
			return grounded;
		}
	}

	public KnowledgeGraph graph() {
		return KnowledgeGraph.of(workspace());
	}

	private Workspace workspace() {
		UUID ownerId = owner.currentOwnerId();
		LocalDate today = LocalDate.now(clock);
		return new Workspace(today, work.companies(ownerId), work.projects(ownerId), work.tasks(ownerId),
				knowledge.notes(ownerId), knowledge.snippets(ownerId), goals.goals(ownerId), learning.studies(ownerId),
				finance.purchases(ownerId), finance.month(ownerId, YearMonth.from(today)), contacts.contacts(ownerId));
	}

}

package com.tbfernandes.api.assistant.domain;

import java.time.LocalDate;
import java.util.List;

import com.tbfernandes.api.contacts.ContactsLookup.ContactView;
import com.tbfernandes.api.finance.FinanceLookup.MonthView;
import com.tbfernandes.api.finance.FinanceLookup.PurchaseView;
import com.tbfernandes.api.goals.GoalsLookup.GoalView;
import com.tbfernandes.api.knowledge.KnowledgeLookup.NoteView;
import com.tbfernandes.api.knowledge.KnowledgeLookup.SnippetView;
import com.tbfernandes.api.learning.LearningLookup.StudyView;
import com.tbfernandes.api.work.WorkLookup.CompanyView;
import com.tbfernandes.api.work.WorkLookup.ProjectView;
import com.tbfernandes.api.work.WorkLookup.TaskView;

/**
 * Read-only snapshot of one owner's data, built from the other modules' public APIs. The
 * assistant answers and the graph are pure functions of it, so they are tested without Spring.
 */
public record Workspace(LocalDate today, List<CompanyView> companies, List<ProjectView> projects,
		List<TaskView> tasks, List<NoteView> notes, List<SnippetView> snippets, List<GoalView> goals,
		List<StudyView> studies, List<PurchaseView> purchases, MonthView month, List<ContactView> contacts) {
}

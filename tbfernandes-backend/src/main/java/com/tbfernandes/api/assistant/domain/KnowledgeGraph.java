package com.tbfernandes.api.assistant.domain;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import com.tbfernandes.api.contacts.ContactsLookup.ContactView;
import com.tbfernandes.api.goals.GoalsLookup.GoalView;
import com.tbfernandes.api.knowledge.KnowledgeLookup.NoteView;
import com.tbfernandes.api.knowledge.KnowledgeLookup.SnippetView;
import com.tbfernandes.api.work.WorkLookup.CompanyView;
import com.tbfernandes.api.work.WorkLookup.ProjectView;
import com.tbfernandes.api.work.WorkLookup.TaskView;

/**
 * Every record that takes part in a relation, as nodes and undirected edges (KNW-05). Same
 * nodes, ids ("kind:id"), links and edge order as buildGraph in
 * web/src/features/knowledge/lib/graph.ts; the layout stays in the browser.
 */
public record KnowledgeGraph(List<Node> nodes, List<Edge> edges) {

	public record Node(String id, String kind, String label, String href) {
	}

	public record Edge(String source, String target) {
	}

	public static KnowledgeGraph of(Workspace data) {
		List<Node> nodes = new ArrayList<>();
		List<Edge> edges = new ArrayList<>();

		for (GoalView goal : data.goals()) {
			nodes.add(new Node(key("goal", goal.id()), "goal", goal.name(), "/goals/view?id=" + goal.id()));
			link(edges, key("goal", goal.id()), "goal", goal.parentId());
		}
		for (CompanyView company : data.companies()) {
			nodes.add(new Node(key("company", company.id()), "company", company.name(), "/companies/view?id=" + company.id()));
		}
		for (ProjectView project : data.projects()) {
			String id = key("project", project.id());
			nodes.add(new Node(id, "project", project.name(), "/projects/view?id=" + project.id()));
			link(edges, id, "company", project.companyId());
			link(edges, id, "goal", project.goalId());
		}
		for (TaskView task : data.tasks()) {
			String id = key("task", task.id());
			nodes.add(new Node(id, "task", task.title(),
					"/tasks?q=" + RuleBasedAssistant.encodeUriComponent(task.title())));
			link(edges, id, "project", task.projectId());
			link(edges, id, "goal", task.goalId());
		}
		for (NoteView note : data.notes()) {
			String id = key("note", note.id());
			nodes.add(new Node(id, "note", note.title(), "/knowledge?note=" + note.id()));
			note.projectIds().stream().sorted().forEach(projectId -> link(edges, id, "project", projectId));
			note.taskIds().stream().sorted().forEach(taskId -> link(edges, id, "task", taskId));
		}
		for (SnippetView snippet : data.snippets()) {
			String id = key("snippet", snippet.id());
			nodes.add(new Node(id, "snippet", snippet.title(), "/knowledge/snippets"));
			snippet.projectIds().stream().sorted().forEach(projectId -> link(edges, id, "project", projectId));
			snippet.taskIds().stream().sorted().forEach(taskId -> link(edges, id, "task", taskId));
		}
		for (ContactView contact : data.contacts()) {
			String id = key("contact", contact.id());
			nodes.add(new Node(id, "contact", contact.name(), "/contacts?contact=" + contact.id()));
			link(edges, id, "company", contact.companyId());
		}

		// Drop edges whose other end was deleted (references across modules have no FK, ADR-003).
		Set<String> ids = nodes.stream().map(Node::id).collect(Collectors.toSet());
		return new KnowledgeGraph(List.copyOf(nodes),
				edges.stream().filter(e -> ids.contains(e.source()) && ids.contains(e.target())).toList());
	}

	private static String key(String kind, UUID id) {
		return kind + ":" + id;
	}

	private static void link(List<Edge> edges, String source, String targetKind, UUID targetId) {
		if (targetId != null) {
			edges.add(new Edge(source, key(targetKind, targetId)));
		}
	}

}

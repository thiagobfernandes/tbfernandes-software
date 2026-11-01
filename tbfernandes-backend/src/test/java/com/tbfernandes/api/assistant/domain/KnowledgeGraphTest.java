package com.tbfernandes.api.assistant.domain;

import java.util.UUID;

import com.tbfernandes.api.assistant.domain.KnowledgeGraph.Edge;
import com.tbfernandes.api.assistant.domain.KnowledgeGraph.Node;
import org.junit.jupiter.api.Test;

import static com.tbfernandes.api.assistant.domain.RuleBasedAssistantTest.COMPANY;
import static com.tbfernandes.api.assistant.domain.RuleBasedAssistantTest.GOAL;
import static com.tbfernandes.api.assistant.domain.RuleBasedAssistantTest.NOTE;
import static com.tbfernandes.api.assistant.domain.RuleBasedAssistantTest.PROJECT;
import static org.assertj.core.api.Assertions.assertThat;

class KnowledgeGraphTest {

	@Test
	void sameNodesAndEdgesAsTheFrontend() {
		KnowledgeGraph graph = KnowledgeGraph.of(RuleBasedAssistantTest.workspace());

		// 2 goals, 1 company, 1 project, 4 tasks, 1 note, 1 snippet, 1 contact
		assertThat(graph.nodes()).hasSize(11);
		assertThat(graph.nodes()).contains(new Node("project:" + PROJECT, "project", "Billing Revamp",
				"/projects/view?id=" + PROJECT));
		assertThat(graph.edges()).contains(new Edge("project:" + PROJECT, "company:" + COMPANY),
				new Edge("project:" + PROJECT, "goal:" + GOAL), new Edge("note:" + NOTE, "project:" + PROJECT));
		// 2 project edges + 4 task→project + 1 note + 1 contact
		assertThat(graph.edges()).hasSize(8);
	}

	@Test
	void dropsEdgesToDeletedRecords() {
		Workspace data = RuleBasedAssistantTest.workspace();
		Workspace orphan = new Workspace(data.today(), data.companies(),
				java.util.List.of(new com.tbfernandes.api.work.WorkLookup.ProjectView(UUID.randomUUID(), "Lost",
						"active", UUID.randomUUID(), null, null, null)),
				java.util.List.of(), java.util.List.of(), java.util.List.of(), java.util.List.of(), java.util.List.of(),
				java.util.List.of(), data.month(), java.util.List.of());

		assertThat(KnowledgeGraph.of(orphan).edges()).isEmpty();
	}

}

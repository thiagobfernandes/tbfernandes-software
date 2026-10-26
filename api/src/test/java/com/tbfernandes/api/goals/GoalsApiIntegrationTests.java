package com.tbfernandes.api.goals;

import java.util.List;

import com.tbfernandes.api.ApiTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import static org.assertj.core.api.Assertions.assertThat;

class GoalsApiIntegrationTests extends ApiTestSupport {

	private String goal(String name, String parentId, String indicator) {
		return create("/api/v1/goals", """
				{"name": "%s", "area": "career", "desiredResult": "Done", "parentId": %s, "indicator": %s}"""
			.formatted(name, parentId == null ? "null" : "\"" + parentId + "\"", indicator));
	}

	private static double number(MvcTestResult result, String path) {
		return ((Number) read(result, path)).doubleValue();
	}

	@Test
	void goalResponseHasTheFrontendShape() {
		String id = goal("Ship MVP", null, """
				{"label": "Features", "current": 3, "target": 8, "unit": "features"}""");

		assertThat(get("/api/v1/goals/{id}", id)).bodyJson()
			.hasPathSatisfying("$.id", value -> assertThat(value).isEqualTo(id))
			.hasPathSatisfying("$.status", value -> assertThat(value).isEqualTo("planned"));
		assertThat(number(get("/api/v1/goals/{id}", id), "$.indicator.target")).isEqualTo(8.0);

		assertThat(number(mvc.patch().uri("/api/v1/goals/{id}/indicator", id).contentType("application/json")
			.content("{\"current\": 5}").exchange(), "$.indicator.current")).isEqualTo(5.0);
	}

	@Test
	void subGoalCannotBecomeParentOfItsParent() {
		String parent = goal("Parent", null, "null");
		String child = goal("Child", parent, "null");

		assertThat(put("/api/v1/goals/" + parent, """
				{"name": "Parent", "area": "career", "desiredResult": "Done", "parentId": "%s"}""".formatted(child)))
			.hasStatus(422)
			.bodyJson()
			.hasPathSatisfying("$.rule", rule -> assertThat(rule).isEqualTo("RN-19"));
	}

	@Test
	void deletingAGoalDeletesSubGoalsAndMilestones() {
		String parent = goal("To delete", null, "null");
		String child = goal("Child of deleted", parent, "null");
		String milestone = create("/api/v1/milestones", """
				{"goalId": "%s", "title": "First step"}""".formatted(parent));

		assertThat(mvc.delete().uri("/api/v1/goals/{id}", parent)).hasStatus(204);
		assertThat(get("/api/v1/goals/{id}", child)).hasStatus(404);
		List<String> remaining = read(get("/api/v1/milestones"), "$[*].id");
		assertThat(remaining).doesNotContain(milestone);
	}

	@Test
	void completingALinkedTaskActivatesTheGoalAndCountsIt() {
		String goalId = goal("Close tasks", null, """
				{"label": "Tasks closed", "current": 0, "target": 10, "unit": "tasks"}""");
		String taskId = create("/api/v1/tasks", """
				{"title": "Linked", "status": "todo", "goalId": "%s"}""".formatted(goalId));

		assertThat(mvc.patch().uri("/api/v1/tasks/{id}/status", taskId).contentType("application/json")
			.content("{\"status\": \"done\"}")).hasStatusOk();

		eventually(() -> "active".equals(read(get("/api/v1/goals/{id}", goalId), "$.status")));
		assertThat(number(get("/api/v1/goals/{id}", goalId), "$.indicator.current")).isEqualTo(1.0);
		List<String> linkedTasks = read(get("/api/v1/goals/{id}/links", goalId), "$.tasks[*].id");
		assertThat(linkedTasks).containsExactly(taskId);
	}

}

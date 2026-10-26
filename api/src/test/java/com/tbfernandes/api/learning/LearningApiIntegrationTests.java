package com.tbfernandes.api.learning;

import java.time.LocalDate;
import java.util.List;

import com.tbfernandes.api.ApiTestSupport;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LearningApiIntegrationTests extends ApiTestSupport {

	@Test
	void studyLinksSkillsAndMaterialsFollowIt() {
		String skill = create("/api/v1/skills", """
				{"name": "Spring Modulith", "level": 2}""");
		String study = create("/api/v1/studies", """
				{"name": "Modulith deep dive", "status": "in_progress", "skillIds": ["%s"]}""".formatted(skill));
		String material = create("/api/v1/materials", """
				{"studyId": "%s", "title": "Reference docs", "type": "docs"}""".formatted(study));

		assertThat(get("/api/v1/studies/{id}", study)).bodyJson()
			.extractingPath("$.skillIds")
			.asArray()
			.containsExactly(skill);
		List<String> materials = read(get("/api/v1/materials?studyId=" + study), "$[*].id");
		assertThat(materials).containsExactly(material);
		assertThat(get("/api/v1/materials/{id}", material)).bodyJson()
			.hasPathSatisfying("$.status", value -> assertThat(value).isEqualTo("to_consume"));
	}

	@Test
	void referencesAndRulesAreChecked() {
		assertThat(post("/api/v1/skills", """
				{"name": "Too good", "level": 6}""")).hasStatus(422);
		assertThat(post("/api/v1/studies", """
				{"name": "Ghost", "skillIds": ["0192f000-0000-7000-8000-00000000dead"]}""")).hasStatus(404);
		assertThat(post("/api/v1/certifications", """
				{"name": "OCP", "issuer": "Oracle", "status": "obtained"}""")).hasStatus(422)
			.bodyJson()
			.hasPathSatisfying("$.rule", rule -> assertThat(rule).isEqualTo("RN-14"));
	}

	@Test
	void expiringCertificationsWithinAWindow() {
		LocalDate today = LocalDate.now();
		String soon = create("/api/v1/certifications", """
				{"name": "Soon", "issuer": "X", "status": "obtained", "obtainedAt": "%s", "expiresAt": "%s"}"""
			.formatted(today.minusYears(2), today.plusDays(30)));
		String later = create("/api/v1/certifications", """
				{"name": "Later", "issuer": "X", "status": "obtained", "obtainedAt": "%s", "expiresAt": "%s"}"""
			.formatted(today.minusYears(1), today.plusDays(300)));

		List<String> expiring = read(get("/api/v1/certifications?expiringWithinDays=60"), "$[*].id");
		assertThat(expiring).contains(soon).doesNotContain(later);
	}

}

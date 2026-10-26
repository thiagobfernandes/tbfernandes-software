package com.tbfernandes.api.work.domain.project;

import java.util.UUID;

import com.tbfernandes.api.shared.domain.Ids;
import com.tbfernandes.api.shared.domain.Require;

/** A body of work, optionally for a company. With tasks it is completed, not deleted (RN-01). */
public final class Project {

	private final UUID id;
	private final UUID ownerId;
	private ProjectDetails details;

	private Project(UUID id, UUID ownerId, ProjectDetails details) {
		this.id = id;
		this.ownerId = ownerId;
		this.details = details;
	}

	public static Project create(UUID ownerId, ProjectDetails details) {
		return new Project(Ids.newId(), Require.present(ownerId, "ownerId"), validated(details));
	}

	public static Project restore(UUID id, UUID ownerId, ProjectDetails details) {
		return new Project(id, ownerId, details);
	}

	public void update(ProjectDetails details) {
		this.details = validated(details);
	}

	private static ProjectDetails validated(ProjectDetails d) {
		Require.present(d.startDate(), "startDate");
		Require.dateOrder(d.startDate(), d.dueDate(), "dueDate");
		return new ProjectDetails(Require.text(d.name(), "name", 120),
				Require.optionalText(d.description(), "description", 2000), d.companyId(),
				Require.present(d.category(), "category"), d.status() == null ? ProjectStatus.PLANNED : d.status(),
				d.color() == null ? ProjectColor.TEAL : d.color(), d.startDate(), d.dueDate(),
				Require.optionalText(d.nextDelivery(), "nextDelivery", 200), d.goalId());
	}

	public UUID id() {
		return id;
	}

	public UUID ownerId() {
		return ownerId;
	}

	public ProjectDetails details() {
		return details;
	}

}

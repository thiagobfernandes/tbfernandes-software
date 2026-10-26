package com.tbfernandes.api.goals.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Output port for goals and their milestones. */
public interface GoalRepository {

	Goal save(Goal goal);

	Optional<Goal> findById(UUID ownerId, UUID id);

	List<Goal> findAll(UUID ownerId);

	/** Deletes the goal; sub-goals and milestones go with it (RN-09, ON DELETE CASCADE). */
	void delete(Goal goal);

	Milestone save(Milestone milestone);

	Optional<Milestone> findMilestone(UUID ownerId, UUID id);

	List<Milestone> findMilestones(UUID ownerId, UUID goalId);

	void delete(Milestone milestone);

}

package com.tbfernandes.api.goals.application;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.tbfernandes.api.goals.domain.Goal;
import com.tbfernandes.api.goals.domain.GoalDetails;
import com.tbfernandes.api.goals.domain.GoalRepository;
import com.tbfernandes.api.goals.domain.Milestone;
import com.tbfernandes.api.shared.application.OwnerContext;
import com.tbfernandes.api.shared.domain.BusinessRuleViolation;
import com.tbfernandes.api.shared.domain.NotFound;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Goal and milestone use cases (RF-GOL-01..04). */
@Service
@Transactional
public class GoalService {

	private final GoalRepository goals;
	private final OwnerContext owner;

	GoalService(GoalRepository goals, OwnerContext owner) {
		this.goals = goals;
		this.owner = owner;
	}

	public Goal create(GoalDetails details) {
		Goal goal = Goal.create(owner.currentOwnerId(), details);
		checkParent(goal.id(), details.parentId());
		return goals.save(goal);
	}

	public Goal update(UUID id, GoalDetails details) {
		Goal goal = get(id);
		checkParent(id, details.parentId());
		goal.update(details);
		return goals.save(goal);
	}

	public Goal recordProgress(UUID id, BigDecimal current) {
		Goal goal = get(id);
		goal.recordProgress(current);
		return goals.save(goal);
	}

	/** RN-09: sub-goals and milestones are deleted with the goal. */
	public void delete(UUID id) {
		goals.delete(get(id));
	}

	@Transactional(readOnly = true)
	public Goal get(UUID id) {
		return goals.findById(owner.currentOwnerId(), id).orElseThrow(() -> new NotFound("Goal", id));
	}

	@Transactional(readOnly = true)
	public List<Goal> list() {
		return goals.findAll(owner.currentOwnerId());
	}

	// Milestones

	public Milestone createMilestone(Milestone.Details details) {
		get(details.goalId());
		return goals.save(Milestone.create(owner.currentOwnerId(), details));
	}

	public Milestone updateMilestone(UUID id, Milestone.Details details) {
		Milestone milestone = milestone(id);
		get(details.goalId());
		milestone.update(details);
		return goals.save(milestone);
	}

	public void deleteMilestone(UUID id) {
		goals.delete(milestone(id));
	}

	@Transactional(readOnly = true)
	public Milestone milestone(UUID id) {
		return goals.findMilestone(owner.currentOwnerId(), id).orElseThrow(() -> new NotFound("Milestone", id));
	}

	@Transactional(readOnly = true)
	public List<Milestone> milestones(UUID goalId) {
		return goals.findMilestones(owner.currentOwnerId(), goalId);
	}

	/** RN-19: the parent exists and is not the goal itself or one of its descendants. */
	private void checkParent(UUID goalId, UUID parentId) {
		Set<UUID> seen = new HashSet<>();
		UUID current = parentId;
		while (current != null) {
			if (current.equals(goalId) || !seen.add(current)) {
				throw new BusinessRuleViolation("RN-19", "A goal cannot be a sub-goal of itself or of its sub-goals");
			}
			current = get(current).details().parentId();
		}
	}

}

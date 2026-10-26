package com.tbfernandes.api.goals.adapter.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.tbfernandes.api.goals.domain.Goal;
import com.tbfernandes.api.goals.domain.GoalDetails;
import com.tbfernandes.api.goals.domain.GoalRepository;
import com.tbfernandes.api.goals.domain.Indicator;
import com.tbfernandes.api.goals.domain.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

@Component
class GoalPersistenceAdapter implements GoalRepository {

	private final GoalJpaRepository goals;
	private final MilestoneJpaRepository milestones;

	GoalPersistenceAdapter(GoalJpaRepository goals, MilestoneJpaRepository milestones) {
		this.goals = goals;
		this.milestones = milestones;
	}

	@Override
	public Goal save(Goal goal) {
		GoalJpaEntity e = goals.findById(goal.id()).orElseGet(GoalJpaEntity::new);
		e.id = goal.id();
		e.ownerId = goal.ownerId();
		GoalDetails d = goal.details();
		e.parentId = d.parentId();
		e.name = d.name();
		e.description = d.description();
		e.area = d.area();
		e.status = d.status();
		e.priority = d.priority();
		e.currentState = d.currentState();
		e.desiredResult = d.desiredResult();
		e.doneCriteria = d.doneCriteria();
		e.dueDate = d.dueDate();
		Indicator i = d.indicator();
		e.indicatorLabel = i == null ? null : i.label();
		e.indicatorCurrent = i == null ? null : i.current();
		e.indicatorTarget = i == null ? null : i.target();
		e.indicatorUnit = i == null ? null : i.unit();
		return toDomain(goals.save(e));
	}

	@Override
	public Optional<Goal> findById(UUID ownerId, UUID id) {
		return goals.findByOwnerIdAndId(ownerId, id).map(GoalPersistenceAdapter::toDomain);
	}

	@Override
	public List<Goal> findAll(UUID ownerId) {
		return goals.findByOwnerIdOrderByDueDateAscNameAsc(ownerId).stream().map(GoalPersistenceAdapter::toDomain).toList();
	}

	@Override
	public void delete(Goal goal) {
		goals.deleteById(goal.id());
	}

	@Override
	public Milestone save(Milestone milestone) {
		MilestoneJpaEntity e = milestones.findById(milestone.id()).orElseGet(MilestoneJpaEntity::new);
		e.id = milestone.id();
		e.ownerId = milestone.ownerId();
		Milestone.Details d = milestone.details();
		e.goalId = d.goalId();
		e.title = d.title();
		e.dueDate = d.dueDate();
		e.done = d.done();
		return toDomain(milestones.save(e));
	}

	@Override
	public Optional<Milestone> findMilestone(UUID ownerId, UUID id) {
		return milestones.findByOwnerIdAndId(ownerId, id).map(GoalPersistenceAdapter::toDomain);
	}

	@Override
	public List<Milestone> findMilestones(UUID ownerId, UUID goalId) {
		List<MilestoneJpaEntity> rows = goalId == null ? milestones.findByOwnerIdOrderByDueDateAsc(ownerId)
				: milestones.findByOwnerIdAndGoalIdOrderByDueDateAsc(ownerId, goalId);
		return rows.stream().map(GoalPersistenceAdapter::toDomain).toList();
	}

	@Override
	public void delete(Milestone milestone) {
		milestones.deleteById(milestone.id());
	}

	private static Goal toDomain(GoalJpaEntity e) {
		Indicator indicator = e.indicatorLabel == null ? null
				: new Indicator(e.indicatorLabel, e.indicatorCurrent, e.indicatorTarget, e.indicatorUnit);
		return Goal.restore(e.id, e.ownerId, new GoalDetails(e.name, e.description, e.area, e.status, e.priority,
				e.currentState, e.desiredResult, e.doneCriteria, e.dueDate, indicator, e.parentId));
	}

	private static Milestone toDomain(MilestoneJpaEntity e) {
		return Milestone.restore(e.id, e.ownerId, new Milestone.Details(e.goalId, e.title, e.dueDate, e.done));
	}

}

interface GoalJpaRepository extends JpaRepository<GoalJpaEntity, UUID> {

	Optional<GoalJpaEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	List<GoalJpaEntity> findByOwnerIdOrderByDueDateAscNameAsc(UUID ownerId);

}

interface MilestoneJpaRepository extends JpaRepository<MilestoneJpaEntity, UUID> {

	Optional<MilestoneJpaEntity> findByOwnerIdAndId(UUID ownerId, UUID id);

	List<MilestoneJpaEntity> findByOwnerIdOrderByDueDateAsc(UUID ownerId);

	List<MilestoneJpaEntity> findByOwnerIdAndGoalIdOrderByDueDateAsc(UUID ownerId, UUID goalId);

}

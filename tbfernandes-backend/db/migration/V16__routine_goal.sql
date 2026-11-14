-- WRK-15: a routine can serve a goal (habit towards an outcome), with or without a project.
ALTER TABLE work.routine
  ADD COLUMN goal_id uuid; -- goals.goal (other module)
CREATE INDEX routine_goal_idx ON work.routine (goal_id);

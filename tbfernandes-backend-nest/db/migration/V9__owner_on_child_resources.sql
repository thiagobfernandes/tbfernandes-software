-- Etapa 4. Milestones and interactions are edited on their own in the frontend (flat
-- collections), so they get owner_id like every other resource the API exposes directly.
-- Existing rows take the owner of their parent.

ALTER TABLE goals.milestone ADD COLUMN owner_id uuid;
UPDATE goals.milestone m SET owner_id = g.owner_id FROM goals.goal g WHERE g.id = m.goal_id;
ALTER TABLE goals.milestone ALTER COLUMN owner_id SET NOT NULL;
CREATE INDEX milestone_owner_idx ON goals.milestone (owner_id);

ALTER TABLE contacts.interaction ADD COLUMN owner_id uuid;
UPDATE contacts.interaction i SET owner_id = c.owner_id FROM contacts.contact c WHERE c.id = i.contact_id;
ALTER TABLE contacts.interaction ALTER COLUMN owner_id SET NOT NULL;
CREATE INDEX interaction_owner_idx ON contacts.interaction (owner_id);

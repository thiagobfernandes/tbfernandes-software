-- Development sample data, generated from web/src/lib/sample-data (same records the
-- frontend shows). Ids are UUIDv5 of the frontend ids, so links stay consistent.
-- Loaded only with the dev profile (spring.flyway.locations includes db/dev).

INSERT INTO identity.app_user (id, name, email) VALUES
  ('0192f000-0000-7000-8000-000000000001', 'Thiago', 'owner@tbfernandes.local')
ON CONFLICT DO NOTHING;

INSERT INTO work.company (id, owner_id, name, trade_name, relationship, status, description, start_date, main_contact) VALUES
  ('b99dd5f4-7828-541a-9190-d722873bc1ad', '0192f000-0000-7000-8000-000000000001', 'Software house', NULL, 'CONTRACTOR', 'ACTIVE', 'Software house I provide development services to as a PJ contractor.', '2025-03-10', 'Engineering manager'),
  ('c90d1caf-96f0-5b3e-b51d-04fc590d7355', '0192f000-0000-7000-8000-000000000001', 'TBFernandes PJ', 'TBFernandes Software', 'OWN', 'ACTIVE', 'My own company: contracts, invoicing, and personal products.', '2024-08-01', NULL),
  ('83d1dcdb-2b57-57ac-bda3-1ad0d867bdc4', '0192f000-0000-7000-8000-000000000001', 'Previous agency', NULL, 'CLIENT', 'CLOSED', 'Former client for landing pages and integrations.', '2023-02-01', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO work.project (id, owner_id, company_id, name, description, category, status, color, start_date, due_date, next_delivery, goal_id) VALUES
  ('9cc39cfc-63d8-5404-9bc1-b8d3250bf432', '0192f000-0000-7000-8000-000000000001', 'b99dd5f4-7828-541a-9190-d722873bc1ad', 'Telemetry support', 'Maintenance and evolution of the client''s telemetry platform.', 'PROFESSIONAL', 'ACTIVE', 'VIOLET', '2026-09-01', '2026-12-19', 'Monthly report · Oct 31', NULL),
  ('0dac5543-7d3f-5da5-aad0-9138f86f30e7', '0192f000-0000-7000-8000-000000000001', 'c90d1caf-96f0-5b3e-b51d-04fc590d7355', 'TBFernandes Software', 'This platform: companies, projects, tasks, then goals and AI.', 'PERSONAL', 'ACTIVE', 'TEAL', '2026-10-20', '2026-11-15', 'MVP: companies & tasks · Nov 15', 'b9dff122-5016-535e-b04d-c6910a7b892d'),
  ('5f7a9ebf-4f29-5ff7-8df4-5ff87bb95ae0', '0192f000-0000-7000-8000-000000000001', NULL, 'Distributed systems lab', 'Hands-on experiments: consensus, messaging, fault tolerance.', 'STUDY', 'ACTIVE', 'AMBER', '2026-10-05', '2026-11-30', 'Raft experiment · Nov 30', 'fe97e479-9046-5429-8bdd-3eaaeadd09b3'),
  ('0defbafa-f351-55f6-b5f7-13f8b95612b7', '0192f000-0000-7000-8000-000000000001', NULL, 'Kubernetes certification', NULL, 'STUDY', 'PLANNED', 'SKY', '2026-11-16', NULL, NULL, 'fe97e479-9046-5429-8bdd-3eaaeadd09b3')
ON CONFLICT DO NOTHING;

INSERT INTO work.task (id, owner_id, project_id, title, description, status, priority, tag, start_date, due_date, done_criteria, checklist_done, checklist_total, goal_id, completed_at) VALUES
  ('afb289ce-5697-5de2-bc43-4b90eccb092e', '0192f000-0000-7000-8000-000000000001', '9cc39cfc-63d8-5404-9bc1-b8d3250bf432', 'Investigate telemetry ingestion alert', 'Ingestion lag above 5 min since the last deploy. Find root cause and document it.', 'IN_PROGRESS', 'URGENT', 'Backend', '2026-10-22', '2026-10-23', NULL, 2, 5, NULL, NULL),
  ('d1273647-a602-5992-bece-74ffbd9100c6', '0192f000-0000-7000-8000-000000000001', '0dac5543-7d3f-5da5-aad0-9138f86f30e7', 'Model Company, Project and Task entities', 'Entities, relationships, and business rules for the MVP, ready for the Flyway baseline.', 'IN_PROGRESS', 'HIGH', 'Modeling', '2026-10-21', '2026-10-23', NULL, 3, 6, NULL, NULL),
  ('42766118-2cde-5e2c-bfca-24c6ddce50a4', '0192f000-0000-7000-8000-000000000001', '9cc39cfc-63d8-5404-9bc1-b8d3250bf432', 'Review pull request for device sync', NULL, 'TODO', 'NORMAL', 'Review', '2026-10-24', '2026-10-24', NULL, NULL, NULL, NULL, NULL),
  ('815cca4b-ba39-569c-a8f6-7e5e3f8246dd', '0192f000-0000-7000-8000-000000000001', '0dac5543-7d3f-5da5-aad0-9138f86f30e7', 'Write Flyway baseline migration', 'Tables for companies, projects, tasks, and checklist items with owner_id.', 'TODO', 'NORMAL', 'Database', '2026-10-24', '2026-10-27', NULL, NULL, NULL, NULL, NULL),
  ('e4805b82-9807-5236-9bbc-3c82362db2f4', '0192f000-0000-7000-8000-000000000001', '0dac5543-7d3f-5da5-aad0-9138f86f30e7', 'Frontend app shell', 'Next.js, theme tokens, sidebar, dashboard, and shared components.', 'DONE', 'HIGH', 'Frontend', '2026-10-20', '2026-10-22', NULL, 6, 6, NULL, '2026-10-22T18:00:00Z'),
  ('41e9f673-a208-5065-9542-7a4ae78d0e5e', '0192f000-0000-7000-8000-000000000001', '9cc39cfc-63d8-5404-9bc1-b8d3250bf432', 'Monthly telemetry report', NULL, 'BACKLOG', 'NORMAL', 'Report', '2026-10-28', '2026-10-31', NULL, NULL, NULL, NULL, NULL),
  ('bc9a6b51-97ee-557a-82e8-dcf9c62158bb', '0192f000-0000-7000-8000-000000000001', '5f7a9ebf-4f29-5ff7-8df4-5ff87bb95ae0', 'Raft leader election experiment', 'Three nodes locally, inject partitions, record election times.', 'IN_PROGRESS', 'NORMAL', 'Study', '2026-10-19', '2026-10-29', NULL, 1, 4, NULL, NULL),
  ('da2f3b53-85d2-52f3-8c23-200919c5ab13', '0192f000-0000-7000-8000-000000000001', '9cc39cfc-63d8-5404-9bc1-b8d3250bf432', 'Waiting on client VPN access', NULL, 'BLOCKED', 'HIGH', 'Access', '2026-10-20', '2026-10-21', NULL, NULL, NULL, NULL, NULL),
  ('5fa96b34-b49e-5cf8-8a27-76e6cfa185ef', '0192f000-0000-7000-8000-000000000001', '0dac5543-7d3f-5da5-aad0-9138f86f30e7', 'Companies CRUD API', NULL, 'BACKLOG', 'HIGH', 'Backend', '2026-10-27', '2026-10-30', NULL, NULL, NULL, NULL, NULL),
  ('ff191190-0a88-50f6-af54-896d2939160e', '0192f000-0000-7000-8000-000000000001', NULL, 'Renew accountant contract', NULL, 'TODO', 'LOW', 'Admin', NULL, '2026-10-30', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO knowledge.note (id, owner_id, title, body, tags, created_at, updated_at) VALUES
  ('2d71fd08-006d-5683-add8-7e553b6a652f', '0192f000-0000-7000-8000-000000000001', 'Telemetry ingestion: where alerts come from', '## Context

The ingestion alert fires when the **lag** of the `telemetry-events` consumer group passes 5 minutes.

## What to check first

1. Consumer lag per partition in Grafana
2. Recent deploys of the ingestion service
3. Database connection pool saturation

> Most incidents so far were a slow query in the device lookup.

- [x] Document the dashboard links
- [ ] Ask for read access to the production logs', ARRAY['telemetry','incident','kafka']::text[], '2026-10-14', '2026-10-22'),
  ('6e489101-1a1c-5509-892a-c2e3fecd775c', '0192f000-0000-7000-8000-000000000001', 'Modular monolith boundaries', 'Each module owns its tables and exposes a small API to the others.

| Module | Owns |
| --- | --- |
| work | companies, projects, tasks |
| knowledge | notes, snippets, links |
| finance | entries, purchase goals |

Cross-module reads go through **application services**, never through repositories of another module.', ARRAY['architecture','spring']::text[], '2026-10-20', '2026-10-21'),
  ('8699903d-79a7-5ac4-a455-7ab06b393069', '0192f000-0000-7000-8000-000000000001', 'Raft: leader election notes', 'Election timeout must be randomized (150–300 ms) to avoid split votes.

A node becomes **candidate** after the timeout, votes for itself and sends `RequestVote` to its peers.', ARRAY['distributed-systems','raft']::text[], '2026-10-19', '2026-10-19')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge.snippet (id, owner_id, title, language, code, explanation, source_url, tags, created_at, updated_at) VALUES
  ('ea1ff87a-55b0-5b06-8bc1-c34f702251a0', '0192f000-0000-7000-8000-000000000001', 'Problem Details exception handler', 'java', '@RestControllerAdvice
class ApiExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    ProblemDetail handleNotFound(EntityNotFoundException ex) {
        var problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource not found");
        return problem;
    }
}', 'Returns RFC 9457 Problem Details so the frontend can show the same error shape everywhere.', NULL, ARRAY['spring','errors']::text[], '2026-10-21', '2026-10-21'),
  ('24a91ffe-cf1c-5744-aa0e-37eae90a4d5b', '0192f000-0000-7000-8000-000000000001', 'Consumer lag per partition', 'bash', 'kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe --group telemetry-events', 'First check when the ingestion alert fires.', 'https://kafka.apache.org/documentation/', ARRAY['kafka','telemetry']::text[], '2026-10-15', '2026-10-15'),
  ('bd08cb36-b3ff-5485-9d7a-4b5ab726b0e0', '0192f000-0000-7000-8000-000000000001', 'Tasks overdue per project', 'sql', 'select p.name, count(*) as overdue
from task t
join project p on p.id = t.project_id
where t.status not in (''DONE'', ''CANCELED'')
  and t.due_date < current_date
group by p.name
order by overdue desc;', NULL, NULL, ARRAY['postgres','reports']::text[], '2026-10-22', '2026-10-22')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge.note_link (note_id, target_type, target_id) VALUES
  ('2d71fd08-006d-5683-add8-7e553b6a652f', 'PROJECT', '9cc39cfc-63d8-5404-9bc1-b8d3250bf432'),
  ('2d71fd08-006d-5683-add8-7e553b6a652f', 'TASK', 'afb289ce-5697-5de2-bc43-4b90eccb092e'),
  ('6e489101-1a1c-5509-892a-c2e3fecd775c', 'PROJECT', '0dac5543-7d3f-5da5-aad0-9138f86f30e7'),
  ('6e489101-1a1c-5509-892a-c2e3fecd775c', 'TASK', 'd1273647-a602-5992-bece-74ffbd9100c6'),
  ('8699903d-79a7-5ac4-a455-7ab06b393069', 'PROJECT', '5f7a9ebf-4f29-5ff7-8df4-5ff87bb95ae0'),
  ('8699903d-79a7-5ac4-a455-7ab06b393069', 'TASK', 'bc9a6b51-97ee-557a-82e8-dcf9c62158bb')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge.snippet_link (snippet_id, target_type, target_id) VALUES
  ('ea1ff87a-55b0-5b06-8bc1-c34f702251a0', 'PROJECT', '0dac5543-7d3f-5da5-aad0-9138f86f30e7'),
  ('ea1ff87a-55b0-5b06-8bc1-c34f702251a0', 'TASK', '5fa96b34-b49e-5cf8-8a27-76e6cfa185ef'),
  ('24a91ffe-cf1c-5744-aa0e-37eae90a4d5b', 'PROJECT', '9cc39cfc-63d8-5404-9bc1-b8d3250bf432'),
  ('24a91ffe-cf1c-5744-aa0e-37eae90a4d5b', 'TASK', 'afb289ce-5697-5de2-bc43-4b90eccb092e'),
  ('bd08cb36-b3ff-5485-9d7a-4b5ab726b0e0', 'PROJECT', '0dac5543-7d3f-5da5-aad0-9138f86f30e7')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge.method (id, owner_id, title, summary, category, tags, last_reviewed) VALUES
  ('f15fe65b-40b3-5b7e-b37e-0af4c4e351b4', '0192f000-0000-7000-8000-000000000001', 'Commit method', 'Prepare small, reviewed commits with a consistent message.', 'DEVELOPMENT', ARRAY['git','review']::text[], '2026-10-23'),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', '0192f000-0000-7000-8000-000000000001', 'Bug-fixing method', 'From reproduction to a tested, documented fix.', 'QUALITY', ARRAY['debugging','testing']::text[], '2026-10-23'),
  ('78f5b89b-427d-58d1-934f-d558d0fa23a0', '0192f000-0000-7000-8000-000000000001', 'Meeting method', 'Meetings with a clear goal, decisions, and follow-up.', 'COMMUNICATION', ARRAY['meetings','follow-up']::text[], '2026-10-23')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge.method_step (method_id, position, title, detail) VALUES
  ('f15fe65b-40b3-5b7e-b37e-0af4c4e351b4', 0, 'Review the diff', 'Read every changed line with git diff --staged before committing.'),
  ('f15fe65b-40b3-5b7e-b37e-0af4c4e351b4', 1, 'Keep the change focused', 'One intent per commit. Split unrelated changes with git add -p.'),
  ('f15fe65b-40b3-5b7e-b37e-0af4c4e351b4', 2, 'Run checks', 'Tests, lint, and build as appropriate for the change.'),
  ('f15fe65b-40b3-5b7e-b37e-0af4c4e351b4', 3, 'Write the message', 'Conventional Commits: type(scope): summary in the imperative, under 72 characters.'),
  ('f15fe65b-40b3-5b7e-b37e-0af4c4e351b4', 4, 'Explain the why', 'Add a body when the reason is not obvious from the diff.'),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 0, 'Reproduce the bug', NULL),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 1, 'Record expected vs. actual behavior', NULL),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 2, 'Gather logs and relevant context', NULL),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 3, 'Find a minimal reproduction', NULL),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 4, 'Form and test a hypothesis', 'Change one thing at a time and confirm the cause before fixing.'),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 5, 'Implement the smallest safe fix', NULL),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 6, 'Add or update regression tests', 'The test must fail without the fix.'),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 7, 'Review the diff and validate the fix', NULL),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 8, 'Record the root cause and lessons', 'Link the note to the project or task.'),
  ('78f5b89b-427d-58d1-934f-d558d0fa23a0', 0, 'Define the objective and agenda', NULL),
  ('78f5b89b-427d-58d1-934f-d558d0fa23a0', 1, 'Gather the context you need beforehand', NULL),
  ('78f5b89b-427d-58d1-934f-d558d0fa23a0', 2, 'Record decisions', NULL),
  ('78f5b89b-427d-58d1-934f-d558d0fa23a0', 3, 'Record action items with owners and deadlines', NULL),
  ('78f5b89b-427d-58d1-934f-d558d0fa23a0', 4, 'Share a concise summary afterward', NULL),
  ('78f5b89b-427d-58d1-934f-d558d0fa23a0', 5, 'Follow up on open actions', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO knowledge.method_example (method_id, position, title, content) VALUES
  ('f15fe65b-40b3-5b7e-b37e-0af4c4e351b4', 0, 'Commit messages', 'feat(tasks): add board view grouped by status
fix(projects): keep timeline bars inside the visible range
refactor(api): extract Problem Details parsing
docs: record modular monolith decision'),
  ('78f5b89b-427d-58d1-934f-d558d0fa23a0', 0, 'Summary template', 'Objective:
Decisions:
- 
Action items (owner, deadline):
- 
Open questions:
- ')
ON CONFLICT DO NOTHING;

INSERT INTO goals.goal (id, owner_id, parent_id, name, description, area, status, priority, current_state, desired_result, done_criteria, due_date, indicator_label, indicator_current, indicator_target, indicator_unit) VALUES
  ('b9dff122-5016-535e-b04d-c6910a7b892d', '0192f000-0000-7000-8000-000000000001', NULL, 'Launch TBFernandes Software MVP', 'Use my own platform daily for work and personal life.', 'CAREER', 'ACTIVE', 'HIGH', 'Frontend shell and simulated flows are ready.', 'Companies, projects and tasks running on the real API.', 'I manage all my tasks in it for two weeks in a row.', '2026-11-15', 'MVP features done', 3, 8, 'features'),
  ('fe97e479-9046-5429-8bdd-3eaaeadd09b3', '0192f000-0000-7000-8000-000000000001', NULL, 'Become a stronger backend engineer', NULL, 'LEARNING', 'ACTIVE', 'HIGH', NULL, 'Design and operate distributed systems with confidence.', 'Pass the CKAD exam and finish the distributed systems lab.', '2027-03-31', 'Study hours', 42, 120, 'h'),
  ('ea76c01b-8d1a-52a3-952c-50b6e52b3b86', '0192f000-0000-7000-8000-000000000001', NULL, 'Build an emergency reserve', NULL, 'FINANCE', 'ACTIVE', 'NORMAL', 'Two months of expenses saved.', 'Six months of personal expenses saved.', NULL, '2027-06-30', 'Reserve', 14000, 42000, 'BRL'),
  ('e79d39ca-b71c-5715-b303-773aaa2b9033', '0192f000-0000-7000-8000-000000000001', 'fe97e479-9046-5429-8bdd-3eaaeadd09b3', 'Pass the CKAD exam', NULL, 'LEARNING', 'PLANNED', 'NORMAL', NULL, 'CKAD certification obtained.', NULL, '2027-02-28', NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO goals.milestone (id, goal_id, title, due_date, done, position) VALUES
  ('4e59d1ab-fb80-5d52-83ec-380590511cb1', 'b9dff122-5016-535e-b04d-c6910a7b892d', 'Frontend shell', '2026-10-23', true, 0),
  ('d4d4cf55-86c2-5fe1-ab9e-b81b95e70ec9', 'b9dff122-5016-535e-b04d-c6910a7b892d', 'Companies & projects API', '2026-11-01', false, 1),
  ('babe31f9-a58a-5291-a357-010eab4b8a33', 'b9dff122-5016-535e-b04d-c6910a7b892d', 'Tasks API and deploy', '2026-11-15', false, 2),
  ('e72f7385-76b9-5c6b-b7f8-c235336a4b38', 'fe97e479-9046-5429-8bdd-3eaaeadd09b3', 'Distributed systems lab', '2026-11-30', false, 3),
  ('3187c5f7-044a-5925-a548-73e2fe41a356', 'ea76c01b-8d1a-52a3-952c-50b6e52b3b86', 'Three months saved', '2026-12-31', false, 4)
ON CONFLICT DO NOTHING;

INSERT INTO learning.skill (id, owner_id, name, level, evidence) VALUES
  ('b9e8edcf-6de3-5644-97e6-c27f56957676', '0192f000-0000-7000-8000-000000000001', 'Java & Spring Boot', 4, 'Five years in production systems.'),
  ('21e71439-83f9-5184-8520-ba83de75182c', '0192f000-0000-7000-8000-000000000001', 'Distributed systems', 2, 'Raft lab in progress.'),
  ('4da412ac-2acc-5bf6-87bc-4aa8755d263e', '0192f000-0000-7000-8000-000000000001', 'Kubernetes', 2, NULL),
  ('8c3a5c00-9a6b-5891-877e-2899f6265ec9', '0192f000-0000-7000-8000-000000000001', 'React & Next.js', 3, 'This platform''s frontend.'),
  ('7f0327b6-73f3-5109-bab7-a6556f22c657', '0192f000-0000-7000-8000-000000000001', 'PostgreSQL', 3, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO learning.study (id, owner_id, name, description, status, goal_id, start_date, due_date, next_activity) VALUES
  ('020a101b-2141-5ff5-ba29-f85f06a363f7', '0192f000-0000-7000-8000-000000000001', 'Distributed systems fundamentals', 'Consensus, replication, and failure handling.', 'IN_PROGRESS', 'fe97e479-9046-5429-8bdd-3eaaeadd09b3', '2026-10-05', '2026-11-30', 'Finish Raft leader election experiment'),
  ('ad28962b-4013-5d88-98c9-3cfde520dbe6', '0192f000-0000-7000-8000-000000000001', 'Kubernetes for developers', NULL, 'PLANNED', 'e79d39ca-b71c-5715-b303-773aaa2b9033', '2026-11-16', '2027-02-28', 'Pick a course and book the exam date')
ON CONFLICT DO NOTHING;

INSERT INTO learning.study_skill (study_id, skill_id) VALUES
  ('020a101b-2141-5ff5-ba29-f85f06a363f7', '21e71439-83f9-5184-8520-ba83de75182c'),
  ('ad28962b-4013-5d88-98c9-3cfde520dbe6', '4da412ac-2acc-5bf6-87bc-4aa8755d263e')
ON CONFLICT DO NOTHING;

INSERT INTO learning.material (id, owner_id, study_id, title, type, url, status, notes) VALUES
  ('f7d5c1dc-9cf0-529f-a80b-3af72b073489', '0192f000-0000-7000-8000-000000000001', '020a101b-2141-5ff5-ba29-f85f06a363f7', 'In Search of an Understandable Consensus Algorithm', 'PAPER', 'https://raft.github.io/raft.pdf', 'CONSUMED', NULL),
  ('5847cce9-9e51-5d92-b591-d63906b11c57', '0192f000-0000-7000-8000-000000000001', '020a101b-2141-5ff5-ba29-f85f06a363f7', 'Designing Data-Intensive Applications', 'BOOK', NULL, 'IN_PROGRESS', 'Chapters 5, 8 and 9 first.'),
  ('a2940194-b46f-56b1-acbe-109f9cb5bcf2', '0192f000-0000-7000-8000-000000000001', '020a101b-2141-5ff5-ba29-f85f06a363f7', 'MIT 6.824 lectures', 'VIDEO', NULL, 'TO_CONSUME', NULL),
  ('f41f3440-f7ea-5156-be73-eda2d84d9e7a', '0192f000-0000-7000-8000-000000000001', 'ad28962b-4013-5d88-98c9-3cfde520dbe6', 'Kubernetes documentation: Tasks', 'DOCS', 'https://kubernetes.io/docs/tasks/', 'TO_CONSUME', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO learning.certification (id, owner_id, name, issuer, status, obtained_at, expires_at, validation_url) VALUES
  ('f6455fbc-12db-5c0e-be68-b7c63e8012fd', '0192f000-0000-7000-8000-000000000001', 'Certified Kubernetes Application Developer', 'CNCF', 'PLANNED', NULL, NULL, NULL),
  ('97966912-2a42-579d-9a21-491387219bfb', '0192f000-0000-7000-8000-000000000001', 'Oracle Certified Professional: Java SE 17', 'Oracle', 'OBTAINED', '2024-05-12', NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO learning.certification_study (certification_id, study_id) VALUES
  ('f6455fbc-12db-5c0e-be68-b7c63e8012fd', 'ad28962b-4013-5d88-98c9-3cfde520dbe6')
ON CONFLICT DO NOTHING;

INSERT INTO learning.education (id, owner_id, institution, course, degree, status, start_date, end_date) VALUES
  ('6d681ca6-edb6-54d4-843e-95033977c079', '0192f000-0000-7000-8000-000000000001', 'Federal University', 'Computer Science', 'Bachelor', 'COMPLETED', '2016-02-01', '2020-12-15')
ON CONFLICT DO NOTHING;

INSERT INTO finance.entry (id, owner_id, kind, scope, category, description, amount, entry_date, recurring) VALUES
  ('1e9467ee-9a34-576b-987e-f28f2ec321a4', '0192f000-0000-7000-8000-000000000001', 'INCOME', 'BUSINESS', 'Services', 'Software house invoice · September', 18000, '2026-10-05', true),
  ('a56513e1-abe1-5275-b9a3-183b6c151c5a', '0192f000-0000-7000-8000-000000000001', 'EXPENSE', 'BUSINESS', 'Taxes', 'Simples Nacional DAS', 1080, '2026-10-20', true),
  ('1f7b9c85-4e5f-523f-b1a7-05920aaaffa5', '0192f000-0000-7000-8000-000000000001', 'EXPENSE', 'BUSINESS', 'Accounting', 'Accountant', 350, '2026-10-10', true),
  ('0f4cb6f7-4c5d-5be0-8aca-434072bf5a0e', '0192f000-0000-7000-8000-000000000001', 'INCOME', 'PERSONAL', 'Pro-labore', 'Transfer from PJ', 9000, '2026-10-06', true),
  ('552c107b-641d-5ab9-ad2c-fecb29860478', '0192f000-0000-7000-8000-000000000001', 'EXPENSE', 'PERSONAL', 'Housing', 'Rent', 2800, '2026-10-08', true),
  ('86974e5c-e3ed-5830-8532-77ac6acf218e', '0192f000-0000-7000-8000-000000000001', 'EXPENSE', 'PERSONAL', 'Food', 'Groceries', 1400, '2026-10-12', false),
  ('90bbabe3-312f-534f-aa91-b07fad8a950f', '0192f000-0000-7000-8000-000000000001', 'EXPENSE', 'PERSONAL', 'Education', 'Course subscription', 120, '2026-10-15', true),
  ('24b4b008-72b7-5316-8e51-874d42c4ae85', '0192f000-0000-7000-8000-000000000001', 'EXPENSE', 'PERSONAL', 'Transport', 'Fuel and app rides', 480, '2026-10-18', false),
  ('7bf2ec49-91b9-57a9-97d3-af5fda053a90', '0192f000-0000-7000-8000-000000000001', 'INCOME', 'BUSINESS', 'Services', 'Software house invoice · August', 18000, '2026-09-05', true),
  ('fc3a75d1-ad6b-5ab5-89b8-3eb8a42c9ac7', '0192f000-0000-7000-8000-000000000001', 'EXPENSE', 'PERSONAL', 'Housing', 'Rent', 2800, '2026-09-08', true),
  ('8bcc25ed-b67a-5acf-ae04-41d031448d44', '0192f000-0000-7000-8000-000000000001', 'INCOME', 'PERSONAL', 'Pro-labore', 'Transfer from PJ', 9000, '2026-09-06', true),
  ('4a42bb2a-6de8-56cf-8d8a-37754333b720', '0192f000-0000-7000-8000-000000000001', 'EXPENSE', 'PERSONAL', 'Food', 'Groceries', 1550, '2026-09-12', false)
ON CONFLICT DO NOTHING;

INSERT INTO finance.purchase_goal (id, owner_id, name, description, estimated, reserved, monthly_saving, priority, desired_date, goal_id, status, paid) VALUES
  ('b786362e-1d9d-5f03-b00e-1d65e6f34aa9', '0192f000-0000-7000-8000-000000000001', 'New laptop', '32 GB RAM for local Kubernetes and builds.', 14000, 6500, 1500, 'HIGH', '2027-03-01', NULL, 'SAVING', NULL),
  ('44c69188-28dd-5476-aa26-a75be1d56596', '0192f000-0000-7000-8000-000000000001', 'Standing desk', NULL, 2600, 2600, NULL, 'NORMAL', NULL, NULL, 'BOUGHT', 2450),
  ('95db8a53-c5d9-5e7f-9f67-9caf6cbb6279', '0192f000-0000-7000-8000-000000000001', 'CKAD exam voucher', NULL, 2200, 0, 550, 'NORMAL', '2027-02-01', 'e79d39ca-b71c-5715-b303-773aaa2b9033', 'PLANNED', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO contacts.contact (id, owner_id, name, company_id, company_name, role, email, phone, profile_url, specialties, context, next_contact, notes) VALUES
  ('5ce72274-9717-5391-af4d-b5e56b054c73', '0192f000-0000-7000-8000-000000000001', 'Marina Alves', 'b99dd5f4-7828-541a-9190-d722873bc1ad', NULL, 'Engineering manager', 'marina@example.com', NULL, NULL, ARRAY['Telemetry','Team leadership']::text[], 'Manages the telemetry squad I work with.', '2026-10-31', NULL),
  ('de9a99e4-06fd-5d6e-b169-2dbb3af201dd', '0192f000-0000-7000-8000-000000000001', 'Rafael Costa', NULL, 'Accounting office', 'Accountant', NULL, '+55 11 90000-0000', NULL, ARRAY['Taxes','PJ']::text[], 'Handles TBFernandes PJ bookkeeping.', '2026-10-30', NULL),
  ('2ef0a47d-2e1c-5395-b6ba-bc20d7fdf97d', '0192f000-0000-7000-8000-000000000001', 'Lucas Pereira', NULL, 'Java community', 'Staff engineer', NULL, NULL, 'https://www.linkedin.com/', ARRAY['Kubernetes','Distributed systems']::text[], 'Met at a Java meetup; offered to review my Raft lab.', NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO contacts.interaction (id, contact_id, occurred_on, kind, summary, follow_up_task_id) VALUES
  ('04645064-d941-50e0-b2d3-85e9b2edadec', '5ce72274-9717-5391-af4d-b5e56b054c73', '2026-10-20', 'MEETING', 'Weekly sync: VPN access still pending, agreed on the monthly report format.', NULL),
  ('565e0eba-123c-517a-9d42-50cd341ebe42', 'de9a99e4-06fd-5d6e-b169-2dbb3af201dd', '2026-10-10', 'MESSAGE', 'Asked about renewing the contract for 2027.', 'ff191190-0a88-50f6-af54-896d2939160e'),
  ('27157793-4740-55e5-966b-bbcf7923a608', '2ef0a47d-2e1c-5395-b6ba-bc20d7fdf97d', '2026-09-28', 'EVENT', 'Talked about Raft and CKAD preparation at the meetup.', NULL),
  ('169cec07-18c7-5b03-980a-3ef88ef2d732', '5ce72274-9717-5391-af4d-b5e56b054c73', '2026-10-06', 'CALL', 'Kick-off for the ingestion alert investigation.', NULL)
ON CONFLICT DO NOTHING;

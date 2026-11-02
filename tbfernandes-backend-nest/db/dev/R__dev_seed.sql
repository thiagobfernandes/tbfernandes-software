-- Development sample data, generated from web/src/lib/sample-data (same records the
-- frontend shows). Ids are UUIDv5 of the frontend ids, so links stay consistent.
-- Loaded only with the dev profile (spring.flyway.locations includes db/dev).

INSERT INTO identity.app_user (id, name, email) VALUES
  ('0192f000-0000-7000-8000-000000000001', 'Thiago', 'owner@tbfernandes.local')
ON CONFLICT DO NOTHING;

INSERT INTO work.company (id, owner_id, name, trade_name, relationship, status, description, start_date, main_contact) VALUES
  ('b99dd5f4-7828-541a-9190-d722873bc1ad', '0192f000-0000-7000-8000-000000000001', 'Software house', NULL, 'CONTRACTOR', 'ACTIVE', 'Software house para a qual presto serviços de desenvolvimento como PJ.', '2025-03-10', 'Gerente de engenharia'),
  ('c90d1caf-96f0-5b3e-b51d-04fc590d7355', '0192f000-0000-7000-8000-000000000001', 'TBFernandes PJ', 'TBFernandes Software', 'OWN', 'ACTIVE', 'Minha própria empresa: contratos, faturamento e produtos próprios.', '2024-08-01', NULL),
  ('83d1dcdb-2b57-57ac-bda3-1ad0d867bdc4', '0192f000-0000-7000-8000-000000000001', 'Agência anterior', NULL, 'CLIENT', 'CLOSED', 'Ex-cliente de landing pages e integrações.', '2023-02-01', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO work.project (id, owner_id, company_id, name, description, category, status, color, start_date, due_date, next_delivery, goal_id) VALUES
  ('9cc39cfc-63d8-5404-9bc1-b8d3250bf432', '0192f000-0000-7000-8000-000000000001', 'b99dd5f4-7828-541a-9190-d722873bc1ad', 'Suporte de telemetria', 'Manutenção e evolução da plataforma de telemetria do cliente.', 'PROFESSIONAL', 'ACTIVE', 'VIOLET', '2026-09-01', '2026-12-19', 'Relatório mensal · 31/10', NULL),
  ('0dac5543-7d3f-5da5-aad0-9138f86f30e7', '0192f000-0000-7000-8000-000000000001', 'c90d1caf-96f0-5b3e-b51d-04fc590d7355', 'TBFernandes Software', 'Esta plataforma: empresas, projetos, tarefas, depois metas e IA.', 'PERSONAL', 'ACTIVE', 'TEAL', '2026-10-20', '2026-11-15', 'MVP: empresas e tarefas · 15/11', 'b9dff122-5016-535e-b04d-c6910a7b892d'),
  ('5f7a9ebf-4f29-5ff7-8df4-5ff87bb95ae0', '0192f000-0000-7000-8000-000000000001', NULL, 'Laboratório de sistemas distribuídos', 'Experimentos práticos: consenso, mensageria, tolerância a falhas.', 'STUDY', 'ACTIVE', 'AMBER', '2026-10-05', '2026-11-30', 'Experimento Raft · 30/11', 'fe97e479-9046-5429-8bdd-3eaaeadd09b3'),
  ('0defbafa-f351-55f6-b5f7-13f8b95612b7', '0192f000-0000-7000-8000-000000000001', NULL, 'Certificação Kubernetes', NULL, 'STUDY', 'PLANNED', 'SKY', '2026-11-16', NULL, NULL, 'fe97e479-9046-5429-8bdd-3eaaeadd09b3')
ON CONFLICT DO NOTHING;

INSERT INTO work.task (id, owner_id, project_id, title, description, status, priority, tag, start_date, due_date, done_criteria, checklist_done, checklist_total, goal_id, completed_at) VALUES
  ('afb289ce-5697-5de2-bc43-4b90eccb092e', '0192f000-0000-7000-8000-000000000001', '9cc39cfc-63d8-5404-9bc1-b8d3250bf432', 'Investigar alerta de ingestão da telemetria', 'Atraso de ingestão acima de 5 min desde o último deploy. Encontrar a causa raiz e documentar.', 'IN_PROGRESS', 'URGENT', 'Backend', '2026-10-22', '2026-10-23', NULL, 2, 5, NULL, NULL),
  ('d1273647-a602-5992-bece-74ffbd9100c6', '0192f000-0000-7000-8000-000000000001', '0dac5543-7d3f-5da5-aad0-9138f86f30e7', 'Modelar as entidades Empresa, Projeto e Tarefa', 'Entidades, relacionamentos e regras de negócio do MVP, prontos para a baseline do Flyway.', 'IN_PROGRESS', 'HIGH', 'Modelagem', '2026-10-21', '2026-10-23', NULL, 3, 6, NULL, NULL),
  ('42766118-2cde-5e2c-bfca-24c6ddce50a4', '0192f000-0000-7000-8000-000000000001', '9cc39cfc-63d8-5404-9bc1-b8d3250bf432', 'Revisar pull request de sincronização de dispositivos', NULL, 'TODO', 'NORMAL', 'Revisão', '2026-10-24', '2026-10-24', NULL, NULL, NULL, NULL, NULL),
  ('815cca4b-ba39-569c-a8f6-7e5e3f8246dd', '0192f000-0000-7000-8000-000000000001', '0dac5543-7d3f-5da5-aad0-9138f86f30e7', 'Escrever a migration baseline do Flyway', 'Tabelas de empresas, projetos, tarefas e itens de checklist com owner_id.', 'TODO', 'NORMAL', 'Banco de dados', '2026-10-24', '2026-10-27', NULL, NULL, NULL, NULL, NULL),
  ('e4805b82-9807-5236-9bbc-3c82362db2f4', '0192f000-0000-7000-8000-000000000001', '0dac5543-7d3f-5da5-aad0-9138f86f30e7', 'Estrutura base do frontend', 'Next.js, tokens de tema, menu lateral, dashboard e componentes compartilhados.', 'DONE', 'HIGH', 'Frontend', '2026-10-20', '2026-10-22', NULL, 6, 6, NULL, '2026-10-22T18:00:00Z'),
  ('41e9f673-a208-5065-9542-7a4ae78d0e5e', '0192f000-0000-7000-8000-000000000001', '9cc39cfc-63d8-5404-9bc1-b8d3250bf432', 'Relatório mensal de telemetria', NULL, 'BACKLOG', 'NORMAL', 'Relatório', '2026-10-28', '2026-10-31', NULL, NULL, NULL, NULL, NULL),
  ('bc9a6b51-97ee-557a-82e8-dcf9c62158bb', '0192f000-0000-7000-8000-000000000001', '5f7a9ebf-4f29-5ff7-8df4-5ff87bb95ae0', 'Experimento de eleição de líder no Raft', 'Três nós locais, injetar partições, registrar os tempos de eleição.', 'IN_PROGRESS', 'NORMAL', 'Estudo', '2026-10-19', '2026-10-29', NULL, 1, 4, NULL, NULL),
  ('da2f3b53-85d2-52f3-8c23-200919c5ab13', '0192f000-0000-7000-8000-000000000001', '9cc39cfc-63d8-5404-9bc1-b8d3250bf432', 'Aguardando acesso à VPN do cliente', NULL, 'BLOCKED', 'HIGH', 'Acesso', '2026-10-20', '2026-10-21', NULL, NULL, NULL, NULL, NULL),
  ('5fa96b34-b49e-5cf8-8a27-76e6cfa185ef', '0192f000-0000-7000-8000-000000000001', '0dac5543-7d3f-5da5-aad0-9138f86f30e7', 'API de CRUD de empresas', NULL, 'BACKLOG', 'HIGH', 'Backend', '2026-10-27', '2026-10-30', NULL, NULL, NULL, NULL, NULL),
  ('ff191190-0a88-50f6-af54-896d2939160e', '0192f000-0000-7000-8000-000000000001', NULL, 'Renovar contrato com o contador', NULL, 'TODO', 'LOW', 'Admin', NULL, '2026-10-30', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO knowledge.note (id, owner_id, title, body, tags, created_at, updated_at) VALUES
  ('2d71fd08-006d-5683-add8-7e553b6a652f', '0192f000-0000-7000-8000-000000000001', 'Ingestão de telemetria: de onde vêm os alertas', '## Contexto

O alerta de ingestão dispara quando o **lag** do consumer group `telemetry-events` passa de 5 minutos.

## O que verificar primeiro

1. Lag do consumer por partição no Grafana
2. Deploys recentes do serviço de ingestão
3. Saturação do pool de conexões do banco

> A maioria dos incidentes até agora foi uma query lenta na busca de dispositivos.

- [x] Documentar os links dos dashboards
- [ ] Pedir acesso de leitura aos logs de produção', ARRAY['telemetry','incident','kafka']::text[], '2026-10-14', '2026-10-22'),
  ('6e489101-1a1c-5509-892a-c2e3fecd775c', '0192f000-0000-7000-8000-000000000001', 'Fronteiras do monólito modular', 'Cada módulo é dono das suas tabelas e expõe uma API pequena para os outros.

| Módulo | Dono de |
| --- | --- |
| work | empresas, projetos, tarefas |
| knowledge | notas, snippets, vínculos |
| finance | lançamentos, metas de compra |

Leituras entre módulos passam por **serviços de aplicação**, nunca pelos repositórios de outro módulo.', ARRAY['architecture','spring']::text[], '2026-10-20', '2026-10-21'),
  ('8699903d-79a7-5ac4-a455-7ab06b393069', '0192f000-0000-7000-8000-000000000001', 'Raft: anotações sobre eleição de líder', 'O timeout de eleição precisa ser aleatório (150–300 ms) para evitar votos divididos.

Um nó vira **candidato** depois do timeout, vota em si mesmo e envia `RequestVote` para os pares.', ARRAY['distributed-systems','raft']::text[], '2026-10-19', '2026-10-19')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge.snippet (id, owner_id, title, language, code, explanation, source_url, tags, created_at, updated_at) VALUES
  ('ea1ff87a-55b0-5b06-8bc1-c34f702251a0', '0192f000-0000-7000-8000-000000000001', 'Handler de exceções com Problem Details', 'java', '@RestControllerAdvice
class ApiExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    ProblemDetail handleNotFound(EntityNotFoundException ex) {
        var problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource not found");
        return problem;
    }
}', 'Retorna Problem Details (RFC 9457) para o frontend mostrar o mesmo formato de erro em todo lugar.', NULL, ARRAY['spring','errors']::text[], '2026-10-21', '2026-10-21'),
  ('24a91ffe-cf1c-5744-aa0e-37eae90a4d5b', '0192f000-0000-7000-8000-000000000001', 'Lag do consumer por partição', 'bash', 'kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe --group telemetry-events', 'Primeira verificação quando o alerta de ingestão dispara.', 'https://kafka.apache.org/documentation/', ARRAY['kafka','telemetry']::text[], '2026-10-15', '2026-10-15'),
  ('bd08cb36-b3ff-5485-9d7a-4b5ab726b0e0', '0192f000-0000-7000-8000-000000000001', 'Tarefas atrasadas por projeto', 'sql', 'select p.name, count(*) as overdue
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
  ('f15fe65b-40b3-5b7e-b37e-0af4c4e351b4', '0192f000-0000-7000-8000-000000000001', 'Método de commit', 'Preparar commits pequenos e revisados, com mensagem consistente.', 'DEVELOPMENT', ARRAY['git','review']::text[], '2026-10-23'),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', '0192f000-0000-7000-8000-000000000001', 'Método de correção de bugs', 'Da reprodução até uma correção testada e documentada.', 'QUALITY', ARRAY['debugging','testing']::text[], '2026-10-23'),
  ('78f5b89b-427d-58d1-934f-d558d0fa23a0', '0192f000-0000-7000-8000-000000000001', 'Método de reunião', 'Reuniões com objetivo claro, decisões e follow-up.', 'COMMUNICATION', ARRAY['meetings','follow-up']::text[], '2026-10-23')
ON CONFLICT DO NOTHING;

INSERT INTO knowledge.method_step (method_id, position, title, detail) VALUES
  ('f15fe65b-40b3-5b7e-b37e-0af4c4e351b4', 0, 'Revisar o diff', 'Ler cada linha alterada com git diff --staged antes de commitar.'),
  ('f15fe65b-40b3-5b7e-b37e-0af4c4e351b4', 1, 'Manter a mudança focada', 'Uma intenção por commit. Separe mudanças sem relação com git add -p.'),
  ('f15fe65b-40b3-5b7e-b37e-0af4c4e351b4', 2, 'Rodar as verificações', 'Testes, lint e build conforme a mudança.'),
  ('f15fe65b-40b3-5b7e-b37e-0af4c4e351b4', 3, 'Escrever a mensagem', 'Conventional Commits: tipo(escopo): resumo no imperativo, com menos de 72 caracteres.'),
  ('f15fe65b-40b3-5b7e-b37e-0af4c4e351b4', 4, 'Explicar o porquê', 'Adicione um corpo quando o motivo não for óbvio pelo diff.'),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 0, 'Reproduzir o bug', NULL),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 1, 'Registrar o comportamento esperado e o real', NULL),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 2, 'Reunir logs e contexto relevante', NULL),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 3, 'Encontrar uma reprodução mínima', NULL),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 4, 'Formular e testar uma hipótese', 'Mudar uma coisa por vez e confirmar a causa antes de corrigir.'),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 5, 'Implementar a menor correção segura', NULL),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 6, 'Adicionar ou atualizar testes de regressão', 'O teste precisa falhar sem a correção.'),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 7, 'Revisar o diff e validar a correção', NULL),
  ('309307f3-713d-5bed-a3c2-a47acefe496b', 8, 'Registrar a causa raiz e os aprendizados', 'Vincular a nota ao projeto ou à tarefa.'),
  ('78f5b89b-427d-58d1-934f-d558d0fa23a0', 0, 'Definir o objetivo e a pauta', NULL),
  ('78f5b89b-427d-58d1-934f-d558d0fa23a0', 1, 'Reunir antes o contexto necessário', NULL),
  ('78f5b89b-427d-58d1-934f-d558d0fa23a0', 2, 'Registrar as decisões', NULL),
  ('78f5b89b-427d-58d1-934f-d558d0fa23a0', 3, 'Registrar os encaminhamentos com responsáveis e prazos', NULL),
  ('78f5b89b-427d-58d1-934f-d558d0fa23a0', 4, 'Compartilhar um resumo curto depois', NULL),
  ('78f5b89b-427d-58d1-934f-d558d0fa23a0', 5, 'Acompanhar as ações em aberto', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO knowledge.method_example (method_id, position, title, content) VALUES
  ('f15fe65b-40b3-5b7e-b37e-0af4c4e351b4', 0, 'Mensagens de commit', 'feat(tasks): add board view grouped by status
fix(projects): keep timeline bars inside the visible range
refactor(api): extract Problem Details parsing
docs: record modular monolith decision'),
  ('78f5b89b-427d-58d1-934f-d558d0fa23a0', 0, 'Modelo de resumo', 'Objetivo:
Decisões:
- 
Encaminhamentos (responsável, prazo):
- 
Dúvidas em aberto:
- ')
ON CONFLICT DO NOTHING;

INSERT INTO goals.goal (id, owner_id, parent_id, name, description, area, status, priority, current_state, desired_result, done_criteria, due_date, indicator_label, indicator_current, indicator_target, indicator_unit) VALUES
  ('b9dff122-5016-535e-b04d-c6910a7b892d', '0192f000-0000-7000-8000-000000000001', NULL, 'Lançar o MVP do TBFernandes Software', 'Usar minha própria plataforma todo dia no trabalho e na vida pessoal.', 'CAREER', 'ACTIVE', 'HIGH', 'A estrutura do frontend e os fluxos simulados estão prontos.', 'Empresas, projetos e tarefas rodando na API real.', 'Gerencio todas as minhas tarefas nela por duas semanas seguidas.', '2026-11-15', 'Funcionalidades do MVP prontas', 3, 8, 'funcionalidades'),
  ('fe97e479-9046-5429-8bdd-3eaaeadd09b3', '0192f000-0000-7000-8000-000000000001', NULL, 'Ser um engenheiro de backend mais forte', NULL, 'LEARNING', 'ACTIVE', 'HIGH', NULL, 'Projetar e operar sistemas distribuídos com segurança.', 'Passar no exame CKAD e terminar o laboratório de sistemas distribuídos.', '2027-03-31', 'Horas de estudo', 42, 120, 'h'),
  ('ea76c01b-8d1a-52a3-952c-50b6e52b3b86', '0192f000-0000-7000-8000-000000000001', NULL, 'Montar uma reserva de emergência', NULL, 'FINANCE', 'ACTIVE', 'NORMAL', 'Dois meses de despesas guardados.', 'Seis meses de despesas pessoais guardados.', NULL, '2027-06-30', 'Reserva', 14000, 42000, 'BRL'),
  ('e79d39ca-b71c-5715-b303-773aaa2b9033', '0192f000-0000-7000-8000-000000000001', 'fe97e479-9046-5429-8bdd-3eaaeadd09b3', 'Passar no exame CKAD', NULL, 'LEARNING', 'PLANNED', 'NORMAL', NULL, 'Certificação CKAD obtida.', NULL, '2027-02-28', NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO goals.milestone (id, owner_id, goal_id, title, due_date, done, position) VALUES
  ('4e59d1ab-fb80-5d52-83ec-380590511cb1', '0192f000-0000-7000-8000-000000000001', 'b9dff122-5016-535e-b04d-c6910a7b892d', 'Estrutura do frontend', '2026-10-23', true, 0),
  ('d4d4cf55-86c2-5fe1-ab9e-b81b95e70ec9', '0192f000-0000-7000-8000-000000000001', 'b9dff122-5016-535e-b04d-c6910a7b892d', 'API de empresas e projetos', '2026-11-01', false, 1),
  ('babe31f9-a58a-5291-a357-010eab4b8a33', '0192f000-0000-7000-8000-000000000001', 'b9dff122-5016-535e-b04d-c6910a7b892d', 'API de tarefas e deploy', '2026-11-15', false, 2),
  ('e72f7385-76b9-5c6b-b7f8-c235336a4b38', '0192f000-0000-7000-8000-000000000001', 'fe97e479-9046-5429-8bdd-3eaaeadd09b3', 'Laboratório de sistemas distribuídos', '2026-11-30', false, 3),
  ('3187c5f7-044a-5925-a548-73e2fe41a356', '0192f000-0000-7000-8000-000000000001', 'ea76c01b-8d1a-52a3-952c-50b6e52b3b86', 'Três meses guardados', '2026-12-31', false, 4)
ON CONFLICT DO NOTHING;

INSERT INTO learning.skill (id, owner_id, name, level, evidence) VALUES
  ('b9e8edcf-6de3-5644-97e6-c27f56957676', '0192f000-0000-7000-8000-000000000001', 'Java & Spring Boot', 4, 'Cinco anos em sistemas de produção.'),
  ('21e71439-83f9-5184-8520-ba83de75182c', '0192f000-0000-7000-8000-000000000001', 'Sistemas distribuídos', 2, 'Laboratório de Raft em andamento.'),
  ('4da412ac-2acc-5bf6-87bc-4aa8755d263e', '0192f000-0000-7000-8000-000000000001', 'Kubernetes', 2, NULL),
  ('8c3a5c00-9a6b-5891-877e-2899f6265ec9', '0192f000-0000-7000-8000-000000000001', 'React & Next.js', 3, 'O frontend desta plataforma.'),
  ('7f0327b6-73f3-5109-bab7-a6556f22c657', '0192f000-0000-7000-8000-000000000001', 'PostgreSQL', 3, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO learning.study (id, owner_id, name, description, status, goal_id, start_date, due_date, next_activity) VALUES
  ('020a101b-2141-5ff5-ba29-f85f06a363f7', '0192f000-0000-7000-8000-000000000001', 'Fundamentos de sistemas distribuídos', 'Consenso, replicação e tratamento de falhas.', 'IN_PROGRESS', 'fe97e479-9046-5429-8bdd-3eaaeadd09b3', '2026-10-05', '2026-11-30', 'Terminar o experimento de eleição de líder no Raft'),
  ('ad28962b-4013-5d88-98c9-3cfde520dbe6', '0192f000-0000-7000-8000-000000000001', 'Kubernetes para desenvolvedores', NULL, 'PLANNED', 'e79d39ca-b71c-5715-b303-773aaa2b9033', '2026-11-16', '2027-02-28', 'Escolher um curso e marcar a data do exame')
ON CONFLICT DO NOTHING;

INSERT INTO learning.study_skill (study_id, skill_id) VALUES
  ('020a101b-2141-5ff5-ba29-f85f06a363f7', '21e71439-83f9-5184-8520-ba83de75182c'),
  ('ad28962b-4013-5d88-98c9-3cfde520dbe6', '4da412ac-2acc-5bf6-87bc-4aa8755d263e')
ON CONFLICT DO NOTHING;

INSERT INTO learning.material (id, owner_id, study_id, title, type, url, status, notes) VALUES
  ('f7d5c1dc-9cf0-529f-a80b-3af72b073489', '0192f000-0000-7000-8000-000000000001', '020a101b-2141-5ff5-ba29-f85f06a363f7', 'In Search of an Understandable Consensus Algorithm', 'PAPER', 'https://raft.github.io/raft.pdf', 'CONSUMED', NULL),
  ('5847cce9-9e51-5d92-b591-d63906b11c57', '0192f000-0000-7000-8000-000000000001', '020a101b-2141-5ff5-ba29-f85f06a363f7', 'Designing Data-Intensive Applications', 'BOOK', NULL, 'IN_PROGRESS', 'Capítulos 5, 8 e 9 primeiro.'),
  ('a2940194-b46f-56b1-acbe-109f9cb5bcf2', '0192f000-0000-7000-8000-000000000001', '020a101b-2141-5ff5-ba29-f85f06a363f7', 'Aulas do MIT 6.824', 'VIDEO', NULL, 'TO_CONSUME', NULL),
  ('f41f3440-f7ea-5156-be73-eda2d84d9e7a', '0192f000-0000-7000-8000-000000000001', 'ad28962b-4013-5d88-98c9-3cfde520dbe6', 'Documentação do Kubernetes: Tasks', 'DOCS', 'https://kubernetes.io/docs/tasks/', 'TO_CONSUME', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO learning.certification (id, owner_id, name, issuer, status, obtained_at, expires_at, validation_url) VALUES
  ('f6455fbc-12db-5c0e-be68-b7c63e8012fd', '0192f000-0000-7000-8000-000000000001', 'Certified Kubernetes Application Developer', 'CNCF', 'PLANNED', NULL, NULL, NULL),
  ('97966912-2a42-579d-9a21-491387219bfb', '0192f000-0000-7000-8000-000000000001', 'Oracle Certified Professional: Java SE 17', 'Oracle', 'OBTAINED', '2024-05-12', NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO learning.certification_study (certification_id, study_id) VALUES
  ('f6455fbc-12db-5c0e-be68-b7c63e8012fd', 'ad28962b-4013-5d88-98c9-3cfde520dbe6')
ON CONFLICT DO NOTHING;

INSERT INTO learning.education (id, owner_id, institution, course, degree, status, start_date, end_date) VALUES
  ('6d681ca6-edb6-54d4-843e-95033977c079', '0192f000-0000-7000-8000-000000000001', 'Universidade Federal', 'Ciência da Computação', 'Bacharelado', 'COMPLETED', '2016-02-01', '2020-12-15')
ON CONFLICT DO NOTHING;

INSERT INTO finance.entry (id, owner_id, kind, scope, category, description, amount, entry_date, recurring) VALUES
  ('1e9467ee-9a34-576b-987e-f28f2ec321a4', '0192f000-0000-7000-8000-000000000001', 'INCOME', 'BUSINESS', 'Serviços', 'Nota fiscal da software house · setembro', 18000, '2026-10-05', true),
  ('a56513e1-abe1-5275-b9a3-183b6c151c5a', '0192f000-0000-7000-8000-000000000001', 'EXPENSE', 'BUSINESS', 'Impostos', 'Simples Nacional DAS', 1080, '2026-10-20', true),
  ('1f7b9c85-4e5f-523f-b1a7-05920aaaffa5', '0192f000-0000-7000-8000-000000000001', 'EXPENSE', 'BUSINESS', 'Contabilidade', 'Contador', 350, '2026-10-10', true),
  ('0f4cb6f7-4c5d-5be0-8aca-434072bf5a0e', '0192f000-0000-7000-8000-000000000001', 'INCOME', 'PERSONAL', 'Pro-labore', 'Transferência da PJ', 9000, '2026-10-06', true),
  ('552c107b-641d-5ab9-ad2c-fecb29860478', '0192f000-0000-7000-8000-000000000001', 'EXPENSE', 'PERSONAL', 'Moradia', 'Aluguel', 2800, '2026-10-08', true),
  ('86974e5c-e3ed-5830-8532-77ac6acf218e', '0192f000-0000-7000-8000-000000000001', 'EXPENSE', 'PERSONAL', 'Alimentação', 'Mercado', 1400, '2026-10-12', false),
  ('90bbabe3-312f-534f-aa91-b07fad8a950f', '0192f000-0000-7000-8000-000000000001', 'EXPENSE', 'PERSONAL', 'Educação', 'Assinatura de cursos', 120, '2026-10-15', true),
  ('24b4b008-72b7-5316-8e51-874d42c4ae85', '0192f000-0000-7000-8000-000000000001', 'EXPENSE', 'PERSONAL', 'Transporte', 'Combustível e corridas de aplicativo', 480, '2026-10-18', false),
  ('7bf2ec49-91b9-57a9-97d3-af5fda053a90', '0192f000-0000-7000-8000-000000000001', 'INCOME', 'BUSINESS', 'Serviços', 'Nota fiscal da software house · agosto', 18000, '2026-09-05', true),
  ('fc3a75d1-ad6b-5ab5-89b8-3eb8a42c9ac7', '0192f000-0000-7000-8000-000000000001', 'EXPENSE', 'PERSONAL', 'Moradia', 'Aluguel', 2800, '2026-09-08', true),
  ('8bcc25ed-b67a-5acf-ae04-41d031448d44', '0192f000-0000-7000-8000-000000000001', 'INCOME', 'PERSONAL', 'Pro-labore', 'Transferência da PJ', 9000, '2026-09-06', true),
  ('4a42bb2a-6de8-56cf-8d8a-37754333b720', '0192f000-0000-7000-8000-000000000001', 'EXPENSE', 'PERSONAL', 'Alimentação', 'Mercado', 1550, '2026-09-12', false)
ON CONFLICT DO NOTHING;

INSERT INTO finance.purchase_goal (id, owner_id, name, description, estimated, reserved, monthly_saving, priority, desired_date, goal_id, status, paid) VALUES
  ('b786362e-1d9d-5f03-b00e-1d65e6f34aa9', '0192f000-0000-7000-8000-000000000001', 'Notebook novo', '32 GB de RAM para Kubernetes local e builds.', 14000, 6500, 1500, 'HIGH', '2027-03-01', NULL, 'SAVING', NULL),
  ('44c69188-28dd-5476-aa26-a75be1d56596', '0192f000-0000-7000-8000-000000000001', 'Mesa com regulagem de altura', NULL, 2600, 2600, NULL, 'NORMAL', NULL, NULL, 'BOUGHT', 2450),
  ('95db8a53-c5d9-5e7f-9f67-9caf6cbb6279', '0192f000-0000-7000-8000-000000000001', 'Voucher do exame CKAD', NULL, 2200, 0, 550, 'NORMAL', '2027-02-01', 'e79d39ca-b71c-5715-b303-773aaa2b9033', 'PLANNED', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO contacts.contact (id, owner_id, name, company_id, company_name, role, email, phone, profile_url, specialties, context, next_contact, notes) VALUES
  ('5ce72274-9717-5391-af4d-b5e56b054c73', '0192f000-0000-7000-8000-000000000001', 'Marina Alves', 'b99dd5f4-7828-541a-9190-d722873bc1ad', NULL, 'Gerente de engenharia', 'marina@example.com', NULL, NULL, ARRAY['Telemetria','Liderança de equipe']::text[], 'Gerencia o squad de telemetria com quem trabalho.', '2026-10-31', NULL),
  ('de9a99e4-06fd-5d6e-b169-2dbb3af201dd', '0192f000-0000-7000-8000-000000000001', 'Rafael Costa', NULL, 'Escritório de contabilidade', 'Contador', NULL, '+55 11 90000-0000', NULL, ARRAY['Impostos','PJ']::text[], 'Cuida da contabilidade da TBFernandes PJ.', '2026-10-30', NULL),
  ('2ef0a47d-2e1c-5395-b6ba-bc20d7fdf97d', '0192f000-0000-7000-8000-000000000001', 'Lucas Pereira', NULL, 'Comunidade Java', 'Staff engineer', NULL, NULL, 'https://www.linkedin.com/', ARRAY['Kubernetes','Sistemas distribuídos']::text[], 'Nos conhecemos em um meetup de Java; ofereceu revisar meu laboratório de Raft.', NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO contacts.interaction (id, owner_id, contact_id, occurred_on, kind, summary, follow_up_task_id) VALUES
  ('04645064-d941-50e0-b2d3-85e9b2edadec', '0192f000-0000-7000-8000-000000000001', '5ce72274-9717-5391-af4d-b5e56b054c73', '2026-10-20', 'MEETING', 'Reunião semanal: acesso à VPN ainda pendente, combinamos o formato do relatório mensal.', NULL),
  ('565e0eba-123c-517a-9d42-50cd341ebe42', '0192f000-0000-7000-8000-000000000001', 'de9a99e4-06fd-5d6e-b169-2dbb3af201dd', '2026-10-10', 'MESSAGE', 'Perguntei sobre a renovação do contrato para 2027.', 'ff191190-0a88-50f6-af54-896d2939160e'),
  ('27157793-4740-55e5-966b-bbcf7923a608', '0192f000-0000-7000-8000-000000000001', '2ef0a47d-2e1c-5395-b6ba-bc20d7fdf97d', '2026-09-28', 'EVENT', 'Conversamos sobre Raft e a preparação para o CKAD no meetup.', NULL),
  ('169cec07-18c7-5b03-980a-3ef88ef2d732', '0192f000-0000-7000-8000-000000000001', '5ce72274-9717-5391-af4d-b5e56b054c73', '2026-10-06', 'CALL', 'Kick-off da investigação do alerta de ingestão.', NULL)
ON CONFLICT DO NOTHING;

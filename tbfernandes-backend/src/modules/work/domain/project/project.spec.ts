import { BusinessRuleViolationError } from '../../../../common/domain';
import { Project, ProjectDetails } from './project';

const details = (overrides: Partial<ProjectDetails> = {}): ProjectDetails => ({
  name: 'Telemetry',
  description: null,
  companyId: null,
  category: 'PROFESSIONAL',
  status: null,
  color: null,
  startDate: '2026-09-01',
  dueDate: null,
  nextDelivery: null,
  goalId: null,
  ...overrides,
});

describe('Project', () => {
  it('defaults status and color', () => {
    const project = Project.create('p1', 'o1', details());
    expect(project.status).toBe('PLANNED');
    expect(project.details.color).toBe('TEAL');
  });

  it('refuses a due date before the start (RN-02)', () => {
    expect(() =>
      Project.create('p1', 'o1', details({ dueDate: '2026-08-01' })),
    ).toThrow(BusinessRuleViolationError);
  });
});

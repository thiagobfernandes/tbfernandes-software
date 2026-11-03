import { BusinessRuleViolationError } from '../../../../common/domain';
import { Interaction } from './interaction';

const create = () =>
  Interaction.create('i1', 'o1', {
    contactId: 'c1',
    date: '2026-10-20',
    kind: 'MEETING',
    summary: ' Talked about the API ',
    followUpTaskId: null,
  });

describe('Interaction', () => {
  it('trims the summary', () => {
    expect(create().details.summary).toBe('Talked about the API');
  });

  it('accepts one follow-up only (RN-24)', () => {
    const interaction = create();
    interaction.followUpCreated('t1');
    expect(interaction.details.followUpTaskId).toBe('t1');
    expect(() => interaction.followUpCreated('t2')).toThrow(
      BusinessRuleViolationError,
    );
  });

  it('forgets a deleted follow-up task', () => {
    const interaction = create();
    interaction.followUpCreated('t1');
    interaction.followUpDeleted();
    expect(interaction.details.followUpTaskId).toBeNull();
  });
});

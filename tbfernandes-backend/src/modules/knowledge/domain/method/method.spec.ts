import { InvalidArgumentError } from '../../../../common/domain';
import { Method, MethodDetails } from './method';

const details: MethodDetails = {
  title: 'Code review',
  summary: 'How I review',
  category: 'QUALITY',
  steps: [
    { title: 'Read the ticket', detail: null },
    { title: 'Comment', detail: ' kindly ' },
  ],
  examples: [{ title: 'Comment', content: '  nit: rename' }],
  tags: ['Review'],
  lastReviewed: '2026-10-20',
};

describe('Method', () => {
  it('keeps the step order and the example content as written', () => {
    const method = Method.create('m1', 'o1', details);
    expect(method.details.steps).toEqual([
      { title: 'Read the ticket', detail: null },
      { title: 'Comment', detail: 'kindly' },
    ]);
    expect(method.details.examples[0].content).toBe('  nit: rename');
    expect(method.details.tags).toEqual(['review']);
  });

  it('needs at least one step', () => {
    expect(() => Method.create('m1', 'o1', { ...details, steps: [] })).toThrow(
      InvalidArgumentError,
    );
  });
});

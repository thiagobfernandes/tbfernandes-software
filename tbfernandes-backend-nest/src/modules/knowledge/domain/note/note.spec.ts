import { InvalidArgumentError } from '../../../../common/domain';
import { KnowledgeLinks } from '../knowledge-links';
import { Note } from './note';

const links = KnowledgeLinks.of(['p1', 'p1'], ['t1']);

describe('Note', () => {
  it('normalizes title, body and tags and keeps unique links', () => {
    const note = Note.create(
      'n1',
      'o1',
      { title: '  Flyway  ', body: null as unknown as string, tags: ['A'] },
      links,
    );
    expect(note.details).toEqual({ title: 'Flyway', body: '', tags: ['a'] });
    expect(note.links.projectIds).toEqual(['p1']);
  });

  it('requires a title', () => {
    expect(() =>
      Note.create('n1', 'o1', { title: ' ', body: '', tags: [] }, links),
    ).toThrow(InvalidArgumentError);
  });

  it('drops the link to a deleted work item and says whether it changed (KNW-06)', () => {
    const note = Note.create(
      'n1',
      'o1',
      { title: 'x', body: '', tags: [] },
      links,
    );
    expect(note.unlink('t1')).toBe(true);
    expect(note.links.taskIds).toEqual([]);
    expect(note.unlink('t1')).toBe(false);
  });
});

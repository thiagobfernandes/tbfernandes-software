import { InvalidArgumentError } from '../../../../common/domain';
import { KnowledgeLinks } from '../knowledge-links';
import { Snippet, SnippetDetails } from './snippet';

const details: SnippetDetails = {
  title: 'Guard',
  language: ' Java ',
  code: '  if (x) {\n\treturn y;\n  }\n',
  explanation: '',
  sourceUrl: null,
  tags: [],
};

describe('Snippet', () => {
  it('keeps the code verbatim and lowercases the language (RN-11)', () => {
    const snippet = Snippet.create('s1', 'o1', details, KnowledgeLinks.none());
    expect(snippet.details.code).toBe(details.code);
    expect(snippet.details.language).toBe('java');
    expect(snippet.details.explanation).toBeNull();
  });

  it('requires code that is not blank', () => {
    expect(() =>
      Snippet.create(
        's1',
        'o1',
        { ...details, code: '  \n' },
        KnowledgeLinks.none(),
      ),
    ).toThrow(InvalidArgumentError);
  });
});

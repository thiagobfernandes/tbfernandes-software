import { createHash, randomUUID } from 'node:crypto';
import { IsoDates } from '../../../common/domain';
import {
  DocumentKey,
  EXCERPT_LENGTH,
  GroundedAnswer,
  IndexedChunk,
  KnowledgeDocuments,
  KnowledgeGraphs,
  MAX_LIMIT,
  Passage,
  PassageRanker,
  QueryEngine,
  RuleBasedAssistant,
  StructuredQueries,
  TaskRecord,
  TextChunker,
  Workspace,
} from '.';

const day = (base: string, days: number) => IsoDates.plusDays(base, days);

// --- Rule-based assistant -----------------------------------------------------------------

const TODAY = '2026-10-26';
const COMPANY = randomUUID();
const PROJECT = randomUUID();
const GOAL = randomUUID();
const NOTE = randomUUID();

const ruleTask = (
  title: string,
  status: string,
  priority: string,
  due: string,
): TaskRecord => ({
  id: randomUUID(),
  title,
  description: null,
  status,
  priority,
  projectId: PROJECT,
  goalId: null,
  dueDate: due,
});

function workspace(): Workspace {
  return {
    today: TODAY,
    companies: [{ id: COMPANY, name: 'Acme', status: 'active' }],
    projects: [
      {
        id: PROJECT,
        name: 'Billing Revamp',
        status: 'active',
        companyId: COMPANY,
        goalId: GOAL,
        dueDate: null,
        nextDelivery: 'Invoices v2',
      },
    ],
    tasks: [
      ruleTask('Fix invoice totals', 'blocked', 'high', day(TODAY, -2)),
      ruleTask('Write release notes', 'todo', 'normal', TODAY),
      ruleTask('Call the bank', 'todo', 'urgent', day(TODAY, 1)),
      ruleTask('Ship dashboard', 'done', 'normal', day(TODAY, -5)),
    ],
    notes: [
      {
        id: NOTE,
        title: 'Billing decisions',
        body: 'Rounding uses HALF_UP',
        tags: ['billing'],
        projectIds: [PROJECT],
        taskIds: [],
      },
    ],
    snippets: [
      {
        id: randomUUID(),
        title: 'Rounding helper',
        explanation: 'How we round money',
        tags: ['java'],
        projectIds: [],
        taskIds: [],
      },
    ],
    goals: [
      {
        id: GOAL,
        name: 'Senior role',
        status: 'active',
        parentId: null,
        percent: 50,
        basis: '1/2 marcos',
      },
      {
        id: randomUUID(),
        name: 'Marathon',
        status: 'planned',
        parentId: null,
        percent: 0,
        basis: 'Ainda sem medida de progresso',
      },
    ],
    studies: [
      {
        id: randomUUID(),
        name: 'Spring Modulith',
        status: 'in_progress',
        goalId: null,
        dueDate: null,
        nextActivity: 'Read chapter 3',
      },
    ],
    purchases: [
      {
        id: randomUUID(),
        name: 'Laptop',
        status: 'planned',
        goalId: null,
        estimated: 8000,
        reserved: 2000,
        missing: 6000,
        ready: false,
        months: 3,
        onTime: false,
      },
    ],
    month: {
      month: '2026-10',
      personalIncome: 10000,
      personalExpense: 4000.4,
      businessIncome: 20000,
      businessExpense: 5000,
    },
    contacts: [
      {
        id: randomUUID(),
        name: 'Ana',
        role: 'CTO',
        companyId: COMPANY,
        companyName: null,
        nextContact: day(TODAY, 3),
      },
    ],
  };
}

describe('RuleBasedAssistant', () => {
  it('a project named in the question wins', () => {
    const answer = RuleBasedAssistant.answer(
      'How is billing revamp going today?',
      workspace(),
    );
    expect(answer.source).toBe('rules');
    expect(answer.text).toMatch(
      /^\*\*Billing Revamp\*\* está ativo: 1 de 4 tarefas concluídas \(25%\)\./,
    );
    expect(answer.text).toContain('Próxima entrega: Invoices v2.');
    expect(answer.text).toContain('- Fix invoice totals (atrasada 2d)');
    expect(answer.text).toContain('⚠ 1 bloqueada: Fix invoice totals.');
    expect(answer.text).toContain('1 nota vinculada pode ajudar.');
    expect(answer.references[0]).toEqual({
      kind: 'Projeto',
      label: 'Billing Revamp',
      href: `/projects/view?id=${PROJECT}`,
      excerpt: null,
    });
    expect(answer.references).toContainEqual({
      kind: 'Nota',
      label: 'Billing decisions',
      href: `/knowledge?note=${NOTE}`,
      excerpt: null,
    });
    expect(answer.references).toContainEqual({
      kind: 'Tarefa',
      label: 'Fix invoice totals',
      href: '/tasks?q=Fix%20invoice%20totals',
      excerpt: null,
    });
  });

  it('answers overdue and focus questions in Portuguese', () => {
    expect(
      RuleBasedAssistant.answer('O que está atrasado?', workspace()).text,
    ).toMatch(
      /^Você tem 1 tarefa atrasada:\n- \*\*Fix invoice totals\*\*, atrasada 2d \(bloqueada\)/,
    );
    expect(
      RuleBasedAssistant.answer('qual o foco de hoje?', workspace()).text,
    ).toContain(
      '1. **Call the bank** · prioridade urgente · vence amanhã\n' +
        '2. **Fix invoice totals** · prioridade alta · atrasada 2d\n' +
        '3. **Write release notes** · prioridade normal · vence hoje',
    );
  });

  it('keeps personal and business money apart', () => {
    const text = RuleBasedAssistant.answer(
      'how is my money?',
      workspace(),
    ).text;
    expect(text).toContain(
      '- **Pessoal**: R$\u00a010.000 de entrada, R$\u00a04.000 de saída, saldo R$\u00a06.000.',
    );
    expect(text).toContain(
      '- **Empresa**: R$\u00a020.000 de entrada, R$\u00a05.000 de saída, saldo R$\u00a015.000.',
    );
    expect(text).toContain(
      'saldo R$\u00a015.000.\n\nLembre que o saldo da empresa não é dinheiro pessoal',
    );
  });

  it('answers purchases, goals, contacts and studies', () => {
    expect(RuleBasedAssistant.answer('can I buy it?', workspace()).text).toBe(
      '- **Laptop**: R$\u00a06.000 faltando, dá para comprar em 3 meses (depois do que você queria).',
    );
    const goals = RuleBasedAssistant.answer('minhas metas', workspace());
    expect(goals.text).toBe(
      'Metas ativas:\n- **Senior role**: 50% (1/2 marcos)',
    );
    expect(goals.references.map((r) => r.href)).toEqual([
      `/goals/view?id=${GOAL}`,
    ]);
    expect(
      RuleBasedAssistant.answer('who should I contact?', workspace()).text,
    ).toBe('Follow-ups desta semana:\n- **Ana** (CTO), vence em 3d');
    expect(RuleBasedAssistant.answer('o que estudar?', workspace()).text).toBe(
      'Estudos em andamento:\n- **Spring Modulith**: Read chapter 3',
    );
  });

  it('falls back to searching knowledge and tasks', () => {
    const answer = RuleBasedAssistant.answer('rounding', workspace());
    expect(answer.text).toBe(
      'Encontrei 2 itens relacionados nos seus dados. Abra abaixo.',
    );
    expect(answer.references.map((r) => r.kind)).toEqual(['Nota', 'Snippet']);
    expect(RuleBasedAssistant.answer('xyz', workspace()).references).toEqual(
      [],
    );
  });

  it('matches project names only as whole words', () => {
    expect(
      RuleBasedAssistant.mentions(
        'como está o tbfernandes software?',
        'TBFernandes Software',
      ),
    ).toBe(true);
    expect(RuleBasedAssistant.mentions('explique o servidor', 'P')).toBe(false);
    expect(RuleBasedAssistant.mentions('status do p?', 'P')).toBe(true);
  });
});

// --- Query engine -------------------------------------------------------------------------

describe('QueryEngine', () => {
  const today = '2026-10-30';
  const company = randomUUID();
  const project = randomUUID();
  const task = (
    title: string,
    status: string,
    priority: string,
    projectId: string | null,
    due: string,
  ): TaskRecord => ({
    id: randomUUID(),
    title,
    description: null,
    status,
    priority,
    projectId,
    goalId: null,
    dueDate: due,
  });
  const data: Workspace = {
    today,
    companies: [{ id: company, name: 'Zasso', status: 'active' }],
    projects: [
      {
        id: project,
        name: 'Portal',
        status: 'active',
        companyId: company,
        goalId: null,
        dueDate: day(today, 30),
        nextDelivery: null,
      },
    ],
    tasks: [
      task('Corrigir relatório', 'todo', 'normal', project, day(today, -2)),
      task(
        'Publicar migração',
        'in_progress',
        'urgent',
        project,
        day(today, 1),
      ),
      task('Revisar contrato', 'blocked', 'high', null, day(today, -5)),
      task('Tarefa antiga', 'done', 'low', project, day(today, -9)),
    ],
    notes: [
      {
        id: randomUUID(),
        title: 'Decisões de migração',
        body: 'Usar Flyway',
        tags: ['banco'],
        projectIds: [project],
        taskIds: [],
      },
      {
        id: randomUUID(),
        title: 'Receitas',
        body: 'Pão',
        tags: [],
        projectIds: [],
        taskIds: [],
      },
    ],
    snippets: [],
    goals: [],
    studies: [],
    purchases: [],
    month: {
      month: '2026-09',
      personalIncome: 10,
      personalExpense: 1,
      businessIncome: 0,
      businessExpense: 0,
    },
    contacts: [
      {
        id: randomUUID(),
        name: 'Ana',
        role: 'CTO',
        companyId: company,
        companyName: 'Zasso',
        nextContact: day(today, 3),
      },
    ],
  };
  const labels = (q: Parameters<typeof StructuredQueries.of>[0]) =>
    QueryEngine.run(StructuredQueries.of(q), data).references.map(
      (r) => r.label,
    );

  it('overdue open tasks include only what is late and not finished', () => {
    const answer = QueryEngine.run(
      StructuredQueries.of({
        subject: 'TASKS',
        openOnly: true,
        dueTo: day(today, -1),
      }),
      data,
    );
    expect(answer.text).toMatch(/^Encontrei 2 tarefas:/);
    expect(answer.text).toContain(
      '**Revisar contrato** · prioridade alta · atrasada 5d · bloqueada',
    );
    expect(answer.text).not.toContain('Tarefa antiga');
    expect(answer.text).not.toContain('Publicar migração');
    expect(answer.references.map((r) => r.label)).toEqual([
      'Revisar contrato',
      'Corrigir relatório',
    ]);
    expect(answer.source).toBe('query');
    expect(answer.query).not.toBeNull();
  });

  it('sorts by priority and counts', () => {
    expect(
      labels({ subject: 'TASKS', openOnly: true, sort: 'PRIORITY' })[0],
    ).toBe('Publicar migração');
    expect(
      QueryEngine.run(
        StructuredQueries.of({
          subject: 'TASKS',
          aggregate: 'COUNT',
          openOnly: true,
        }),
        data,
      ).text,
    ).toBe('Você tem 3 tarefas com esses critérios.');
  });

  it("filters tasks by their project's company and by status, ignoring case", () => {
    expect(
      labels({
        subject: 'TASKS',
        statuses: [' IN_PROGRESS '],
        company: 'zasso',
      }),
    ).toEqual(['Publicar migração']);
  });

  it('search ignores accents and needs every word', () => {
    expect(
      labels({ subject: 'NOTES', sort: 'NAME', text: 'migracao flyway' }),
    ).toEqual(['Decisões de migração']);
    expect(
      QueryEngine.run(
        StructuredQueries.of({
          subject: 'NOTES',
          sort: 'NAME',
          text: 'migracao receita',
        }),
        data,
      ).text,
    ).toBe('Não encontrei notas com esses critérios.');
  });

  it('caps the limit and says so in the text', () => {
    const answer = QueryEngine.run(
      StructuredQueries.of({ subject: 'TASKS', limit: 1 }),
      data,
    );
    expect(answer.references).toHaveLength(1);
    expect(answer.text).toMatch(/^Encontrei 4 tarefas\. Mostrando 1:/);
    expect(StructuredQueries.of({ subject: 'TASKS', limit: 999 }).limit).toBe(
      MAX_LIMIT,
    );
  });

  it('names another month for cash flow and keeps scopes apart', () => {
    const text = QueryEngine.run(
      StructuredQueries.of({ subject: 'CASH_FLOW' }),
      data,
    ).text;
    expect(text).toMatch(/^Em setembro de 2026:/);
    expect(text).toContain('**Pessoal**');
    expect(text).toContain('**Empresa**');
  });

  it('a query needs a subject', () => {
    expect(() => StructuredQueries.of({ subject: null })).toThrow();
  });
});

// --- Knowledge graph ----------------------------------------------------------------------

describe('KnowledgeGraphs', () => {
  it('has the same nodes and edges as the frontend', () => {
    const graph = KnowledgeGraphs.of(workspace());
    // 2 goals, 1 company, 1 project, 4 tasks, 1 note, 1 snippet, 1 contact
    expect(graph.nodes).toHaveLength(11);
    expect(graph.nodes).toContainEqual({
      id: `project:${PROJECT}`,
      kind: 'project',
      label: 'Billing Revamp',
      href: `/projects/view?id=${PROJECT}`,
    });
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        { source: `project:${PROJECT}`, target: `company:${COMPANY}` },
        { source: `project:${PROJECT}`, target: `goal:${GOAL}` },
        { source: `note:${NOTE}`, target: `project:${PROJECT}` },
      ]),
    );
    // 2 project edges + 4 task→project + 1 note + 1 contact
    expect(graph.edges).toHaveLength(8);
  });

  it('drops edges to deleted records', () => {
    const data = workspace();
    const orphan: Workspace = {
      ...data,
      projects: [
        {
          id: randomUUID(),
          name: 'Lost',
          status: 'active',
          companyId: randomUUID(),
          goalId: null,
          dueDate: null,
          nextDelivery: null,
        },
      ],
      tasks: [],
      notes: [],
      snippets: [],
      goals: [],
      contacts: [],
    };
    expect(KnowledgeGraphs.of(orphan).edges).toEqual([]);
  });
});

// --- Retrieval: documents, chunks, ranking, grounded answers ------------------------------

describe('KnowledgeDocuments', () => {
  it('turns notes and snippets into documents with their tags', () => {
    const noteId = randomUUID();
    const documents = KnowledgeDocuments.of(
      [
        {
          id: noteId,
          title: 'Docker',
          body: 'Engine no WSL',
          tags: ['devops'],
          projectIds: [],
          taskIds: [],
        },
      ],
      [
        {
          id: randomUUID(),
          title: 'compose',
          explanation: null,
          tags: [],
          projectIds: [],
          taskIds: [],
        },
      ],
    );
    expect(documents.map((d) => d.text)).toEqual([
      'Engine no WSL\n\nTags: devops',
      '',
    ]);
  });

  it('changes the fingerprint with the text and the model', () => {
    const key: DocumentKey = { kind: 'NOTE', id: randomUUID() };
    const document = { key, title: 'Título', text: 'Texto' };
    const edited = { key, title: 'Título', text: 'Texto novo' };
    const fp = KnowledgeDocuments.fingerprint(document, 'none');
    expect(fp).toBe(KnowledgeDocuments.fingerprint(document, 'none'));
    expect(fp).toHaveLength(64);
    expect(fp).not.toBe(KnowledgeDocuments.fingerprint(edited, 'none'));
    expect(fp).not.toBe(
      KnowledgeDocuments.fingerprint(document, 'voyage:voyage-3.5-lite'),
    );
  });

  it('keeps the digest of the Java backend, so an existing index is reused', () => {
    // sha256("Título\0Texto\0none\0")
    expect(
      KnowledgeDocuments.fingerprint(
        {
          key: { kind: 'NOTE', id: randomUUID() },
          title: 'Título',
          text: 'Texto',
        },
        'none',
      ),
    ).toBe(
      createHash('sha256')
        .update(Buffer.from('Título\0Texto\0none\0', 'utf8'))
        .digest('hex'),
    );
  });
});

describe('TextChunker', () => {
  it('joins short paragraphs into one passage', () => {
    expect(
      TextChunker.split('Primeiro.\n\nSegundo.\n\n\nTerceiro.', 100),
    ).toEqual(['Primeiro.\n\nSegundo.\n\nTerceiro.']);
  });

  it('starts a new passage when the next paragraph does not fit', () => {
    const a = 'a'.repeat(60);
    const b = 'b'.repeat(60);
    expect(TextChunker.split(`${a}\n\n${b}`, 100)).toEqual([a, b]);
  });

  it('cuts a long paragraph at the end of a sentence', () => {
    const sentence = 'Esta frase tem umas quarenta letras ok. ';
    const chunks = TextChunker.split(sentence.repeat(5), 100);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(100);
      expect(chunk.endsWith('.')).toBe(true);
    }
    expect(chunks.join(' ')).toBe(sentence.repeat(5).trim());
  });

  it('cuts at the limit when there is no space', () => {
    expect(
      TextChunker.split('x'.repeat(250), 100).map((c) => c.length),
    ).toEqual([100, 100, 50]);
  });

  it('gives no passages for empty text', () => {
    expect(TextChunker.split('  \n\n ', 100)).toEqual([]);
  });

  it('rejects tiny limits', () => {
    expect(() => TextChunker.split('text', 10)).toThrow();
  });
});

describe('PassageRanker', () => {
  const DOCKER: DocumentKey = { kind: 'NOTE', id: randomUUID() };
  const KAFKA: DocumentKey = { kind: 'NOTE', id: randomUUID() };
  const RECIPE: DocumentKey = { kind: 'SNIPPET', id: randomUUID() };
  const chunk = (
    source: DocumentKey,
    position: number,
    title: string,
    text: string,
    vector: number[] | null,
  ): IndexedChunk => ({ source, position, title, text, vector });
  const sources = (passages: Passage[]) => passages.map((p) => p.source);

  it('finds passages by their words, ignoring accents and case', () => {
    const found = PassageRanker.rank(
      'Como fiz a instalacao do docker?',
      null,
      [
        chunk(
          DOCKER,
          0,
          'Docker no WSL',
          'Instalação do Docker Engine no Ubuntu.',
          null,
        ),
        chunk(KAFKA, 0, 'Kafka', 'Tópicos, partições e consumidores.', null),
      ],
      5,
    );
    expect(sources(found)).toEqual([DOCKER]);
    expect(found[0].score).toBe(1);
  });

  it('finds nothing with stop words alone', () => {
    expect(
      PassageRanker.rank(
        'como o que',
        null,
        [chunk(DOCKER, 0, 'Docker', 'Como instalar o que for preciso.', null)],
        5,
      ),
    ).toEqual([]);
  });

  it('finds passages written with other words through embeddings', () => {
    const found = PassageRanker.rank(
      'como subir o docker',
      [0.9, 0.1, 0],
      [
        chunk(DOCKER, 0, 'Containers', 'Engine no Ubuntu', [1, 0, 0]),
        chunk(RECIPE, 0, 'Bolo', 'Farinha e ovos', [0, 1, 0]),
      ],
      5,
    );
    expect(sources(found)).toEqual([DOCKER]);
  });

  it('keeps a passage that shares words even when its vector is far', () => {
    expect(
      PassageRanker.rank(
        'kafka',
        [1, 0],
        [chunk(KAFKA, 0, 'Kafka', 'Partições', [0, 1])],
        5,
      ),
    ).toHaveLength(1);
  });

  it('still counts passages without a vector by their words', () => {
    const found = PassageRanker.rank(
      'docker',
      [1, 0],
      [
        chunk(DOCKER, 0, 'Docker', 'Engine', null),
        chunk(KAFKA, 0, 'Kafka', 'Docker compose do Kafka', [1, 0]),
      ],
      5,
    );
    expect(sources(found)).toEqual(expect.arrayContaining([DOCKER, KAFKA]));
    expect(found).toHaveLength(2);
  });

  it('keeps at most two passages per document, and the limit', () => {
    const chunks = [
      chunk(DOCKER, 0, 'Docker', 'docker um', null),
      chunk(DOCKER, 1, 'Docker', 'docker dois', null),
      chunk(DOCKER, 2, 'Docker', 'docker três', null),
      chunk(KAFKA, 0, 'Kafka', 'docker no kafka', null),
    ];
    const found = PassageRanker.rank('docker', null, chunks, 10);
    expect(found.filter((p) => p.source === DOCKER)).toHaveLength(2);
    expect(found.filter((p) => p.source === KAFKA)).toHaveLength(1);
    expect(PassageRanker.rank('docker', null, chunks, 1)).toHaveLength(1);
  });

  it('computes the cosine of equal, opposite and empty vectors', () => {
    expect(PassageRanker.cosine([1, 2], [2, 4])).toBeCloseTo(1, 9);
    expect(PassageRanker.cosine([1, 0], [-1, 0])).toBe(-1);
    expect(PassageRanker.cosine([0, 0], [1, 0])).toBe(0);
  });
});

describe('GroundedAnswer', () => {
  const note = randomUUID();
  const snippet = randomUUID();
  const passages: Passage[] = [
    {
      source: { kind: 'NOTE', id: note },
      title: 'Docker no WSL',
      text: 'Instale o Docker Engine.',
      score: 0.9,
    },
    {
      source: { kind: 'SNIPPET', id: snippet },
      title: 'compose up',
      text: 'Sobe tudo em segundo plano.',
      score: 0.8,
    },
    {
      source: { kind: 'NOTE', id: note },
      title: 'Docker no WSL',
      text: 'Depois ajuste o systemd.',
      score: 0.7,
    },
  ];

  it('renumbers citations to the cited records', () => {
    const answer = GroundedAnswer.fromModel(
      'Use o compose [2]. Instale o Engine [1] e o systemd [3, 1].',
      passages,
    );
    expect(answer.source).toBe('rag');
    expect(answer.text).toBe(
      'Use o compose [1]. Instale o Engine [2] e o systemd [2].',
    );
    expect(answer.references.map((r) => r.label)).toEqual([
      'compose up',
      'Docker no WSL',
    ]);
    expect(answer.references[1].href).toBe(`/knowledge?note=${note}`);
    expect(answer.references[1].excerpt).toBe('Instale o Docker Engine.');
  });

  it('drops citations of passages that do not exist', () => {
    const answer = GroundedAnswer.fromModel(
      'Instale o Engine [1] [9].',
      passages,
    );
    expect(answer.text).toBe('Instale o Engine [1].');
    expect(answer.references).toHaveLength(1);
  });

  it('lists every record when the model cites nothing', () => {
    expect(
      GroundedAnswer.fromModel(
        'Não encontrei isso nas suas notas.',
        passages,
      ).references.map((r) => r.label),
    ).toEqual(['Docker no WSL', 'compose up']);
  });

  it('shows the excerpts without a model', () => {
    const answer = GroundedAnswer.excerpts(passages);
    expect(answer.source).toBe('search');
    expect(answer.text).toContain('Encontrei 2 trechos');
    expect(answer.references.map((r) => r.excerpt)).toEqual([
      'Instale o Docker Engine.',
      'Sobe tudo em segundo plano.',
    ]);
  });

  it('writes excerpts as plain text', () => {
    expect(
      GroundedAnswer.excerpt(
        '## Contexto\nO **lag** do `consumer`:\n- um\n> citação',
      ),
    ).toBe('Contexto O lag do consumer: um citação');
  });

  it('cuts excerpts at a word', () => {
    const excerpt = GroundedAnswer.excerpt('palavra '.repeat(100));
    expect(excerpt.endsWith('palavra…')).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(EXCERPT_LENGTH + 1);
  });
});

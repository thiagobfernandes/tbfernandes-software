import { z } from 'zod';

import type { TbfClient } from '../api/tbf-client.ts';
import { definedFields } from './defined-fields.ts';
import {
  defineTool,
  type ToolContext,
  type ToolRegistration,
} from './define-tool.ts';
import { entryKind, entryScope, isoDate, uuid, yearMonth } from './schemas.ts';

const MAX_MONTHS = 60;

const category = z.string().min(1).max(60);
const description = z.string().min(1).max(300);
const amount = z.number().positive();

const plannedEntry = z.object({
  description,
  category,
  amount: amount.describe(
    'Valor em reais de cada mês (de cada parcela, se installments=true).',
  ),
  date: isoDate.describe('Data do primeiro lançamento.'),
  kind: entryKind.default('expense'),
  scope: entryScope.default('personal'),
  months: z
    .number()
    .int()
    .min(1)
    .max(MAX_MONTHS)
    .default(1)
    .describe('Quantos meses seguidos, a partir de date. 1 = só uma vez.'),
  installments: z
    .boolean()
    .default(false)
    .describe(
      'true = parcelas de uma compra: a descrição ganha "(1/10)". false com months>1 = gasto fixo mensal (marcado como recorrente).',
    ),
});

type PlannedEntry = z.infer<typeof plannedEntry>;

interface EntryBody {
  kind: string;
  scope: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  recurring: boolean;
}

export function financeTools(context: ToolContext): ToolRegistration[] {
  return [
    listEntries(context),
    createEntries(context),
    updateEntry(context),
    deleteEntries(context),
  ];
}

function listEntries({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'list_finance_entries',
    description:
      'Lista lançamentos financeiros (receitas e despesas), opcionalmente de um mês (AAAA-MM) e de um escopo.',
    input: { month: yearMonth.optional(), scope: entryScope.optional() },
    run: async ({ month, scope }) =>
      (await api.list('/finance/entries', { month, scope })).items,
  });
}

function createEntries({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'create_finance_entries',
    description:
      'Cria lançamentos financeiros. Cada item pode se repetir por vários meses: parcelas (installments=true, "Notebook (3/10)") ou gasto fixo mensal (assinaturas, contas). Cria um lançamento por mês, porque o fluxo de caixa não projeta recorrência sozinho.',
    input: { entries: z.array(plannedEntry).min(1).max(50) },
    run: async ({ entries }) => {
      const bodies = entries.flatMap(expand);
      const created = [];
      for (const body of bodies) {
        created.push(await api.post('/finance/entries', body));
      }
      return { created: created.length, entries: created };
    },
  });
}

function updateEntry({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'update_finance_entry',
    description: 'Edita um lançamento. Campos omitidos são mantidos.',
    input: {
      id: uuid,
      description: description.optional(),
      category: category.optional(),
      amount: amount.optional(),
      date: isoDate.optional(),
      kind: entryKind.optional(),
      scope: entryScope.optional(),
      recurring: z.boolean().optional(),
    },
    run: async ({ id, ...changes }) => {
      const current = await api.get<EntryBody>(`/finance/entries/${id}`);
      return api.put(`/finance/entries/${id}`, {
        ...current,
        ...definedFields(changes),
      });
    },
  });
}

function deleteEntries({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'delete_finance_entries',
    description: 'Exclui lançamentos pelo id.',
    input: { ids: z.array(uuid).min(1).max(100) },
    run: async ({ ids }) => deleteAll(api, ids),
  });
}

async function deleteAll(api: TbfClient, ids: string[]) {
  for (const id of ids) await api.delete(`/finance/entries/${id}`);
  return { deleted: ids.length };
}

function expand(entry: PlannedEntry): EntryBody[] {
  return Array.from({ length: entry.months }, (_, index) => ({
    kind: entry.kind,
    scope: entry.scope,
    category: entry.category,
    description: entry.installments
      ? `${entry.description} (${String(index + 1)}/${String(entry.months)})`.slice(
          0,
          300,
        )
      : entry.description,
    amount: entry.amount,
    date: addMonths(entry.date, index),
    recurring: !entry.installments && entry.months > 1,
  }));
}

/** Same day in a later month, clamped to the month's last day (31/01 + 1 → 28/02). */
export function addMonths(date: string, months: number): string {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

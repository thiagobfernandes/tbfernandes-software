import { InvalidArgumentError, IsoDate } from '../../../../common/domain';
import { Cents, Money } from '../money';

export interface CsvTransaction {
  date: IsoDate;
  title: string;
  amount: Cents;
}

export interface Installment {
  base: string;
  number: number;
  total: number;
}

const INSTALLMENT = /^(.*?)\s*-\s*(?:parcela\s+)?(\d{1,3})\/(\d{1,3})\s*$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Card statement CSV with the columns date, title and amount, as the Nubank app exports it:
 * amounts in Brazilian format ("1.234,56", quoted) or plain ("1234.56").
 */
export function parseStatementCsv(text: string): CsvTransaction[] {
  const lines = withoutByteOrderMark(text)
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');
  const [header, ...rows] = lines;
  const columns = splitCsvLine(header ?? '').map((column) =>
    column.trim().toLowerCase(),
  );
  const index = (name: string) => {
    const position = columns.indexOf(name);
    if (position < 0) {
      throw new InvalidArgumentError(
        `o CSV precisa da coluna "${name}" (date, title, amount)`,
      );
    }
    return position;
  };
  const [dateAt, titleAt, amountAt] = [
    index('date'),
    index('title'),
    index('amount'),
  ];
  return rows.map((row, rowIndex) => {
    const cells = splitCsvLine(row);
    return parseRow(cells[dateAt], cells[titleAt], cells[amountAt], rowIndex);
  });
}

function withoutByteOrderMark(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function parseRow(
  date: string | undefined,
  title: string | undefined,
  amount: string | undefined,
  rowIndex: number,
): CsvTransaction {
  const line = rowIndex + 2;
  if (!date || !ISO_DATE.test(date.trim())) {
    throw new InvalidArgumentError(`linha ${line}: data inválida`);
  }
  if (!title || title.trim() === '') {
    throw new InvalidArgumentError(`linha ${line}: título vazio`);
  }
  return {
    date: date.trim(),
    title: title.replace(/\s+/g, ' ').trim(),
    amount: parseAmount(amount ?? '', line),
  };
}

/** "1.234,56" and "1234.56" are both R$ 1.234,56. */
export function parseAmount(text: string, line: number): Cents {
  const trimmed = text.trim().replace(/^R\$\s*/, '');
  const normalized = trimmed.includes(',')
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed;
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new InvalidArgumentError(`linha ${line}: valor inválido "${text}"`);
  }
  return Money.cents(normalized);
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let position = 0; position < line.length; position++) {
    const char = line[position];
    if (char === '"' && quoted && line[position + 1] === '"') {
      current += '"';
      position++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

/** "Loja - Parcela 2/3" and "Pix no Crédito - 1/2" → base, number and total. */
export function parseInstallment(title: string): Installment | null {
  const match = INSTALLMENT.exec(title);
  if (!match) return null;
  const number = Number(match[2]);
  const total = Number(match[3]);
  if (number < 1 || total < 2 || number > total) return null;
  return { base: normalizeTitle(match[1]), number, total };
}

export function normalizeTitle(title: string): string {
  return title.replace(/\s+/g, ' ').trim().toLowerCase();
}

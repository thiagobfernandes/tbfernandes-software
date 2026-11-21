import {
  EntityManager,
  EntityTarget,
  FindOptionsWhere,
  In,
  ObjectLiteral,
} from 'typeorm';

/** Child rows of an aggregate are rewritten on every save, inside its transaction. */
export async function replaceRows<T extends ObjectLiteral>(
  manager: EntityManager,
  target: EntityTarget<T>,
  where: FindOptionsWhere<T>,
  rows: T[],
): Promise<void> {
  await manager.delete(target, where);
  if (rows.length) await manager.insert(target, rows);
}

/** Children of several aggregates at once, grouped by their parent id. */
export async function rowsByParent<T extends ObjectLiteral>(
  manager: EntityManager,
  target: EntityTarget<T>,
  parentColumn: keyof T & string,
  parentIds: string[],
): Promise<Map<string, T[]>> {
  const grouped = new Map<string, T[]>(parentIds.map((id) => [id, []]));
  if (!parentIds.length) return grouped;
  const rows = await manager.find(target, {
    where: { [parentColumn]: In(parentIds) } as FindOptionsWhere<T>,
  });
  for (const child of rows) {
    grouped.get(child[parentColumn])?.push(child);
  }
  return grouped;
}

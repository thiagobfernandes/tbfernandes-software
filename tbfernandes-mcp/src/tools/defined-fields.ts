// Undefined keys are dropped so that spreading the result over the stored record
// keeps every field the caller did not send.
export function definedFields<Fields extends object>(
  fields: Fields,
): Partial<Fields> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  ) as Partial<Fields>;
}

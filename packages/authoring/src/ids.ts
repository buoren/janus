/**
 * Ids only need to be unique within a single form, so a per-editor counter is
 * enough. `createIdFactory` returns a generator; `newId` is a shared default.
 */
export function createIdFactory(start = 100): (prefix: string) => string {
  let n = start
  return (prefix: string) => `${prefix}_${++n}`
}

/** A shared default factory — fine for a single editing session. */
export const newId = createIdFactory()

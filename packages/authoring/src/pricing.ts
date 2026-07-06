import type { PriceRule, Question } from '@janus/core'

/**
 * A cross-field pricing grid, as edited in a table. Prices are in the smallest
 * currency unit (cents), keyed by the row option id for a single-axis rule, or
 * `"rowId|colId"` for a two-axis rule. A null/absent cell means "no price".
 */
export interface GridPriceRule {
  description: string
  /** Single-choice question whose options form the rows. */
  fieldA: string
  /** Single-choice question whose options form the columns. Omit for one axis. */
  fieldB?: string
  cells: Record<string, number | null | undefined>
}

/**
 * Compile a grid into a Janus nested `switch` price rule. A two-axis grid
 * becomes `switch(fieldA) -> switch(fieldB) -> price`. Returns null if fieldA
 * can't be resolved in `questions`.
 */
export function compileGridRule(rule: GridPriceRule, questions: Question[]): PriceRule | null {
  const byId = (id: string): Question | undefined => questions.find((q) => q.id === id)
  const a = byId(rule.fieldA)
  if (!a) return null
  const b = rule.fieldB ? byId(rule.fieldB) : undefined

  if (b && rule.fieldB) {
    const cases: Record<string, PriceRule['rule']> = {}
    for (const oa of a.options ?? []) {
      const inner: Record<string, number> = {}
      for (const ob of b.options ?? []) {
        const c = rule.cells[`${oa.id}|${ob.id}`]
        if (c != null) inner[ob.id] = c
      }
      cases[oa.id] = { switch: { field: rule.fieldB, cases: inner, default: 0 } }
    }
    return { description: rule.description, rule: { switch: { field: rule.fieldA, cases, default: 0 } } }
  }

  const cases: Record<string, number> = {}
  for (const oa of a.options ?? []) {
    const c = rule.cells[oa.id]
    if (c != null) cases[oa.id] = c
  }
  return { description: rule.description, rule: { switch: { field: rule.fieldA, cases, default: 0 } } }
}

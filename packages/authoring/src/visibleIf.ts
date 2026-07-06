import type { VisibleIf } from '@janus/core'

/**
 * The binary condition operators an authoring UI edits directly. (Janus's full
 * VisibleIf has more — has_any, prev_*, before/after — but a builder round-trips
 * these field/op/value forms.)
 */
export type ConditionOp = 'eq' | 'not_eq' | 'greater_than' | 'less_than'

export interface Condition {
  field: string
  op: ConditionOp
  value: string | number
}

const OPS: ConditionOp[] = ['eq', 'not_eq', 'greater_than', 'less_than']

/** Build a VisibleIf from an authoring (field, op, value) triple, or null. */
export function buildVisibleIf(field: string, op: ConditionOp, value: string | number): VisibleIf | null {
  if (!field) return null
  switch (op) {
    case 'eq':
      return { eq: [field, String(value)] }
    case 'not_eq':
      return { not_eq: [field, String(value)] }
    case 'greater_than':
      return { greater_than: [field, Number(value) || 0] }
    case 'less_than':
      return { less_than: [field, Number(value) || 0] }
    default:
      return null
  }
}

/**
 * Read a VisibleIf back into an authoring triple for the editor UI. Only the
 * binary field/op/value operators are recognised; anything else returns null.
 */
export function readVisibleIf(vi: VisibleIf | null | undefined): Condition | null {
  if (!vi) return null
  for (const op of OPS) {
    if (op in vi) {
      const [field, value] = (vi as Record<string, [string, string | number]>)[op]
      return { field, op, value }
    }
  }
  return null
}

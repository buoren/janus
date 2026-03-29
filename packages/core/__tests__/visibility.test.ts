import { evaluateVisibleIf, isOptionVisible, visibleOptions } from '../src/visibility'

// ---------------------------------------------------------------------------
// evaluateVisibleIf
// ---------------------------------------------------------------------------

describe('evaluateVisibleIf', () => {
  test('has_any returns true when non-empty list', () => {
    expect(evaluateVisibleIf({ has_any: 'q1' }, { q1: ['a'] })).toBe(true)
  })

  test('has_any returns false when empty list', () => {
    expect(evaluateVisibleIf({ has_any: 'q1' }, { q1: [] })).toBe(false)
  })

  test('has_none returns true when empty list', () => {
    expect(evaluateVisibleIf({ has_none: 'q1' }, { q1: [] })).toBe(true)
  })

  test('eq returns true when matching', () => {
    expect(evaluateVisibleIf({ eq: ['q1', 'yes'] }, { q1: 'yes' })).toBe(true)
  })

  test('eq returns false when not matching', () => {
    expect(evaluateVisibleIf({ eq: ['q1', 'yes'] }, { q1: 'no' })).toBe(false)
  })

  test('not_eq returns true when different', () => {
    expect(evaluateVisibleIf({ not_eq: ['q1', 'yes'] }, { q1: 'no' })).toBe(true)
  })

  test('before returns true when date is in future', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    expect(evaluateVisibleIf({ before: tomorrow }, {})).toBe(true)
  })

  test('before returns false when date is in past', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    expect(evaluateVisibleIf({ before: yesterday }, {})).toBe(false)
  })

  test('after returns true when date is in past', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    expect(evaluateVisibleIf({ after: yesterday }, {})).toBe(true)
  })

  test('after returns false when date is in future', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    expect(evaluateVisibleIf({ after: tomorrow }, {})).toBe(false)
  })

  test('after today is true', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(evaluateVisibleIf({ after: today }, {})).toBe(true)
  })

  test('before today is false', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(evaluateVisibleIf({ before: today }, {})).toBe(false)
  })

  // now param for testability
  test('before with explicit now', () => {
    expect(evaluateVisibleIf({ before: '2025-06-01' }, {}, '2025-05-15')).toBe(true)
    expect(evaluateVisibleIf({ before: '2025-06-01' }, {}, '2025-06-15')).toBe(false)
  })

  test('after with explicit now', () => {
    expect(evaluateVisibleIf({ after: '2025-06-01' }, {}, '2025-06-01')).toBe(true)
    expect(evaluateVisibleIf({ after: '2025-06-01' }, {}, '2025-05-15')).toBe(false)
  })

  // less_than / greater_than
  test('less_than returns true when value is below threshold', () => {
    expect(evaluateVisibleIf({ less_than: ['age', 18] }, { age: 15 })).toBe(true)
  })

  test('less_than returns false when value equals threshold', () => {
    expect(evaluateVisibleIf({ less_than: ['age', 18] }, { age: 18 })).toBe(false)
  })

  test('less_than returns false when value exceeds threshold', () => {
    expect(evaluateVisibleIf({ less_than: ['age', 18] }, { age: 25 })).toBe(false)
  })

  test('greater_than returns true when value exceeds threshold', () => {
    expect(evaluateVisibleIf({ greater_than: ['group_size', 10] }, { group_size: 15 })).toBe(true)
  })

  test('greater_than returns false when value equals threshold', () => {
    expect(evaluateVisibleIf({ greater_than: ['group_size', 10] }, { group_size: 10 })).toBe(false)
  })

  test('greater_than returns false when value is below threshold', () => {
    expect(evaluateVisibleIf({ greater_than: ['group_size', 10] }, { group_size: 5 })).toBe(false)
  })

  test('less_than coerces string answer to number', () => {
    expect(evaluateVisibleIf({ less_than: ['age', 18] }, { age: '15' })).toBe(true)
  })

  test('greater_than coerces string answer to number', () => {
    expect(evaluateVisibleIf({ greater_than: ['group_size', 10] }, { group_size: '15' })).toBe(true)
  })

  test('less_than with missing key returns true (NaN < n)', () => {
    expect(evaluateVisibleIf({ less_than: ['age', 18] }, {})).toBe(false)
  })

  test('greater_than with missing key returns false (NaN > n)', () => {
    expect(evaluateVisibleIf({ greater_than: ['group_size', 10] }, {})).toBe(false)
  })

  // null/undefined condition
  test('null condition returns true', () => {
    expect(evaluateVisibleIf(null, {})).toBe(true)
  })

  test('undefined condition returns true', () => {
    expect(evaluateVisibleIf(undefined, {})).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Edge cases — missing answer keys
// ---------------------------------------------------------------------------

describe('evaluateVisibleIf edge cases', () => {
  test('has_any missing key is false', () => {
    expect(evaluateVisibleIf({ has_any: 'q1' }, {})).toBe(false)
  })

  test('has_none missing key is true', () => {
    expect(evaluateVisibleIf({ has_none: 'q1' }, {})).toBe(true)
  })

  test('eq missing key is false', () => {
    expect(evaluateVisibleIf({ eq: ['q1', 'yes'] }, {})).toBe(false)
  })

  test('not_eq missing key is true', () => {
    expect(evaluateVisibleIf({ not_eq: ['q1', 'yes'] }, {})).toBe(true)
  })

  test('has_any non-list is false', () => {
    expect(evaluateVisibleIf({ has_any: 'q1' }, { q1: 'string' })).toBe(false)
  })

  test('has_none non-list is true', () => {
    expect(evaluateVisibleIf({ has_none: 'q1' }, { q1: 'string' })).toBe(true)
  })

  test('unknown operator returns true', () => {
    expect(evaluateVisibleIf({ unknown_op: 'foo' } as any, {})).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Dict answers (quantity_choice)
// ---------------------------------------------------------------------------

describe('evaluateVisibleIf with dict answers', () => {
  test('has_any true when dict has positive value', () => {
    expect(evaluateVisibleIf({ has_any: 'q1' }, { q1: { a: 2, b: 0 } })).toBe(true)
  })

  test('has_any false when dict all zero', () => {
    expect(evaluateVisibleIf({ has_any: 'q1' }, { q1: { a: 0, b: 0 } })).toBe(false)
  })

  test('has_none true when dict all zero', () => {
    expect(evaluateVisibleIf({ has_none: 'q1' }, { q1: { a: 0, b: 0 } })).toBe(true)
  })

  test('has_none false when dict has positive', () => {
    expect(evaluateVisibleIf({ has_none: 'q1' }, { q1: { a: 1 } })).toBe(false)
  })

  test('has_none true when dict empty', () => {
    expect(evaluateVisibleIf({ has_none: 'q1' }, { q1: {} })).toBe(true)
  })

  test('has_any false when dict empty', () => {
    expect(evaluateVisibleIf({ has_any: 'q1' }, { q1: {} })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Option visibility
// ---------------------------------------------------------------------------

describe('option visibility', () => {
  test('no visible_if always visible', () => {
    expect(isOptionVisible({ id: 'a', label: 'A' }, {})).toBe(true)
  })

  test('before filters option', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    expect(isOptionVisible({ id: 'early', label: 'Early', visible_if: { before: yesterday } }, {})).toBe(false)
  })

  test('after shows option', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    expect(isOptionVisible({ id: 'normal', label: 'Normal', visible_if: { after: yesterday } }, {})).toBe(true)
  })

  test('visibleOptions filters list', () => {
    const q = {
      id: 'ticket',
      type: 'single_choice' as const,
      label: 'Ticket',
      options: [
        { id: 'early', label: 'Early', visible_if: { before: '2020-01-01' } as const },
        { id: 'normal', label: 'Normal', visible_if: { after: '2020-01-01' } as const },
        { id: 'always', label: 'Always' },
      ],
    }
    const result = visibleOptions(q, {})
    const ids = result.map((o) => o.id)
    expect(ids).not.toContain('early')
    expect(ids).toContain('normal')
    expect(ids).toContain('always')
  })

  test('eq condition on option', () => {
    const opt = { id: 'premium', label: 'Premium', visible_if: { eq: ['role', 'pro'] as [string, string] } }
    expect(isOptionVisible(opt, { role: 'pro' })).toBe(true)
    expect(isOptionVisible(opt, { role: 'student' })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// prev_* conditions
// ---------------------------------------------------------------------------

describe('evaluateVisibleIf prev_* conditions', () => {
  // prev_increased
  test('prev_increased returns true when current > previous', () => {
    expect(evaluateVisibleIf({ prev_increased: 'pain' }, { pain: 8 }, undefined, { pain: 5 })).toBe(true)
  })

  test('prev_increased returns false when current <= previous', () => {
    expect(evaluateVisibleIf({ prev_increased: 'pain' }, { pain: 5 }, undefined, { pain: 5 })).toBe(false)
    expect(evaluateVisibleIf({ prev_increased: 'pain' }, { pain: 3 }, undefined, { pain: 5 })).toBe(false)
  })

  test('prev_increased returns false when no previousAnswers', () => {
    expect(evaluateVisibleIf({ prev_increased: 'pain' }, { pain: 8 })).toBe(false)
  })

  test('prev_increased returns false when values are non-numeric', () => {
    expect(evaluateVisibleIf({ prev_increased: 'pain' }, { pain: 'high' }, undefined, { pain: 'low' })).toBe(false)
  })

  // prev_decreased
  test('prev_decreased returns true when current < previous', () => {
    expect(evaluateVisibleIf({ prev_decreased: 'pain' }, { pain: 3 }, undefined, { pain: 7 })).toBe(true)
  })

  test('prev_decreased returns false when current >= previous', () => {
    expect(evaluateVisibleIf({ prev_decreased: 'pain' }, { pain: 7 }, undefined, { pain: 7 })).toBe(false)
    expect(evaluateVisibleIf({ prev_decreased: 'pain' }, { pain: 9 }, undefined, { pain: 7 })).toBe(false)
  })

  test('prev_decreased returns false when no previousAnswers', () => {
    expect(evaluateVisibleIf({ prev_decreased: 'pain' }, { pain: 3 })).toBe(false)
  })

  // prev_unchanged
  test('prev_unchanged returns true when values are identical', () => {
    expect(evaluateVisibleIf({ prev_unchanged: 'status' }, { status: 'active' }, undefined, { status: 'active' })).toBe(true)
  })

  test('prev_unchanged returns false when values differ', () => {
    expect(evaluateVisibleIf({ prev_unchanged: 'status' }, { status: 'active' }, undefined, { status: 'inactive' })).toBe(false)
  })

  test('prev_unchanged returns false when no previousAnswers', () => {
    expect(evaluateVisibleIf({ prev_unchanged: 'status' }, { status: 'active' })).toBe(false)
  })

  // prev_changed
  test('prev_changed returns true when values differ', () => {
    expect(evaluateVisibleIf({ prev_changed: 'status' }, { status: 'inactive' }, undefined, { status: 'active' })).toBe(true)
  })

  test('prev_changed returns false when values are identical', () => {
    expect(evaluateVisibleIf({ prev_changed: 'status' }, { status: 'active' }, undefined, { status: 'active' })).toBe(false)
  })

  test('prev_changed returns false when no previousAnswers', () => {
    expect(evaluateVisibleIf({ prev_changed: 'status' }, { status: 'active' })).toBe(false)
  })

  // prev_changed_from
  test('prev_changed_from returns true when previous was the specified value', () => {
    expect(evaluateVisibleIf({ prev_changed_from: ['status', 'active'] }, { status: 'inactive' }, undefined, { status: 'active' })).toBe(true)
  })

  test('prev_changed_from returns false when previous was different', () => {
    expect(evaluateVisibleIf({ prev_changed_from: ['status', 'active'] }, { status: 'inactive' }, undefined, { status: 'pending' })).toBe(false)
  })

  test('prev_changed_from returns false when no previousAnswers', () => {
    expect(evaluateVisibleIf({ prev_changed_from: ['status', 'active'] }, { status: 'inactive' })).toBe(false)
  })

  // prev_changed_to
  test('prev_changed_to returns true when current is target and previous was different', () => {
    expect(evaluateVisibleIf({ prev_changed_to: ['status', 'critical'] }, { status: 'critical' }, undefined, { status: 'normal' })).toBe(true)
  })

  test('prev_changed_to returns false when current is target but previous was same', () => {
    expect(evaluateVisibleIf({ prev_changed_to: ['status', 'critical'] }, { status: 'critical' }, undefined, { status: 'critical' })).toBe(false)
  })

  test('prev_changed_to returns false when current is not target', () => {
    expect(evaluateVisibleIf({ prev_changed_to: ['status', 'critical'] }, { status: 'normal' }, undefined, { status: 'normal' })).toBe(false)
  })

  test('prev_changed_to returns false when no previousAnswers', () => {
    expect(evaluateVisibleIf({ prev_changed_to: ['status', 'critical'] }, { status: 'critical' })).toBe(false)
  })
})

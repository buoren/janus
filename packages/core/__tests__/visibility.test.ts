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

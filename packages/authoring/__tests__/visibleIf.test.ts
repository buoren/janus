import { buildVisibleIf, readVisibleIf } from '../src/visibleIf'

describe('buildVisibleIf', () => {
  it('builds each operator', () => {
    expect(buildVisibleIf('q_partner', 'eq', 'yes')).toEqual({ eq: ['q_partner', 'yes'] })
    expect(buildVisibleIf('q_partner', 'not_eq', 'no')).toEqual({ not_eq: ['q_partner', 'no'] })
    expect(buildVisibleIf('q_age', 'greater_than', '17')).toEqual({ greater_than: ['q_age', 17] })
    expect(buildVisibleIf('q_age', 'less_than', 6)).toEqual({ less_than: ['q_age', 6] })
  })

  it('returns null without a field', () => {
    expect(buildVisibleIf('', 'eq', 'x')).toBeNull()
  })

  it('coerces non-numeric values on numeric operators to 0', () => {
    expect(buildVisibleIf('q_age', 'greater_than', 'abc')).toEqual({ greater_than: ['q_age', 0] })
  })
})

describe('readVisibleIf', () => {
  it('round-trips a condition', () => {
    const vi = buildVisibleIf('q_partner', 'eq', 'yes')!
    expect(readVisibleIf(vi)).toEqual({ field: 'q_partner', op: 'eq', value: 'yes' })
  })

  it('returns null for empty or unsupported conditions', () => {
    expect(readVisibleIf(null)).toBeNull()
    expect(readVisibleIf({ has_any: 'q_extras' } as any)).toBeNull()
  })
})

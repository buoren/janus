import { blankQuestion, conditionSources, hasOptions, singleChoiceQuestions } from '../src/questions'
import { createIdFactory } from '../src/ids'

describe('hasOptions', () => {
  it('is true only for choice types', () => {
    expect(hasOptions('single_choice')).toBe(true)
    expect(hasOptions('multi_choice')).toBe(true)
    expect(hasOptions('quantity_choice')).toBe(true)
    expect(hasOptions('number')).toBe(false)
    expect(hasOptions('short_text')).toBe(false)
  })
})

describe('blankQuestion', () => {
  it('seeds two options for choice types', () => {
    const q = blankQuestion('single_choice', createIdFactory())
    expect(q.type).toBe('single_choice')
    expect(q.required).toBe(false)
    expect(q.options).toHaveLength(2)
  })

  it('seeds one capped option for quantity', () => {
    const q = blankQuestion('quantity_choice', createIdFactory())
    expect(q.options).toEqual([expect.objectContaining({ label: 'Option 1', max_quantity: 4 })])
  })

  it('omits options for non-choice types and applies overrides', () => {
    const q = blankQuestion('short_text', createIdFactory(), { label: 'Name', required: true })
    expect(q.options).toBeUndefined()
    expect(q.label).toBe('Name')
    expect(q.required).toBe(true)
  })
})

describe('conditionSources / singleChoiceQuestions', () => {
  const qs = [
    { id: 'q1', type: 'single_choice', label: 'A', options: [] },
    { id: 'q2', type: 'short_text', label: 'B' },
    { id: 'q3', type: 'number', label: 'C' },
    { id: 'q4', type: 'single_choice', label: 'D', options: [] },
  ] as const

  it('returns only earlier single-choice/number questions', () => {
    expect(conditionSources(qs as any, 'q4').map((q) => q.id)).toEqual(['q1', 'q3'])
  })

  it('considers the whole list when no id is given', () => {
    expect(conditionSources(qs as any).map((q) => q.id)).toEqual(['q1', 'q3', 'q4'])
  })

  it('lists single-choice questions for pricing axes', () => {
    expect(singleChoiceQuestions(qs as any).map((q) => q.id)).toEqual(['q1', 'q4'])
  })
})

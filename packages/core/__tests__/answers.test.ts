import { resolveAnswer, resolveAllAnswers } from '../src/answers'
import type { Question, RegistrationForm } from '../src/types'

describe('resolveAnswer', () => {
  test('returns null for empty values', () => {
    const q: Question = { id: 'q1', type: 'short_text', label: 'Q1' }
    expect(resolveAnswer(q, undefined)).toBeNull()
    expect(resolveAnswer(q, null)).toBeNull()
    expect(resolveAnswer(q, '')).toBeNull()
  })

  test('returns string for text types', () => {
    const q: Question = { id: 'q1', type: 'short_text', label: 'Q1' }
    expect(resolveAnswer(q, 'hello')).toBe('hello')
  })

  test('resolves single_choice to label', () => {
    const q: Question = {
      id: 'q1',
      type: 'single_choice',
      label: 'Q1',
      options: [{ id: 'a', label: 'Option A' }, { id: 'b', label: 'Option B' }],
    }
    expect(resolveAnswer(q, 'a')).toBe('Option A')
    expect(resolveAnswer(q, 'unknown')).toBe('unknown')
  })

  test('resolves multi_choice to joined labels', () => {
    const q: Question = {
      id: 'q1',
      type: 'multi_choice',
      label: 'Q1',
      options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }],
    }
    expect(resolveAnswer(q, ['a', 'c'])).toBe('A, C')
    expect(resolveAnswer(q, [])).toBeNull()
  })

  test('resolves quantity_choice to labeled quantities', () => {
    const q: Question = {
      id: 'q1',
      type: 'quantity_choice',
      label: 'Q1',
      options: [{ id: 'sat', label: 'Saturday' }, { id: 'sun', label: 'Sunday' }],
    }
    expect(resolveAnswer(q, { sat: 2, sun: 0 })).toBe('Saturday x2')
    expect(resolveAnswer(q, { sat: 0 })).toBeNull()
  })
})

describe('resolveAllAnswers', () => {
  test('resolves visible questions with answers', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [
          { id: 'name', type: 'short_text', label: 'Name' },
          {
            id: 'details',
            type: 'short_text',
            label: 'Details',
            visible_if: { eq: ['show', 'yes'] },
          },
        ],
      }],
    }
    const resolved = resolveAllAnswers(form, { name: 'Alice', details: 'hidden', show: 'no' })
    expect(resolved).toHaveLength(1)
    expect(resolved[0]).toEqual({ questionId: 'name', label: 'Name', value: 'Alice' })
  })
})

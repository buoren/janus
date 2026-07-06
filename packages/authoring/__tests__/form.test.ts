import type { Question, RegistrationForm } from '@janus/core'
import { toFlatForm, toRegistrationForm } from '../src/form'

const q1: Question = { id: 'q_a', type: 'short_text', label: 'A' }
const q2: Question = { id: 'q_b', type: 'number', label: 'B' }

describe('toRegistrationForm / toFlatForm', () => {
  it('wraps a flat form into a single page', () => {
    const form = toRegistrationForm({ currency: 'EUR', decimals: 2, questions: [q1, q2] })
    expect(form.pages).toHaveLength(1)
    expect(form.pages[0].questions).toEqual([q1, q2])
    expect(form.price_rules).toBeUndefined()
  })

  it('carries price_rules through', () => {
    const pr = [{ description: 'x', rule: 5 as const }]
    const form = toRegistrationForm({ currency: 'EUR', decimals: 2, questions: [q1], price_rules: pr })
    expect(form.price_rules).toEqual(pr)
  })

  it('round-trips through toFlatForm (flattening all pages)', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [
        { id: 'p1', title: 'One', questions: [q1] },
        { id: 'p2', title: 'Two', questions: [q2] },
      ],
    }
    const flat = toFlatForm(form)
    expect(flat.questions).toEqual([q1, q2])
    expect(toRegistrationForm(flat).pages[0].questions).toEqual([q1, q2])
  })
})

import type { Question } from '@janus/core'
import { calculatePaymentDetails } from '@janus/core'
import { compileGridRule } from '../src/pricing'
import { toRegistrationForm } from '../src/form'

const ticket: Question = {
  id: 'q_ticket',
  type: 'single_choice',
  label: 'Ticket',
  options: [
    { id: 'weekend', label: 'Weekend' },
    { id: 'day', label: 'Day' },
  ],
}
const age: Question = {
  id: 'q_age',
  type: 'single_choice',
  label: 'Age',
  options: [
    { id: 'adult', label: 'Adult' },
    { id: 'child', label: 'Child' },
  ],
}

describe('compileGridRule', () => {
  it('compiles a two-axis grid into nested switches', () => {
    const rule = compileGridRule(
      {
        description: 'Festival ticket',
        fieldA: 'q_ticket',
        fieldB: 'q_age',
        cells: { 'weekend|adult': 19500, 'weekend|child': 10000, 'day|adult': 10000 },
      },
      [ticket, age],
    )
    expect(rule).toEqual({
      description: 'Festival ticket',
      rule: {
        switch: {
          field: 'q_ticket',
          default: 0,
          cases: {
            weekend: { switch: { field: 'q_age', default: 0, cases: { adult: 19500, child: 10000 } } },
            day: { switch: { field: 'q_age', default: 0, cases: { adult: 10000 } } },
          },
        },
      },
    })
  })

  it('compiles a single-axis grid', () => {
    const rule = compileGridRule(
      { description: 'Ticket', fieldA: 'q_ticket', cells: { weekend: 19500, day: 10000 } },
      [ticket],
    )
    expect(rule!.rule).toEqual({ switch: { field: 'q_ticket', default: 0, cases: { weekend: 19500, day: 10000 } } })
  })

  it('returns null when the row field is unknown', () => {
    expect(compileGridRule({ description: 'x', fieldA: 'nope', cells: {} }, [ticket])).toBeNull()
  })

  it('produces a rule the core engine actually prices', () => {
    // The compiled rule + a single page = a valid form that @janus/core evaluates.
    const compiled = compileGridRule(
      { description: 'Festival ticket', fieldA: 'q_ticket', fieldB: 'q_age', cells: { 'weekend|adult': 19500 } },
      [ticket, age],
    )!
    const form = toRegistrationForm({ currency: 'EUR', decimals: 2, questions: [ticket, age], price_rules: [compiled] })
    const pay = calculatePaymentDetails(form, { q_ticket: 'weekend', q_age: 'adult' })
    expect(pay.total).toBe(19500)
  })
})

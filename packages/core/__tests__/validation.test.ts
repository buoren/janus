import { validatePage, validateAnswers } from '../src/validation'
import type { RegistrationForm } from '../src/types'

// ---------------------------------------------------------------------------
// validateAnswers — option-level visible_if
// ---------------------------------------------------------------------------

describe('validation with option visibility', () => {
  test('hidden option rejects selection', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [{
          id: 'ticket',
          type: 'single_choice',
          label: 'Ticket',
          required: true,
          options: [
            { id: 'early', label: 'Early', visible_if: { before: '2020-01-01' } },
            { id: 'normal', label: 'Normal' },
          ],
        }],
      }],
    }
    const errors = validateAnswers(form, { ticket: 'early' })
    expect(errors.some((e) => e.message.includes('Invalid option'))).toBe(true)

    const errors2 = validateAnswers(form, { ticket: 'normal' })
    expect(errors2).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// validateAnswers — multi_choice with hidden options
// ---------------------------------------------------------------------------

describe('validation multi_choice hidden options', () => {
  test('rejects selecting hidden option', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [{
          id: 'addons',
          type: 'multi_choice',
          label: 'Add-ons',
          options: [
            { id: 'early_bonus', label: 'Early Bonus', visible_if: { before: '2020-01-01' } },
            { id: 'tshirt', label: 'T-shirt' },
            { id: 'lunch', label: 'Lunch' },
          ],
        }],
      }],
    }
    const errors = validateAnswers(form, { addons: ['early_bonus', 'tshirt'] })
    expect(errors.some((e) => e.message.includes('Invalid option') && e.message.includes('early_bonus'))).toBe(true)

    expect(validateAnswers(form, { addons: ['tshirt', 'lunch'] })).toHaveLength(0)
  })

  test('hidden question skips required validation', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [
          {
            id: 'level',
            type: 'single_choice',
            label: 'Level',
            options: [{ id: 'beg', label: 'Beginner' }, { id: 'adv', label: 'Advanced' }],
          },
          {
            id: 'adv_details',
            type: 'short_text',
            label: 'Advanced Details',
            required: true,
            visible_if: { eq: ['level', 'adv'] },
          },
        ],
      }],
    }
    expect(validateAnswers(form, { level: 'beg' })).toHaveLength(0)
    const errors = validateAnswers(form, { level: 'adv' })
    expect(errors.some((e) => e.message.includes('Advanced Details'))).toBe(true)
  })

  test('no form returns validation error', () => {
    expect(validateAnswers(null, {})).toHaveLength(1)
    expect(validateAnswers({} as any, {})).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// quantity_choice validation
// ---------------------------------------------------------------------------

describe('quantity_choice validation', () => {
  function makeForm(required = true, maxQuantity?: number): RegistrationForm {
    const opts: any[] = [
      { id: 'sat', label: 'Saturday', price: 2000 },
      { id: 'sun', label: 'Sunday', price: 2000 },
    ]
    if (maxQuantity != null) {
      for (const o of opts) o.max_quantity = maxQuantity
    }
    return {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [{ id: 'tickets', type: 'quantity_choice', label: 'Tickets', required, options: opts }],
      }],
    }
  }

  test('required empty dict is unanswered', () => {
    const errors = validateAnswers(makeForm(), { tickets: {} })
    expect(errors.some((e) => e.message.includes('not answered'))).toBe(true)
  })

  test('required all zero is unanswered', () => {
    const errors = validateAnswers(makeForm(), { tickets: { sat: 0, sun: 0 } })
    expect(errors.some((e) => e.message.includes('not answered'))).toBe(true)
  })

  test('required with quantity is valid', () => {
    expect(validateAnswers(makeForm(), { tickets: { sat: 2 } })).toHaveLength(0)
  })

  test('invalid option id rejected', () => {
    const errors = validateAnswers(makeForm(), { tickets: { invalid_id: 1 } })
    expect(errors.some((e) => e.message.includes('Invalid option'))).toBe(true)
  })

  test('negative quantity rejected', () => {
    const errors = validateAnswers(makeForm(), { tickets: { sat: -1 } })
    expect(errors.some((e) => e.message.includes('Invalid quantity'))).toBe(true)
  })

  test('max quantity exceeded', () => {
    const errors = validateAnswers(makeForm(true, 5), { tickets: { sat: 6 } })
    expect(errors.some((e) => e.message.includes('exceeds maximum'))).toBe(true)
  })

  test('max quantity respected', () => {
    expect(validateAnswers(makeForm(true, 5), { tickets: { sat: 5 } })).toHaveLength(0)
  })

  test('not required empty is valid', () => {
    expect(validateAnswers(makeForm(false), { tickets: {} })).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// min_quantity validation
// ---------------------------------------------------------------------------

describe('min_quantity validation', () => {
  function makeForm(): RegistrationForm {
    return {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [{
          id: 'age_category',
          type: 'quantity_choice',
          label: 'Age category',
          required: true,
          options: [
            { id: 'adult', label: 'Adult (18+)', min_quantity: 1, max_quantity: 1 },
            { id: 'child', label: 'Child (6-11)' },
            { id: 'infant', label: 'Infant (0-1)' },
          ],
        }],
      }],
    }
  }

  test('min quantity met is valid', () => {
    expect(validateAnswers(makeForm(), { age_category: { adult: 1 } })).toHaveLength(0)
  })

  test('min quantity not met is invalid', () => {
    const errors = validateAnswers(makeForm(), { age_category: { child: 2 } })
    expect(errors.some((e) => e.message.includes('at least 1'))).toBe(true)
  })

  test('min quantity zero is invalid', () => {
    const errors = validateAnswers(makeForm(), { age_category: { adult: 0, child: 1 } })
    expect(errors.some((e) => e.message.includes('at least 1'))).toBe(true)
  })

  test('min quantity with max respected', () => {
    expect(validateAnswers(makeForm(), { age_category: { adult: 1, child: 3 } })).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// validatePage
// ---------------------------------------------------------------------------

describe('validatePage', () => {
  const form: RegistrationForm = {
    currency: 'EUR',
    decimals: 2,
    pages: [
      {
        id: 'p1',
        title: 'Page 1',
        questions: [
          { id: 'name', type: 'short_text', label: 'Name', required: true },
          { id: 'note', type: 'long_text', label: 'Note' },
        ],
      },
      {
        id: 'p2',
        title: 'Page 2',
        questions: [
          { id: 'ticket', type: 'single_choice', label: 'Ticket', required: true, options: [{ id: 'full', label: 'Full' }] },
        ],
      },
    ],
  }

  test('returns error for required unanswered field', () => {
    const errors = validatePage(form, 0, {})
    expect(errors).toHaveProperty('name')
    expect(errors.name).toContain('required')
  })

  test('returns empty when required field answered', () => {
    expect(validatePage(form, 0, { name: 'Alice' })).toEqual({})
  })

  test('skips non-required fields', () => {
    const errors = validatePage(form, 0, { name: 'Alice' })
    expect(errors).not.toHaveProperty('note')
  })

  test('validates only the specified page', () => {
    // Page 0 with name answered, but ticket (page 1) missing — should pass
    expect(validatePage(form, 0, { name: 'Alice' })).toEqual({})
  })

  test('returns empty for out-of-range page', () => {
    expect(validatePage(form, 99, {})).toEqual({})
  })
})

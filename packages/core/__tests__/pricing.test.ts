import { evaluatePriceRule, calculatePaymentDetails } from '../src/pricing'
import type { RegistrationForm } from '../src/types'

// ---------------------------------------------------------------------------
// evaluatePriceRule — nested switch
// ---------------------------------------------------------------------------

describe('nested switch price rule', () => {
  test('flat switch returns matching case value', () => {
    const rule = { switch: { field: 'ticket', cases: { full: 10000, half: 5000 }, default: 0 } }
    expect(evaluatePriceRule(rule, { ticket: 'full' })).toBe(10000)
    expect(evaluatePriceRule(rule, { ticket: 'half' })).toBe(5000)
  })

  test('nested switch resolves both levels', () => {
    const rule = {
      switch: {
        field: 'ticket',
        cases: {
          full: {
            switch: { field: 'age', cases: { adult: 19500, child: 10000 }, default: 19500 },
          },
          half: {
            switch: { field: 'age', cases: { adult: 11500, child: 7000 }, default: 11500 },
          },
        },
        default: 0,
      },
    }
    expect(evaluatePriceRule(rule, { ticket: 'full', age: 'adult' })).toBe(19500)
    expect(evaluatePriceRule(rule, { ticket: 'full', age: 'child' })).toBe(10000)
    expect(evaluatePriceRule(rule, { ticket: 'half', age: 'adult' })).toBe(11500)
    expect(evaluatePriceRule(rule, { ticket: 'half', age: 'child' })).toBe(7000)
    // Missing age falls back to default
    expect(evaluatePriceRule(rule, { ticket: 'full' })).toBe(19500)
    // Missing ticket falls back to outer default
    expect(evaluatePriceRule(rule, { age: 'adult' })).toBe(0)
  })

  test('nested default evaluates as rule', () => {
    const rule = {
      switch: {
        field: 'ticket',
        cases: {},
        default: { switch: { field: 'age', cases: { adult: 100 }, default: 50 } },
      },
    }
    expect(evaluatePriceRule(rule, { age: 'adult' })).toBe(100)
    expect(evaluatePriceRule(rule, { age: 'child' })).toBe(50)
  })
})

// ---------------------------------------------------------------------------
// evaluatePriceRule — count_tier
// ---------------------------------------------------------------------------

describe('count_tier price rule', () => {
  test('returns price for matching tier (tuple format)', () => {
    const rule = {
      count_tier: { field: 'workshops', tiers: [[1, 1000], [3, 2500], [5, 4000]] as [number, number][] },
    }
    expect(evaluatePriceRule(rule, { workshops: [] })).toBe(0)
    expect(evaluatePriceRule(rule, { workshops: ['a'] })).toBe(1000)
    expect(evaluatePriceRule(rule, { workshops: ['a', 'b'] })).toBe(1000)
    expect(evaluatePriceRule(rule, { workshops: ['a', 'b', 'c'] })).toBe(2500)
    expect(evaluatePriceRule(rule, { workshops: ['a', 'b', 'c', 'd', 'e'] })).toBe(4000)
  })

  test('returns price for matching tier (object format)', () => {
    const rule = {
      count_tier: {
        field: 'workshops',
        tiers: [
          { min_count: 1, price: 1000 },
          { min_count: 3, price: 2500 },
          { min_count: 5, price: 4000 },
        ],
      },
    }
    expect(evaluatePriceRule(rule, { workshops: [] })).toBe(0)
    expect(evaluatePriceRule(rule, { workshops: ['a'] })).toBe(1000)
    expect(evaluatePriceRule(rule, { workshops: ['a', 'b', 'c'] })).toBe(2500)
    expect(evaluatePriceRule(rule, { workshops: ['a', 'b', 'c', 'd', 'e'] })).toBe(4000)
  })

  test('returns zero when field missing', () => {
    const rule = { count_tier: { field: 'workshops', tiers: [[1, 500] as [number, number]] } }
    expect(evaluatePriceRule(rule, {})).toBe(0)
  })

  test('returns zero when field is not list', () => {
    const rule = { count_tier: { field: 'workshops', tiers: [[1, 500] as [number, number]] } }
    expect(evaluatePriceRule(rule, { workshops: 'not-a-list' })).toBe(0)
  })

  test('returns zero when tiers empty', () => {
    const rule = { count_tier: { field: 'workshops', tiers: [] } }
    expect(evaluatePriceRule(rule, { workshops: ['a', 'b'] })).toBe(0)
  })

  test('sums quantities from dict (quantity_choice)', () => {
    const rule = {
      count_tier: { field: 'tickets', tiers: [[1, 1000], [5, 4000]] as [number, number][] },
    }
    expect(evaluatePriceRule(rule, { tickets: { sat: 2, sun: 2 } })).toBe(1000)
    expect(evaluatePriceRule(rule, { tickets: { sat: 3, sun: 3 } })).toBe(4000)
    expect(evaluatePriceRule(rule, { tickets: { sat: 0 } })).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// evaluatePriceRule — per_quantity
// ---------------------------------------------------------------------------

describe('per_quantity price rule', () => {
  test('multiplies unit price by qty', () => {
    const rule = {
      per_quantity: { field: 'age_category', prices: { adult: 19500, child: 10000 } },
    }
    expect(evaluatePriceRule(rule, { age_category: { adult: 1, child: 2 } })).toBe(19500 + 20000)
  })

  test('with nested switch', () => {
    const rule = {
      per_quantity: {
        field: 'age_category',
        prices: {
          adult: { switch: { field: 'ticket_type', cases: { full: 19500, half: 11500 }, default: 0 } },
          child: { switch: { field: 'ticket_type', cases: { full: 10000, half: 7000 }, default: 0 } },
        },
      },
    }
    expect(evaluatePriceRule(rule, { ticket_type: 'full', age_category: { adult: 1, child: 3 } })).toBe(19500 + 30000)
    expect(evaluatePriceRule(rule, { ticket_type: 'half', age_category: { adult: 1, child: 2 } })).toBe(11500 + 14000)
  })

  test('zero qty excluded', () => {
    const rule = { per_quantity: { field: 'tickets', prices: { sat: 2000, sun: 1500 } } }
    expect(evaluatePriceRule(rule, { tickets: { sat: 0, sun: 2 } })).toBe(3000)
  })

  test('missing field returns zero', () => {
    const rule = { per_quantity: { field: 'tickets', prices: { sat: 2000 } } }
    expect(evaluatePriceRule(rule, {})).toBe(0)
  })

  test('non-dict field returns zero', () => {
    const rule = { per_quantity: { field: 'tickets', prices: { sat: 2000 } } }
    expect(evaluatePriceRule(rule, { tickets: 'sat' })).toBe(0)
  })

  test('unknown option ignored', () => {
    const rule = { per_quantity: { field: 'tickets', prices: { sat: 2000 } } }
    expect(evaluatePriceRule(rule, { tickets: { sun: 1 } })).toBe(0)
  })

  test('free option', () => {
    const rule = {
      per_quantity: { field: 'age_category', prices: { adult: 19500, infant: 0 } },
    }
    expect(evaluatePriceRule(rule, { age_category: { adult: 1, infant: 2 } })).toBe(19500)
  })
})

// ---------------------------------------------------------------------------
// evaluatePriceRule — literal values
// ---------------------------------------------------------------------------

describe('literal price rule', () => {
  test('literal int returns value', () => {
    expect(evaluatePriceRule(5000, {})).toBe(5000)
  })

  test('unknown rule returns zero', () => {
    expect(evaluatePriceRule({ unknown_type: {} } as any, {})).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// calculatePaymentDetails
// ---------------------------------------------------------------------------

describe('calculatePaymentDetails', () => {
  test('hidden option price not included in total', () => {
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
          options: [
            { id: 'early', label: 'Early', price: 17500, visible_if: { before: '2020-01-01' } },
            { id: 'normal', label: 'Normal', price: 19500 },
          ],
        }],
      }],
    }
    expect(calculatePaymentDetails(form, { ticket: 'early' }).total).toBe(0)
    expect(calculatePaymentDetails(form, { ticket: 'normal' }).total).toBe(19500)
  })

  test('nested switch calculates correct payment total', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [
          { id: 'age', type: 'single_choice', label: 'Age', options: [{ id: 'adult', label: 'Adult' }, { id: 'child', label: 'Child' }] },
          { id: 'ticket', type: 'single_choice', label: 'Ticket', options: [{ id: 'full', label: 'Full' }] },
        ],
      }],
      price_rules: [{
        description: 'Ticket price',
        rule: {
          switch: {
            field: 'ticket',
            cases: {
              full: { switch: { field: 'age', cases: { adult: 19500, child: 10000 }, default: 19500 } },
            },
            default: 0,
          },
        },
      }],
    }
    const result = calculatePaymentDetails(form, { ticket: 'full', age: 'child' })
    expect(result.total).toBe(10000)
    expect(result.lines[0].description).toBe('Ticket price')
    expect(result.lines[0].price).toBe(10000)
  })

  test('count_tier generates correct line and total', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [{
          id: 'workshops',
          type: 'multi_choice',
          label: 'Workshops',
          options: [{ id: 'w1', label: 'Workshop 1' }, { id: 'w2', label: 'Workshop 2' }, { id: 'w3', label: 'Workshop 3' }],
        }],
      }],
      price_rules: [{
        description: 'Workshop bundle',
        rule: { count_tier: { field: 'workshops', tiers: [[1, 1000], [3, 2500]] } },
      }],
    }
    expect(calculatePaymentDetails(form, { workshops: [] }).total).toBe(0)

    const r2 = calculatePaymentDetails(form, { workshops: ['w1', 'w2'] })
    expect(r2.total).toBe(1000)
    expect(r2.lines[0].description).toBe('Workshop bundle')

    expect(calculatePaymentDetails(form, { workshops: ['w1', 'w2', 'w3'] }).total).toBe(2500)
  })

  test('multi_choice sums selected option prices', () => {
    const form: RegistrationForm = {
      currency: 'USD',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [{
          id: 'addons',
          type: 'multi_choice',
          label: 'Add-ons',
          options: [
            { id: 'tshirt', label: 'T-shirt', price: 2500 },
            { id: 'lunch', label: 'Lunch', price: 3000 },
            { id: 'sticker', label: 'Sticker' },
          ],
        }],
      }],
    }
    const result = calculatePaymentDetails(form, { addons: ['tshirt', 'lunch'] })
    expect(result.total).toBe(5500)
    expect(result.lines).toHaveLength(2)
    expect(result.currency).toBe('USD')
  })

  test('hidden question prices excluded', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [
          { id: 'level', type: 'single_choice', label: 'Level', options: [{ id: 'beg', label: 'Beginner' }] },
          {
            id: 'extras',
            type: 'single_choice',
            label: 'Extras',
            visible_if: { eq: ['level', 'adv'] },
            options: [{ id: 'vip', label: 'VIP', price: 5000 }],
          },
        ],
      }],
    }
    expect(calculatePaymentDetails(form, { level: 'beg', extras: 'vip' }).total).toBe(0)
  })

  test('defaults to EUR and two decimals', () => {
    const form = { pages: [] } as any as RegistrationForm
    const result = calculatePaymentDetails(form, {})
    expect(result.currency).toBe('EUR')
    expect(result.decimals).toBe(2)
    expect(result.total).toBe(0)
    expect(result.lines).toEqual([])
  })

  test('quantity_choice multiplies price by quantity', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [{
          id: 'tickets',
          type: 'quantity_choice',
          label: 'Tickets',
          options: [
            { id: 'sat', label: 'Saturday', price: 2000 },
            { id: 'sun', label: 'Sunday', price: 1500 },
          ],
        }],
      }],
    }
    const result = calculatePaymentDetails(form, { tickets: { sat: 3, sun: 2 } })
    expect(result.total).toBe(3 * 2000 + 2 * 1500)
    expect(result.lines).toHaveLength(2)
    expect(result.lines[0].description).toBe('Saturday x3')
    expect(result.lines[0].price).toBe(6000)
    expect(result.lines[1].description).toBe('Sunday x2')
    expect(result.lines[1].price).toBe(3000)
  })

  test('zero quantity generates no line', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [{
          id: 'tickets',
          type: 'quantity_choice',
          label: 'Tickets',
          options: [{ id: 'sat', label: 'Saturday', price: 2000 }],
        }],
      }],
    }
    const result = calculatePaymentDetails(form, { tickets: { sat: 0 } })
    expect(result.total).toBe(0)
    expect(result.lines).toHaveLength(0)
  })
})

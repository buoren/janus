import type { DecisionRule, FormPage, RegistrationForm, Question } from '../src/types'
import { evaluateDecisionRules, evaluateDecisionResults, isPageGated, isPageVisible } from '../src/decision'
import { visiblePages } from '../src/visibility'
import { calculatePaymentDetails } from '../src/pricing'
import { validateAnswers, validatePage } from '../src/validation'
import { resolveAllAnswers, applyPreviousAnswers } from '../src/answers'

const makeRule = (overrides?: Partial<DecisionRule>): DecisionRule => ({
  description: 'Test rule',
  branches: [
    { condition: { eq: ['reg_type', 'individual'] }, pages: ['personal_info', 'individual_prefs'] },
    { condition: { eq: ['reg_type', 'team'] }, pages: ['team_info', 'team_members'] },
  ],
  ...overrides,
})

const makePage = (id: string, questions: RegistrationForm['pages'][0]['questions'] = []): FormPage => ({
  id,
  title: id,
  questions,
})

describe('evaluateDecisionRules', () => {
  it('returns matching branch page IDs', () => {
    const rules = [makeRule()]
    const result = evaluateDecisionRules(rules, { reg_type: 'individual' })
    expect(result).toEqual(new Set(['personal_info', 'individual_prefs']))
  })

  it('returns empty set when no branch matches and no default', () => {
    const rules = [makeRule()]
    const result = evaluateDecisionRules(rules, { reg_type: 'sponsor' })
    expect(result).toEqual(new Set())
  })

  it('uses default when no branch matches', () => {
    const rules = [makeRule({ default: ['fallback_page'] })]
    const result = evaluateDecisionRules(rules, { reg_type: 'sponsor' })
    expect(result).toEqual(new Set(['fallback_page']))
  })

  it('uses default when field is unanswered', () => {
    const rules = [makeRule({ default: ['fallback_page'] })]
    const result = evaluateDecisionRules(rules, {})
    expect(result).toEqual(new Set(['fallback_page']))
  })

  it('merges page IDs from multiple rules', () => {
    const rules = [
      makeRule(),
      {
        description: 'Second rule',
        branches: [{ condition: { eq: ['tier', 'vip'] as [string, string] }, pages: ['vip_page'] }],
      },
    ]
    const result = evaluateDecisionRules(rules, { reg_type: 'individual', tier: 'vip' })
    expect(result).toEqual(new Set(['personal_info', 'individual_prefs', 'vip_page']))
  })

  it('collects pages from multiple matching branches', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Multi-match',
        branches: [
          { condition: { has_any: 'extras' }, pages: ['extras_page'] },
          { condition: { eq: ['reg_type', 'team'] }, pages: ['team_info'] },
        ],
      },
    ]
    const result = evaluateDecisionRules(rules, { extras: ['a'], reg_type: 'team' })
    expect(result).toEqual(new Set(['extras_page', 'team_info']))
  })
})

describe('evaluateDecisionRules with has_any/has_none conditions', () => {
  it('has_any branch matches when answer has items', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Extras routing',
        branches: [{ condition: { has_any: 'extras' }, pages: ['extras_page'] }],
        default: ['no_extras_page'],
      },
    ]
    const result = evaluateDecisionRules(rules, { extras: ['shirt', 'hat'] })
    expect(result).toEqual(new Set(['extras_page']))
  })

  it('has_none branch matches when answer is empty', () => {
    const rules: DecisionRule[] = [
      {
        description: 'No extras',
        branches: [{ condition: { has_none: 'extras' }, pages: ['simple_page'] }],
      },
    ]
    const result = evaluateDecisionRules(rules, { extras: [] })
    expect(result).toEqual(new Set(['simple_page']))
  })
})

describe('evaluateDecisionRules with less_than/greater_than conditions', () => {
  it('greater_than matches when value exceeds threshold', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Large group',
        branches: [{ condition: { greater_than: ['group_size', 10] }, pages: ['large_group_info'] }],
        default: ['small_group_info'],
      },
    ]
    expect(evaluateDecisionRules(rules, { group_size: 15 })).toEqual(new Set(['large_group_info']))
  })

  it('greater_than uses default when value is at threshold', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Large group',
        branches: [{ condition: { greater_than: ['group_size', 10] }, pages: ['large_group_info'] }],
        default: ['small_group_info'],
      },
    ]
    expect(evaluateDecisionRules(rules, { group_size: 10 })).toEqual(new Set(['small_group_info']))
  })

  it('less_than matches when value is below threshold', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Discount',
        branches: [{ condition: { less_than: ['age', 18] }, pages: ['youth_page'] }],
        default: ['adult_page'],
      },
    ]
    expect(evaluateDecisionRules(rules, { age: 15 })).toEqual(new Set(['youth_page']))
  })

  it('less_than uses default when value is at threshold', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Discount',
        branches: [{ condition: { less_than: ['age', 18] }, pages: ['youth_page'] }],
        default: ['adult_page'],
      },
    ]
    expect(evaluateDecisionRules(rules, { age: 18 })).toEqual(new Set(['adult_page']))
  })
})

describe('evaluateDecisionRules with mixed condition types', () => {
  it('combines eq, greater_than, and has_any in one rule', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Registration routing',
        branches: [
          { condition: { eq: ['reg_type', 'individual'] }, pages: ['personal_info'] },
          { condition: { eq: ['reg_type', 'team'] }, pages: ['team_info', 'team_members'] },
          { condition: { greater_than: ['group_size', 10] }, pages: ['large_group_info'] },
        ],
        default: ['fallback_page'],
      },
    ]
    // team with large group — both branches match
    const result = evaluateDecisionRules(rules, { reg_type: 'team', group_size: 20 })
    expect(result).toEqual(new Set(['team_info', 'team_members', 'large_group_info']))
  })
})

describe('evaluateDecisionResults', () => {
  it('single branch match returns its result', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Routing',
        branches: [
          {
            condition: { eq: ['reg_type', 'individual'] },
            pages: ['personal_info'],
            result: { registration_type: 'individual' },
          },
          {
            condition: { eq: ['reg_type', 'team'] },
            pages: ['team_info'],
            result: { registration_type: 'team' },
          },
        ],
      },
    ]
    expect(evaluateDecisionResults(rules, { reg_type: 'team' })).toEqual({
      values: { registration_type: 'team' },
      result_types: [],
    })
  })

  it('multiple matching branches merge results', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Routing',
        branches: [
          {
            condition: { eq: ['reg_type', 'team'] },
            pages: ['team_info'],
            result: { registration_type: 'team' },
          },
          {
            condition: { greater_than: ['group_size', 10] },
            pages: ['large_group_info'],
            result: { size_category: 'large' },
          },
        ],
      },
    ]
    expect(evaluateDecisionResults(rules, { reg_type: 'team', group_size: 20 })).toEqual({
      values: { registration_type: 'team', size_category: 'large' },
      result_types: [],
    })
  })

  it('branch without result field is skipped', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Routing',
        branches: [
          { condition: { eq: ['reg_type', 'team'] }, pages: ['team_info'] },
        ],
      },
    ]
    expect(evaluateDecisionResults(rules, { reg_type: 'team' })).toEqual({
      values: {},
      result_types: [],
    })
  })

  it('no matching branches returns empty object', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Routing',
        branches: [
          {
            condition: { eq: ['reg_type', 'team'] },
            pages: ['team_info'],
            result: { registration_type: 'team' },
          },
        ],
      },
    ]
    expect(evaluateDecisionResults(rules, { reg_type: 'individual' })).toEqual({
      values: {},
      result_types: [],
    })
  })

  it('key conflict: later branch wins', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Rule 1',
        branches: [
          {
            condition: { has_any: 'extras' },
            pages: ['extras_page'],
            result: { tier: 'basic' },
          },
        ],
      },
      {
        description: 'Rule 2',
        branches: [
          {
            condition: { eq: ['reg_type', 'team'] },
            pages: ['team_info'],
            result: { tier: 'premium' },
          },
        ],
      },
    ]
    expect(evaluateDecisionResults(rules, { extras: ['a'], reg_type: 'team' })).toEqual({
      values: { tier: 'premium' },
      result_types: [],
    })
  })

  it('includes result_type from rules with matching branches', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Routing',
        result_type: 'show_answers',
        branches: [
          {
            condition: { eq: ['reg_type', 'team'] },
            pages: ['team_info'],
            result: { registration_type: 'team' },
          },
        ],
      },
    ]
    expect(evaluateDecisionResults(rules, { reg_type: 'team' })).toEqual({
      values: { registration_type: 'team' },
      result_types: ['show_answers'],
    })
  })

  it('does not include result_type when no branches match', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Routing',
        result_type: 'show_answers',
        branches: [
          {
            condition: { eq: ['reg_type', 'team'] },
            pages: ['team_info'],
            result: { registration_type: 'team' },
          },
        ],
      },
    ]
    expect(evaluateDecisionResults(rules, { reg_type: 'individual' })).toEqual({
      values: {},
      result_types: [],
    })
  })

  it('collects result_types from multiple matched rules', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Rule 1',
        result_type: 'show_answers',
        branches: [
          { condition: { eq: ['reg_type', 'team'] }, pages: ['team_info'] },
        ],
      },
      {
        description: 'Rule 2',
        result_type: 'perform_action',
        branches: [
          { condition: { has_any: 'extras' }, pages: ['extras_page'] },
        ],
      },
    ]
    expect(evaluateDecisionResults(rules, { reg_type: 'team', extras: ['a'] })).toEqual({
      values: {},
      result_types: ['show_answers', 'perform_action'],
    })
  })
})

describe('isPageGated', () => {
  it('returns true for pages in branches', () => {
    expect(isPageGated('personal_info', [makeRule()])).toBe(true)
    expect(isPageGated('team_info', [makeRule()])).toBe(true)
  })

  it('returns true for pages in default', () => {
    expect(isPageGated('fallback_page', [makeRule({ default: ['fallback_page'] })])).toBe(true)
  })

  it('returns false for pages not in any rule', () => {
    expect(isPageGated('welcome', [makeRule()])).toBe(false)
  })
})

describe('isPageVisible', () => {
  const rules = [makeRule()]

  it('ungated pages are always visible', () => {
    const page = makePage('welcome')
    expect(isPageVisible(page, rules, { reg_type: 'individual' })).toBe(true)
    expect(isPageVisible(page, rules, {})).toBe(true)
  })

  it('gated page visible when branch matches', () => {
    const page = makePage('personal_info')
    expect(isPageVisible(page, rules, { reg_type: 'individual' })).toBe(true)
  })

  it('gated page hidden when branch does not match', () => {
    const page = makePage('personal_info')
    expect(isPageVisible(page, rules, { reg_type: 'team' })).toBe(false)
  })

  it('gated page hidden when field is unanswered and no default', () => {
    const page = makePage('personal_info')
    expect(isPageVisible(page, rules, {})).toBe(false)
  })

  it('all pages visible when no rules', () => {
    const page = makePage('anything')
    expect(isPageVisible(page, [], {})).toBe(true)
  })

  it('page visible if any rule includes it', () => {
    const twoRules: DecisionRule[] = [
      makeRule(),
      {
        description: 'Second rule',
        branches: [{ condition: { eq: ['tier', 'vip'] }, pages: ['personal_info'] }],
      },
    ]
    const page = makePage('personal_info')
    // Not matched by first rule (team), but matched by second rule (vip)
    expect(isPageVisible(page, twoRules, { reg_type: 'team', tier: 'vip' })).toBe(true)
  })
})

describe('visiblePages', () => {
  it('returns all pages when no decision rules', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [makePage('a'), makePage('b')],
    }
    expect(visiblePages(form, {})).toHaveLength(2)
  })

  it('filters gated pages based on answers', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [makePage('welcome'), makePage('personal_info'), makePage('team_info')],
      decision_rules: [makeRule()],
    }
    const result = visiblePages(form, { reg_type: 'individual' })
    expect(result.map((p) => p.id)).toEqual(['welcome', 'personal_info'])
  })
})

describe('integration: pricing skips hidden pages', () => {
  it('does not charge for options on hidden pages', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [
        makePage('welcome', []),
        {
          id: 'personal_info',
          title: 'Personal Info',
          questions: [
            {
              id: 'shirt',
              type: 'single_choice',
              label: 'Shirt',
              options: [{ id: 's', label: 'Small', price: 1000 }],
            },
          ],
        },
        {
          id: 'team_info',
          title: 'Team Info',
          questions: [
            {
              id: 'banner',
              type: 'single_choice',
              label: 'Banner',
              options: [{ id: 'b', label: 'Banner', price: 5000 }],
            },
          ],
        },
      ],
      decision_rules: [makeRule()],
    }

    const answers = { reg_type: 'individual', shirt: 's', banner: 'b' }
    const details = calculatePaymentDetails(form, answers)
    // team_info page is hidden, so banner should not be charged
    expect(details.total).toBe(1000)
    expect(details.lines).toHaveLength(1)
    expect(details.lines[0].description).toBe('Small')
  })
})

describe('integration: validation skips hidden pages', () => {
  it('does not require answers on hidden pages', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [
        {
          id: 'personal_info',
          title: 'Personal Info',
          questions: [{ id: 'name', type: 'short_text', label: 'Name', required: true }],
        },
        {
          id: 'team_info',
          title: 'Team Info',
          questions: [{ id: 'team_name', type: 'short_text', label: 'Team Name', required: true }],
        },
      ],
      decision_rules: [makeRule()],
    }

    const errors = validateAnswers(form, { reg_type: 'individual', name: 'Alice' })
    // team_name is on a hidden page, so no error
    expect(errors).toEqual([])
  })

  it('validatePage returns no errors for hidden page', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [
        {
          id: 'personal_info',
          title: 'Personal Info',
          questions: [{ id: 'name', type: 'short_text', label: 'Name', required: true }],
        },
        {
          id: 'team_info',
          title: 'Team Info',
          questions: [{ id: 'team_name', type: 'short_text', label: 'Team Name', required: true }],
        },
      ],
      decision_rules: [makeRule()],
    }

    // Page index 1 is team_info, hidden for individual
    const errors = validatePage(form, 1, { reg_type: 'individual' })
    expect(errors).toEqual({})
  })
})

describe('integration: resolveAllAnswers skips hidden pages', () => {
  it('does not resolve answers on hidden pages', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [
        {
          id: 'personal_info',
          title: 'Personal Info',
          questions: [{ id: 'name', type: 'short_text', label: 'Name' }],
        },
        {
          id: 'team_info',
          title: 'Team Info',
          questions: [{ id: 'team_name', type: 'short_text', label: 'Team Name' }],
        },
      ],
      decision_rules: [makeRule()],
    }

    const resolved = resolveAllAnswers(form, { reg_type: 'individual', name: 'Alice', team_name: 'Hawks' })
    expect(resolved).toHaveLength(1)
    expect(resolved[0].questionId).toBe('name')
  })
})

// ---------------------------------------------------------------------------
// prev_* conditions in decision rules
// ---------------------------------------------------------------------------

describe('evaluateDecisionRules with prev_* conditions', () => {
  it('prev_increased routes to hospital page when pain increased', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Pain routing',
        branches: [
          { condition: { prev_increased: 'pain_level' }, pages: ['hospital_page'] },
        ],
        default: ['routine_page'],
      },
    ]
    const result = evaluateDecisionRules(rules, { pain_level: 8 }, { pain_level: 3 })
    expect(result).toEqual(new Set(['hospital_page']))
  })

  it('prev_increased falls to default when pain not increased', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Pain routing',
        branches: [
          { condition: { prev_increased: 'pain_level' }, pages: ['hospital_page'] },
        ],
        default: ['routine_page'],
      },
    ]
    const result = evaluateDecisionRules(rules, { pain_level: 3 }, { pain_level: 8 })
    expect(result).toEqual(new Set(['routine_page']))
  })

  it('prev_changed routes when value changed', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Status change',
        branches: [
          { condition: { prev_changed: 'medication' }, pages: ['review_page'] },
        ],
        default: ['skip_review'],
      },
    ]
    const result = evaluateDecisionRules(rules, { medication: 'B' }, { medication: 'A' })
    expect(result).toEqual(new Set(['review_page']))
  })

  it('prev_* conditions return false with no previousAnswers (backward compatible)', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Pain routing',
        branches: [
          { condition: { prev_increased: 'pain_level' }, pages: ['hospital_page'] },
        ],
        default: ['routine_page'],
      },
    ]
    const result = evaluateDecisionRules(rules, { pain_level: 8 })
    expect(result).toEqual(new Set(['routine_page']))
  })

  it('evaluateDecisionResults works with prev_changed_to', () => {
    const rules: DecisionRule[] = [
      {
        description: 'Critical alert',
        result_type: 'alert',
        branches: [
          {
            condition: { prev_changed_to: ['status', 'critical'] },
            pages: ['alert_page'],
            result: { alert_level: 'high' },
          },
        ],
      },
    ]
    const result = evaluateDecisionResults(rules, { status: 'critical' }, { status: 'normal' })
    expect(result).toEqual({
      values: { alert_level: 'high' },
      result_types: ['alert'],
    })
  })
})

// ---------------------------------------------------------------------------
// applyPreviousAnswers
// ---------------------------------------------------------------------------

describe('applyPreviousAnswers', () => {
  it('prefills answers for questions with previous_answer=prefill', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [
          { id: 'name', type: 'short_text', label: 'Name', previous_answer: 'prefill' },
          { id: 'email', type: 'short_text', label: 'Email' },
        ],
      }],
    }
    const prev = { name: 'Alice', email: 'alice@example.com' }
    const { prefilled, skippedQuestionIds } = applyPreviousAnswers(form, prev)
    expect(prefilled).toEqual({ name: 'Alice' })
    expect(skippedQuestionIds.size).toBe(0)
  })

  it('skips questions with previous_answer=skip', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [
          { id: 'name', type: 'short_text', label: 'Name', previous_answer: 'skip' },
          { id: 'age', type: 'number', label: 'Age', previous_answer: 'prefill' },
        ],
      }],
    }
    const prev = { name: 'Alice', age: 30 }
    const { prefilled, skippedQuestionIds } = applyPreviousAnswers(form, prev)
    expect(prefilled).toEqual({ name: 'Alice', age: 30 })
    expect(skippedQuestionIds).toEqual(new Set(['name']))
  })

  it('ignores questions without previous_answer field', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [
          { id: 'name', type: 'short_text', label: 'Name' },
        ],
      }],
    }
    const { prefilled, skippedQuestionIds } = applyPreviousAnswers(form, { name: 'Alice' })
    expect(prefilled).toEqual({})
    expect(skippedQuestionIds.size).toBe(0)
  })

  it('ignores questions where previousAnswers has no value', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [
          { id: 'name', type: 'short_text', label: 'Name', previous_answer: 'skip' },
        ],
      }],
    }
    const { prefilled, skippedQuestionIds } = applyPreviousAnswers(form, {})
    expect(prefilled).toEqual({})
    expect(skippedQuestionIds.size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// integration: validation skips skipped questions
// ---------------------------------------------------------------------------

describe('integration: validation skips skipped questions', () => {
  it('does not require answers for skipped questions', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [
          { id: 'name', type: 'short_text', label: 'Name', required: true, previous_answer: 'skip' },
          { id: 'email', type: 'short_text', label: 'Email', required: true },
        ],
      }],
    }
    const skipped = new Set(['name'])
    // name is skipped so only email should be validated
    const errors = validateAnswers(form, { name: 'Alice' }, undefined, undefined, skipped)
    expect(errors).toHaveLength(1)
    expect(errors[0].questionId).toBe('email')
  })

  it('validatePage skips skipped questions', () => {
    const form: RegistrationForm = {
      currency: 'EUR',
      decimals: 2,
      pages: [{
        id: 'p1',
        title: 'Page 1',
        questions: [
          { id: 'name', type: 'short_text', label: 'Name', required: true, previous_answer: 'skip' },
        ],
      }],
    }
    const skipped = new Set(['name'])
    const errors = validatePage(form, 0, {}, undefined, undefined, skipped)
    expect(errors).toEqual({})
  })
})

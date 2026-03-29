import type { Answers, CountTier, PaymentDetails, PriceRuleValue, RegistrationForm } from './types'
import { isQuestionVisible, visibleOptions, visiblePages } from './visibility'

/** Normalize count_tier entries to [count, price] tuples. */
function normalizeTier(tier: CountTier): [number, number] {
  if (Array.isArray(tier)) return tier
  return [tier.min_count, tier.price]
}

/**
 * Evaluate a price_rule and return the computed price (in smallest currency unit).
 *
 * Supports: plain number, switch, count_tier, per_quantity.
 * count_tier accepts both tuple format [[count, price], ...] and object format [{min_count, price}, ...].
 */
export function evaluatePriceRule(rule: PriceRuleValue, answers: Answers): number {
  if (typeof rule === 'number') return rule
  if (!rule || typeof rule !== 'object') return 0

  if ('switch' in rule) {
    const sw = rule.switch
    const fieldVal = answers[sw.field]
    const cases = sw.cases || {}
    if (fieldVal in cases) {
      const result = cases[fieldVal]
      return typeof result === 'object' ? evaluatePriceRule(result, answers) : Number(result)
    }
    const def = sw.default ?? 0
    return typeof def === 'object' ? evaluatePriceRule(def, answers) : Number(def)
  }

  if ('per_quantity' in rule) {
    const pq = rule.per_quantity
    const fieldVal = answers[pq.field]
    if (!fieldVal || typeof fieldVal !== 'object' || Array.isArray(fieldVal)) return 0
    const prices = pq.prices || {}
    let total = 0
    for (const [optId, qty] of Object.entries(fieldVal)) {
      if (typeof qty !== 'number' || qty <= 0) continue
      const unitRule = prices[optId]
      if (unitRule === undefined || unitRule === null) continue
      const unitPrice =
        typeof unitRule === 'object' ? evaluatePriceRule(unitRule, answers) : Number(unitRule)
      total += unitPrice * qty
    }
    return total
  }

  if ('count_tier' in rule) {
    const ct = rule.count_tier
    const fieldVal = answers[ct.field]
    const count: number =
      fieldVal && typeof fieldVal === 'object' && !Array.isArray(fieldVal)
        ? (Object.values(fieldVal).reduce((s: number, v: any) => s + (Number(v) || 0), 0) as number)
        : Array.isArray(fieldVal)
          ? fieldVal.length
          : 0
    const tiers = (ct.tiers || []).map(normalizeTier).sort((a, b) => a[0] - b[0])
    let price = 0
    for (const [tierCount, tierPrice] of tiers) {
      if (count >= tierCount) price = tierPrice
    }
    return price
  }

  return 0
}

/**
 * Calculate full payment details from form and answers.
 *
 * Sums prices from selected options (skipping hidden questions/options),
 * then evaluates price_rules for cross-field formulas.
 */
export function calculatePaymentDetails(
  form: RegistrationForm,
  answers: Answers,
  now?: string,
  previousAnswers?: Answers,
): PaymentDetails {
  const currency = form.currency ?? 'EUR'
  const decimals = form.decimals ?? 2
  const lines: PaymentDetails['lines'] = []
  let sortOrder = 0

  for (const page of visiblePages(form, answers, previousAnswers)) {
    for (const q of page.questions ?? []) {
      if (!isQuestionVisible(q, answers, now, previousAnswers)) continue

      const answer = answers[q.id]
      if (answer === undefined || answer === null) continue

      const opts = visibleOptions(q, answers, now, previousAnswers)
      const optsById = new Map(opts.map((o) => [o.id, o]))

      if (q.type === 'single_choice' && optsById.has(answer)) {
        const opt = optsById.get(answer)!
        if (opt.price != null) {
          sortOrder++
          lines.push({ description: opt.label, price: opt.price, sort_order: sortOrder })
        }
      } else if (q.type === 'multi_choice' && Array.isArray(answer)) {
        for (const val of answer) {
          if (optsById.has(val)) {
            const opt = optsById.get(val)!
            if (opt.price != null) {
              sortOrder++
              lines.push({ description: opt.label, price: opt.price, sort_order: sortOrder })
            }
          }
        }
      } else if (q.type === 'quantity_choice' && typeof answer === 'object' && !Array.isArray(answer)) {
        for (const [optId, qty] of Object.entries(answer as Record<string, number>)) {
          if (qty > 0 && optsById.has(optId)) {
            const opt = optsById.get(optId)!
            if (opt.price != null) {
              sortOrder++
              lines.push({
                description: `${opt.label} x${qty}`,
                price: opt.price * qty,
                sort_order: sortOrder,
              })
            }
          }
        }
      }
    }
  }

  for (const pr of form.price_rules ?? []) {
    if (pr.rule == null) continue
    const price = evaluatePriceRule(pr.rule, answers)
    if (price > 0) {
      sortOrder++
      lines.push({
        description: pr.description ?? 'Calculated price',
        price,
        sort_order: sortOrder,
      })
    }
  }

  const total = lines.reduce((sum, line) => sum + line.price, 0)
  return { currency, decimals, total, lines }
}

import type { FormPage, Question, RegistrationForm } from '@janus/core'

/**
 * The page-less shape a builder works with: a flat question list plus pricing.
 * (Janus's RegistrationForm always has pages; many editors don't expose pages,
 * so they edit a flat list and convert on save/load.)
 */
export interface FlatForm {
  currency: string
  decimals: number
  questions: Question[]
  price_rules?: RegistrationForm['price_rules']
  decision_rules?: RegistrationForm['decision_rules']
}

/** Wrap a flat editor form into a single-page Janus RegistrationForm. */
export function toRegistrationForm(flat: FlatForm, pageTitle = 'Registration'): RegistrationForm {
  const page: FormPage = { id: 'main', title: pageTitle, questions: flat.questions }
  const form: RegistrationForm = { currency: flat.currency, decimals: flat.decimals, pages: [page] }
  if (flat.price_rules) form.price_rules = flat.price_rules
  if (flat.decision_rules) form.decision_rules = flat.decision_rules
  return form
}

/** Flatten a Janus RegistrationForm back into the page-less editor shape. */
export function toFlatForm(form: RegistrationForm): FlatForm {
  return {
    currency: form.currency,
    decimals: form.decimals,
    questions: form.pages.flatMap((p) => p.questions),
    price_rules: form.price_rules,
    decision_rules: form.decision_rules,
  }
}

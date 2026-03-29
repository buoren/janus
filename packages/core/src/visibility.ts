import type { Answers, FormPage, Question, QuestionOption, RegistrationForm, VisibleIf } from './types'
import { isPageVisible } from './decision'

/**
 * Evaluate a visible_if condition against current answers.
 *
 * @param condition - The visibility condition to evaluate
 * @param answers - Current form answers
 * @param now - Override current date for testability (defaults to today)
 * @param previousAnswers - Previous run's answers for prev_* conditions
 */
export function evaluateVisibleIf(
  condition: VisibleIf | undefined | null,
  answers: Answers,
  now?: string,
  previousAnswers?: Answers,
): boolean {
  if (!condition) return true

  if ('has_any' in condition) {
    const val = answers[condition.has_any]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.values(val).some((v: any) => v > 0)
    }
    return Array.isArray(val) && val.length > 0
  }

  if ('has_none' in condition) {
    const val = answers[condition.has_none]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.values(val).every((v: any) => v === 0)
    }
    return !Array.isArray(val) || val.length === 0
  }

  if ('eq' in condition) {
    const [field, expected] = condition.eq
    return answers[field] === expected
  }

  if ('not_eq' in condition) {
    const [field, expected] = condition.not_eq
    return answers[field] !== expected
  }

  if ('less_than' in condition) {
    const [field, threshold] = condition.less_than
    return Number(answers[field]) < threshold
  }

  if ('greater_than' in condition) {
    const [field, threshold] = condition.greater_than
    return Number(answers[field]) > threshold
  }

  // prev_* conditions — all return false when no previousAnswers provided
  if ('prev_increased' in condition) {
    if (!previousAnswers) return false
    const field = condition.prev_increased
    const curr = Number(answers[field])
    const prev = Number(previousAnswers[field])
    if (isNaN(curr) || isNaN(prev)) return false
    return curr > prev
  }

  if ('prev_decreased' in condition) {
    if (!previousAnswers) return false
    const field = condition.prev_decreased
    const curr = Number(answers[field])
    const prev = Number(previousAnswers[field])
    if (isNaN(curr) || isNaN(prev)) return false
    return curr < prev
  }

  if ('prev_unchanged' in condition) {
    if (!previousAnswers) return false
    const field = condition.prev_unchanged
    return answers[field] === previousAnswers[field]
  }

  if ('prev_changed' in condition) {
    if (!previousAnswers) return false
    const field = condition.prev_changed
    return answers[field] !== previousAnswers[field]
  }

  if ('prev_changed_from' in condition) {
    if (!previousAnswers) return false
    const [field, value] = condition.prev_changed_from
    return previousAnswers[field] === value
  }

  if ('prev_changed_to' in condition) {
    if (!previousAnswers) return false
    const [field, value] = condition.prev_changed_to
    return answers[field] === value && previousAnswers[field] !== value
  }

  const today = now ?? new Date().toISOString().slice(0, 10)

  if ('before' in condition) {
    return today < condition.before
  }

  if ('after' in condition) {
    return today >= condition.after
  }

  return true
}

/** Check whether a question should be visible given current answers. */
export function isQuestionVisible(question: Question, answers: Answers, now?: string, previousAnswers?: Answers): boolean {
  return evaluateVisibleIf(question.visible_if, answers, now, previousAnswers)
}

/** Check whether an option should be visible given current answers. */
export function isOptionVisible(option: QuestionOption, answers: Answers, now?: string, previousAnswers?: Answers): boolean {
  return evaluateVisibleIf(option.visible_if, answers, now, previousAnswers)
}

/** Return only the pages that are visible given decision rules and answers. */
export function visiblePages(form: RegistrationForm, answers: Answers, previousAnswers?: Answers): FormPage[] {
  const rules = form.decision_rules ?? []
  if (rules.length === 0) return form.pages ?? []
  return (form.pages ?? []).filter((page) => isPageVisible(page, rules, answers, previousAnswers))
}

/** Return only the options whose visible_if condition passes (or have none). */
export function visibleOptions(
  question: Question,
  answers: Answers,
  now?: string,
  previousAnswers?: Answers,
): QuestionOption[] {
  return (question.options ?? []).filter((opt) => isOptionVisible(opt, answers, now, previousAnswers))
}

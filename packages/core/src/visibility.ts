import type { Answers, Question, QuestionOption, VisibleIf } from './types'

/**
 * Evaluate a visible_if condition against current answers.
 *
 * @param condition - The visibility condition to evaluate
 * @param answers - Current form answers
 * @param now - Override current date for testability (defaults to today)
 */
export function evaluateVisibleIf(
  condition: VisibleIf | undefined | null,
  answers: Answers,
  now?: string,
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
export function isQuestionVisible(question: Question, answers: Answers, now?: string): boolean {
  return evaluateVisibleIf(question.visible_if, answers, now)
}

/** Check whether an option should be visible given current answers. */
export function isOptionVisible(option: QuestionOption, answers: Answers, now?: string): boolean {
  return evaluateVisibleIf(option.visible_if, answers, now)
}

/** Return only the options whose visible_if condition passes (or have none). */
export function visibleOptions(
  question: Question,
  answers: Answers,
  now?: string,
): QuestionOption[] {
  return (question.options ?? []).filter((opt) => isOptionVisible(opt, answers, now))
}

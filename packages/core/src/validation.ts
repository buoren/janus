import type { Answers, Question, RegistrationForm, ValidationError } from './types'
import { isQuestionVisible, visibleOptions, visiblePages } from './visibility'
import { isPageVisible } from './decision'

/**
 * Check if an answer is considered "empty" for a given question.
 */
function isUnanswered(question: Question, answer: any): boolean {
  return (
    answer === undefined ||
    answer === null ||
    answer === '' ||
    (Array.isArray(answer) && answer.length === 0) ||
    (question.type === 'quantity_choice' &&
      typeof answer === 'object' &&
      !Array.isArray(answer) &&
      Object.values(answer as Record<string, number>).every((v) => v === 0))
  )
}

/**
 * Validate a single page of the form (for wizard-style navigation).
 * Returns a map of questionId → error message.
 */
export function validatePage(
  form: RegistrationForm,
  pageIndex: number,
  answers: Answers,
  now?: string,
  previousAnswers?: Answers,
  skippedQuestionIds?: Set<string>,
): Record<string, string> {
  const page = form.pages?.[pageIndex]
  if (!page) return {}

  const rules = form.decision_rules ?? []
  if (!isPageVisible(page, rules, answers, previousAnswers)) return {}

  const errors: Record<string, string> = {}
  for (const q of page.questions ?? []) {
    if (!q.required) continue
    if (!isQuestionVisible(q, answers, now, previousAnswers)) continue
    if (skippedQuestionIds?.has(q.id)) continue
    if (isUnanswered(q, answers[q.id])) {
      errors[q.id] = `${q.label} is required`
    }
  }
  return errors
}

/**
 * Validate all answers against the full form definition.
 * Ported from Python validate_registration_answers — the most complete version.
 * Returns a list of validation errors.
 */
export function validateAnswers(
  form: RegistrationForm | null | undefined,
  answers: Answers,
  now?: string,
  previousAnswers?: Answers,
  skippedQuestionIds?: Set<string>,
): ValidationError[] {
  const errors: ValidationError[] = []

  if (!form || !form.pages) {
    errors.push({ questionId: '', message: 'No form definition found' })
    return errors
  }

  // Build lookup of all questions (only from visible pages)
  const questionsById = new Map<string, Question>()
  for (const page of visiblePages(form, answers, previousAnswers)) {
    for (const q of page.questions ?? []) {
      questionsById.set(q.id, q)
    }
  }

  // Check required questions are answered (skip hidden)
  for (const [qId, q] of questionsById) {
    if (!q.required) continue
    if (!isQuestionVisible(q, answers, now, previousAnswers)) continue
    if (skippedQuestionIds?.has(qId)) continue
    if (isUnanswered(q, answers[qId])) {
      errors.push({
        questionId: qId,
        message: `Required question '${q.label ?? qId}' is not answered`,
      })
    }
  }

  // Validate choice answers have valid option IDs
  for (const [qId, answer] of Object.entries(answers)) {
    const q = questionsById.get(qId)
    if (!q) continue

    if (q.type === 'single_choice' && answer != null && answer !== '') {
      const validIds = new Set(visibleOptions(q, answers, now, previousAnswers).map((o) => o.id))
      if (!validIds.has(answer)) {
        errors.push({
          questionId: qId,
          message: `Invalid option '${answer}' for question '${q.label ?? qId}'`,
        })
      }
    } else if (q.type === 'multi_choice' && Array.isArray(answer)) {
      const validIds = new Set(visibleOptions(q, answers, now, previousAnswers).map((o) => o.id))
      for (const val of answer) {
        if (!validIds.has(val)) {
          errors.push({
            questionId: qId,
            message: `Invalid option '${val}' for question '${q.label ?? qId}'`,
          })
        }
      }
    } else if (q.type === 'quantity_choice' && typeof answer === 'object' && !Array.isArray(answer)) {
      const opts = visibleOptions(q, answers, now, previousAnswers)
      const validIds = new Set(opts.map((o) => o.id))
      const maxQtyById = new Map(opts.map((o) => [o.id, o.max_quantity]))

      for (const [optId, qty] of Object.entries(answer as Record<string, number>)) {
        if (!validIds.has(optId)) {
          errors.push({
            questionId: qId,
            message: `Invalid option '${optId}' for question '${q.label ?? qId}'`,
          })
        } else if (typeof qty !== 'number' || qty < 0) {
          errors.push({
            questionId: qId,
            message: `Invalid quantity for option '${optId}' in question '${q.label ?? qId}'`,
          })
        } else if (maxQtyById.get(optId) != null && qty > maxQtyById.get(optId)!) {
          errors.push({
            questionId: qId,
            message: `Quantity ${qty} exceeds maximum ${maxQtyById.get(optId)} for option '${optId}' in question '${q.label ?? qId}'`,
          })
        }
      }

      // Check min_quantity constraints
      for (const opt of opts) {
        if (opt.min_quantity != null && ((answer as Record<string, number>)[opt.id] ?? 0) < opt.min_quantity) {
          errors.push({
            questionId: qId,
            message: `Option '${opt.label ?? opt.id}' requires at least ${opt.min_quantity} in question '${q.label ?? qId}'`,
          })
        }
      }
    }
  }

  return errors
}

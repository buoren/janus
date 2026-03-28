import type { Answers, Question, ResolvedAnswer, RegistrationForm } from './types'
import { isQuestionVisible, visibleOptions } from './visibility'

/**
 * Resolve a single answer to a human-readable string.
 *
 * @param question - The question definition
 * @param value - The raw answer value
 * @returns Human-readable string or null if empty
 */
export function resolveAnswer(question: Question, value: any): string | null {
  if (value === undefined || value === null || value === '') return null

  const optionLabels = new Map((question.options ?? []).map((o) => [o.id, o.label]))

  if (question.type === 'single_choice') {
    return optionLabels.get(value) ?? String(value)
  }

  if (question.type === 'multi_choice' && Array.isArray(value)) {
    if (value.length === 0) return null
    return value.map((v: string) => optionLabels.get(v) ?? v).join(', ')
  }

  if (question.type === 'quantity_choice' && value && typeof value === 'object' && !Array.isArray(value)) {
    const parts: string[] = []
    for (const [optId, qty] of Object.entries(value as Record<string, number>)) {
      if (qty > 0) {
        const label = optionLabels.get(optId) ?? optId
        parts.push(`${label} x${qty}`)
      }
    }
    return parts.length > 0 ? parts.join(', ') : null
  }

  return String(value)
}

/**
 * Resolve all answers for a form into human-readable labels.
 * Skips hidden questions.
 */
export function resolveAllAnswers(
  form: RegistrationForm,
  answers: Answers,
  now?: string,
): ResolvedAnswer[] {
  const resolved: ResolvedAnswer[] = []

  for (const page of form.pages ?? []) {
    for (const q of page.questions ?? []) {
      if (!isQuestionVisible(q, answers, now)) continue
      const value = resolveAnswer(q, answers[q.id])
      if (value !== null) {
        resolved.push({ questionId: q.id, label: q.label, value })
      }
    }
  }

  return resolved
}

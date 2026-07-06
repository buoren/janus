import type { OptionsSourceData, Question, RegistrationForm } from './types'

/**
 * Return a question with its options resolved from external sources.
 *
 * - If `options_source` is set and the source exists in `sources`: use the resolved options.
 * - If `options_source` is set but no data found: fall back to static `options`.
 * - If `options_source` is not set: return the question unchanged.
 */
function resolveQuestionOptions(question: Question, sources: OptionsSourceData): Question {
  if (!question.options_source) return question
  const resolved = sources[question.options_source]
  if (!resolved) return question
  return { ...question, options: resolved }
}

/**
 * Return a copy of the form with `options_source` questions populated from the given sources.
 * Static `options` on each question serve as a fallback when no source data is available.
 */
export function resolveFormOptions(
  form: RegistrationForm,
  sources: OptionsSourceData,
): RegistrationForm {
  return {
    ...form,
    pages: (form.pages ?? []).map((page) => ({
      ...page,
      questions: (page.questions ?? []).map((q) => resolveQuestionOptions(q, sources)),
    })),
  }
}

/**
 * Collect all unique `options_source` keys referenced by questions in the form.
 */
export function collectOptionsSources(form: RegistrationForm): string[] {
  const keys = new Set<string>()
  for (const page of form.pages ?? []) {
    for (const q of page.questions ?? []) {
      if (q.options_source) keys.add(q.options_source)
    }
  }
  return Array.from(keys)
}

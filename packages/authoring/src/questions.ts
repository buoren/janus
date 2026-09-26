import type { Question, QuestionType } from '@buoren/janus-core'

/** Answer types that carry a list of options. */
export function hasOptions(type: QuestionType): boolean {
  return type === 'single_choice' || type === 'multi_choice' || type === 'quantity_choice'
}

/** A fresh question, with sensible default options for its type. */
export function blankQuestion(
  type: QuestionType,
  newId: (prefix: string) => string,
  fields: Partial<Question> = {},
): Question {
  let options: Question['options']
  if (type === 'single_choice' || type === 'multi_choice') {
    options = [
      { id: newId('opt'), label: 'Option 1' },
      { id: newId('opt'), label: 'Option 2' },
    ]
  } else if (type === 'quantity_choice') {
    options = [{ id: newId('opt'), label: 'Option 1', max_quantity: 4 }]
  }
  return {
    id: newId('q'),
    type,
    label: '',
    required: false,
    ...(options ? { options } : {}),
    ...fields,
  }
}

/**
 * Questions that can gate a later one via a condition — the single-choice and
 * number questions that appear *before* `questionId`. Pass no id to consider
 * the whole list.
 */
export function conditionSources(questions: Question[], questionId?: string): Question[] {
  const cut = questionId ? questions.findIndex((q) => q.id === questionId) : questions.length
  const limit = cut < 0 ? questions.length : cut
  return questions.filter((q, i) => i < limit && (q.type === 'single_choice' || q.type === 'number'))
}

/** Single-choice questions — the axes available for a cross-field price grid. */
export function singleChoiceQuestions(questions: Question[]): Question[] {
  return questions.filter((q) => q.type === 'single_choice')
}

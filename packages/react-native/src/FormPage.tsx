import React from 'react'
import { evaluateVisibleIf } from '@janus/core'
import { QuestionRenderer } from './QuestionRenderer'
import type { FormActions, FormStyles } from './types'

interface FormPageProps {
  page: any
  answers: Record<string, any>
  actions: FormActions
  currency: string
  formatPrice: (amount: number) => string
  fieldErrors: Record<string, string>
  styles: FormStyles
  datePlaceholder?: string
  previousAnswers?: Record<string, any>
  skippedQuestionIds?: Set<string>
}

export const FormPage: React.FC<FormPageProps> = ({
  page,
  answers,
  actions,
  currency,
  formatPrice,
  fieldErrors,
  styles,
  datePlaceholder,
  previousAnswers,
  skippedQuestionIds,
}) => {
  const visibleQuestions = (page?.questions || []).filter((q: any) => {
    if (skippedQuestionIds?.has(q.id)) return false
    return evaluateVisibleIf(q.visible_if, answers, undefined, previousAnswers)
  })

  return (
    <>
      {visibleQuestions.map((q: any) => (
        <QuestionRenderer
          key={q.id}
          question={q}
          answers={answers}
          actions={actions}
          currency={currency}
          formatPrice={formatPrice}
          fieldErrors={fieldErrors}
          styles={styles}
          datePlaceholder={datePlaceholder}
          previousAnswers={previousAnswers}
        />
      ))}
    </>
  )
}

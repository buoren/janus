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
}) => {
  const visibleQuestions = (page?.questions || []).filter((q: any) =>
    evaluateVisibleIf(q.visible_if, answers)
  )

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
        />
      ))}
    </>
  )
}

import React from 'react'
import { FormPage as CoreFormPage } from '@buoren/janus-react-core'
import type { FormActions, FormStyles } from '@buoren/janus-react-core'
import { QuestionRenderer } from './QuestionRenderer'

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

// The React DOM binding: core page logic rendered through DOM question widgets.
export const FormPage: React.FC<FormPageProps> = (props) => (
  <CoreFormPage {...props} QuestionRenderer={QuestionRenderer} />
)

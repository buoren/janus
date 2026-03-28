import type { StyleSheet } from 'react-native'

export interface FormTheme {
  primaryDark: string
  textPrimary: string
}

export interface FormActions {
  setAnswer: (questionId: string, value: any) => void
  toggleMultiChoice: (questionId: string, optionValue: string) => void
  setQuantity: (questionId: string, optionId: string, qty: number) => void
}

export type FormStyles = ReturnType<typeof StyleSheet.create>

export interface QuestionWidgetProps {
  question: any
  answers: Record<string, any>
  actions: FormActions
  currency: string
  formatPrice: (amount: number) => string
  fieldErrors: Record<string, string>
  styles: FormStyles
  datePlaceholder?: string
}

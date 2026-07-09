// Platform-neutral form types. The RN and DOM bindings each supply their own
// concrete style objects; here `FormStyles` is just an opaque style-key map so
// this package never depends on react-native OR react-dom.

export interface FormTheme {
  primaryDark: string
  textPrimary: string
}

export interface FormActions {
  setAnswer: (questionId: string, value: any) => void
  toggleMultiChoice: (questionId: string, optionValue: string) => void
  setQuantity: (questionId: string, optionId: string, qty: number) => void
}

/** A map of style keys to whatever style value the platform binding uses
 *  (RN StyleSheet entries, or DOM CSSProperties). Opaque to the core. */
export type FormStyles = Record<string, any>

export interface QuestionWidgetProps {
  question: any
  answers: Record<string, any>
  actions: FormActions
  currency: string
  formatPrice: (amount: number) => string
  fieldErrors: Record<string, string>
  styles: FormStyles
  datePlaceholder?: string
  previousAnswers?: Record<string, any>
}

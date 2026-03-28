export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'date'
  | 'single_choice'
  | 'multi_choice'
  | 'quantity_choice'

export type VisibleIf =
  | { has_any: string }
  | { has_none: string }
  | { eq: [string, string] }
  | { not_eq: [string, string] }
  | { before: string }
  | { after: string }

export interface QuestionOption {
  id: string
  label: string
  price?: number
  max_quantity?: number
  min_quantity?: number
  visible_if?: VisibleIf
}

export interface Question {
  id: string
  type: QuestionType
  label: string
  description?: string
  placeholder?: string
  required?: boolean
  visible_if?: VisibleIf
  options?: QuestionOption[]
}

export interface FormPage {
  id: string
  title: string
  questions: Question[]
}

export type PriceRuleValue =
  | number
  | { switch: { field: string; cases: Record<string, PriceRuleValue>; default: PriceRuleValue } }
  | { count_tier: { field: string; tiers: CountTier[] } }
  | { per_quantity: { field: string; prices: Record<string, PriceRuleValue> } }

/** count_tier accepts both tuple format [[count, price], ...] and object format [{min_count, price}, ...] */
export type CountTier = [number, number] | { min_count: number; price: number }

export interface PriceRule {
  description: string
  rule: PriceRuleValue
}

export interface RegistrationForm {
  currency: string
  decimals: number
  pages: FormPage[]
  price_rules?: PriceRule[]
}

export type Answers = Record<string, any>

export interface ValidationError {
  questionId: string
  message: string
}

export interface PaymentLine {
  description: string
  price: number
  sort_order: number
}

export interface PaymentDetails {
  currency: string
  decimals: number
  total: number
  lines: PaymentLine[]
}

export interface ResolvedAnswer {
  questionId: string
  label: string
  value: string | null
}

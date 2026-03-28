import { useState, useCallback } from 'react'
import type { FormActions } from './types'

export function useFormState(initialAnswers: Record<string, any> = {}) {
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers)

  const setAnswer = useCallback((questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  const toggleMultiChoice = useCallback((questionId: string, optionValue: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? [...prev[questionId]] : []
      const idx = current.indexOf(optionValue)
      if (idx >= 0) {
        current.splice(idx, 1)
      } else {
        current.push(optionValue)
      }
      return { ...prev, [questionId]: current }
    })
  }, [])

  const setQuantity = useCallback((questionId: string, optionId: string, qty: number) => {
    setAnswers((prev) => {
      const current =
        prev[questionId] && typeof prev[questionId] === 'object' && !Array.isArray(prev[questionId])
          ? { ...prev[questionId] }
          : {}
      current[optionId] = Math.max(0, qty)
      return { ...prev, [questionId]: current }
    })
  }, [])

  const actions: FormActions = { setAnswer, toggleMultiChoice, setQuantity }

  return { answers, setAnswers, ...actions, actions }
}

import { useState, useCallback } from 'react'
import { validatePage } from '@janus/core'

export function useValidation() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validateCurrentPage = useCallback(
    (form: any, pageIndex: number, answers: Record<string, any>): boolean => {
      if (!form) return true
      const errors = validatePage(form, pageIndex, answers)
      setFieldErrors(errors)
      return Object.keys(errors).length === 0
    },
    []
  )

  const clearErrors = useCallback(() => {
    setFieldErrors({})
  }, [])

  return { fieldErrors, validateCurrentPage, clearErrors }
}

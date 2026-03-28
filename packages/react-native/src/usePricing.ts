import { useMemo, useCallback } from 'react'
import {
  evaluateVisibleIf,
  calculatePaymentDetails,
  formatPrice as formatPriceCore,
} from '@janus/core'

export function usePricing(registrationForm: any, answers: Record<string, any>) {
  const decimals = registrationForm?.decimals ?? 2
  const currency = registrationForm?.currency || ''

  const formatPrice = useCallback(
    (amount: number) => formatPriceCore(amount, decimals),
    [decimals]
  )

  const hasPricing = useMemo(() => {
    if (!registrationForm) return false
    if (registrationForm.currency) return true
    if ((registrationForm.price_rules || []).length > 0) return true
    const pages = registrationForm.pages || []
    for (const page of pages) {
      for (const q of page.questions || []) {
        const opts = (q.options || []).filter((o: any) =>
          evaluateVisibleIf(o.visible_if, answers)
        )
        if (opts.some((o: any) => o.price != null && o.price > 0)) return true
      }
    }
    return false
  }, [registrationForm, answers])

  const runningTotal = useMemo(() => {
    if (!registrationForm) return 0
    return calculatePaymentDetails(registrationForm, answers).total
  }, [answers, registrationForm])

  return { hasPricing, runningTotal, currency, formatPrice, decimals }
}

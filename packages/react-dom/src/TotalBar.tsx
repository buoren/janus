import React from 'react'
import type { FormStyles } from '@janus/react-core'

interface TotalBarProps {
  runningTotal: number
  currency: string
  formatPrice: (amount: number) => string
  totalLabel: string
  styles: FormStyles
}

// DOM sibling of the RN TotalBar.
export const TotalBar: React.FC<TotalBarProps> = ({
  runningTotal,
  currency,
  formatPrice,
  totalLabel,
  styles,
}) => {
  if (runningTotal <= 0) return null

  return (
    <div style={styles.totalBar}>
      <div style={styles.totalText}>
        {totalLabel}: {currency} {formatPrice(runningTotal)}
      </div>
    </div>
  )
}

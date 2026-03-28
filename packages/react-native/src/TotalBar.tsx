import React from 'react'
import { View, Text } from 'react-native'
import type { FormStyles } from './types'

interface TotalBarProps {
  runningTotal: number
  currency: string
  formatPrice: (amount: number) => string
  totalLabel: string
  styles: FormStyles
}

export const TotalBar: React.FC<TotalBarProps> = ({
  runningTotal,
  currency,
  formatPrice,
  totalLabel,
  styles,
}) => {
  if (runningTotal <= 0) return null

  return (
    <View style={styles.totalBar}>
      <Text style={styles.totalText}>
        {totalLabel}: {currency} {formatPrice(runningTotal)}
      </Text>
    </View>
  )
}

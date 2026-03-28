import { StyleSheet } from 'react-native'
import type { FormTheme } from './types'

export function createFormStyles(theme: FormTheme) {
  return StyleSheet.create({
    questionContainer: {
      marginBottom: 20,
    },
    questionLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    questionDescription: {
      fontSize: 13,
      color: '#888',
      marginBottom: 8,
    },
    fieldError: {
      color: '#e53935',
      fontSize: 13,
      marginTop: 4,
    },
    textInput: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 12,
      fontSize: 15,
      color: theme.textPrimary,
      backgroundColor: '#fff',
    },
    choiceGroup: {
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 8,
      backgroundColor: '#fff',
      overflow: 'hidden' as const,
    },
    choiceRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    choiceRowSelected: {
      backgroundColor: theme.primaryDark + '10',
    },
    choiceRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#ccc',
      marginRight: 10,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    radioSelected: {
      borderColor: theme.primaryDark,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.primaryDark,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: '#ccc',
      marginRight: 10,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    checkboxSelected: {
      borderColor: theme.primaryDark,
      backgroundColor: theme.primaryDark,
    },
    checkmark: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700' as const,
    },
    choiceLabel: {
      flex: 1,
      fontSize: 15,
      color: theme.textPrimary,
    },
    choicePrice: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: theme.primaryDark,
      marginLeft: 8,
    },
    qtyControls: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginLeft: 8,
    },
    qtyButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#ccc',
      backgroundColor: '#f5f5f5',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    qtyButtonDisabled: {
      opacity: 0.3,
    },
    qtyButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#333',
    },
    qtyValue: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: theme.textPrimary,
      minWidth: 24,
      textAlign: 'center' as const,
    },
    totalBar: {
      backgroundColor: theme.primaryDark + '15',
      padding: 14,
      borderRadius: 8,
      marginTop: 8,
    },
    totalText: {
      fontSize: 17,
      fontWeight: '700' as const,
      color: theme.primaryDark,
      textAlign: 'right' as const,
    },
  })
}

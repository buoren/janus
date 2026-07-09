import type { CSSProperties } from 'react'
import type { FormTheme } from '@janus/react-core'

// DOM sibling of the RN createFormStyles: same visual intent, expressed as
// inline CSS. Returns a plain style-key map (React.CSSProperties), which the DOM
// widgets apply via `style={...}`. Callers may override via the theme.
export function createFormStyles(theme: FormTheme): Record<string, CSSProperties> {
  return {
    questionContainer: {
      marginBottom: 20,
    },
    questionLabel: {
      display: 'block',
      fontSize: 15,
      fontWeight: 600,
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
      boxSizing: 'border-box',
      width: '100%',
      border: '1px solid #ddd',
      borderRadius: 8,
      padding: 12,
      fontSize: 15,
      color: theme.textPrimary,
      background: '#fff',
      fontFamily: 'inherit',
      outline: 'none',
    },
    choiceGroup: {
      border: '1px solid #e0e0e0',
      borderRadius: 8,
      background: '#fff',
      overflow: 'hidden',
    },
    choiceRow: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'left',
      background: 'transparent',
      border: 'none',
      font: 'inherit',
    },
    choiceRowSelected: {
      background: theme.primaryDark + '10',
    },
    choiceRowBorder: {
      borderBottom: '1px solid #e0e0e0',
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      border: '2px solid #ccc',
      marginRight: 10,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flex: 'none',
    },
    radioSelected: {
      borderColor: theme.primaryDark,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      background: theme.primaryDark,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      border: '2px solid #ccc',
      marginRight: 10,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flex: 'none',
    },
    checkboxSelected: {
      borderColor: theme.primaryDark,
      background: theme.primaryDark,
    },
    checkmark: {
      color: '#fff',
      fontSize: 13,
      fontWeight: 700,
      lineHeight: 1,
    },
    choiceLabel: {
      flex: 1,
      fontSize: 15,
      color: theme.textPrimary,
    },
    choicePrice: {
      fontSize: 14,
      fontWeight: 600,
      color: theme.primaryDark,
      marginLeft: 8,
    },
    qtyControls: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: 8,
    },
    qtyButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      border: '1px solid #ccc',
      background: '#f5f5f5',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      fontSize: 16,
      fontWeight: 600,
      color: '#333',
    },
    qtyButtonDisabled: {
      opacity: 0.3,
      cursor: 'default',
    },
    qtyValue: {
      fontSize: 15,
      fontWeight: 600,
      color: theme.textPrimary,
      minWidth: 24,
      textAlign: 'center',
    },
    totalBar: {
      background: theme.primaryDark + '15',
      padding: 14,
      borderRadius: 8,
      marginTop: 8,
    },
    totalText: {
      fontSize: 17,
      fontWeight: 700,
      color: theme.primaryDark,
      textAlign: 'right',
    },
  }
}

import React from 'react'
import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { evaluateVisibleIf } from '@janus/core'
import type { QuestionWidgetProps } from './types'

export const QuestionRenderer: React.FC<QuestionWidgetProps> = ({
  question: q,
  answers,
  actions,
  currency,
  formatPrice,
  fieldErrors,
  styles,
  datePlaceholder,
  previousAnswers,
}) => {
  const opts = (q.options || []).filter((o: any) =>
    evaluateVisibleIf(o.visible_if, answers, undefined, previousAnswers)
  )

  return (
    <View style={styles.questionContainer}>
      <Text style={styles.questionLabel}>
        {q.label}
        {q.required && <Text style={{ color: '#e53935' }}> *</Text>}
      </Text>
      {q.description && <Text style={styles.questionDescription}>{q.description}</Text>}

      {q.type === 'short_text' && (
        <TextInput
          style={styles.textInput}
          value={answers[q.id] ?? ''}
          onChangeText={(text) => actions.setAnswer(q.id, text)}
          placeholder={q.placeholder || ''}
          placeholderTextColor="#999"
        />
      )}

      {q.type === 'long_text' && (
        <TextInput
          style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]}
          value={answers[q.id] ?? ''}
          onChangeText={(text) => actions.setAnswer(q.id, text)}
          multiline
          placeholder={q.placeholder || ''}
          placeholderTextColor="#999"
        />
      )}

      {q.type === 'number' && (
        <TextInput
          style={styles.textInput}
          value={answers[q.id]?.toString() ?? ''}
          onChangeText={(text) => actions.setAnswer(q.id, text ? Number(text) : '')}
          keyboardType="numeric"
          placeholder={q.placeholder || ''}
          placeholderTextColor="#999"
        />
      )}

      {q.type === 'date' && (
        <TextInput
          style={styles.textInput}
          value={answers[q.id] ?? ''}
          onChangeText={(text) => actions.setAnswer(q.id, text)}
          placeholder={datePlaceholder || 'YYYY-MM-DD'}
          placeholderTextColor="#999"
        />
      )}

      {q.type === 'single_choice' && opts.length === 1 && (
        <View style={styles.choiceGroup}>
          {opts.map((opt: any) => {
            const selected = answers[q.id] === opt.id
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.choiceRow, selected && styles.choiceRowSelected]}
                onPress={() => actions.setAnswer(q.id, selected ? undefined : opt.id)}
              >
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.choiceLabel}>{opt.label}</Text>
                {opt.price != null && opt.price > 0 && (
                  <Text style={styles.choicePrice}>
                    {currency} {formatPrice(opt.price)}
                  </Text>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      )}

      {q.type === 'single_choice' && opts.length > 1 && (
        <View style={styles.choiceGroup}>
          {opts.map((opt: any, idx: number) => {
            const selected = answers[q.id] === opt.id
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.choiceRow,
                  selected && styles.choiceRowSelected,
                  idx < opts.length - 1 && styles.choiceRowBorder,
                ]}
                onPress={() => actions.setAnswer(q.id, opt.id)}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.choiceLabel}>{opt.label}</Text>
                {opt.price != null && opt.price > 0 && (
                  <Text style={styles.choicePrice}>
                    {currency} {formatPrice(opt.price)}
                  </Text>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      )}

      {q.type === 'multi_choice' && (
        <View style={styles.choiceGroup}>
          {opts.map((opt: any, idx: number) => {
            const currentArr = Array.isArray(answers[q.id]) ? answers[q.id] : []
            const selected = currentArr.includes(opt.id)
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.choiceRow,
                  selected && styles.choiceRowSelected,
                  idx < opts.length - 1 && styles.choiceRowBorder,
                ]}
                onPress={() => actions.toggleMultiChoice(q.id, opt.id)}
              >
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.choiceLabel}>{opt.label}</Text>
                {opt.price != null && opt.price > 0 && (
                  <Text style={styles.choicePrice}>
                    {currency} {formatPrice(opt.price)}
                  </Text>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      )}

      {q.type === 'quantity_choice' && (
        <View style={styles.choiceGroup}>
          {opts.map((opt: any, idx: number) => {
            const quantities =
              answers[q.id] &&
              typeof answers[q.id] === 'object' &&
              !Array.isArray(answers[q.id])
                ? answers[q.id]
                : {}
            const qty = quantities[opt.id] || 0
            const maxQty = opt.max_quantity
            return (
              <View
                key={opt.id}
                style={[
                  styles.choiceRow,
                  qty > 0 && styles.choiceRowSelected,
                  idx < opts.length - 1 && styles.choiceRowBorder,
                ]}
              >
                <Text style={styles.choiceLabel}>{opt.label}</Text>
                {opt.price != null && opt.price > 0 && (
                  <Text style={styles.choicePrice}>
                    {currency} {formatPrice(opt.price)}
                  </Text>
                )}
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={[styles.qtyButton, qty <= 0 && styles.qtyButtonDisabled]}
                    onPress={() => actions.setQuantity(q.id, opt.id, qty - 1)}
                    disabled={qty <= 0}
                  >
                    <Text style={styles.qtyButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{qty}</Text>
                  <TouchableOpacity
                    style={[
                      styles.qtyButton,
                      maxQty != null && qty >= maxQty && styles.qtyButtonDisabled,
                    ]}
                    onPress={() =>
                      actions.setQuantity(
                        q.id,
                        opt.id,
                        maxQty != null ? Math.min(qty + 1, maxQty) : qty + 1
                      )
                    }
                    disabled={maxQty != null && qty >= maxQty}
                  >
                    <Text style={styles.qtyButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })}
        </View>
      )}

      {fieldErrors[q.id] && <Text style={styles.fieldError}>{fieldErrors[q.id]}</Text>}
    </View>
  )
}

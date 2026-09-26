import React from 'react'
import { evaluateVisibleIf } from '@buoren/janus-core'
import type { QuestionWidgetProps } from '@buoren/janus-react-core'

// DOM sibling of the RN QuestionRenderer. Same question types, same actions
// contract, same visibility filtering — rendered with DOM controls.
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
    evaluateVisibleIf(o.visible_if, answers, undefined, previousAnswers),
  )
  const row = (selected: boolean, border: boolean): React.CSSProperties => ({
    ...styles.choiceRow,
    ...(selected ? styles.choiceRowSelected : {}),
    ...(border ? styles.choiceRowBorder : {}),
  })
  const price = (opt: any) =>
    opt.price != null && opt.price > 0 ? (
      <span style={styles.choicePrice}>
        {currency} {formatPrice(opt.price)}
      </span>
    ) : null

  return (
    <div style={styles.questionContainer}>
      <label style={styles.questionLabel}>
        {q.label}
        {q.required && <span style={{ color: '#e53935' }}> *</span>}
      </label>
      {q.description && <div style={styles.questionDescription}>{q.description}</div>}

      {q.type === 'short_text' && (
        <input
          style={styles.textInput}
          value={answers[q.id] ?? ''}
          onChange={(e) => actions.setAnswer(q.id, e.target.value)}
          placeholder={q.placeholder || ''}
        />
      )}

      {q.type === 'long_text' && (
        <textarea
          style={{ ...styles.textInput, height: 100, resize: 'vertical' }}
          value={answers[q.id] ?? ''}
          onChange={(e) => actions.setAnswer(q.id, e.target.value)}
          placeholder={q.placeholder || ''}
        />
      )}

      {q.type === 'number' && (
        <input
          type="number"
          style={styles.textInput}
          value={answers[q.id]?.toString() ?? ''}
          onChange={(e) => actions.setAnswer(q.id, e.target.value ? Number(e.target.value) : '')}
          placeholder={q.placeholder || ''}
        />
      )}

      {q.type === 'date' && (
        <input
          type="date"
          style={styles.textInput}
          value={answers[q.id] ?? ''}
          onChange={(e) => actions.setAnswer(q.id, e.target.value)}
          placeholder={datePlaceholder || 'YYYY-MM-DD'}
        />
      )}

      {q.type === 'single_choice' && opts.length === 1 && (
        <div style={styles.choiceGroup}>
          {opts.map((opt: any) => {
            const selected = answers[q.id] === opt.id
            return (
              <button
                type="button"
                key={opt.id}
                style={row(selected, false)}
                onClick={() => actions.setAnswer(q.id, selected ? undefined : opt.id)}
              >
                <span style={{ ...styles.checkbox, ...(selected ? styles.checkboxSelected : {}) }}>
                  {selected && <span style={styles.checkmark}>✓</span>}
                </span>
                <span style={styles.choiceLabel}>{opt.label}</span>
                {price(opt)}
              </button>
            )
          })}
        </div>
      )}

      {q.type === 'single_choice' && opts.length > 1 && (
        <div style={styles.choiceGroup}>
          {opts.map((opt: any, idx: number) => {
            const selected = answers[q.id] === opt.id
            return (
              <button
                type="button"
                key={opt.id}
                style={row(selected, idx < opts.length - 1)}
                onClick={() => actions.setAnswer(q.id, opt.id)}
              >
                <span style={{ ...styles.radio, ...(selected ? styles.radioSelected : {}) }}>
                  {selected && <span style={styles.radioInner} />}
                </span>
                <span style={styles.choiceLabel}>{opt.label}</span>
                {price(opt)}
              </button>
            )
          })}
        </div>
      )}

      {q.type === 'multi_choice' && (
        <div style={styles.choiceGroup}>
          {opts.map((opt: any, idx: number) => {
            const currentArr = Array.isArray(answers[q.id]) ? answers[q.id] : []
            const selected = currentArr.includes(opt.id)
            return (
              <button
                type="button"
                key={opt.id}
                style={row(selected, idx < opts.length - 1)}
                onClick={() => actions.toggleMultiChoice(q.id, opt.id)}
              >
                <span style={{ ...styles.checkbox, ...(selected ? styles.checkboxSelected : {}) }}>
                  {selected && <span style={styles.checkmark}>✓</span>}
                </span>
                <span style={styles.choiceLabel}>{opt.label}</span>
                {price(opt)}
              </button>
            )
          })}
        </div>
      )}

      {q.type === 'quantity_choice' && (
        <div style={styles.choiceGroup}>
          {opts.map((opt: any, idx: number) => {
            const quantities =
              answers[q.id] && typeof answers[q.id] === 'object' && !Array.isArray(answers[q.id])
                ? answers[q.id]
                : {}
            const qty = quantities[opt.id] || 0
            const maxQty = opt.max_quantity
            const atMax = maxQty != null && qty >= maxQty
            return (
              <div key={opt.id} style={row(qty > 0, idx < opts.length - 1)}>
                <span style={styles.choiceLabel}>{opt.label}</span>
                {price(opt)}
                <span style={styles.qtyControls}>
                  <button
                    type="button"
                    style={{ ...styles.qtyButton, ...(qty <= 0 ? styles.qtyButtonDisabled : {}) }}
                    onClick={() => actions.setQuantity(q.id, opt.id, qty - 1)}
                    disabled={qty <= 0}
                  >
                    −
                  </button>
                  <span style={styles.qtyValue}>{qty}</span>
                  <button
                    type="button"
                    style={{ ...styles.qtyButton, ...(atMax ? styles.qtyButtonDisabled : {}) }}
                    onClick={() =>
                      actions.setQuantity(q.id, opt.id, maxQty != null ? Math.min(qty + 1, maxQty) : qty + 1)
                    }
                    disabled={atMax}
                  >
                    +
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      )}

      {fieldErrors[q.id] && <div style={styles.fieldError}>{fieldErrors[q.id]}</div>}
    </div>
  )
}

import { resolveFormOptions, collectOptionsSources } from '../src/options'
import type { RegistrationForm, OptionsSourceData } from '../src/types'

const baseForm: RegistrationForm = {
  currency: 'USD',
  decimals: 2,
  pages: [
    {
      id: 'page1',
      title: 'Page 1',
      questions: [
        {
          id: 'static_q',
          type: 'single_choice',
          label: 'Static question',
          options: [
            { id: 'a', label: 'Option A' },
            { id: 'b', label: 'Option B' },
          ],
        },
        {
          id: 'dynamic_q',
          type: 'single_choice',
          label: 'Dynamic question',
          options_source: 'internships',
          options: [{ id: 'fallback', label: 'Loading...' }],
        },
        {
          id: 'dynamic_no_fallback',
          type: 'multi_choice',
          label: 'Dynamic no fallback',
          options_source: 'skills',
        },
      ],
    },
  ],
}

describe('collectOptionsSources', () => {
  test('returns unique source keys', () => {
    const keys = collectOptionsSources(baseForm)
    expect(keys.sort()).toEqual(['internships', 'skills'])
  })

  test('returns empty array when no sources', () => {
    const form: RegistrationForm = {
      currency: 'USD',
      decimals: 2,
      pages: [
        {
          id: 'p',
          title: 'P',
          questions: [{ id: 'q', type: 'short_text', label: 'Q' }],
        },
      ],
    }
    expect(collectOptionsSources(form)).toEqual([])
  })

  test('handles empty form', () => {
    const form: RegistrationForm = { currency: 'USD', decimals: 2, pages: [] }
    expect(collectOptionsSources(form)).toEqual([])
  })
})

describe('resolveFormOptions', () => {
  const sources: OptionsSourceData = {
    internships: [
      { id: 'intern_1', label: 'Acme Corp' },
      { id: 'intern_2', label: 'Globex Inc' },
    ],
    skills: [
      { id: 'js', label: 'JavaScript' },
      { id: 'py', label: 'Python' },
    ],
  }

  test('replaces options on questions with matching source', () => {
    const resolved = resolveFormOptions(baseForm, sources)
    const dynamicQ = resolved.pages[0].questions[1]
    expect(dynamicQ.options).toEqual([
      { id: 'intern_1', label: 'Acme Corp' },
      { id: 'intern_2', label: 'Globex Inc' },
    ])
  })

  test('leaves static questions unchanged', () => {
    const resolved = resolveFormOptions(baseForm, sources)
    const staticQ = resolved.pages[0].questions[0]
    expect(staticQ.options).toEqual([
      { id: 'a', label: 'Option A' },
      { id: 'b', label: 'Option B' },
    ])
  })

  test('resolves questions with no static fallback', () => {
    const resolved = resolveFormOptions(baseForm, sources)
    const noFallbackQ = resolved.pages[0].questions[2]
    expect(noFallbackQ.options).toEqual([
      { id: 'js', label: 'JavaScript' },
      { id: 'py', label: 'Python' },
    ])
  })

  test('falls back to static options when source not in data', () => {
    const resolved = resolveFormOptions(baseForm, {})
    const dynamicQ = resolved.pages[0].questions[1]
    expect(dynamicQ.options).toEqual([{ id: 'fallback', label: 'Loading...' }])
  })

  test('falls back to undefined when source missing and no static options', () => {
    const resolved = resolveFormOptions(baseForm, {})
    const noFallbackQ = resolved.pages[0].questions[2]
    expect(noFallbackQ.options).toBeUndefined()
  })

  test('does not mutate the original form', () => {
    const originalOptions = baseForm.pages[0].questions[1].options
    resolveFormOptions(baseForm, sources)
    expect(baseForm.pages[0].questions[1].options).toBe(originalOptions)
  })
})

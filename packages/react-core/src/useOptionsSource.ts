import { useState, useEffect, useRef } from 'react'
import { collectOptionsSources, resolveFormOptions } from '@buoren/janus-core'
import type { QuestionOption, RegistrationForm, OptionsSourceData } from '@buoren/janus-core'

/** Async function that fetches options for a given source key. */
export type OptionsSourceFetcher = (sourceKey: string) => Promise<QuestionOption[]>

/**
 * Hook that resolves `options_source` references in a form by calling the provided fetcher.
 *
 * Returns the form with options populated, plus loading and error state.
 * Static `options` on each question serve as fallback while loading.
 */
export function useOptionsSource(
  form: RegistrationForm | undefined,
  fetcher?: OptionsSourceFetcher,
): {
  resolvedForm: RegistrationForm | undefined
  loading: boolean
  errors: Record<string, Error>
} {
  const [sources, setSources] = useState<OptionsSourceData>({})
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, Error>>({})
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    if (!form || !fetcherRef.current) {
      setSources({})
      setLoading(false)
      return
    }

    const keys = collectOptionsSources(form)
    if (keys.length === 0) {
      setSources({})
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const currentFetcher = fetcherRef.current
    Promise.all(
      keys.map((key) =>
        currentFetcher(key)
          .then((options) => ({ key, options, error: undefined }))
          .catch((err: Error) => ({ key, options: [] as QuestionOption[], error: err })),
      ),
    ).then((results) => {
      if (cancelled) return
      const newSources: OptionsSourceData = {}
      const newErrors: Record<string, Error> = {}
      for (const { key, options, error } of results) {
        if (error) {
          newErrors[key] = error
        } else {
          newSources[key] = options
        }
      }
      setSources(newSources)
      setErrors(newErrors)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [form])

  const resolvedForm =
    form && Object.keys(sources).length > 0 ? resolveFormOptions(form, sources) : form

  return { resolvedForm, loading, errors }
}

import type { Answers, DecisionRule, DecisionBranch, DecisionResults, FormPage } from './types'
import { evaluateVisibleIf } from './visibility'

/**
 * Evaluate all decision rules and return the set of page IDs that should be visible.
 */
export function evaluateDecisionRules(rules: DecisionRule[], answers: Answers, previousAnswers?: Answers): Set<string> {
  const visiblePageIds = new Set<string>()

  for (const rule of rules) {
    let matched = false

    for (const branch of rule.branches) {
      if (evaluateVisibleIf(branch.condition, answers, undefined, previousAnswers)) {
        for (const id of branch.pages) {
          visiblePageIds.add(id)
        }
        matched = true
      }
    }

    if (!matched && rule.default) {
      for (const id of rule.default) {
        visiblePageIds.add(id)
      }
    }
  }

  return visiblePageIds
}

/**
 * Check if a page is gated by any decision rule (i.e., appears in any branch or default).
 */
export function isPageGated(pageId: string, rules: DecisionRule[]): boolean {
  for (const rule of rules) {
    for (const branch of rule.branches) {
      if (branch.pages.includes(pageId)) return true
    }
    if (rule.default?.includes(pageId)) return true
  }
  return false
}

/**
 * Check if a page should be visible given decision rules and current answers.
 *
 * - Ungated pages (not referenced by any rule) are always visible.
 * - Gated pages are visible only when included in an active branch.
 */
/**
 * Evaluate all decision rules and merge results from matching branches.
 * Later branches overwrite earlier ones on key conflict (last-write-wins).
 */
export function evaluateDecisionResults(
  rules: DecisionRule[],
  answers: Answers,
  previousAnswers?: Answers,
): DecisionResults {
  const values: Record<string, string> = {}
  const result_types: string[] = []
  for (const rule of rules) {
    let matched = false
    for (const branch of rule.branches) {
      if (evaluateVisibleIf(branch.condition, answers, undefined, previousAnswers)) {
        if (branch.result) {
          Object.assign(values, branch.result)
        }
        matched = true
      }
    }
    if (matched && rule.result_type) {
      result_types.push(rule.result_type)
    }
  }
  return { values, result_types }
}

export function isPageVisible(page: FormPage, rules: DecisionRule[], answers: Answers, previousAnswers?: Answers): boolean {
  if (!rules || rules.length === 0) return true
  if (!isPageGated(page.id, rules)) return true
  return evaluateDecisionRules(rules, answers, previousAnswers).has(page.id)
}

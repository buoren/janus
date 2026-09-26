# @janus/core

Pure TypeScript engine for JSON decision-tree forms: visibility evaluation, pricing calculation, validation, and answer resolution. Zero dependencies.

## Install

```bash
npm install @janus/core
```

## Exports

- **Visibility**: `evaluateVisibleIf`, `isQuestionVisible`, `isOptionVisible`, `visibleOptions`, `visiblePages`
- **Decision rules**: `evaluateDecisionRules`, `evaluateDecisionResults`, `isPageGated`, `isPageVisible`
- **Pricing**: `evaluatePriceRule`, `calculatePaymentDetails`
- **Validation**: `validatePage`, `validateAnswers`
- **Answers**: `resolveAnswer`, `resolveAllAnswers`
- **Format**: `formatPrice`, `parsePrice`
- **Types**: `RegistrationForm`, `FormPage`, `Question`, `QuestionOption`, `Answers`, `PaymentDetails`, etc.

Part of the [Janus](https://github.com/buoren/janus) monorepo.

## License

MIT

# Janus

TypeScript library for JSON decision-tree forms — visibility, pricing, validation, and React Native components.

## Packages

| Package | Description |
|---------|-------------|
| `@janus/core` | Pure TypeScript engine: visibility evaluation, pricing calculation, validation, answer resolution |
| `@janus/react-native` | React Native hooks and components: `useFormState`, `usePricing`, `useValidation`, `FormPage`, `TotalBar` |

## Setup

```bash
npm install
```

This is an npm workspaces monorepo. Running `npm install` at the root installs dependencies for all packages.

## Scripts

```bash
npm run typecheck   # Typecheck all packages
npm test            # Run all tests (core: 95 tests)
npm run build       # Build all packages (generates dist/)
```

## `@janus/core`

Pure TypeScript, zero dependencies. Exports:

- **Visibility**: `evaluateVisibleIf`, `isQuestionVisible`, `isOptionVisible`, `visibleOptions`
- **Pricing**: `evaluatePriceRule`, `calculatePaymentDetails`
- **Validation**: `validatePage`, `validateAnswers`
- **Answers**: `resolveAnswer`, `resolveAllAnswers`
- **Format**: `formatPrice`, `parsePrice`
- **Types**: `RegistrationForm`, `FormPage`, `Question`, `QuestionOption`, `Answers`, `PaymentDetails`, etc.

## `@janus/react-native`

Peer deps: `@janus/core`, `react`, `react-native`. Exports:

- **Hooks**: `useFormState`, `usePricing`, `useValidation`
- **Components**: `FormPage`, `TotalBar`, `QuestionRenderer`
- **Styles**: `createFormStyles(theme)` — pass `{ primaryDark, textPrimary }` to get a full form stylesheet
- **Types**: `FormTheme`, `FormActions`, `FormStyles`, `QuestionWidgetProps`

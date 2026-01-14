# @motioneffector/theme

Type-safe theme management with CSS variables, runtime switching, and automatic persistence.

[![npm version](https://img.shields.io/npm/v/@motioneffector/theme.svg)](https://www.npmjs.com/package/@motioneffector/theme)
[![license](https://img.shields.io/npm/l/@motioneffector/theme.svg)](https://github.com/motioneffector/theme/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**[Try the interactive demo →](https://motioneffector.github.io/theme/)**

## Features

- **Theme Switching** - Apply themes instantly with CSS variable updates
- **Type Safety** - Full TypeScript support with validated theme definitions
- **System Preferences** - Auto-detect and respond to OS dark mode
- **Persistence** - Remember user preferences across sessions with localStorage
- **Token Management** - Runtime access to theme tokens and CSS variable names
- **Custom Prefixes** - Configure CSS variable naming conventions
- **Zero Dependencies** - No supply chain risk

[Read the full manual →](https://github.com/motioneffector/theme)

## Quick Start

```typescript
import { createThemeManager, createTheme } from '@motioneffector/theme'

// Define your themes
const light = createTheme({
  name: 'light',
  tokens: { primary: '#007bff', background: '#ffffff', text: '#000000' }
})

const dark = createTheme({
  name: 'dark',
  tokens: { primary: '#0d6efd', background: '#1a1a1a', text: '#ffffff' }
})

// Create manager and switch themes
const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light',
  storageKey: 'app-theme'
})

manager.apply('dark')
```

## Testing & Validation

- **Comprehensive test suite** - 361 unit tests covering core functionality
- **Fuzz tested** - Randomized input testing to catch edge cases
- **Strict TypeScript** - Full type coverage with no `any` types
- **Zero dependencies** - No supply chain risk

## License

MIT © [motioneffector](https://github.com/motioneffector)

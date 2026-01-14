# Theme Manager Creation API

Create and configure the theme manager.

---

## `createThemeManager()`

Creates a theme manager instance for managing CSS variable-based themes.

**Signature:**

```typescript
function createThemeManager(options: ThemeManagerOptions): ThemeManager
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `ThemeManagerOptions` | Yes | Configuration object |

**Returns:** `ThemeManager` — A manager instance with methods to apply, register, and manage themes.

**Example:**

```typescript
import { createTheme, createThemeManager } from '@motioneffector/theme'

const light = createTheme({
  name: 'light',
  tokens: { background: '#fff', text: '#000' }
})

const dark = createTheme({
  name: 'dark',
  tokens: { background: '#1a1a1a', text: '#fff' }
})

const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light',
  storageKey: 'app-theme',
  prefix: '--color-'
})
```

**Throws:**

- `TypeError` — If `options` is null or undefined
- `TypeError` — If `themes` is not an array or is empty
- `TypeError` — If any theme is invalid (missing name or tokens)
- `TypeError` — If `storageKey` is an empty string
- `Error` — If `themes` contains duplicate names
- `Error` — If `defaultTheme` doesn't match any theme name

---

## Types

### `ThemeManagerOptions`

```typescript
interface ThemeManagerOptions {
  themes: Theme[]
  defaultTheme?: string
  storageKey?: string
  prefix?: string
  target?: HTMLElement | null
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `themes` | `Theme[]` | Yes | Array of themes to manage. Must have at least one. |
| `defaultTheme` | `string` | No | Name of the initial active theme. Default: first theme in array. |
| `storageKey` | `string` | No | localStorage key for persistence. Omit to disable persistence. |
| `prefix` | `string` | No | CSS variable prefix. Default: `'--color-'`. |
| `target` | `HTMLElement \| null` | No | Element for CSS variable injection. Default: `document.documentElement`. Pass `null` to disable DOM operations (useful for SSR). |

### `ThemeManager`

```typescript
interface ThemeManager {
  // Theme switching
  apply(themeName: string): Theme
  current(): Theme
  currentName(): string

  // Theme registry
  list(): string[]
  get(themeName: string): Theme | undefined
  has(themeName: string): boolean
  register(theme: Theme): void
  unregister(themeName: string): Theme

  // Token access
  getToken(tokenName: string): string | undefined
  getAllTokens(): Record<string, string>
  getCSSVariableName(tokenName: string): string

  // Change notifications
  onChange(callback: ChangeCallback): Unsubscribe

  // System preferences
  prefersDark(): boolean
  prefersLight(): boolean
  onSystemChange(callback: SystemChangeCallback): Unsubscribe
  applySystem(lightThemeName: string, darkThemeName: string): Theme
  watchSystem(lightThemeName: string, darkThemeName: string): Unsubscribe

  // Persistence
  clearStorage(): void

  // Lifecycle
  dispose(): void
}
```

### `ChangeCallback`

```typescript
type ChangeCallback = (newTheme: Theme, previousTheme: Theme) => void
```

### `SystemChangeCallback`

```typescript
type SystemChangeCallback = (scheme: 'dark' | 'light') => void
```

### `Unsubscribe`

```typescript
type Unsubscribe = () => void
```

---

## Configuration Details

### `prefix` Option

The prefix is prepended to CSS variable names. Token names are converted from camelCase to kebab-case.

```typescript
// Default prefix: '--color-'
createThemeManager({ themes, prefix: '--color-' })
// Token 'primaryColor' → CSS var '--color-primary-color'

// Custom prefix
createThemeManager({ themes, prefix: '--theme-' })
// Token 'primaryColor' → CSS var '--theme-primary-color'

// Minimal prefix
createThemeManager({ themes, prefix: '' })
// Token 'primaryColor' → CSS var '--primary-color'
```

### `target` Option

Controls where CSS variables are injected.

```typescript
// Default: document.documentElement (<html>)
createThemeManager({ themes })

// Custom element
const container = document.querySelector('#app')
createThemeManager({ themes, target: container })

// Disable DOM operations (SSR)
createThemeManager({ themes, target: null })
```

### `storageKey` Option

Enables localStorage persistence.

```typescript
// No persistence
createThemeManager({ themes })

// With persistence
createThemeManager({ themes, storageKey: 'my-app-theme' })
```

When enabled:
- On creation: reads and applies saved theme if valid
- On `apply()`: saves theme name to localStorage
- Handles localStorage errors silently (logs warning, continues)

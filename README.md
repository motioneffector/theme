# @motioneffector/theme

Type-safe theme management system with CSS variables, runtime switching, and persistence support. Build applications with dynamic theming using a clean, type-safe API.

[![npm version](https://img.shields.io/npm/v/@motioneffector/theme.svg)](https://www.npmjs.com/package/@motioneffector/theme)
[![license](https://img.shields.io/npm/l/@motioneffector/theme.svg)](https://github.com/motioneffector/theme/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Installation

```bash
npm install @motioneffector/theme
```

## Quick Start

```typescript
import { createTheme, createThemeManager } from '@motioneffector/theme'

// Define your themes
const lightTheme = createTheme({
  name: 'light',
  tokens: {
    background: '#ffffff',
    text: '#1a1a1a',
    primary: '#3b82f6',
    border: '#e5e7eb'
  }
})

const darkTheme = createTheme({
  name: 'dark',
  tokens: {
    background: '#1a1a1a',
    text: '#ffffff',
    primary: '#60a5fa',
    border: '#374151'
  }
})

// Create theme manager
const themeManager = createThemeManager({
  themes: [lightTheme, darkTheme],
  defaultTheme: 'light',
  storageKey: 'app-theme', // Persist user preference
  prefix: '--color-' // CSS variable prefix (default)
})

// Switch themes
themeManager.apply('dark')

// Listen for changes
themeManager.onChange((newTheme, prevTheme) => {
  console.log(`Theme changed: ${prevTheme.name} → ${newTheme.name}`)
})
```

Then in your CSS:

```css
.button {
  background: var(--color-primary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
```

## Features

- **Type-Safe** - Full TypeScript support with complete type definitions
- **CSS Variables** - Automatic generation and injection of CSS custom properties
- **Runtime Switching** - Change themes instantly without page reload
- **Persistence** - Optional localStorage integration for user preferences
- **System Preferences** - Detect and respond to OS dark/light mode
- **Dynamic Registration** - Add or remove themes at runtime
- **Zero Dependencies** - No external runtime dependencies
- **Tree-Shakeable** - ESM build optimized for modern bundlers
- **Framework Agnostic** - Works with React, Vue, Svelte, or vanilla JS

## API Reference

### `createTheme(options)`

Creates an immutable theme object with validation.

**Options:**
- `name` (string) - Unique theme identifier
- `tokens` (Record<string, string>) - Token name to color value map

**Returns:** `Theme`

**Example:**
```typescript
const theme = createTheme({
  name: 'ocean',
  tokens: {
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    background: '#f0f9ff'
  }
})
```

**Token Names:**
- Must be valid JavaScript identifiers
- Support camelCase (`primaryColor`), numbers (`gray100`), underscores (`primary_hover`)
- Converted to kebab-case in CSS (`primaryColor` → `--color-primary-color`)

**Token Values:**
- Any valid CSS color string
- Hex (`#ffffff`), RGB (`rgb(255, 255, 255)`), HSL (`hsl(0, 0%, 100%)`)
- CSS keywords (`transparent`, `currentColor`, `inherit`)
- CSS variables (`var(--other-color)`)
- No validation - invalid values pass through to CSS

---

### `createThemeManager(options)`

Creates a theme manager instance to control theming.

**Options:**
- `themes` (Theme[]) - Array of theme definitions (required)
- `defaultTheme` (string) - Initial theme name (defaults to first theme)
- `storageKey` (string) - localStorage key for persistence (optional)
- `prefix` (string) - CSS variable prefix (default: `'--color-'`)
- `target` (HTMLElement | null) - Target element for CSS vars (default: `document.documentElement`, use `null` for SSR)

**Returns:** `ThemeManager`

**Example:**
```typescript
const manager = createThemeManager({
  themes: [lightTheme, darkTheme],
  defaultTheme: 'light',
  storageKey: 'my-app-theme',
  prefix: '--theme-',
  target: document.documentElement
})
```

---

### Theme Manager Methods

#### `apply(themeName: string): Theme`

Apply a theme by name, updating all CSS variables.

```typescript
const appliedTheme = manager.apply('dark')
```

**Throws:** `Error` if theme doesn't exist

---

#### `current(): Theme`

Returns a copy of the currently active theme.

```typescript
const theme = manager.current()
console.log(theme.name) // 'dark'
console.log(theme.tokens.primary) // '#60a5fa'
```

---

#### `currentName(): string`

Returns the name of the currently active theme.

```typescript
const name = manager.currentName() // 'dark'
```

---

#### `list(): string[]`

Returns all registered theme names in registration order.

```typescript
const themes = manager.list() // ['light', 'dark', 'ocean']
```

---

#### `get(themeName: string): Theme | undefined`

Retrieve a theme by name without applying it.

```typescript
const theme = manager.get('dark')
if (theme) {
  console.log(theme.tokens)
}
```

---

#### `has(themeName: string): boolean`

Check if a theme exists.

```typescript
if (manager.has('dark')) {
  manager.apply('dark')
}
```

---

#### `register(theme: Theme): void`

Register a new theme at runtime.

```typescript
const customTheme = createTheme({
  name: 'custom',
  tokens: { primary: '#ff5722' }
})

manager.register(customTheme)
manager.apply('custom')
```

**Throws:** `Error` if theme name already exists

---

#### `unregister(themeName: string): Theme`

Remove a theme by name and return it.

```typescript
const removed = manager.unregister('custom')
```

**Throws:** `Error` if theme is currently active or doesn't exist

---

#### `onChange(callback: ChangeCallback): Unsubscribe`

Subscribe to theme changes. Returns an unsubscribe function.

```typescript
const unsubscribe = manager.onChange((newTheme, prevTheme) => {
  console.log(`Changed from ${prevTheme.name} to ${newTheme.name}`)
})

// Later: stop listening
unsubscribe()
```

**Note:** Callback does NOT fire on initial manager creation or when applying the already-active theme.

---

#### `clearStorage(): void`

Remove the persisted theme from localStorage.

```typescript
manager.clearStorage()
```

---

### System Preference Detection

#### `prefersDark(): boolean`

Check if the system prefers dark color scheme.

```typescript
if (manager.prefersDark()) {
  manager.apply('dark')
}
```

---

#### `prefersLight(): boolean`

Check if the system prefers light color scheme.

```typescript
if (manager.prefersLight()) {
  manager.apply('light')
}
```

---

#### `onSystemChange(callback: SystemChangeCallback): Unsubscribe`

Listen for system color scheme changes.

```typescript
const unsubscribe = manager.onSystemChange((scheme) => {
  console.log(`System changed to ${scheme} mode`)
  manager.apply(scheme === 'dark' ? 'dark' : 'light')
})
```

---

#### `applySystem(lightThemeName: string, darkThemeName: string): Theme`

Apply a theme based on current system preference.

```typescript
// Apply 'light' or 'dark' based on system
const applied = manager.applySystem('light', 'dark')
```

---

#### `watchSystem(lightThemeName: string, darkThemeName: string): Unsubscribe`

Automatically switch themes when system preference changes.

```typescript
// Set up automatic switching
const unwatch = manager.watchSystem('light', 'dark')

// Stop watching
unwatch()
```

---

### Token Utilities

#### `getToken(tokenName: string): string | undefined`

Get the current value of a token from the active theme.

```typescript
const primaryColor = manager.getToken('primary') // '#60a5fa'
```

---

#### `getAllTokens(): Record<string, string>`

Get all tokens from the active theme as a plain object.

```typescript
const tokens = manager.getAllTokens()
// { background: '#1a1a1a', text: '#ffffff', ... }
```

---

#### `getCSSVariableName(tokenName: string): string`

Get the CSS variable name for a token (useful for inline styles).

```typescript
const varName = manager.getCSSVariableName('primary')
// '--color-primary'

// Use in inline styles
element.style.setProperty(varName, '#ff0000')
```

---

### Cleanup

#### `dispose(): void`

Clean up the manager, removing all CSS variables and listeners. Calling any method after disposal will throw.

```typescript
manager.dispose()
```

---

## Error Handling

```typescript
import { ThemeError } from '@motioneffector/theme'

try {
  manager.apply('nonexistent')
} catch (error) {
  if (error instanceof ThemeError) {
    console.error('Theme error:', error.message)
  }
}
```

All validation errors throw descriptive `TypeError` or `Error` instances.

## Advanced Usage

### Server-Side Rendering (SSR)

Disable DOM operations by setting `target: null`:

```typescript
const manager = createThemeManager({
  themes: [lightTheme, darkTheme],
  target: null // No DOM access
})
```

### Custom CSS Variable Prefix

```typescript
const manager = createThemeManager({
  themes: [lightTheme, darkTheme],
  prefix: '--app-' // Tokens become --app-primary, --app-background, etc.
})
```

### Empty Prefix

```typescript
const manager = createThemeManager({
  themes: [lightTheme, darkTheme],
  prefix: '' // Tokens become --primary, --background, etc.
})
```

### Dynamic Themes

```typescript
// Load themes from API
const themes = await fetch('/api/themes').then(r => r.json())
const manager = createThemeManager({ themes })

// Register user-created theme
const userTheme = createTheme({
  name: 'my-custom',
  tokens: { /* user's colors */ }
})
manager.register(userTheme)
```

### Multiple Managers

Create separate managers for different parts of your app:

```typescript
const headerTheme = createThemeManager({
  themes: [light, dark],
  prefix: '--header-',
  target: document.getElementById('header')
})

const mainTheme = createThemeManager({
  themes: [light, dark],
  prefix: '--main-',
  target: document.getElementById('main')
})
```

## Demo

[Try the interactive demo](https://motioneffector.github.io/theme/demo.html)

## Browser Support

Works in all modern browsers supporting ES2022 and CSS custom properties:
- Chrome/Edge 88+
- Firefox 87+
- Safari 14+

For older browsers, transpile with your build tool.

## TypeScript

Full TypeScript support included. All types are exported:

```typescript
import type {
  Theme,
  ThemeManager,
  ThemeManagerOptions,
  ChangeCallback,
  SystemChangeCallback,
  Unsubscribe
} from '@motioneffector/theme'
```

## License

MIT © [MotionEffector](https://github.com/motioneffector)

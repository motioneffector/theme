# Design Tokens

Design tokens are the atomic values that make up a theme—the individual colors, sizes, and styles that define your visual language. In this library, tokens are defined in JavaScript and automatically converted to CSS custom properties.

## How It Works

When you define a theme, you specify tokens as an object with camelCase keys:

```typescript
tokens: {
  primaryColor: '#007bff',
  textMuted: '#6c757d',
  borderRadius: '4px'
}
```

The theme manager converts these to CSS variables using a prefix (default `--color-`) and kebab-case conversion:

```
JavaScript Token          CSS Variable
─────────────────────     ─────────────────────────
primaryColor         →    --color-primary-color
textMuted            →    --color-text-muted
borderRadius         →    --color-border-radius
```

## Basic Usage

```typescript
import { createTheme, createThemeManager } from '@motioneffector/theme'

const theme = createTheme({
  name: 'default',
  tokens: {
    background: '#ffffff',
    foreground: '#1a1a1a',
    primaryColor: '#007bff',
    borderRadius: '8px',
    shadowMedium: '0 4px 6px rgba(0, 0, 0, 0.1)'
  }
})

const manager = createThemeManager({ themes: [theme] })
```

Use the variables in your CSS:

```css
.card {
  background: var(--color-background);
  color: var(--color-foreground);
  border-radius: var(--color-border-radius);
  box-shadow: var(--color-shadow-medium);
}

.button {
  background: var(--color-primary-color);
}
```

## Key Points

- **camelCase to kebab-case** — Token names are converted: `primaryColor` becomes `primary-color` in the CSS variable name.

- **Prefix is configurable** — Default is `--color-`. Change it with the `prefix` option: `prefix: '--theme-'` gives you `--theme-primary-color`.

- **Any CSS value works** — Colors, sizes, shadows, fonts, transitions—if it's a valid CSS value string, it works as a token.

- **Token names are validated** — Names must be valid JavaScript identifiers in camelCase. No spaces, no hyphens, no leading numbers. `gray100` is fine; `100gray` is not.

- **Access tokens at runtime** — Use `getToken()` to get a value, `getAllTokens()` to get all values, or `getCSSVariableName()` to get the variable name for use in JavaScript.

## Examples

### Naming Conventions

```typescript
// These token names are VALID
const validTokens = {
  primary: '#007bff',
  primaryColor: '#007bff',
  gray100: '#f8f9fa',
  textXl: '1.25rem',
  shadow_large: '0 10px 40px rgba(0,0,0,0.2)'  // underscores allowed
}

// These token names are INVALID
const invalidTokens = {
  'primary-color': '#007bff',  // No hyphens
  '100gray': '#f8f9fa',        // No leading numbers
  'text color': '#000',        // No spaces
}
```

### Accessing Tokens at Runtime

```typescript
const manager = createThemeManager({
  themes: [theme],
  prefix: '--color-'
})

// Get a single token value
const primary = manager.getToken('primaryColor')
// Returns: '#007bff'

// Get all tokens
const all = manager.getAllTokens()
// Returns: { background: '#fff', primaryColor: '#007bff', ... }

// Get the CSS variable name
const varName = manager.getCSSVariableName('primaryColor')
// Returns: '--color-primary-color'
```

### Using Different Prefixes

```typescript
// Default prefix
createThemeManager({ themes, prefix: '--color-' })
// primaryColor → --color-primary-color

// Custom prefix
createThemeManager({ themes, prefix: '--theme-' })
// primaryColor → --theme-primary-color

// No prefix (just --)
createThemeManager({ themes, prefix: '' })
// primaryColor → --primary-color
```

### Case Conversion Details

```typescript
// Simple camelCase
'primary'       → 'primary'
'primaryColor'  → 'primary-color'
'backgroundColor' → 'background-color'

// With numbers (not separated)
'gray100'       → 'gray100'

// With underscores (preserved)
'primary_hover' → 'primary_hover'

// Consecutive capitals (each gets a dash)
'BGColor'       → 'b-g-color'
'textXL'        → 'text-x-l'
```

## Related

- **[Themes](Concept-Themes)** — Tokens live inside themes
- **[Runtime Token Access](Guide-Runtime-Token-Access)** — Access tokens in JavaScript
- **[API: Token Access](API-Token-Access)** — Full method reference

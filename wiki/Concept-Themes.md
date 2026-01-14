# Themes

A theme is a named collection of design tokens—the colors, spacing, typography values, or any CSS property your application needs. Think of a theme as a skin for your app: swap the theme, and the entire look changes.

## How It Works

Themes are simple objects with two properties:

- **name** — A unique identifier for the theme (e.g., `'light'`, `'dark'`, `'ocean'`)
- **tokens** — An object containing your design values as key-value pairs

When you switch themes, the [Theme Manager](Concept-Theme-Manager) swaps out all the CSS variables to match the new theme's tokens. Your CSS doesn't change—only the values behind the variables.

```
Theme A                          Theme B
┌──────────────────┐             ┌──────────────────┐
│ name: 'light'    │             │ name: 'dark'     │
│ tokens:          │   switch    │ tokens:          │
│   background: #fff│ ────────► │   background: #1a1a│
│   text: #000     │             │   text: #fff     │
└──────────────────┘             └──────────────────┘
         │                                │
         ▼                                ▼
   --color-background: #fff       --color-background: #1a1a
   --color-text: #000             --color-text: #fff
```

## Basic Usage

```typescript
import { createTheme } from '@motioneffector/theme'

const ocean = createTheme({
  name: 'ocean',
  tokens: {
    background: '#e3f2fd',
    text: '#0d47a1',
    primary: '#1976d2',
    accent: '#00bcd4'
  }
})
```

The `createTheme()` function validates your input and returns a frozen (immutable) theme object. Once created, a theme cannot be modified.

## Key Points

- **Themes are immutable** — After creation, the name and tokens cannot be changed. This prevents accidental modifications and makes themes predictable.

- **Token names must be valid** — Use camelCase identifiers: no spaces, no hyphens, and don't start with numbers. `primaryColor` is valid; `primary-color` and `1stColor` are not.

- **Token values are strings** — Any valid CSS value works: colors (`#fff`, `rgb(0,0,0)`, `hsl(200, 50%, 50%)`), sizes (`16px`, `1rem`), or complex values (`0 2px 4px rgba(0,0,0,0.1)`).

- **Themes should share token names** — If your light theme has `background`, `text`, and `primary`, your dark theme should too. This keeps your CSS consistent across themes.

## Examples

### Multiple Color Schemes

```typescript
import { createTheme } from '@motioneffector/theme'

const light = createTheme({
  name: 'light',
  tokens: {
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#212121',
    textMuted: '#757575',
    primary: '#1976d2',
    error: '#d32f2f'
  }
})

const dark = createTheme({
  name: 'dark',
  tokens: {
    background: '#121212',
    surface: '#1e1e1e',
    text: '#e0e0e0',
    textMuted: '#9e9e9e',
    primary: '#90caf9',
    error: '#ef5350'
  }
})
```

### Brand Themes

```typescript
import { createTheme } from '@motioneffector/theme'

const corporate = createTheme({
  name: 'corporate',
  tokens: {
    primary: '#003366',
    secondary: '#336699',
    accent: '#ff9900'
  }
})

const playful = createTheme({
  name: 'playful',
  tokens: {
    primary: '#ff6b6b',
    secondary: '#4ecdc4',
    accent: '#ffe66d'
  }
})
```

## Related

- **[Design Tokens](Concept-Design-Tokens)** — How tokens become CSS variables
- **[Theme Manager](Concept-Theme-Manager)** — Manages themes and handles switching
- **[Adding Dark Mode](Guide-Adding-Dark-Mode)** — Step-by-step guide to implement theming
- **[API: Theme Creation](API-Theme-Creation)** — Full `createTheme()` reference

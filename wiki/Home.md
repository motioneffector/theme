# @motioneffector/theme

@motioneffector/theme bridges your design tokens and CSS custom properties, enabling instant theme switching without page reloads or class juggling. Define your themes once as JavaScript objects, and the library handles injecting CSS variables, persisting user preferences, and responding to system dark mode—all with zero dependencies and full TypeScript support.

## I want to...

| Goal | Where to go |
|------|-------------|
| Get up and running quickly | [Your First Theme Switch](Your-First-Theme-Switch) |
| Understand how themes work | [Themes](Concept-Themes) |
| Add dark mode to my app | [Adding Dark Mode](Guide-Adding-Dark-Mode) |
| Remember the user's preference | [Persisting Theme Choice](Guide-Persisting-Theme-Choice) |
| Respond to system preferences | [System Preference Detection](Guide-System-Preference-Detection) |
| Access tokens in JavaScript | [Runtime Token Access](Guide-Runtime-Token-Access) |
| Look up a specific method | [API Reference](API-Theme-Creation) |

## Key Concepts

### Themes

A theme is a named collection of design tokens—key-value pairs that define colors, spacing, typography, or any CSS value. You create themes with `createTheme()` and switch between them at runtime.

### Theme Manager

The theme manager is the central controller. It holds your themes, tracks which one is active, injects CSS variables into the DOM, and optionally persists the user's choice to localStorage.

### Design Tokens

Tokens are the individual values within a theme. Define them in camelCase (`primaryColor`) and they automatically become kebab-case CSS variables (`--color-primary-color`).

## Quick Example

```typescript
import { createTheme, createThemeManager } from '@motioneffector/theme'

// Define themes
const light = createTheme({
  name: 'light',
  tokens: {
    background: '#ffffff',
    text: '#1a1a1a',
    primary: '#007bff'
  }
})

const dark = createTheme({
  name: 'dark',
  tokens: {
    background: '#1a1a1a',
    text: '#ffffff',
    primary: '#0d6efd'
  }
})

// Create manager
const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light',
  storageKey: 'app-theme'
})

// Switch themes
document.querySelector('#toggle').addEventListener('click', () => {
  const next = manager.currentName() === 'light' ? 'dark' : 'light'
  manager.apply(next)
})
```

Use the CSS variables in your styles:

```css
body {
  background: var(--color-background);
  color: var(--color-text);
}

button {
  background: var(--color-primary);
}
```

---

**[Full API Reference →](API-Theme-Creation)**

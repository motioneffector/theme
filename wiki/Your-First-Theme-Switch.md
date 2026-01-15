# Your First Theme Switch

Build a working light/dark theme toggle in about 5 minutes.

By the end of this guide, you'll have CSS variables that update instantly when users switch themes, with their preference saved to localStorage.

## What We're Building

A simple page with a toggle button that switches between light and dark themes. The colors update immediately—no page reload required.

## Step 1: Define Your Themes

Themes are objects with a name and a set of tokens (design values). Both themes should use the same token names so your CSS works with either.

```typescript
import { createTheme } from '@motioneffector/theme'

const light = createTheme({
  name: 'light',
  tokens: {
    background: '#ffffff',
    text: '#1a1a1a',
    primary: '#007bff',
    border: '#e0e0e0'
  }
})

const dark = createTheme({
  name: 'dark',
  tokens: {
    background: '#1a1a1a',
    text: '#f0f0f0',
    primary: '#0d6efd',
    border: '#333333'
  }
})
```

Token names are validated: use camelCase, no spaces, no hyphens, and don't start with a number.

## Step 2: Create the Theme Manager

The theme manager holds your themes and handles switching between them. Pass it an array of themes and optionally specify which should be active by default.

```typescript
import { createThemeManager } from '@motioneffector/theme'

const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light',
  storageKey: 'my-app-theme'
})
```

The `storageKey` option enables persistence—the user's choice is saved to localStorage and restored on page load.

## Step 3: Use the CSS Variables

When the manager is created, it immediately injects CSS variables into `document.documentElement`. Token names are converted to kebab-case with a `--color-` prefix:

- `background` → `--color-background`
- `primary` → `--color-primary`

Use them in your CSS:

```css
body {
  background-color: var(--color-background);
  color: var(--color-text);
}

.button {
  background-color: var(--color-primary);
  border: 1px solid var(--color-border);
}
```

## Step 4: Wire Up the Toggle

Call `apply()` with a theme name to switch themes. The CSS variables update instantly.

```typescript
const toggle = document.querySelector('#theme-toggle')

toggle.addEventListener('click', () => {
  const next = manager.currentName() === 'light' ? 'dark' : 'light'
  manager.apply(next)
})
```

## The Complete Code

Here's everything together:

```typescript
import { createTheme, createThemeManager } from '@motioneffector/theme'

// 1. Define themes
const light = createTheme({
  name: 'light',
  tokens: {
    background: '#ffffff',
    text: '#1a1a1a',
    primary: '#007bff',
    border: '#e0e0e0'
  }
})

const dark = createTheme({
  name: 'dark',
  tokens: {
    background: '#1a1a1a',
    text: '#f0f0f0',
    primary: '#0d6efd',
    border: '#333333'
  }
})

// 2. Create manager
const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light',
  storageKey: 'my-app-theme'
})

// 3. Toggle on button click
document.querySelector('#theme-toggle').addEventListener('click', () => {
  const next = manager.currentName() === 'light' ? 'dark' : 'light'
  manager.apply(next)
})
```

```css
body {
  background-color: var(--color-background);
  color: var(--color-text);
  transition: background-color 0.2s, color 0.2s;
}

.button {
  background-color: var(--color-primary);
  color: white;
  border: 1px solid var(--color-border);
}
```

## What's Next?

Now that you have the basics:

- **[Understand Themes better](Concept-Themes)** — Learn how themes work under the hood
- **[Respond to system preferences](Guide-System-Preference-Detection)** — Automatically match the user's OS setting
- **[Listen for theme changes](Guide-Listening-For-Theme-Changes)** — Update non-CSS elements when the theme changes
- **[Explore the API](API-Theme-Creation)** — Full reference when you need details

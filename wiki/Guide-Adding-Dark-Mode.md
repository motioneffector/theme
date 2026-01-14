# Adding Dark Mode

Add light/dark mode switching to your application with instant visual updates and optional persistence.

## Prerequisites

Before starting, you should:

- Have @motioneffector/theme [installed](Installation)
- Understand the basics of [themes](Concept-Themes)

## Overview

We'll add dark mode by:

1. Defining light and dark themes with matching token names
2. Creating a theme manager
3. Wiring up a toggle control
4. Styling with CSS variables

## Step 1: Define Your Themes

Create two themes with the same token names but different values. This ensures your CSS works with either theme.

```typescript
import { createTheme } from '@motioneffector/theme'

const light = createTheme({
  name: 'light',
  tokens: {
    background: '#ffffff',
    backgroundAlt: '#f8f9fa',
    text: '#212529',
    textMuted: '#6c757d',
    primary: '#0d6efd',
    primaryHover: '#0b5ed7',
    border: '#dee2e6'
  }
})

const dark = createTheme({
  name: 'dark',
  tokens: {
    background: '#121212',
    backgroundAlt: '#1e1e1e',
    text: '#e9ecef',
    textMuted: '#adb5bd',
    primary: '#6ea8fe',
    primaryHover: '#8bb9fe',
    border: '#495057'
  }
})
```

## Step 2: Create the Theme Manager

Initialize the manager with both themes. Add `storageKey` if you want the preference to persist.

```typescript
import { createThemeManager } from '@motioneffector/theme'

const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light',
  storageKey: 'theme-preference'
})
```

## Step 3: Add the Toggle

Wire up a button to switch between themes.

```typescript
const toggleButton = document.querySelector('#theme-toggle')

toggleButton.addEventListener('click', () => {
  const next = manager.currentName() === 'light' ? 'dark' : 'light'
  manager.apply(next)
})

// Update button text to show current state
manager.onChange((newTheme) => {
  toggleButton.textContent = newTheme.name === 'light' ? '🌙' : '☀️'
})
```

## Step 4: Use CSS Variables

Write your styles using CSS variables. They update automatically when themes switch.

```css
body {
  background-color: var(--color-background);
  color: var(--color-text);
}

.card {
  background-color: var(--color-background-alt);
  border: 1px solid var(--color-border);
}

.text-muted {
  color: var(--color-text-muted);
}

.btn-primary {
  background-color: var(--color-primary);
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}
```

## Complete Example

```typescript
import { createTheme, createThemeManager } from '@motioneffector/theme'

// Define themes
const light = createTheme({
  name: 'light',
  tokens: {
    background: '#ffffff',
    backgroundAlt: '#f8f9fa',
    text: '#212529',
    textMuted: '#6c757d',
    primary: '#0d6efd',
    border: '#dee2e6'
  }
})

const dark = createTheme({
  name: 'dark',
  tokens: {
    background: '#121212',
    backgroundAlt: '#1e1e1e',
    text: '#e9ecef',
    textMuted: '#adb5bd',
    primary: '#6ea8fe',
    border: '#495057'
  }
})

// Create manager with persistence
const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light',
  storageKey: 'theme-preference'
})

// Toggle button
const toggle = document.querySelector('#theme-toggle')

toggle.addEventListener('click', () => {
  manager.apply(manager.currentName() === 'light' ? 'dark' : 'light')
})
```

## Variations

### Dropdown Selector

Use a dropdown for more than two themes.

```typescript
const selector = document.querySelector('#theme-selector') as HTMLSelectElement

// Populate options
manager.list().forEach(name => {
  const option = document.createElement('option')
  option.value = name
  option.textContent = name.charAt(0).toUpperCase() + name.slice(1)
  selector.appendChild(option)
})

// Set current value
selector.value = manager.currentName()

// Handle changes
selector.addEventListener('change', () => {
  manager.apply(selector.value)
})
```

### Three-Way Toggle (Light / Dark / System)

Let users choose between explicit themes or following the system.

```typescript
type Preference = 'light' | 'dark' | 'system'

let unwatchSystem: (() => void) | null = null

function setPreference(pref: Preference) {
  unwatchSystem?.()
  unwatchSystem = null

  if (pref === 'system') {
    unwatchSystem = manager.watchSystem('light', 'dark')
  } else {
    manager.apply(pref)
  }

  localStorage.setItem('theme-mode', pref)
}

// Restore on load
const saved = localStorage.getItem('theme-mode') as Preference | null
setPreference(saved ?? 'system')
```

## Troubleshooting

### Theme doesn't apply on page load

**Symptom:** Page flashes the default theme before applying the saved preference.

**Cause:** JavaScript loads after the page renders.

**Solution:** Add a blocking script in `<head>` that applies a class before render:

```html
<script>
  const saved = localStorage.getItem('theme-preference')
  if (saved === 'dark') {
    document.documentElement.classList.add('dark-loading')
  }
</script>
```

Then initialize the theme manager normally—it will replace the CSS variables.

### CSS variables not updating

**Symptom:** Calling `apply()` doesn't change the colors.

**Cause:** CSS isn't using the variables, or the wrong prefix.

**Solution:** Check that your CSS uses `var(--color-...)` and matches the manager's prefix (default: `--color-`).

## See Also

- **[Persisting Theme Choice](Guide-Persisting-Theme-Choice)** — Save preferences across sessions
- **[System Preference Detection](Guide-System-Preference-Detection)** — Respect OS dark mode
- **[API: Theme Switching](API-Theme-Switching)** — `apply()`, `current()`, `currentName()` reference

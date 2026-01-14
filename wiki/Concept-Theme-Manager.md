# Theme Manager

The theme manager is your control center for theming. It holds all registered themes, tracks which one is active, injects CSS variables into the DOM, and optionally handles persistence and system preference detection.

## How It Works

Create a theme manager once at app initialization. It immediately applies the default theme's CSS variables and restores any saved preference from localStorage.

```
                    Theme Manager
                  ┌─────────────────────────────────────┐
                  │                                     │
  Themes ────────►│  Registry: [light, dark, ocean]    │
                  │                                     │
                  │  Active: 'dark'                    │◄──── apply('dark')
                  │                                     │
                  │  Persistence: localStorage          │
                  │  System Detection: dark mode        │
                  │                                     │
                  └──────────────┬──────────────────────┘
                                 │
                                 ▼
                    CSS Variables on <html>
                    --color-background: #1a1a
                    --color-text: #fff
                    --color-primary: #0d6efd
```

The manager:

1. Validates and stores your themes
2. Applies the default theme immediately
3. Restores saved preferences (if `storageKey` is set)
4. Provides methods to switch themes, query state, and subscribe to changes

## Basic Usage

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

// Switch themes
manager.apply('dark')

// Query current state
console.log(manager.currentName()) // 'dark'
console.log(manager.list())        // ['light', 'dark']
```

## Key Points

- **Create once, use everywhere** — The manager is typically a singleton. Create it at app startup and import it where needed.

- **CSS variables are injected automatically** — When created, the manager sets CSS variables on `document.documentElement`. Switch themes, and the variables update immediately.

- **Persistence is opt-in** — Pass a `storageKey` to save the user's preference. Without it, themes reset on page reload.

- **Cleanup is your responsibility** — In single-page apps, call `dispose()` when the manager is no longer needed. This removes CSS variables and cleans up event listeners.

- **The prefix customizes variable names** — Default is `--color-`. A token named `primary` becomes `--color-primary`. Set `prefix: '--theme-'` to get `--theme-primary` instead.

## Examples

### Basic Setup

```typescript
import { createTheme, createThemeManager } from '@motioneffector/theme'

const manager = createThemeManager({
  themes: [lightTheme, darkTheme],
  defaultTheme: 'light'
})
```

### With Persistence

```typescript
import { createThemeManager } from '@motioneffector/theme'

const manager = createThemeManager({
  themes: [light, dark],
  storageKey: 'user-theme-preference'
})

// Theme is automatically restored on page load
// User's choice is saved whenever apply() is called
```

### With System Preference Detection

```typescript
import { createThemeManager } from '@motioneffector/theme'

const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light'
})

// Apply theme based on OS setting
manager.applySystem('light', 'dark')

// Or watch for changes continuously
const unwatch = manager.watchSystem('light', 'dark')
```

### Custom Target Element

```typescript
import { createThemeManager } from '@motioneffector/theme'

// Inject CSS variables into a specific element instead of <html>
const container = document.querySelector('#app')

const manager = createThemeManager({
  themes: [light, dark],
  target: container
})
```

### SSR / No DOM

```typescript
import { createThemeManager } from '@motioneffector/theme'

// Pass null to disable DOM operations (useful for SSR)
const manager = createThemeManager({
  themes: [light, dark],
  target: null
})
```

## Related

- **[Themes](Concept-Themes)** — What the manager manages
- **[Persisting Theme Choice](Guide-Persisting-Theme-Choice)** — Save user preferences
- **[System Preference Detection](Guide-System-Preference-Detection)** — Respond to OS dark mode
- **[API: Theme Manager Creation](API-Theme-Manager-Creation)** — Full configuration options

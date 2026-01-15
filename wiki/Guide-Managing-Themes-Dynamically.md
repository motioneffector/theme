# Managing Themes Dynamically

Add, remove, or swap themes at runtime without recreating the theme manager.

## Prerequisites

Before starting, you should:

- Have a [theme manager created](Your-First-Theme-Switch)
- Understand [Themes](Concept-Themes) and the [Theme Manager](Concept-Theme-Manager)

## Overview

We'll manage themes dynamically by:

1. Registering new themes with `register()`
2. Removing themes with `unregister()`
3. Checking theme availability with `has()` and `get()`

## Step 1: Register New Themes

Use `register()` to add a theme to the manager after creation.

```typescript
import { createTheme, createThemeManager } from '@motioneffector/theme'

const manager = createThemeManager({
  themes: [light, dark]
})

// Add a new theme at runtime
const ocean = createTheme({
  name: 'ocean',
  tokens: {
    background: '#e3f2fd',
    text: '#0d47a1',
    primary: '#1976d2'
  }
})

manager.register(ocean)

// Now you can use it
manager.apply('ocean')
```

The theme is immediately available—no need to recreate the manager.

## Step 2: Remove Themes

Use `unregister()` to remove a theme from the manager.

```typescript
// Remove the ocean theme
const removed = manager.unregister('ocean')
// Returns the removed theme object

console.log(manager.has('ocean'))  // false
```

Constraints:
- Cannot unregister the currently active theme
- Cannot unregister if it would leave zero themes

```typescript
// This throws - ocean is active
manager.apply('ocean')
manager.unregister('ocean')  // Error!

// Switch first, then unregister
manager.apply('light')
manager.unregister('ocean')  // Works
```

## Step 3: Check Theme Availability

Use `has()` to check if a theme exists, and `get()` to retrieve it.

```typescript
// Check existence
if (manager.has('ocean')) {
  manager.apply('ocean')
}

// Get theme details
const theme = manager.get('ocean')
if (theme) {
  console.log(theme.tokens)
}

// List all themes
const themes = manager.list()
// Returns: ['light', 'dark', 'ocean']
```

## Complete Example

```typescript
import { createTheme, createThemeManager } from '@motioneffector/theme'

const light = createTheme({
  name: 'light',
  tokens: { background: '#fff', text: '#000', primary: '#0d6efd' }
})

const dark = createTheme({
  name: 'dark',
  tokens: { background: '#1a1a1a', text: '#fff', primary: '#6ea8fe' }
})

const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light'
})

// Theme builder UI
function addCustomTheme(name: string, colors: { bg: string; text: string; primary: string }) {
  // Validate name is unique
  if (manager.has(name)) {
    throw new Error(`Theme "${name}" already exists`)
  }

  const theme = createTheme({
    name,
    tokens: {
      background: colors.bg,
      text: colors.text,
      primary: colors.primary
    }
  })

  manager.register(theme)
  return theme
}

function removeCustomTheme(name: string) {
  // Don't allow removing built-in themes
  if (name === 'light' || name === 'dark') {
    throw new Error('Cannot remove built-in themes')
  }

  // Switch away if this is active
  if (manager.currentName() === name) {
    manager.apply('light')
  }

  return manager.unregister(name)
}

// Usage
const custom = addCustomTheme('sunset', {
  bg: '#fff5e6',
  text: '#5d4037',
  primary: '#ff7043'
})

manager.apply('sunset')
```

## Variations

### User-Created Themes

Let users create and save their own themes.

```typescript
interface UserThemeData {
  name: string
  tokens: Record<string, string>
}

function saveUserThemes() {
  const themes = manager.list()
    .filter(name => name !== 'light' && name !== 'dark')
    .map(name => manager.get(name))
    .filter(Boolean)

  localStorage.setItem('custom-themes', JSON.stringify(themes))
}

function loadUserThemes() {
  const saved = localStorage.getItem('custom-themes')
  if (!saved) return

  const themes: UserThemeData[] = JSON.parse(saved)

  themes.forEach(data => {
    try {
      const theme = createTheme(data)
      manager.register(theme)
    } catch (e) {
      console.warn(`Failed to load theme "${data.name}":`, e)
    }
  })
}

// Load on startup
loadUserThemes()
```

### Theme Loading from API

Fetch themes from a server.

```typescript
interface ThemeResponse {
  name: string
  tokens: Record<string, string>
}

async function loadRemoteThemes() {
  const response = await fetch('/api/themes')
  const themes: ThemeResponse[] = await response.json()

  themes.forEach(data => {
    if (!manager.has(data.name)) {
      const theme = createTheme(data)
      manager.register(theme)
    }
  })
}

// Refresh button
document.querySelector('#refresh-themes').addEventListener('click', async () => {
  await loadRemoteThemes()
  updateThemeSelector()
})
```

### Dynamic Theme Selector

Keep a dropdown in sync with available themes.

```typescript
const selector = document.querySelector('#theme-selector') as HTMLSelectElement

function updateThemeSelector() {
  selector.innerHTML = ''

  manager.list().forEach(name => {
    const option = document.createElement('option')
    option.value = name
    option.textContent = name
    option.selected = name === manager.currentName()
    selector.appendChild(option)
  })
}

selector.addEventListener('change', () => {
  manager.apply(selector.value)
})

// Initial render
updateThemeSelector()
```

## Troubleshooting

### Cannot register theme with same name

**Symptom:** `register()` throws "already exists" error.

**Cause:** A theme with that name is already registered.

**Solution:** Check with `has()` first, or unregister the existing theme.

### Cannot unregister active theme

**Symptom:** `unregister()` throws an error.

**Cause:** The theme you're trying to remove is currently active.

**Solution:** Apply a different theme first, then unregister.

### Cannot unregister last theme

**Symptom:** `unregister()` throws "only theme" error.

**Cause:** The manager must always have at least one theme.

**Solution:** Register another theme first, or keep built-in themes.

## See Also

- **[Themes](Concept-Themes)** — How themes work
- **[Listening for Theme Changes](Guide-Listening-For-Theme-Changes)** — React to dynamic changes
- **[API: Theme Registry](API-Theme-Registry)** — Full method reference

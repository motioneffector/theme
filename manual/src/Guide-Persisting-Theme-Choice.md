# Persisting Theme Choice

Remember the user's theme selection across page reloads and browser sessions using localStorage.

## Prerequisites

Before starting, you should:

- Have a [working theme setup](Your-First-Theme-Switch)
- Understand the [Theme Manager](Concept-Theme-Manager)

## Overview

We'll enable persistence by:

1. Adding a `storageKey` to the theme manager
2. Understanding automatic restoration
3. Clearing stored preferences when needed

## Step 1: Add the Storage Key

Pass a `storageKey` option when creating the theme manager. This string becomes the localStorage key.

```typescript
import { createThemeManager } from '@motioneffector/theme'

const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light',
  storageKey: 'my-app-theme'
})
```

That's it. The manager now:

- Saves the theme name to localStorage whenever `apply()` is called
- Restores the saved theme on initialization (if it exists and is valid)

## Step 2: Understand the Restoration Flow

When the manager is created with a `storageKey`:

1. It applies the `defaultTheme` immediately
2. It checks localStorage for a saved value
3. If found and valid, it applies that theme instead

```
Manager Created
      │
      ▼
Apply defaultTheme ('light')
      │
      ▼
Check localStorage['my-app-theme']
      │
      ├─► Value: 'dark' (exists in themes) ──► Apply 'dark'
      │
      ├─► Value: 'ocean' (not in themes) ──► Keep 'light'
      │
      └─► No value stored ──► Keep 'light'
```

## Step 3: Clear Storage When Needed

Use `clearStorage()` to remove the saved preference without changing the current theme.

```typescript
// Remove saved preference
manager.clearStorage()

// Next page load will use defaultTheme
```

This is useful for "Reset to default" features or when unregistering themes.

## Complete Example

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
  storageKey: 'user-theme'
})

// Toggle button
document.querySelector('#toggle').addEventListener('click', () => {
  manager.apply(manager.currentName() === 'light' ? 'dark' : 'light')
  // Preference is automatically saved
})

// Reset button
document.querySelector('#reset').addEventListener('click', () => {
  manager.clearStorage()
  manager.apply('light')
})
```

## Variations

### Custom Storage Key Naming

Use a namespaced key to avoid collisions with other libraries or apps.

```typescript
const manager = createThemeManager({
  themes: [light, dark],
  storageKey: 'myapp:preferences:theme'
})
```

Or include a version to reset preferences after design changes:

```typescript
const manager = createThemeManager({
  themes: [light, dark],
  storageKey: 'myapp-theme-v2'
})
```

### Handling Storage Errors

localStorage can throw errors (private browsing, quota exceeded). The manager handles these silently—it logs a warning and continues without persistence.

If you need to know when storage fails:

```typescript
// Check if storage is available
function isStorageAvailable(): boolean {
  try {
    const key = '__storage_test__'
    localStorage.setItem(key, key)
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

if (!isStorageAvailable()) {
  console.log('Theme preference will not be saved')
}
```

### Combining with System Preference

When using both persistence and system preference detection, decide which takes priority:

```typescript
// Option A: Saved preference wins
const manager = createThemeManager({
  themes: [light, dark],
  storageKey: 'theme'
})

// Only use system preference if nothing is saved
if (!localStorage.getItem('theme')) {
  manager.applySystem('light', 'dark')
}
```

```typescript
// Option B: Three-way toggle (explicit light, explicit dark, or system)
const modeKey = 'theme-mode'
const themeKey = 'theme-value'

const mode = localStorage.getItem(modeKey) ?? 'system'

if (mode === 'system') {
  manager.watchSystem('light', 'dark')
} else {
  // Theme already restored by manager via storageKey
}
```

## Troubleshooting

### Saved theme not restored

**Symptom:** The default theme always appears on page load.

**Cause:** The saved theme name doesn't match any registered theme.

**Solution:** Check that theme names match exactly (case-sensitive). If you renamed a theme, saved values won't match.

### Storage quota exceeded

**Symptom:** Console warning about storage errors.

**Cause:** localStorage is full or unavailable.

**Solution:** The manager continues working without persistence. Consider using shorter storage keys or clearing old data.

## See Also

- **[System Preference Detection](Guide-System-Preference-Detection)** — Combine with OS dark mode
- **[API: Persistence](API-Persistence)** — `clearStorage()` reference
- **[Theme Manager](Concept-Theme-Manager)** — How persistence fits in

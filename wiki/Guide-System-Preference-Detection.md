# System Preference Detection

Automatically match the user's operating system color scheme preference for a seamless experience.

## Prerequisites

Before starting, you should:

- Have [light and dark themes defined](Guide-Adding-Dark-Mode)
- Understand [System Preferences](Concept-System-Preferences)

## Overview

We'll detect system preferences by:

1. Checking the current preference
2. Applying the matching theme
3. Watching for preference changes
4. Combining with user overrides

## Step 1: Check the Current Preference

Use `prefersDark()` or `prefersLight()` to check what the user's OS is set to.

```typescript
import { createThemeManager } from '@motioneffector/theme'

const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light'
})

if (manager.prefersDark()) {
  console.log('User prefers dark mode')
} else {
  console.log('User prefers light mode')
}
```

These methods check the current state—they don't watch for changes.

## Step 2: Apply the Matching Theme

Use `applySystem()` to apply the appropriate theme based on the current preference.

```typescript
// Apply light theme if system is light, dark theme if system is dark
manager.applySystem('light', 'dark')
```

This is a one-time application. If the user changes their OS setting while your app is open, nothing happens.

## Step 3: Watch for Changes

Use `watchSystem()` to automatically switch themes when the system preference changes.

```typescript
// Apply immediately AND watch for changes
const unwatch = manager.watchSystem('light', 'dark')

// Stop watching later (e.g., on component unmount)
unwatch()
```

`watchSystem()` does two things:
1. Applies the matching theme immediately
2. Sets up a listener that applies the matching theme whenever the preference changes

## Step 4: Combine with User Overrides

Most apps let users override the system preference. Here's a three-way toggle pattern.

```typescript
type ThemeMode = 'light' | 'dark' | 'system'

let currentMode: ThemeMode = 'system'
let unwatchSystem: (() => void) | null = null

function setThemeMode(mode: ThemeMode) {
  // Clean up previous watcher
  unwatchSystem?.()
  unwatchSystem = null

  if (mode === 'system') {
    // Watch system and apply matching theme
    unwatchSystem = manager.watchSystem('light', 'dark')
  } else {
    // Apply explicit theme
    manager.apply(mode)
  }

  currentMode = mode
  localStorage.setItem('theme-mode', mode)
}

// Restore on page load
const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null
setThemeMode(savedMode ?? 'system')
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
  tokens: { background: '#121212', text: '#fff', primary: '#6ea8fe' }
})

const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light'
})

// Three-way toggle
type ThemeMode = 'light' | 'dark' | 'system'

let unwatchSystem: (() => void) | null = null

function setThemeMode(mode: ThemeMode) {
  unwatchSystem?.()
  unwatchSystem = null

  if (mode === 'system') {
    unwatchSystem = manager.watchSystem('light', 'dark')
  } else {
    manager.apply(mode)
  }

  localStorage.setItem('theme-mode', mode)
  updateUI(mode)
}

function updateUI(mode: ThemeMode) {
  document.querySelectorAll('[data-theme-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeMode === mode)
  })
}

// Button handlers
document.querySelectorAll('[data-theme-mode]').forEach(btn => {
  btn.addEventListener('click', () => {
    setThemeMode(btn.dataset.themeMode as ThemeMode)
  })
})

// Initialize
const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null
setThemeMode(savedMode ?? 'system')
```

```html
<div class="theme-controls">
  <button data-theme-mode="light">Light</button>
  <button data-theme-mode="dark">Dark</button>
  <button data-theme-mode="system">System</button>
</div>
```

## Variations

### One-Time Detection Only

Apply system preference on load but don't watch for changes.

```typescript
manager.applySystem('light', 'dark')
// User must reload to pick up OS changes
```

### Listen Without Applying

Get notified of changes without automatic theme application.

```typescript
const unsubscribe = manager.onSystemChange((scheme) => {
  console.log(`System changed to ${scheme}`)
  // Decide whether to apply
  if (userPreference === 'system') {
    manager.apply(scheme === 'dark' ? 'dark' : 'light')
  }
})
```

### SSR / Server Rendering

In SSR environments, system detection isn't available. Fall back gracefully.

```typescript
// prefersDark() returns false when window is undefined
if (typeof window !== 'undefined') {
  manager.applySystem('light', 'dark')
}
```

## Troubleshooting

### System preference not detected

**Symptom:** `prefersDark()` always returns `false`.

**Cause:** Running in an environment without `window.matchMedia` (SSR, old browser).

**Solution:** This is expected. Fall back to the default theme.

### Theme doesn't update when OS setting changes

**Symptom:** Changing OS dark mode doesn't update the app.

**Cause:** Using `applySystem()` instead of `watchSystem()`.

**Solution:** Use `watchSystem()` for continuous updates, or use `onSystemChange()` for manual control.

## See Also

- **[Persisting Theme Choice](Guide-Persisting-Theme-Choice)** — Combine with localStorage
- **[System Preferences Concept](Concept-System-Preferences)** — How detection works
- **[API: System Preferences](API-System-Preferences)** — Method reference

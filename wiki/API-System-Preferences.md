# System Preferences API

Detect and respond to the user's OS color scheme preference.

---

## `prefersDark()`

Checks if the system prefers dark color scheme.

**Signature:**

```typescript
prefersDark(): boolean
```

**Parameters:** None

**Returns:** `boolean` — `true` if the system prefers dark mode, `false` otherwise.

**Example:**

```typescript
if (manager.prefersDark()) {
  console.log('User prefers dark mode')
}
```

**Note:** Returns `false` if `window.matchMedia` is unavailable (SSR, old browsers).

---

## `prefersLight()`

Checks if the system prefers light color scheme.

**Signature:**

```typescript
prefersLight(): boolean
```

**Parameters:** None

**Returns:** `boolean` — `true` if the system prefers light mode, `false` otherwise.

**Example:**

```typescript
if (manager.prefersLight()) {
  console.log('User prefers light mode')
}
```

**Note:** Returns `false` if `window.matchMedia` is unavailable.

---

## `onSystemChange()`

Subscribes to system color scheme changes.

**Signature:**

```typescript
onSystemChange(callback: SystemChangeCallback): Unsubscribe
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `callback` | `SystemChangeCallback` | Yes | Called when system preference changes |

**Returns:** `Unsubscribe` — Function to stop listening.

**Example:**

```typescript
const unsubscribe = manager.onSystemChange((scheme) => {
  console.log(`System changed to: ${scheme}`)
  // scheme is 'dark' or 'light'
})

// Stop listening
unsubscribe()
```

**Behavior:**

- Does NOT fire on initial subscription
- Fires when the user changes their OS dark mode setting
- Multiple callbacks can be registered

---

## `applySystem()`

Applies the appropriate theme based on current system preference.

**Signature:**

```typescript
applySystem(lightThemeName: string, darkThemeName: string): Theme
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `lightThemeName` | `string` | Yes | Theme to apply if system prefers light |
| `darkThemeName` | `string` | Yes | Theme to apply if system prefers dark |

**Returns:** `Theme` — The applied theme.

**Example:**

```typescript
// Apply once based on current preference
const applied = manager.applySystem('light', 'dark')
console.log(`Applied: ${applied.name}`)
```

**Behavior:**

- Checks `prefersDark()` and applies the matching theme
- One-time application—does not watch for changes
- Validates both theme names before applying
- Triggers `onChange` callbacks
- Saves to localStorage (if configured)

**Throws:**

- `Error` — If either theme name doesn't exist
- `Error` — If manager has been disposed

---

## `watchSystem()`

Applies theme based on system preference and watches for changes.

**Signature:**

```typescript
watchSystem(lightThemeName: string, darkThemeName: string): Unsubscribe
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `lightThemeName` | `string` | Yes | Theme to apply when system prefers light |
| `darkThemeName` | `string` | Yes | Theme to apply when system prefers dark |

**Returns:** `Unsubscribe` — Function to stop watching.

**Example:**

```typescript
// Apply immediately and watch for changes
const unwatch = manager.watchSystem('light', 'dark')

// Later: stop watching
unwatch()
```

**Behavior:**

- Immediately applies the matching theme (calls `applySystem()`)
- Watches for system preference changes
- Automatically applies the matching theme on change
- Triggers `onChange` callbacks on each change

**Throws:**

- `Error` — If either theme name doesn't exist
- `Error` — If manager has been disposed

---

## Types

### `SystemChangeCallback`

```typescript
type SystemChangeCallback = (scheme: 'dark' | 'light') => void
```

---

## Usage Patterns

### One-Time Detection

```typescript
// Apply on page load only
manager.applySystem('light', 'dark')
```

### Continuous Sync

```typescript
// Always match system preference
const unwatch = manager.watchSystem('light', 'dark')

// Cleanup on app unmount
window.addEventListener('beforeunload', unwatch)
```

### Three-Way Toggle

```typescript
type Mode = 'light' | 'dark' | 'system'

let unwatchSystem: (() => void) | null = null

function setMode(mode: Mode) {
  unwatchSystem?.()
  unwatchSystem = null

  if (mode === 'system') {
    unwatchSystem = manager.watchSystem('light', 'dark')
  } else {
    manager.apply(mode)
  }

  localStorage.setItem('theme-mode', mode)
}
```

### Manual Control with Notification

```typescript
manager.onSystemChange((scheme) => {
  // Get notified but decide whether to apply
  if (userPreference === 'system') {
    manager.apply(scheme === 'dark' ? 'dark' : 'light')
  }
})
```

### Fallback for SSR

```typescript
if (typeof window !== 'undefined' && window.matchMedia) {
  manager.applySystem('light', 'dark')
} else {
  // SSR or old browser - use default
  manager.apply('light')
}
```

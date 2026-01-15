# Persistence API

Methods for managing localStorage persistence.

---

## `clearStorage()`

Removes the saved theme preference from localStorage.

**Signature:**

```typescript
clearStorage(): void
```

**Parameters:** None

**Returns:** `void`

**Example:**

```typescript
// Remove saved preference
manager.clearStorage()

// Next page load will use defaultTheme
```

**Behavior:**

- Removes the item at the configured `storageKey`
- Does NOT change the current theme
- Does NOT trigger `onChange` callbacks
- Safe to call even if:
  - No `storageKey` was configured (no-op)
  - localStorage is unavailable (no-op)
  - The key doesn't exist (no-op)

---

## How Persistence Works

### Configuration

Enable persistence by passing `storageKey` to `createThemeManager`:

```typescript
const manager = createThemeManager({
  themes: [light, dark],
  storageKey: 'my-app-theme'  // Enable persistence
})
```

### Saving

When `apply()` is called, the theme name is saved:

```typescript
manager.apply('dark')
// localStorage['my-app-theme'] = 'dark'
```

### Restoring

On manager creation, the saved preference is restored:

```typescript
// If localStorage['my-app-theme'] = 'dark'
const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light',
  storageKey: 'my-app-theme'
})

console.log(manager.currentName()) // 'dark' (restored, not default)
```

### Fallbacks

The saved preference is ignored if:

- The saved theme name doesn't exist in `themes`
- The saved value is empty
- localStorage throws an error

In these cases, `defaultTheme` is used.

---

## Usage Patterns

### Reset to Default

```typescript
document.querySelector('#reset-theme').addEventListener('click', () => {
  manager.clearStorage()
  manager.apply('light') // Or your default
})
```

### Check if Preference is Saved

```typescript
function hasStoredPreference(): boolean {
  const key = 'my-app-theme' // Same as your storageKey
  try {
    return localStorage.getItem(key) !== null
  } catch {
    return false
  }
}
```

### Clear on Logout

```typescript
function logout() {
  manager.clearStorage()
  // Clear other user data...
}
```

### Version Your Storage Key

```typescript
// When you change your token names, bump the version
const manager = createThemeManager({
  themes: [light, dark],
  storageKey: 'my-app-theme-v2'
})
```

---

## Error Handling

The manager handles localStorage errors gracefully:

```typescript
// These scenarios are handled silently:
// - Private browsing mode (SecurityError)
// - Storage quota exceeded (QuotaExceededError)
// - localStorage disabled
// - localStorage undefined (SSR)

// A warning is logged to console, but no error is thrown
manager.apply('dark') // Works even if save fails
```

If you need to know when storage fails:

```typescript
function isStorageAvailable(): boolean {
  try {
    const key = '__test__'
    localStorage.setItem(key, key)
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

if (!isStorageAvailable()) {
  console.log('Theme preferences will not persist')
}
```

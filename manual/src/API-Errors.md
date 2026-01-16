# Errors API

Error types and handling patterns.

---

## `ThemeError`

A custom error class for theme-related errors.

**Definition:**

```typescript
class ThemeError extends Error {
  name: 'ThemeError'
}
```

**Example:**

```typescript
import { ThemeError } from '@motioneffector/theme'

try {
  manager.apply('nonexistent')
} catch (e) {
  if (e instanceof ThemeError) {
    console.log('Theme error:', e.message)
  }
}
```

---

## Error Types

The library throws two types of errors:

### `TypeError`

Thrown for invalid input types or values:

```typescript
// Invalid theme name
createTheme({ name: '', tokens: { a: '1' } })
// TypeError: Theme name cannot be empty or whitespace-only

// Invalid tokens
createTheme({ name: 'test', tokens: {} })
// TypeError: Theme tokens cannot be empty

// Invalid token names
createTheme({ name: 'test', tokens: { 'bad-name': '#000' } })
// TypeError: Token name cannot contain hyphens: "bad-name"

// Invalid options
createThemeManager({ themes: 'not-array' })
// TypeError: themes must be an array
```

### `Error`

Thrown for logical/state errors:

```typescript
// Theme not found
manager.apply('nonexistent')
// Error: Cannot apply theme: 'nonexistent' not found

// Duplicate theme
manager.register(existingTheme)
// Error: Cannot register theme: 'name' already exists

// Unregister active theme
manager.unregister(manager.currentName())
// Error: Cannot unregister theme: 'name' is currently active

// Disposed manager
manager.dispose()
manager.apply('light')
// Error: ThemeManager has been disposed
```

---

## Error Messages

### `createTheme()` Errors

| Error | Message |
|-------|---------|
| Missing name | `Theme name is required` |
| Null name | `Theme name cannot be null` |
| Empty name | `Theme name cannot be empty or whitespace-only` |
| Missing tokens | `Theme tokens are required` |
| Null tokens | `Theme tokens cannot be null` |
| Invalid tokens type | `Theme tokens must be an object` |
| Empty tokens | `Theme tokens cannot be empty` |
| Empty token name | `Token name cannot be an empty string` |
| Token with spaces | `Token name cannot contain spaces: "..."` |
| Token with hyphens | `Token name cannot contain hyphens: "..."` |
| Token starts with number | `Token name cannot start with a number: "..."` |

### `createThemeManager()` Errors

| Error | Message |
|-------|---------|
| Missing options | `Options object is required` |
| Invalid themes | `themes must be an array` |
| Empty themes | `themes array cannot be empty` |
| Empty storageKey | `storageKey cannot be an empty string` |
| Duplicate theme | `Cannot create theme manager: duplicate theme name '...'` |
| Invalid defaultTheme | `Cannot create theme manager: defaultTheme '...' not found in themes` |

### Method Errors

| Method | Error | Message |
|--------|-------|---------|
| `apply()` | Not found | `Cannot apply theme: '...' not found` |
| `apply()` | Invalid name | `Theme name must be a non-empty string` |
| `apply()` | Disposed | `ThemeManager has been disposed` |
| `register()` | Exists | `Cannot register theme: '...' already exists` |
| `unregister()` | Not found | `Cannot unregister theme: '...' not found` |
| `unregister()` | Active | `Cannot unregister theme: '...' is currently active` |
| `unregister()` | Only theme | `Cannot unregister theme: '...' is the only theme` |
| `applySystem()` | Not found | `Cannot apply system theme: '...' not found` |
| `watchSystem()` | Not found | `Cannot watch system theme: '...' not found` |

---

## Handling Patterns

### Try-Catch

```typescript
try {
  manager.apply(userInput)
} catch (e) {
  if (e instanceof Error) {
    showToast(`Invalid theme: ${e.message}`)
  }
}
```

### Validation Before Action

```typescript
function safeApply(name: string): boolean {
  if (!name || !manager.has(name)) {
    console.warn(`Theme "${name}" not available`)
    return false
  }
  manager.apply(name)
  return true
}
```

### Type Guards

```typescript
function isThemeError(e: unknown): e is Error {
  return e instanceof Error && e.message.includes('theme')
}

try {
  manager.apply(name)
} catch (e) {
  if (isThemeError(e)) {
    // Handle theme-specific error
  } else {
    throw e // Re-throw unexpected errors
  }
}
```

### Logging

```typescript
function applyWithLogging(name: string) {
  try {
    manager.apply(name)
    console.log(`Applied theme: ${name}`)
  } catch (e) {
    console.error(`Failed to apply theme "${name}":`, e)
    // Optionally fall back to default
    manager.apply('light')
  }
}
```

---

## Silent Failures

Some operations fail silently (no error thrown):

| Operation | When | Behavior |
|-----------|------|----------|
| localStorage read | Error/unavailable | Uses default theme, logs warning |
| localStorage write | Error/quota exceeded | Continues without saving, logs warning |
| `clearStorage()` | No storageKey set | No-op |
| `clearStorage()` | localStorage unavailable | No-op |
| `dispose()` | Already disposed | No-op |
| `onChange` callback | Callback throws | Other callbacks still run, error logged |

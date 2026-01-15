# Lifecycle API

Clean up and resource management.

---

## `dispose()`

Cleans up the theme manager, removing CSS variables and event listeners.

**Signature:**

```typescript
dispose(): void
```

**Parameters:** None

**Returns:** `void`

**Example:**

```typescript
const manager = createThemeManager({
  themes: [light, dark]
})

// Use the manager...

// Clean up when done
manager.dispose()
```

**Behavior:**

- Removes all CSS variables from the target element
- Clears all `onChange` callbacks
- Clears all `onSystemChange` callbacks
- Removes system preference media query listeners
- Clears the internal theme registry
- Marks the manager as disposed

After disposal, most methods either:
- Return empty/undefined values (`list()` → `[]`, `current()` → `undefined`)
- Throw an error (`apply()`, `register()`)

---

## When to Call `dispose()`

### Single-Page Applications

Call `dispose()` when the themed portion of your app unmounts:

```typescript
// React
useEffect(() => {
  const manager = createThemeManager({ themes })

  return () => manager.dispose()
}, [])
```

```typescript
// Vue
onUnmounted(() => {
  manager.dispose()
})
```

### Hot Module Replacement (HMR)

Clean up old managers during development:

```typescript
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    manager.dispose()
  })
}
```

### Testing

Dispose between tests to avoid state leakage:

```typescript
describe('Theme tests', () => {
  let manager: ThemeManager

  beforeEach(() => {
    manager = createThemeManager({ themes })
  })

  afterEach(() => {
    manager.dispose()
  })
})
```

---

## Post-Disposal Behavior

| Method | After `dispose()` |
|--------|-------------------|
| `apply()` | Throws `Error` |
| `current()` | Returns `undefined` |
| `currentName()` | Returns `''` |
| `list()` | Returns `[]` |
| `get()` | Returns `undefined` |
| `has()` | Returns `false` |
| `register()` | Throws `Error` |
| `unregister()` | Throws `Error` |
| `getToken()` | Returns `undefined` |
| `getAllTokens()` | Returns `{}` |
| `onChange()` | Returns no-op unsubscribe |
| `applySystem()` | Throws `Error` |
| `watchSystem()` | Throws `Error` |
| `dispose()` | No-op (safe to call again) |

---

## Usage Patterns

### Conditional Disposal

```typescript
let manager: ThemeManager | null = null

function initThemes() {
  if (manager) {
    manager.dispose()
  }
  manager = createThemeManager({ themes })
}

function cleanup() {
  manager?.dispose()
  manager = null
}
```

### Safe Method Calls

```typescript
function safeApply(themeName: string) {
  try {
    manager.apply(themeName)
  } catch (e) {
    if (e.message.includes('disposed')) {
      console.warn('Theme manager was disposed')
    } else {
      throw e
    }
  }
}
```

### Recreating After Disposal

```typescript
// You can create a new manager after disposing the old one
manager.dispose()

manager = createThemeManager({
  themes: [newLight, newDark]
})
```

---

## What `dispose()` Does NOT Do

- Does not remove saved preferences from localStorage
- Does not affect other theme managers
- Does not prevent creating new managers
- Does not clear the target element's other styles

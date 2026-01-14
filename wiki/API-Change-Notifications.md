# Change Notifications API

Subscribe to theme change events.

---

## `onChange()`

Registers a callback that fires when the theme changes.

**Signature:**

```typescript
onChange(callback: ChangeCallback): Unsubscribe
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `callback` | `ChangeCallback` | Yes | Function called on theme change |

**Returns:** `Unsubscribe` — A function to remove the callback.

**Example:**

```typescript
const unsubscribe = manager.onChange((newTheme, previousTheme) => {
  console.log(`Changed from ${previousTheme.name} to ${newTheme.name}`)
  console.log('New tokens:', newTheme.tokens)
})

manager.apply('dark')
// Logs: "Changed from light to dark"

// Stop listening
unsubscribe()
```

---

## Types

### `ChangeCallback`

```typescript
type ChangeCallback = (newTheme: Theme, previousTheme: Theme) => void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `newTheme` | `Theme` | The theme that was just applied |
| `previousTheme` | `Theme` | The theme that was active before |

Both parameters are copies—mutations don't affect the manager.

### `Unsubscribe`

```typescript
type Unsubscribe = () => void
```

Calling the unsubscribe function stops the callback from firing.

---

## Behavior

### When Callbacks Fire

- **Fires:** When `apply()` switches to a different theme
- **Fires:** When `applySystem()` or `watchSystem()` changes the theme
- **Does NOT fire:** When `apply()` is called with the current theme (no-op)
- **Does NOT fire:** When `register()` or `unregister()` is called
- **Does NOT fire:** During initial manager creation
- **Does NOT fire:** When restoring from localStorage (during creation)

### Multiple Callbacks

```typescript
manager.onChange(() => console.log('First'))
manager.onChange(() => console.log('Second'))
manager.onChange(() => console.log('Third'))

manager.apply('dark')
// Logs: First, Second, Third (in registration order)
```

### Error Handling

If a callback throws, other callbacks still fire:

```typescript
manager.onChange(() => {
  throw new Error('Oops')
})

manager.onChange(() => {
  console.log('This still runs')
})

manager.apply('dark')
// Error is logged to console
// "This still runs" is logged
```

### Unsubscribe Behavior

```typescript
const unsub = manager.onChange(() => console.log('Called'))

unsub() // Safe to call
unsub() // Safe to call again (idempotent)

manager.apply('dark') // Callback no longer fires
```

---

## Usage Patterns

### React useEffect

```typescript
import { useEffect } from 'react'

function ThemeLogger() {
  useEffect(() => {
    // Subscribe and return cleanup
    return manager.onChange((theme) => {
      console.log('Theme:', theme.name)
    })
  }, [])

  return null
}
```

### Vue Composition API

```typescript
import { onMounted, onUnmounted } from 'vue'

export default {
  setup() {
    let unsubscribe: (() => void) | null = null

    onMounted(() => {
      unsubscribe = manager.onChange((theme) => {
        console.log('Theme:', theme.name)
      })
    })

    onUnmounted(() => unsubscribe?.())
  }
}
```

### Update External State

```typescript
// Redux
manager.onChange((theme) => {
  store.dispatch({ type: 'THEME_CHANGED', payload: theme.name })
})

// Custom event
manager.onChange((theme) => {
  window.dispatchEvent(new CustomEvent('themechange', {
    detail: { theme: theme.name }
  }))
})
```

### Redraw Non-CSS Elements

```typescript
const canvas = document.querySelector('canvas')!
const ctx = canvas.getContext('2d')!

function draw() {
  ctx.fillStyle = manager.getToken('canvasBackground') ?? '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  // ... more drawing
}

draw() // Initial

manager.onChange(() => draw())
```

### Conditional Actions

```typescript
manager.onChange((newTheme, prevTheme) => {
  // Only when switching to dark
  if (newTheme.name === 'dark' && prevTheme.name !== 'dark') {
    analytics.track('dark_mode_enabled')
  }

  // Only when switching away from dark
  if (prevTheme.name === 'dark' && newTheme.name !== 'dark') {
    analytics.track('dark_mode_disabled')
  }
})
```

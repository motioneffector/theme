# Listening for Theme Changes

React to theme changes to update non-CSS elements, trigger side effects, or sync external state.

## Prerequisites

Before starting, you should:

- Have a [theme manager created](Your-First-Theme-Switch)
- Know how to [switch themes](Guide-Adding-Dark-Mode)

## Overview

We'll listen for changes by:

1. Subscribing with `onChange()`
2. Using the callback parameters
3. Unsubscribing when done

## Step 1: Subscribe to Changes

Call `onChange()` with a callback function. It fires whenever the theme changes.

```typescript
const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light'
})

manager.onChange((newTheme, previousTheme) => {
  console.log(`Changed from ${previousTheme.name} to ${newTheme.name}`)
})

manager.apply('dark')
// Logs: "Changed from light to dark"
```

## Step 2: Use the Callback Parameters

The callback receives two arguments:

- `newTheme` — The theme that was just applied
- `previousTheme` — The theme that was active before

Both are copies of the theme objects, so you can safely read their properties.

```typescript
manager.onChange((newTheme, previousTheme) => {
  // Access theme properties
  console.log(newTheme.name)
  console.log(newTheme.tokens.primary)

  // Compare themes
  if (previousTheme.name === 'dark' && newTheme.name === 'light') {
    console.log('Switched to light mode')
  }
})
```

## Step 3: Unsubscribe When Done

`onChange()` returns an unsubscribe function. Call it to stop receiving notifications.

```typescript
const unsubscribe = manager.onChange((newTheme) => {
  console.log(`Theme: ${newTheme.name}`)
})

// Later...
unsubscribe()

manager.apply('dark')
// Callback no longer fires
```

This is essential for cleanup in components that mount and unmount.

## Complete Example

```typescript
import { createTheme, createThemeManager } from '@motioneffector/theme'

const light = createTheme({
  name: 'light',
  tokens: { background: '#fff', line: '#333' }
})

const dark = createTheme({
  name: 'dark',
  tokens: { background: '#1a1a1a', line: '#ccc' }
})

const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light'
})

// Canvas that needs manual repainting
const canvas = document.querySelector('canvas')!
const ctx = canvas.getContext('2d')!

function draw() {
  const bg = manager.getToken('background') ?? '#fff'
  const line = manager.getToken('line') ?? '#000'

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = line
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(canvas.width, canvas.height)
  ctx.stroke()
}

// Initial draw
draw()

// Redraw on theme change
manager.onChange(() => draw())
```

## Variations

### Updating Canvas/SVG/Charts

Non-CSS elements need manual updates. Redraw when the theme changes.

```typescript
const chart = new Chart(ctx, { /* config */ })

manager.onChange((theme) => {
  chart.options.scales.x.grid.color = theme.tokens.gridColor
  chart.options.scales.y.grid.color = theme.tokens.gridColor
  chart.update()
})
```

### Analytics/Logging

Track theme preferences for analytics.

```typescript
manager.onChange((newTheme) => {
  analytics.track('theme_changed', {
    theme: newTheme.name
  })
})
```

### Syncing External State

Update a state management store.

```typescript
// Redux
manager.onChange((newTheme) => {
  store.dispatch(setTheme(newTheme.name))
})

// Zustand
manager.onChange((newTheme) => {
  useStore.setState({ theme: newTheme.name })
})
```

### React useEffect Pattern

```typescript
import { useEffect } from 'react'

function ThemeAwareCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function draw() {
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = manager.getToken('background') ?? '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    draw()

    // Subscribe and return cleanup
    return manager.onChange(() => draw())
  }, [])

  return <canvas ref={canvasRef} />
}
```

### Vue watch Pattern

```typescript
import { onMounted, onUnmounted } from 'vue'

export default {
  setup() {
    let unsubscribe: (() => void) | null = null

    onMounted(() => {
      unsubscribe = manager.onChange((theme) => {
        console.log('Theme changed:', theme.name)
      })
    })

    onUnmounted(() => {
      unsubscribe?.()
    })
  }
}
```

## Troubleshooting

### Callback fires multiple times

**Symptom:** The callback runs more times than expected.

**Cause:** Subscribing multiple times without unsubscribing (common in React useEffect without cleanup).

**Solution:** Always return the unsubscribe function from useEffect, or track subscriptions.

### Callback doesn't fire

**Symptom:** Calling `apply()` doesn't trigger the callback.

**Cause:** Applying the same theme that's already active is a no-op.

**Solution:** The callback only fires when the theme actually changes. Check `currentName()` if needed.

### Memory leak warnings

**Symptom:** Console warnings about event listeners.

**Cause:** Not unsubscribing when components unmount.

**Solution:** Always call the unsubscribe function during cleanup.

## See Also

- **[Runtime Token Access](Guide-Runtime-Token-Access)** — Get token values in callbacks
- **[Managing Themes Dynamically](Guide-Managing-Themes-Dynamically)** — Add/remove themes at runtime
- **[API: Change Notifications](API-Change-Notifications)** — `onChange()` reference

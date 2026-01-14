# Runtime Token Access

Access theme token values in JavaScript for conditional styling, dynamic calculations, or non-CSS elements like canvas and SVG.

## Prerequisites

Before starting, you should:

- Have a [theme manager created](Your-First-Theme-Switch)
- Understand [Design Tokens](Concept-Design-Tokens)

## Overview

We'll access tokens by:

1. Getting a single token value with `getToken()`
2. Getting all tokens with `getAllTokens()`
3. Getting CSS variable names with `getCSSVariableName()`

## Step 1: Get a Single Token

Use `getToken()` to retrieve the current value of a specific token.

```typescript
const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light'
})

// Get the current primary color
const primary = manager.getToken('primary')
// Returns: '#0d6efd' (from light theme)

manager.apply('dark')

const primaryNow = manager.getToken('primary')
// Returns: '#6ea8fe' (from dark theme)
```

Returns `undefined` if the token doesn't exist in the current theme.

## Step 2: Get All Tokens

Use `getAllTokens()` to get every token in the current theme as an object.

```typescript
const tokens = manager.getAllTokens()
// Returns: { background: '#fff', text: '#000', primary: '#0d6efd', ... }

// Iterate over tokens
Object.entries(tokens).forEach(([name, value]) => {
  console.log(`${name}: ${value}`)
})
```

The returned object is a copy—modifying it doesn't affect the theme.

## Step 3: Get CSS Variable Names

Use `getCSSVariableName()` to get the CSS variable name for a token.

```typescript
const varName = manager.getCSSVariableName('primaryColor')
// Returns: '--color-primary-color'

// Use in inline styles
element.style.setProperty(varName, '#ff0000')

// Or reference in template literals
const style = `color: var(${varName})`
```

This works even for tokens that don't exist—it just computes the name.

## Complete Example

```typescript
import { createTheme, createThemeManager } from '@motioneffector/theme'

const light = createTheme({
  name: 'light',
  tokens: {
    background: '#ffffff',
    text: '#212529',
    primary: '#0d6efd',
    chartLine: '#0d6efd',
    chartFill: 'rgba(13, 110, 253, 0.1)'
  }
})

const dark = createTheme({
  name: 'dark',
  tokens: {
    background: '#121212',
    text: '#e9ecef',
    primary: '#6ea8fe',
    chartLine: '#6ea8fe',
    chartFill: 'rgba(110, 168, 254, 0.1)'
  }
})

const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light'
})

// Draw a chart with theme colors
function drawChart(ctx: CanvasRenderingContext2D) {
  const lineColor = manager.getToken('chartLine')
  const fillColor = manager.getToken('chartFill')

  ctx.strokeStyle = lineColor ?? '#000'
  ctx.fillStyle = fillColor ?? 'rgba(0,0,0,0.1)'

  // Draw chart...
}

// Redraw when theme changes
manager.onChange(() => {
  drawChart(canvas.getContext('2d')!)
})
```

## Variations

### Inline Styles with Token Values

```typescript
function applyTokenStyles(element: HTMLElement) {
  const primary = manager.getToken('primary')
  const radius = manager.getToken('borderRadius')

  if (primary) element.style.backgroundColor = primary
  if (radius) element.style.borderRadius = radius
}
```

### Dynamic CSS Variable Reference

```typescript
// Build a CSS variable reference string
function cssVar(tokenName: string): string {
  return `var(${manager.getCSSVariableName(tokenName)})`
}

// Use in templates
const buttonStyle = `
  background: ${cssVar('primary')};
  color: ${cssVar('buttonText')};
`
```

### Computed Values

```typescript
// Parse and compute based on token values
function getLuminance(tokenName: string): number {
  const color = manager.getToken(tokenName)
  if (!color) return 0

  // Parse hex color and compute luminance
  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const isDark = getLuminance('background') < 0.5
```

### React Integration

```typescript
import { useSyncExternalStore } from 'react'

function useToken(name: string): string | undefined {
  return useSyncExternalStore(
    (callback) => manager.onChange(callback),
    () => manager.getToken(name)
  )
}

function MyComponent() {
  const primary = useToken('primary')

  return <canvas style={{ borderColor: primary }} />
}
```

### Vue Integration

```typescript
import { ref, watchEffect, onUnmounted } from 'vue'

function useToken(name: string) {
  const value = ref(manager.getToken(name))

  const unsubscribe = manager.onChange(() => {
    value.value = manager.getToken(name)
  })

  onUnmounted(unsubscribe)

  return value
}
```

## Troubleshooting

### Token returns undefined

**Symptom:** `getToken('myToken')` returns `undefined`.

**Cause:** The token name doesn't exist in the current theme, or there's a typo.

**Solution:** Check the token name matches exactly (case-sensitive). Use `getAllTokens()` to see available tokens.

### Values don't update after theme switch

**Symptom:** `getToken()` returns stale values.

**Cause:** You're caching the value instead of calling `getToken()` each time.

**Solution:** Call `getToken()` when you need the value, or subscribe to `onChange()` to update cached values.

## See Also

- **[Design Tokens](Concept-Design-Tokens)** — How tokens work
- **[Listening for Theme Changes](Guide-Listening-For-Theme-Changes)** — React to theme switches
- **[API: Token Access](API-Token-Access)** — Full method reference

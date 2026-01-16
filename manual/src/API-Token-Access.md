# Token Access API

Methods for accessing token values and CSS variable names at runtime.

---

## `getToken()`

Returns the value of a token from the current theme.

**Signature:**

```typescript
getToken(tokenName: string): string | undefined
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `tokenName` | `string` | Yes | Name of the token to retrieve |

**Returns:** `string | undefined` — The token value, or `undefined` if not found.

**Example:**

```typescript
const primary = manager.getToken('primary')
console.log(primary) // '#0d6efd'

const missing = manager.getToken('nonexistent')
console.log(missing) // undefined
```

**Behavior:**

- Returns the value from the currently active theme
- Case-sensitive: `'Primary'` and `'primary'` are different
- Returns `undefined` for tokens that don't exist
- Blocks access to `__proto__` (returns `undefined`) for security

**Use Cases:**

```typescript
// Canvas drawing
ctx.fillStyle = manager.getToken('chartBackground') ?? '#fff'

// Inline styles
element.style.color = manager.getToken('primary') ?? 'blue'

// Conditional logic
const isDark = manager.getToken('background')?.startsWith('#1') ?? false
```

---

## `getAllTokens()`

Returns all tokens from the current theme.

**Signature:**

```typescript
getAllTokens(): Record<string, string>
```

**Parameters:** None

**Returns:** `Record<string, string>` — A copy of all tokens in the current theme.

**Example:**

```typescript
const tokens = manager.getAllTokens()

console.log(tokens)
// { background: '#fff', text: '#000', primary: '#0d6efd' }

// Iterate
Object.entries(tokens).forEach(([name, value]) => {
  console.log(`${name}: ${value}`)
})
```

**Note:** Returns a copy. Mutating it doesn't affect the manager or theme.

**Use Cases:**

```typescript
// Export for debugging
console.table(manager.getAllTokens())

// Pass to a component
<ThemeProvider tokens={manager.getAllTokens()} />

// Serialize for storage
const serialized = JSON.stringify(manager.getAllTokens())
```

---

## `getCSSVariableName()`

Returns the CSS variable name for a token.

**Signature:**

```typescript
getCSSVariableName(tokenName: string): string
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `tokenName` | `string` | Yes | Token name to convert |

**Returns:** `string` — The full CSS variable name including prefix.

**Example:**

```typescript
// With default prefix '--color-'
manager.getCSSVariableName('primary')
// Returns: '--color-primary'

manager.getCSSVariableName('primaryColor')
// Returns: '--color-primary-color'

manager.getCSSVariableName('gray100')
// Returns: '--color-gray100'
```

**Behavior:**

- Converts camelCase to kebab-case
- Prepends the configured prefix
- Works even for tokens that don't exist in the current theme

**Conversion Rules:**

| Token Name | CSS Variable (default prefix) |
|------------|------------------------------|
| `primary` | `--color-primary` |
| `primaryColor` | `--color-primary-color` |
| `backgroundColor` | `--color-background-color` |
| `gray100` | `--color-gray100` |
| `primary_hover` | `--color-primary_hover` |
| `BGColor` | `--color-b-g-color` |
| `textXL` | `--color-text-x-l` |

**Use Cases:**

```typescript
// Build CSS var() references
const varRef = `var(${manager.getCSSVariableName('primary')})`
// 'var(--color-primary)'

// Set CSS property dynamically
element.style.setProperty(
  manager.getCSSVariableName('primary'),
  '#ff0000'
)

// Template literals
const style = `
  background: var(${manager.getCSSVariableName('background')});
  color: var(${manager.getCSSVariableName('text')});
`
```

---

## Usage Patterns

### Helper Function for CSS var()

```typescript
function cssVar(tokenName: string): string {
  return `var(${manager.getCSSVariableName(tokenName)})`
}

// Use in templates
const buttonStyles = {
  background: cssVar('primary'),
  color: cssVar('buttonText'),
  borderRadius: cssVar('borderRadius')
}
```

### Reactive Token Hook (React)

```typescript
import { useSyncExternalStore } from 'react'

function useToken(name: string): string | undefined {
  return useSyncExternalStore(
    (callback) => manager.onChange(callback),
    () => manager.getToken(name),
    () => manager.getToken(name)
  )
}

function Component() {
  const primary = useToken('primary')
  return <div style={{ color: primary }}>Themed text</div>
}
```

### Token Watcher (Vue)

```typescript
import { ref, onUnmounted } from 'vue'

function useToken(name: string) {
  const value = ref(manager.getToken(name))

  const unsubscribe = manager.onChange(() => {
    value.value = manager.getToken(name)
  })

  onUnmounted(unsubscribe)

  return value
}
```

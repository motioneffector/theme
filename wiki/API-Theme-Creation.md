# Theme Creation API

Create validated, immutable theme objects.

---

## `createTheme()`

Creates a new theme with validated name and tokens.

**Signature:**

```typescript
function createTheme(options: {
  name: string
  tokens: Record<string, string>
}): Theme
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `object` | Yes | Theme configuration |
| `options.name` | `string` | Yes | Unique identifier for the theme |
| `options.tokens` | `Record<string, string>` | Yes | Design token key-value pairs |

**Returns:** `Theme` — A frozen theme object with `name` and `tokens` properties.

**Example:**

```typescript
import { createTheme } from '@motioneffector/theme'

const dark = createTheme({
  name: 'dark',
  tokens: {
    background: '#1a1a1a',
    text: '#ffffff',
    primary: '#6ea8fe'
  }
})

console.log(dark.name)          // 'dark'
console.log(dark.tokens.primary) // '#6ea8fe'
```

**Throws:**

- `TypeError` — If `name` is undefined, null, empty, or whitespace-only
- `TypeError` — If `tokens` is undefined, null, not an object, or empty
- `TypeError` — If any token name contains spaces, hyphens, starts with a number, or is empty

**Token Name Rules:**

```typescript
// Valid token names
{ primary: '#000' }           // lowercase
{ primaryColor: '#000' }      // camelCase
{ gray100: '#e0e0e0' }        // with numbers (not at start)
{ primary_hover: '#333' }     // with underscores

// Invalid token names
{ 'primary-color': '#000' }   // TypeError: hyphens not allowed
{ '100gray': '#000' }         // TypeError: can't start with number
{ 'my color': '#000' }        // TypeError: spaces not allowed
{ '': '#000' }                // TypeError: empty string
```

---

## Types

### `Theme`

```typescript
interface Theme {
  name: string
  tokens: Record<string, string>
}
```

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Unique identifier for the theme |
| `tokens` | `Record<string, string>` | Design token key-value pairs |

The returned theme object is frozen (immutable). Attempting to modify it has no effect:

```typescript
const theme = createTheme({ name: 'test', tokens: { a: '1' } })

theme.name = 'changed'        // Silently ignored
theme.tokens.a = '2'          // Silently ignored
theme.tokens.b = '3'          // Silently ignored

console.log(theme.name)       // 'test' (unchanged)
console.log(theme.tokens.a)   // '1' (unchanged)
```

# Theme Switching API

Methods for switching and querying the active theme.

---

## `apply()`

Switches to a theme by name, updating CSS variables.

**Signature:**

```typescript
apply(themeName: string): Theme
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `themeName` | `string` | Yes | Name of the theme to apply |

**Returns:** `Theme` — A copy of the applied theme.

**Example:**

```typescript
const applied = manager.apply('dark')

console.log(applied.name)          // 'dark'
console.log(manager.currentName()) // 'dark'
```

**Behavior:**

- Removes CSS variables from the previous theme
- Sets CSS variables for the new theme
- Saves to localStorage (if `storageKey` configured)
- Triggers `onChange` callbacks (unless same theme)
- Applying the current theme is a no-op (no callbacks fire)

**Throws:**

- `Error` — If `themeName` is null, undefined, empty, or not found
- `Error` — If the manager has been disposed

---

## `current()`

Returns the currently active theme.

**Signature:**

```typescript
current(): Theme
```

**Parameters:** None

**Returns:** `Theme` — A deep copy of the current theme. Mutations don't affect the manager.

**Example:**

```typescript
const theme = manager.current()

console.log(theme.name)
console.log(theme.tokens.primary)

// Safe to mutate - it's a copy
theme.tokens.primary = '#000'
console.log(manager.current().tokens.primary) // Original value, unchanged
```

---

## `currentName()`

Returns the name of the currently active theme.

**Signature:**

```typescript
currentName(): string
```

**Parameters:** None

**Returns:** `string` — The name of the current theme.

**Example:**

```typescript
console.log(manager.currentName()) // 'light'

manager.apply('dark')
console.log(manager.currentName()) // 'dark'
```

**Note:** Returns an empty string if the manager has been disposed.

---

## Usage Patterns

### Toggle Between Two Themes

```typescript
function toggle() {
  const next = manager.currentName() === 'light' ? 'dark' : 'light'
  manager.apply(next)
}
```

### Cycle Through Multiple Themes

```typescript
function cycle() {
  const themes = manager.list()
  const current = manager.currentName()
  const index = themes.indexOf(current)
  const next = themes[(index + 1) % themes.length]
  manager.apply(next)
}
```

### Apply with Validation

```typescript
function safeApply(themeName: string): boolean {
  if (!manager.has(themeName)) {
    console.warn(`Theme "${themeName}" not found`)
    return false
  }
  manager.apply(themeName)
  return true
}
```

### Compare Current to Previous

```typescript
let previousTheme: string | null = null

manager.onChange((newTheme, oldTheme) => {
  console.log(`Changed: ${oldTheme.name} → ${newTheme.name}`)
  previousTheme = oldTheme.name
})
```

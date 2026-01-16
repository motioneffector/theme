# Theme Registry API

Methods for managing the collection of available themes.

---

## `list()`

Returns the names of all registered themes.

**Signature:**

```typescript
list(): string[]
```

**Parameters:** None

**Returns:** `string[]` — Array of theme names in registration order.

**Example:**

```typescript
const themes = manager.list()
console.log(themes) // ['light', 'dark', 'ocean']

// Build a selector
themes.forEach(name => {
  const option = document.createElement('option')
  option.value = name
  option.textContent = name
  selector.appendChild(option)
})
```

**Note:** Returns a copy. Mutating the array doesn't affect the manager.

---

## `get()`

Retrieves a theme by name.

**Signature:**

```typescript
get(themeName: string): Theme | undefined
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `themeName` | `string` | Yes | Name of the theme to retrieve |

**Returns:** `Theme | undefined` — A copy of the theme, or `undefined` if not found.

**Example:**

```typescript
const dark = manager.get('dark')

if (dark) {
  console.log(dark.tokens.primary)
}

const missing = manager.get('nonexistent')
console.log(missing) // undefined
```

**Note:** Returns a deep copy. Mutating it doesn't affect the manager.

---

## `has()`

Checks if a theme exists.

**Signature:**

```typescript
has(themeName: string): boolean
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `themeName` | `string` | Yes | Name to check |

**Returns:** `boolean` — `true` if the theme exists, `false` otherwise.

**Example:**

```typescript
if (manager.has('ocean')) {
  manager.apply('ocean')
} else {
  console.log('Ocean theme not available')
}
```

**Note:** Returns `false` for null, undefined, or empty string arguments.

---

## `register()`

Adds a new theme to the manager.

**Signature:**

```typescript
register(theme: Theme): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `theme` | `Theme` | Yes | Theme object to register |

**Returns:** `void`

**Example:**

```typescript
import { createTheme } from '@motioneffector/theme'

const ocean = createTheme({
  name: 'ocean',
  tokens: {
    background: '#e3f2fd',
    text: '#0d47a1',
    primary: '#1976d2'
  }
})

manager.register(ocean)

// Now available
console.log(manager.has('ocean')) // true
manager.apply('ocean')
```

**Behavior:**

- Theme is immediately available
- Does not change the current theme
- Does not trigger `onChange` callbacks

**Throws:**

- `TypeError` — If theme is null, undefined, or invalid
- `Error` — If a theme with the same name already exists
- `Error` — If the manager has been disposed

---

## `unregister()`

Removes a theme from the manager.

**Signature:**

```typescript
unregister(themeName: string): Theme
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `themeName` | `string` | Yes | Name of the theme to remove |

**Returns:** `Theme` — A copy of the removed theme.

**Example:**

```typescript
// Switch away first if needed
if (manager.currentName() === 'ocean') {
  manager.apply('light')
}

const removed = manager.unregister('ocean')
console.log(removed.name) // 'ocean'

console.log(manager.has('ocean')) // false
```

**Behavior:**

- Theme is immediately unavailable
- Does not trigger `onChange` callbacks
- Returns a copy of the removed theme

**Throws:**

- `Error` — If theme doesn't exist
- `Error` — If theme is currently active
- `Error` — If it's the only registered theme
- `Error` — If the manager has been disposed

---

## Usage Patterns

### Safe Registration

```typescript
function registerIfNew(theme: Theme): boolean {
  if (manager.has(theme.name)) {
    return false
  }
  manager.register(theme)
  return true
}
```

### Safe Unregistration

```typescript
function safeUnregister(themeName: string): Theme | null {
  if (!manager.has(themeName)) {
    return null
  }

  if (manager.currentName() === themeName) {
    // Switch to first available theme
    const others = manager.list().filter(n => n !== themeName)
    if (others.length > 0) {
      manager.apply(others[0])
    } else {
      throw new Error('Cannot unregister the only theme')
    }
  }

  return manager.unregister(themeName)
}
```

### Dynamic Theme List

```typescript
function updateThemeUI() {
  const container = document.querySelector('#themes')
  container.innerHTML = ''

  manager.list().forEach(name => {
    const btn = document.createElement('button')
    btn.textContent = name
    btn.classList.toggle('active', name === manager.currentName())
    btn.onclick = () => manager.apply(name)
    container.appendChild(btn)
  })
}

manager.onChange(updateThemeUI)
updateThemeUI()
```

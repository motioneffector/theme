# System Preferences

Modern operating systems let users choose their preferred color scheme—typically light or dark mode. This library can detect that preference and automatically apply the matching theme, creating a seamless experience that respects user choices.

## How It Works

The browser exposes the user's preference via the `prefers-color-scheme` media query. The theme manager provides methods to:

1. **Check** the current preference (`prefersDark()`, `prefersLight()`)
2. **React** to changes (`onSystemChange()`)
3. **Apply** themes based on preference (`applySystem()`)
4. **Watch** and auto-switch (`watchSystem()`)

```
User's OS                    Theme Manager                  Your App
┌──────────────┐             ┌──────────────┐              ┌──────────────┐
│ Dark Mode: ON│────────────►│ prefersDark()│─────────────►│ Dark Theme   │
└──────────────┘             │ returns true │              │ Applied      │
                             └──────────────┘              └──────────────┘
        │                            │
        │ User switches              │ watchSystem()
        │ to Light Mode              │ detects change
        ▼                            ▼
┌──────────────┐             ┌──────────────┐              ┌──────────────┐
│ Dark Mode:OFF│────────────►│ callback     │─────────────►│ Light Theme  │
└──────────────┘             │ fires        │              │ Applied      │
                             └──────────────┘              └──────────────┘
```

## Basic Usage

```typescript
import { createTheme, createThemeManager } from '@motioneffector/theme'

const light = createTheme({
  name: 'light',
  tokens: { background: '#fff', text: '#000' }
})

const dark = createTheme({
  name: 'dark',
  tokens: { background: '#1a1a1a', text: '#fff' }
})

const manager = createThemeManager({
  themes: [light, dark],
  defaultTheme: 'light'
})

// Apply once based on current preference
manager.applySystem('light', 'dark')

// Or watch continuously
const unwatch = manager.watchSystem('light', 'dark')
```

## Key Points

- **Detection requires a browser** — In SSR or Node.js environments, `prefersDark()` and `prefersLight()` return `false`. Theme application still works, but system detection doesn't.

- **`applySystem()` is one-time** — It checks the preference and applies the matching theme once. If the user changes their OS setting afterward, you won't see the change.

- **`watchSystem()` is continuous** — It applies the theme immediately AND watches for changes. Call the returned function to stop watching.

- **Combine with persistence carefully** — If you're using `storageKey` for persistence, decide whether the saved preference or system preference takes priority. See the [guide](Guide-System-Preference-Detection) for patterns.

## Examples

### Check Current Preference

```typescript
if (manager.prefersDark()) {
  console.log('User prefers dark mode')
} else if (manager.prefersLight()) {
  console.log('User prefers light mode')
}
```

### Listen for Changes

```typescript
const unsubscribe = manager.onSystemChange((scheme) => {
  console.log(`System changed to: ${scheme}`)
  // scheme is 'dark' or 'light'
})

// Stop listening later
unsubscribe()
```

### Apply Once on Load

```typescript
// Good for apps where user can override the system preference
manager.applySystem('light', 'dark')
```

### Watch Continuously

```typescript
// Good for apps that should always match the system
const unwatch = manager.watchSystem('light', 'dark')

// Stop watching when component unmounts
onUnmount(() => unwatch())
```

### Three-Way Toggle (Light / Dark / System)

```typescript
type Preference = 'light' | 'dark' | 'system'

let userPreference: Preference = 'system'
let unwatchSystem: (() => void) | null = null

function setPreference(pref: Preference) {
  // Stop watching if we were
  unwatchSystem?.()
  unwatchSystem = null

  if (pref === 'system') {
    unwatchSystem = manager.watchSystem('light', 'dark')
  } else {
    manager.apply(pref)
  }

  userPreference = pref
}

// Initial setup
setPreference('system')
```

## Related

- **[Theme Manager](Concept-Theme-Manager)** — Provides system preference methods
- **[System Preference Detection Guide](Guide-System-Preference-Detection)** — Step-by-step implementation
- **[API: System Preferences](API-System-Preferences)** — Full method reference

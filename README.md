# @motioneffector/theme

A TypeScript library for managing CSS variable-based theming in web applications.

## Overview

This library provides a centralized system for defining, switching, and persisting color themes using CSS custom properties. It enforces a strict "no hardcoded colors" architecture, ensuring all UI colors flow through a single theming system.

## Features

- **Theme Definitions**: Define themes as structured objects with named color tokens
- **Runtime Switching**: Switch themes instantly without page reload
- **Persistence**: Automatically save and restore user theme preference
- **Type Safety**: Full TypeScript support with strict typing for theme tokens
- **CSS Variable Integration**: Generates and applies CSS custom properties to the DOM
- **Dark/Light Mode**: Built-in support for system preference detection
- **Custom Tokens**: Define any token names your application needs

## Core Concepts

### Theme Tokens

Themes are defined as objects mapping token names to color values:

```typescript
interface Theme {
  name: string
  tokens: {
    background: string
    surface: string
    text: string
    textMuted: string
    primary: string
    primaryHover: string
    secondary: string
    border: string
    error: string
    success: string
    // ... extensible
  }
}
```

### CSS Variable Generation

When a theme is applied, the library generates CSS custom properties:

```css
:root {
  --color-background: #ffffff;
  --color-surface: #f5f5f5;
  --color-text: #1a1a1a;
  --color-primary: #3b82f6;
  /* ... */
}
```

### Usage in CSS/Components

All UI code references these variables instead of literal colors:

```css
.button {
  background: var(--color-primary);
  color: var(--color-text);
}
```

## API

### `createThemeManager(options)`

Creates a theme manager instance.

**Options:**
- `themes`: Array of theme definitions
- `defaultTheme`: Name of the default theme
- `storageKey`: LocalStorage key for persistence (optional)
- `prefix`: CSS variable prefix, default `--color-` (optional)

### `themeManager.apply(themeName)`

Applies a theme by name, updating all CSS variables.

### `themeManager.current()`

Returns the currently active theme.

### `themeManager.list()`

Returns all available theme names.

### `themeManager.register(theme)`

Registers a new theme at runtime.

### `themeManager.onchange(callback)`

Subscribe to theme change events.

## Use Cases

- Applications requiring user-selectable themes
- Dark/light mode implementation
- Brand customization (white-labeling)
- Accessibility (high contrast modes)
- Any application enforcing consistent color usage

## Design Philosophy

This library is intentionally opinionated: **all colors must flow through the theme system**. This constraint enables:

1. Guaranteed theme consistency
2. Easy global color changes
3. Accessibility auditing
4. Runtime theme switching without CSS recompilation

## Installation

```bash
npm install @motioneffector/theme
```

## License

MIT

import type {
  Theme,
  ThemeManager,
  ThemeManagerOptions,
  ChangeCallback,
  SystemChangeCallback,
  Unsubscribe,
} from '../types'

/**
 * Converts camelCase to kebab-case.
 * Examples:
 * - "primary" → "primary"
 * - "primaryColor" → "primary-color"
 * - "BGColor" → "b-g-color"
 * - "colorA" → "color-a"
 * - "gray100" → "gray100" (numbers not separated)
 * - "primary_hover" → "primary_hover" (underscores preserved)
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (letter, index) => {
    return (index > 0 ? '-' : '') + letter.toLowerCase()
  })
}

/**
 * Creates a deep copy of a theme object.
 */
function cloneTheme(theme: Theme): Theme {
  return {
    name: theme.name,
    tokens: { ...theme.tokens },
  }
}

/**
 * Validates that a theme object has required properties.
 */
function validateTheme(theme: unknown): void {
  if (theme === null || theme === undefined || typeof theme !== 'object') {
    throw new TypeError('Theme must be a valid object')
  }

  const t = theme as Record<string, unknown>

  if (typeof t.name !== 'string' || t.name === '') {
    throw new TypeError('Theme must have a non-empty name property')
  }

  if (
    t.tokens === null ||
    t.tokens === undefined ||
    typeof t.tokens !== 'object' ||
    Array.isArray(t.tokens)
  ) {
    throw new TypeError('Theme must have a tokens property')
  }

  const tokensObj = t.tokens as Record<string, unknown>
  if (Object.keys(tokensObj).length === 0) {
    throw new TypeError('Cannot create theme: tokens object cannot be empty')
  }
}

/**
 * Creates a theme manager instance for managing CSS variable-based themes.
 *
 * @param options - Configuration options for the theme manager
 * @returns A ThemeManager instance with methods to apply, register, and manage themes
 *
 * @throws {TypeError} If options is null/undefined or themes array is invalid
 * @throws {Error} If themes array contains duplicates or defaultTheme doesn't exist
 *
 * @example
 * ```typescript
 * const manager = createThemeManager({
 *   themes: [
 *     { name: 'light', tokens: { primary: '#000', background: '#fff' } },
 *     { name: 'dark', tokens: { primary: '#fff', background: '#000' } }
 *   ],
 *   defaultTheme: 'light',
 *   storageKey: 'app-theme',
 *   prefix: '--color-'
 * })
 *
 * manager.apply('dark')
 * ```
 */
export function createThemeManager(options: ThemeManagerOptions): ThemeManager {
  // Validate options
  if (options === null || options === undefined || typeof options !== 'object') {
    throw new TypeError('Options object is required')
  }

  if (!Array.isArray(options.themes)) {
    throw new TypeError('themes must be an array')
  }

  if (options.themes.length === 0) {
    throw new TypeError('themes array cannot be empty')
  }

  // Validate all themes
  for (const theme of options.themes) {
    validateTheme(theme)
  }

  // Check for duplicate names
  const names = new Set<string>()
  for (const theme of options.themes) {
    if (names.has(theme.name)) {
      throw new Error(`Cannot create theme manager: duplicate theme name '${theme.name}'`)
    }
    names.add(theme.name)
  }

  // Validate storageKey
  if (options.storageKey !== undefined && options.storageKey === '') {
    throw new TypeError('storageKey cannot be an empty string')
  }

  // Setup prefix
  const prefix = options.prefix ?? '--color-'

  // Setup target
  const target =
    options.target !== undefined
      ? options.target
      : typeof document !== 'undefined'
        ? document.documentElement
        : null

  // Determine default theme
  // We've already validated themes is not empty, so [0] is safe
  const defaultThemeName = options.defaultTheme ?? options.themes[0]!.name
  const defaultTheme = options.themes.find(t => t.name === defaultThemeName)
  if (!defaultTheme) {
    throw new Error(`Cannot create theme manager: defaultTheme '${defaultThemeName}' not found in themes`)
  }

  // Private state
  const themesMap = new Map<string, Theme>(options.themes.map(t => [t.name, t]))
  let currentTheme: Theme = defaultTheme
  let currentVariables: string[] = []
  const changeCallbacks = new Set<ChangeCallback>()
  const systemChangeCallbacks = new Set<SystemChangeCallback>()
  let mediaQueryListener: ((event: MediaQueryListEvent) => void) | null = null
  let disposed = false

  // Apply CSS variables for a theme
  function applyCSSVariables(theme: Theme): void {
    if (target === null) return

    // Remove old variables
    for (const varName of currentVariables) {
      target.style.removeProperty(varName)
    }

    // Apply new variables
    currentVariables = []
    for (const [tokenName, tokenValue] of Object.entries(theme.tokens)) {
      const kebabName = camelToKebab(tokenName)
      const cssVarName = prefix.startsWith('--') ? `${prefix}${kebabName}` : `--${prefix}${kebabName}`
      target.style.setProperty(cssVarName, tokenValue)
      currentVariables.push(cssVarName)
    }
  }

  // Try to restore from localStorage
  function restoreFromStorage(): void {
    if (!options.storageKey) return

    try {
      if (typeof localStorage === 'undefined') return

      const saved = localStorage.getItem(options.storageKey)
      if (!saved || saved === '') return

      // Check if saved theme exists
      if (themesMap.has(saved)) {
        currentTheme = themesMap.get(saved)!
        applyCSSVariables(currentTheme)

        // Don't trigger onChange during initialization
      }
    } catch (error) {
      // Silently ignore localStorage errors
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Failed to restore theme from localStorage:', error)
      }
    }
  }

  // Save to localStorage
  function saveToStorage(themeName: string): void {
    if (!options.storageKey) return

    try {
      if (typeof localStorage === 'undefined') return
      localStorage.setItem(options.storageKey, themeName)
    } catch (error) {
      // Silently ignore localStorage errors
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Failed to save theme to localStorage:', error)
      }
    }
  }

  // Initialize with default theme
  applyCSSVariables(currentTheme)
  restoreFromStorage()

  // Public API
  const manager: ThemeManager = {
    apply(themeName: string): Theme {
      if (disposed) {
        throw new Error('ThemeManager has been disposed')
      }

      if (
        themeName === null ||
        themeName === undefined ||
        typeof themeName !== 'string' ||
        themeName === ''
      ) {
        throw new Error('Theme name must be a non-empty string')
      }

      const theme = themesMap.get(themeName)
      if (!theme) {
        throw new Error(`Cannot apply theme: '${themeName}' not found`)
      }

      const previousTheme = currentTheme
      const isNoOp = currentTheme.name === themeName

      if (!isNoOp) {
        currentTheme = theme
        applyCSSVariables(currentTheme)
      }

      // Always save to storage, even if it's a no-op
      saveToStorage(themeName)

      // Notify listeners only if it's not a no-op
      if (!isNoOp) {
        const newThemeCopy = cloneTheme(currentTheme)
        const prevThemeCopy = cloneTheme(previousTheme)

        for (const callback of changeCallbacks) {
          try {
            callback(newThemeCopy, prevThemeCopy)
          } catch (error) {
            // Don't let callback errors break the system
            if (typeof console !== 'undefined' && console.error) {
              console.error('Error in onChange callback:', error)
            }
          }
        }
      }

      return cloneTheme(currentTheme)
    },

    current(): Theme {
      if (disposed) {
        return undefined as unknown as Theme
      }
      return cloneTheme(currentTheme)
    },

    currentName(): string {
      if (disposed) {
        return ''
      }
      return currentTheme.name
    },

    list(): string[] {
      if (disposed) {
        return []
      }
      return Array.from(themesMap.keys())
    },

    get(themeName: string): Theme | undefined {
      if (disposed) {
        return undefined
      }

      const theme = themesMap.get(themeName)
      return theme ? cloneTheme(theme) : undefined
    },

    has(themeName: string): boolean {
      if (disposed) {
        return false
      }

      if (
        themeName === null ||
        themeName === undefined ||
        typeof themeName !== 'string' ||
        themeName === ''
      ) {
        return false
      }

      return themesMap.has(themeName)
    },

    register(theme: Theme): void {
      if (disposed) {
        throw new Error('ThemeManager has been disposed')
      }

      validateTheme(theme)

      if (themesMap.has(theme.name)) {
        throw new Error(`Cannot register theme: '${theme.name}' already exists`)
      }

      themesMap.set(theme.name, theme)
    },

    unregister(themeName: string): Theme {
      if (disposed) {
        throw new Error('ThemeManager has been disposed')
      }

      const theme = themesMap.get(themeName)
      if (!theme) {
        throw new Error(`Cannot unregister theme: '${themeName}' not found`)
      }

      if (currentTheme.name === themeName) {
        throw new Error(`Cannot unregister theme: '${themeName}' is currently active`)
      }

      if (themesMap.size === 1) {
        throw new Error(`Cannot unregister theme: '${themeName}' is the only theme`)
      }

      themesMap.delete(themeName)
      return cloneTheme(theme)
    },

    onChange(callback: ChangeCallback): Unsubscribe {
      if (disposed) {
        return () => {}
      }

      changeCallbacks.add(callback)

      return () => {
        changeCallbacks.delete(callback)
      }
    },

    clearStorage(): void {
      if (!options.storageKey) return

      try {
        if (typeof localStorage === 'undefined') return
        localStorage.removeItem(options.storageKey)
      } catch {
        // Silently ignore errors
      }
    },

    prefersDark(): boolean {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return false
      }

      return window.matchMedia('(prefers-color-scheme: dark)').matches
    },

    prefersLight(): boolean {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return false
      }

      return window.matchMedia('(prefers-color-scheme: light)').matches
    },

    onSystemChange(callback: SystemChangeCallback): Unsubscribe {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return () => {}
      }

      systemChangeCallbacks.add(callback)

      const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const lightQuery = window.matchMedia('(prefers-color-scheme: light)')

      const handler = (event: MediaQueryListEvent): void => {
        if (event.matches) {
          const scheme = event.media.includes('dark') ? 'dark' : 'light'
          callback(scheme)
        }
      }

      darkQuery.addEventListener('change', handler)
      lightQuery.addEventListener('change', handler)

      return () => {
        systemChangeCallbacks.delete(callback)
        darkQuery.removeEventListener('change', handler)
        lightQuery.removeEventListener('change', handler)
      }
    },

    applySystem(lightThemeName: string, darkThemeName: string): Theme {
      if (disposed) {
        throw new Error('ThemeManager has been disposed')
      }

      // Validate both theme names first
      if (!themesMap.has(lightThemeName)) {
        throw new Error(`Cannot apply system theme: '${lightThemeName}' not found`)
      }
      if (!themesMap.has(darkThemeName)) {
        throw new Error(`Cannot apply system theme: '${darkThemeName}' not found`)
      }

      const prefersDark = manager.prefersDark()
      const themeName = prefersDark ? darkThemeName : lightThemeName

      return manager.apply(themeName)
    },

    watchSystem(lightThemeName: string, darkThemeName: string): Unsubscribe {
      if (disposed) {
        throw new Error('ThemeManager has been disposed')
      }

      // Validate both theme names first
      if (!themesMap.has(lightThemeName)) {
        throw new Error(`Cannot watch system theme: '${lightThemeName}' not found`)
      }
      if (!themesMap.has(darkThemeName)) {
        throw new Error(`Cannot watch system theme: '${darkThemeName}' not found`)
      }

      // Apply immediately based on current preference
      manager.applySystem(lightThemeName, darkThemeName)

      // Watch for changes
      const unsubscribe = manager.onSystemChange(scheme => {
        const themeName = scheme === 'dark' ? darkThemeName : lightThemeName
        manager.apply(themeName)
      })

      return unsubscribe
    },

    getToken(tokenName: string): string | undefined {
      if (disposed) {
        return undefined
      }
      return currentTheme.tokens[tokenName]
    },

    getAllTokens(): Record<string, string> {
      if (disposed) {
        return {}
      }
      return { ...currentTheme.tokens }
    },

    getCSSVariableName(tokenName: string): string {
      const kebabName = camelToKebab(tokenName)
      // Don't add -- if prefix already starts with it
      if (prefix.startsWith('--')) {
        return `${prefix}${kebabName}`
      }
      return `--${prefix}${kebabName}`
    },

    dispose(): void {
      if (disposed) return

      disposed = true

      // Remove CSS variables
      if (target !== null) {
        for (const varName of currentVariables) {
          target.style.removeProperty(varName)
        }
      }

      // Clear callbacks
      changeCallbacks.clear()
      systemChangeCallbacks.clear()

      // Remove media query listener if exists
      if (mediaQueryListener && typeof window !== 'undefined' && window.matchMedia) {
        const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const lightQuery = window.matchMedia('(prefers-color-scheme: light)')
        darkQuery.removeEventListener('change', mediaQueryListener)
        lightQuery.removeEventListener('change', mediaQueryListener)
        mediaQueryListener = null
      }

      // Clear themes
      themesMap.clear()
      currentVariables = []
    },
  }

  return manager
}

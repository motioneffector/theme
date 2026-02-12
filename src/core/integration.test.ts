import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createThemeManager } from './theme-manager'
import { createTheme } from './theme'
import type { Theme } from '../types'

// Test helper functions
function createTestTheme(name: string, tokens: Record<string, string> = {}): Theme {
  return { name, tokens: { primary: '#000', ...tokens } }
}

function createSimpleThemes(): Theme[] {
  return [
    createTestTheme('light', { primary: '#000', background: '#fff', text: '#333' }),
    createTestTheme('dark', { primary: '#fff', background: '#000', text: '#ccc' }),
    createTestTheme('blue', { primary: '#0000ff', background: '#e3f2fd', text: '#0d47a1' }),
  ]
}

// Mock DOM element
function createMockElement() {
  const cssVariables = new Map<string, string>()

  const element = {
    style: {
      setProperty: vi.fn((name: string, value: string) => {
        cssVariables.set(name, value)
      }),
      removeProperty: vi.fn((name: string) => {
        cssVariables.delete(name)
      }),
      getPropertyValue: vi.fn((name: string) => cssVariables.get(name) ?? ''),
    },
    _cssVariables: cssVariables,
  }

  return element as unknown as HTMLElement & { _cssVariables: Map<string, string> }
}

// Mock localStorage
function createMockLocalStorage() {
  const store = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
    clear: vi.fn(() => {
      store.clear()
    }),
    get length() {
      return store.size
    },
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    _store: store,
  }
}

// Mock matchMedia
function createMockMatchMedia() {
  let darkModePreference = false
  const listeners = new Map<string, Set<(event: any) => void>>()

  const mockMatchMedia = vi.fn((query: string) => {
    const isDarkQuery = query === '(prefers-color-scheme: dark)'
    const isLightQuery = query === '(prefers-color-scheme: light)'

    return {
      matches: isDarkQuery ? darkModePreference : isLightQuery ? !darkModePreference : false,
      media: query,
      addEventListener: vi.fn((event: string, handler: (event: any) => void) => {
        if (event === 'change') {
          if (!listeners.has(query)) {
            listeners.set(query, new Set())
          }
          listeners.get(query)!.add(handler)
        }
      }),
      removeEventListener: vi.fn((event: string, handler: (event: any) => void) => {
        if (event === 'change') {
          listeners.get(query)?.delete(handler)
        }
      }),
      dispatchEvent: vi.fn(),
      onchange: null,
    }
  })

  return {
    mockMatchMedia,
    setDarkMode: (value: boolean) => {
      darkModePreference = value
    },
    triggerChange: () => {
      listeners.forEach((handlers, query) => {
        const isDarkQuery = query === '(prefers-color-scheme: dark)'
        const isLightQuery = query === '(prefers-color-scheme: light)'
        const matches = isDarkQuery ? darkModePreference : isLightQuery ? !darkModePreference : false

        handlers.forEach(handler => {
          handler({ matches, media: query })
        })
      })
    },
  }
}

describe('Integration Tests', () => {
  describe('Basic Theme Switching Workflow', () => {
    it('create manager → apply theme → verify CSS variables → switch theme → verify CSS updated', () => {
      // Arrange
      const target = createMockElement()
      const themes = createSimpleThemes()

      // Act - Create manager
      const manager = createThemeManager({ themes, target })

      // Assert - Default theme applied
      expect(manager.currentName()).toBe('light')
      expect(target._cssVariables.get('--color-primary')).toBe('#000')
      expect(target._cssVariables.get('--color-background')).toBe('#fff')

      // Act - Switch theme
      manager.apply('dark')

      // Assert - New theme applied
      expect(manager.currentName()).toBe('dark')
      expect(target._cssVariables.get('--color-primary')).toBe('#fff')
      expect(target._cssVariables.get('--color-background')).toBe('#000')
    })

    it('create manager → verify default theme active → verify CSS variables set correctly', () => {
      // Arrange
      const target = createMockElement()
      const themes = createSimpleThemes()

      // Act
      const manager = createThemeManager({
        themes,
        defaultTheme: 'blue',
        target,
      })

      // Assert
      expect(manager.currentName()).toBe('blue')
      expect(target._cssVariables.get('--color-primary')).toBe('#0000ff')
      expect(target._cssVariables.get('--color-background')).toBe('#e3f2fd')
      expect(target._cssVariables.get('--color-text')).toBe('#0d47a1')
    })
  })

  describe('Persistence Workflow', () => {
    let mockStorage: ReturnType<typeof createMockLocalStorage>

    beforeEach(() => {
      mockStorage = createMockLocalStorage()
      global.localStorage = mockStorage as any
    })

    afterEach(() => {
      mockStorage.clear()
    })

    it('create manager with storageKey → apply theme → create new manager with same key → verify theme restored', () => {
      // Arrange
      const themes = createSimpleThemes()
      const storageKey = 'test-theme'

      // Act - Create first manager and apply theme
      const manager1 = createThemeManager({
        themes,
        storageKey,
        target: null,
      })
      manager1.apply('dark')

      // Assert - Theme saved
      expect(mockStorage._store.get(storageKey)).toBe('dark')

      // Act - Create second manager
      const manager2 = createThemeManager({
        themes,
        storageKey,
        target: null,
      })

      // Assert - Theme restored
      expect(manager2.currentName()).toBe('dark')
    })

    it('apply multiple themes → last applied is restored on new manager', () => {
      // Arrange
      const themes = createSimpleThemes()
      const storageKey = 'test-theme'

      // Act
      const manager1 = createThemeManager({
        themes,
        storageKey,
        target: null,
      })

      manager1.apply('dark')
      manager1.apply('blue')
      manager1.apply('light')

      // Assert - Last theme saved
      expect(mockStorage._store.get(storageKey)).toBe('light')

      // Create new manager
      const manager2 = createThemeManager({
        themes,
        storageKey,
        target: null,
      })

      // Assert - Last theme restored
      expect(manager2.currentName()).toBe('light')
    })

    it('clearStorage → new manager uses defaultTheme', () => {
      // Arrange
      const themes = createSimpleThemes()
      const storageKey = 'test-theme'

      // Act - Create manager and apply theme
      const manager1 = createThemeManager({
        themes,
        defaultTheme: 'light',
        storageKey,
        target: null,
      })
      manager1.apply('dark')

      // Clear storage
      manager1.clearStorage()

      // Assert - Storage cleared
      expect(mockStorage._store.has(storageKey)).toBe(false)

      // Create new manager
      const manager2 = createThemeManager({
        themes,
        defaultTheme: 'light',
        storageKey,
        target: null,
      })

      // Assert - Default theme used
      expect(manager2.currentName()).toBe('light')
    })
  })

  describe('System Preference Workflow', () => {
    let matchMediaMock: ReturnType<typeof createMockMatchMedia>

    beforeEach(() => {
      matchMediaMock = createMockMatchMedia()
      global.window = {
        matchMedia: matchMediaMock.mockMatchMedia,
      } as any
    })

    it('watchSystem → simulate system change → verify theme switches → verify CSS updated', () => {
      // Arrange
      const target = createMockElement()
      const themes = createSimpleThemes()
      matchMediaMock.setDarkMode(false)

      // Act - Create manager and watch system
      const manager = createThemeManager({ themes, target })
      manager.watchSystem('light', 'dark')

      // Assert - Light theme applied initially
      expect(manager.currentName()).toBe('light')
      expect(target._cssVariables.get('--color-primary')).toBe('#000')

      // Act - System changes to dark mode
      matchMediaMock.setDarkMode(true)
      matchMediaMock.triggerChange()

      // Assert - Dark theme applied automatically
      expect(manager.currentName()).toBe('dark')
      expect(target._cssVariables.get('--color-primary')).toBe('#fff')
    })

    it('watchSystem → unsubscribe → simulate system change → verify theme unchanged', () => {
      // Arrange
      const themes = createSimpleThemes()
      matchMediaMock.setDarkMode(false)

      // Act - Create manager and watch system
      const manager = createThemeManager({ themes, target: null })
      const unsubscribe = manager.watchSystem('light', 'dark')

      // Assert - Light theme applied
      expect(manager.currentName()).toBe('light')

      // Act - Unsubscribe
      unsubscribe()

      // Act - System changes to dark mode
      matchMediaMock.setDarkMode(true)
      matchMediaMock.triggerChange()

      // Assert - Theme unchanged (still light)
      expect(manager.currentName()).toBe('light')
    })
  })

  describe('Dynamic Theme Registration Workflow', () => {
    it('create manager → register new theme → apply new theme → verify CSS variables', () => {
      // Arrange
      const target = createMockElement()
      const themes = createSimpleThemes()

      // Act - Create manager
      const manager = createThemeManager({ themes, target })

      // Register new theme
      const purpleTheme = createTheme({
        name: 'purple',
        tokens: {
          primary: '#9c27b0',
          background: '#f3e5f5',
          text: '#4a148c',
        },
      })
      manager.register(purpleTheme)

      // Apply new theme
      manager.apply('purple')

      // Assert - New theme applied with correct CSS variables
      expect(manager.currentName()).toBe('purple')
      expect(target._cssVariables.get('--color-primary')).toBe('#9c27b0')
      expect(target._cssVariables.get('--color-background')).toBe('#f3e5f5')
      expect(target._cssVariables.get('--color-text')).toBe('#4a148c')
    })

    it('create manager → apply theme A → register theme B → apply theme B → verify only B\'s vars present', () => {
      // Arrange
      const target = createMockElement()
      const themeA = createTestTheme('themeA', {
        color1: '#111',
        color2: '#222',
        color3: '#333',
      })
      const themes = [themeA]

      // Act - Create manager and apply theme A
      const manager = createThemeManager({ themes, target })
      manager.apply('themeA')

      // Assert - Theme A variables present
      expect(target._cssVariables.get('--color-color1')).toBe('#111')
      expect(target._cssVariables.get('--color-color2')).toBe('#222')
      expect(target._cssVariables.get('--color-color3')).toBe('#333')

      // Act - Register and apply theme B (different tokens)
      const themeB = createTestTheme('themeB', {
        primary: '#aaa',
        secondary: '#bbb',
      })
      manager.register(themeB)
      manager.apply('themeB')

      // Assert - Only theme B variables present
      expect(target._cssVariables.get('--color-primary')).toBe('#aaa')
      expect(target._cssVariables.get('--color-secondary')).toBe('#bbb')
      expect(target._cssVariables.has('--color-color1')).toBe(false)
      expect(target._cssVariables.has('--color-color2')).toBe(false)
      expect(target._cssVariables.has('--color-color3')).toBe(false)
    })

    it('unregister theme → verify theme no longer accessible', () => {
      // Arrange
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: null })

      // Act - Unregister a theme
      const removed = manager.unregister('blue')

      // Assert - Theme removed
      expect(removed.name).toBe('blue')
      expect(manager.has('blue')).toBe(false)
      expect(manager.get('blue')).toBeUndefined()
      expect(manager.list()).not.toContain('blue')

      // Assert - Cannot apply removed theme
      expect(() => manager.apply('blue')).toThrow(/not found/i)
    })
  })

  describe('Error Recovery', () => {
    it('apply invalid theme name → verify current theme unchanged → apply valid theme → works', () => {
      // Arrange
      const themes = createSimpleThemes()
      const manager = createThemeManager({
        themes,
        defaultTheme: 'light',
        target: null,
      })

      // Assert - Initial theme
      expect(manager.currentName()).toBe('light')

      // Act - Try to apply invalid theme
      expect(() => manager.apply('nonexistent')).toThrow(/not found/i)

      // Assert - Theme unchanged
      expect(manager.currentName()).toBe('light')

      // Act - Apply valid theme
      manager.apply('dark')

      // Assert - Theme changed successfully
      expect(manager.currentName()).toBe('dark')
    })

    it('register duplicate name → verify manager state unchanged → register with different name → works', () => {
      // Arrange
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: null })

      const originalList = manager.list()

      // Act - Try to register duplicate
      const duplicate = createTestTheme('light', { color: 'red' })
      expect(() => manager.register(duplicate)).toThrow(/already exists/i)

      // Assert - Manager state unchanged
      expect(manager.list()).toEqual(originalList)

      // Act - Register with different name
      const newTheme = createTestTheme('custom', { color: 'green' })
      manager.register(newTheme)

      // Assert - New theme registered successfully
      expect(manager.has('custom')).toBe(true)
      expect(manager.list()).toContain('custom')
    })

    it('localStorage corrupted → manager uses defaultTheme → apply works normally', () => {
      // Arrange - Corrupt localStorage with invalid data
      const mockStorage = createMockLocalStorage()
      mockStorage._store.set('test-theme', '{"invalid": json}')
      global.localStorage = mockStorage as any

      const themes = createSimpleThemes()

      // Act - Create manager (should handle corrupted storage gracefully)
      const manager = createThemeManager({
        themes,
        defaultTheme: 'light',
        storageKey: 'test-theme',
        target: null,
      })

      // Assert - Falls back to default theme
      expect(manager.currentName()).toBe('light')

      // Act - Apply theme normally
      manager.apply('dark')

      // Assert - Works correctly
      expect(manager.currentName()).toBe('dark')

      // Act - Apply another theme
      manager.apply('blue')

      // Assert - Still works
      expect(manager.currentName()).toBe('blue')
    })
  })

  describe('Complete End-to-End Scenario', () => {
    it('full application lifecycle with all features', () => {
      // Setup mocks
      const target = createMockElement()
      const mockStorage = createMockLocalStorage()
      const matchMediaMock = createMockMatchMedia()
      global.localStorage = mockStorage as any
      global.window = { matchMedia: matchMediaMock.mockMatchMedia } as any

      // Create themes
      const themes = createSimpleThemes()

      // Create manager with persistence
      const manager = createThemeManager({
        themes,
        defaultTheme: 'light',
        storageKey: 'app-theme',
        target,
      })

      // Track changes
      const changes: string[] = []
      manager.onChange((newTheme, prevTheme) => {
        changes.push(`${prevTheme.name} → ${newTheme.name}`)
      })

      // User manually selects dark theme
      manager.apply('dark')
      expect(manager.currentName()).toBe('dark')
      expect(mockStorage._store.get('app-theme')).toBe('dark')
      expect(changes).toContain('light → dark')

      // Register custom theme dynamically
      const customTheme = createTheme({
        name: 'custom',
        tokens: { primary: '#ff5722', background: '#ffccbc' },
      })
      manager.register(customTheme)

      // Apply custom theme
      manager.apply('custom')
      expect(manager.currentName()).toBe('custom')
      expect(target._cssVariables.get('--color-primary')).toBe('#ff5722')

      // Enable system preference watching
      matchMediaMock.setDarkMode(false)
      const unwatch = manager.watchSystem('light', 'dark')
      expect(manager.currentName()).toBe('light')

      // System switches to dark mode
      matchMediaMock.setDarkMode(true)
      matchMediaMock.triggerChange()
      expect(manager.currentName()).toBe('dark')

      // Stop watching system
      unwatch()

      // Manual theme change
      manager.apply('blue')
      expect(manager.currentName()).toBe('blue')

      // Verify persistence
      const manager2 = createThemeManager({
        themes,
        storageKey: 'app-theme',
        target: null,
      })
      expect(manager2.currentName()).toBe('blue')

      // Cleanup
      manager.dispose()
      expect(() => manager.apply('light')).toThrow(/disposed/i)
    })
  })
})

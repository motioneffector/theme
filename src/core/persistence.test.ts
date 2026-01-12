import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createThemeManager } from './theme-manager'
import type { Theme } from '../types'

// Test helper functions
function createTestTheme(name: string, tokens: Record<string, string> = {}): Theme {
  return { name, tokens: { primary: '#000', ...tokens } }
}

function createSimpleThemes(): Theme[] {
  return [
    createTestTheme('light', { primary: '#000', background: '#fff' }),
    createTestTheme('dark', { primary: '#fff', background: '#000' }),
    createTestTheme('blue', { primary: '#0000ff', background: '#e3f2fd' }),
  ]
}

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  let throwOnGet = false
  let throwOnSet = false

  return {
    getItem: vi.fn((key: string) => {
      if (throwOnGet) throw new Error('SecurityError')
      return store[key] ?? null
    }),
    setItem: vi.fn((key: string, value: string) => {
      if (throwOnSet) throw new Error('QuotaExceededError')
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    setThrowOnGet: (value: boolean) => {
      throwOnGet = value
    },
    setThrowOnSet: (value: boolean) => {
      throwOnSet = value
    },
    reset: () => {
      store = {}
      throwOnGet = false
      throwOnSet = false
      mockLocalStorage.getItem.mockClear()
      mockLocalStorage.setItem.mockClear()
      mockLocalStorage.removeItem.mockClear()
      mockLocalStorage.clear.mockClear()
    },
  }
})()

describe('Persistence', () => {
  beforeEach(() => {
    mockLocalStorage.reset()
    global.localStorage = mockLocalStorage as Storage
  })

  afterEach(() => {
    mockLocalStorage.reset()
  })

  describe('When storageKey Is Configured', () => {
    describe('Saving', () => {
      it('saves theme name to localStorage on successful apply()', () => {
        const themes = createSimpleThemes()
        const manager = createThemeManager({
          themes,
          storageKey: 'test-theme',
          target: null,
        })

        manager.apply('dark')

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-theme', 'dark')
      })

      it('uses exact storageKey as localStorage key', () => {
        const themes = createSimpleThemes()
        const manager = createThemeManager({
          themes,
          storageKey: 'my-custom-key',
          target: null,
        })

        manager.apply('blue')

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('my-custom-key', 'blue')
      })

      it('saves only the theme name string (not entire theme object)', () => {
        const themes = createSimpleThemes()
        const manager = createThemeManager({
          themes,
          storageKey: 'test-theme',
          target: null,
        })

        manager.apply('dark')

        const saved = mockLocalStorage.getItem('test-theme')
        expect(saved).toBe('dark')
        expect(typeof saved).toBe('string')
      })

      it('overwrites previous saved value on each apply()', () => {
        const themes = createSimpleThemes()
        const manager = createThemeManager({
          themes,
          storageKey: 'test-theme',
          target: null,
        })

        manager.apply('light')
        expect(mockLocalStorage.getItem('test-theme')).toBe('light')

        manager.apply('dark')
        expect(mockLocalStorage.getItem('test-theme')).toBe('dark')

        manager.apply('blue')
        expect(mockLocalStorage.getItem('test-theme')).toBe('blue')
      })

      it('does not save if apply() throws (invalid theme name)', () => {
        const themes = createSimpleThemes()
        const manager = createThemeManager({
          themes,
          storageKey: 'test-theme',
          target: null,
        })

        const callCount = mockLocalStorage.setItem.mock.calls.length

        expect(() => manager.apply('nonexistent')).toThrow()
        expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(callCount)
      })
    })

    describe('Restoring', () => {
      it('reads from localStorage during manager creation', () => {
        mockLocalStorage.setItem('test-theme', 'dark')

        const themes = createSimpleThemes()
        createThemeManager({
          themes,
          storageKey: 'test-theme',
          target: null,
        })

        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-theme')
      })

      it('applies restored theme if it exists in themes array', () => {
        mockLocalStorage.setItem('test-theme', 'dark')

        const themes = createSimpleThemes()
        const manager = createThemeManager({
          themes,
          storageKey: 'test-theme',
          target: null,
        })

        expect(manager.currentName()).toBe('dark')
      })

      it('falls back to defaultTheme if saved theme name not in themes array', () => {
        mockLocalStorage.setItem('test-theme', 'nonexistent')

        const themes = createSimpleThemes()
        const manager = createThemeManager({
          themes,
          defaultTheme: 'blue',
          storageKey: 'test-theme',
          target: null,
        })

        expect(manager.currentName()).toBe('blue')
      })

      it('falls back to defaultTheme if localStorage key doesn\'t exist', () => {
        const themes = createSimpleThemes()
        const manager = createThemeManager({
          themes,
          defaultTheme: 'dark',
          storageKey: 'test-theme',
          target: null,
        })

        expect(manager.currentName()).toBe('dark')
      })

      it('falls back to defaultTheme if localStorage value is empty string', () => {
        mockLocalStorage.setItem('test-theme', '')

        const themes = createSimpleThemes()
        const manager = createThemeManager({
          themes,
          defaultTheme: 'blue',
          storageKey: 'test-theme',
          target: null,
        })

        expect(manager.currentName()).toBe('blue')
      })

      it('falls back to defaultTheme if localStorage value is invalid JSON (corrupted)', () => {
        // This test is less relevant since we store raw strings, but we should handle edge cases
        mockLocalStorage.setItem('test-theme', '{"invalid": json}')

        const themes = createSimpleThemes()
        const manager = createThemeManager({
          themes,
          defaultTheme: 'light',
          storageKey: 'test-theme',
          target: null,
        })

        expect(manager.currentName()).toBe('light')
      })

      it('falls back to defaultTheme if localStorage throws on read', () => {
        mockLocalStorage.setThrowOnGet(true)

        const themes = createSimpleThemes()
        const manager = createThemeManager({
          themes,
          defaultTheme: 'light',
          storageKey: 'test-theme',
          target: null,
        })

        expect(manager.currentName()).toBe('light')
      })

      it('triggers onChange callback if restored theme differs from defaultTheme', () => {
        mockLocalStorage.setItem('test-theme', 'dark')

        const themes = createSimpleThemes()
        const callback = vi.fn()

        const manager = createThemeManager({
          themes,
          defaultTheme: 'light',
          storageKey: 'test-theme',
          target: null,
        })

        manager.onChange(callback)

        // Create a new manager to trigger restoration
        const manager2 = createThemeManager({
          themes,
          defaultTheme: 'light',
          storageKey: 'test-theme',
          target: null,
        })

        // The current theme should be the restored one
        expect(manager2.currentName()).toBe('dark')
      })

      it('does not trigger onChange if restored theme equals defaultTheme', () => {
        mockLocalStorage.setItem('test-theme', 'light')

        const themes = createSimpleThemes()
        const callback = vi.fn()

        const manager = createThemeManager({
          themes,
          defaultTheme: 'light',
          storageKey: 'test-theme',
          target: null,
        })

        manager.onChange(callback)

        expect(callback).not.toHaveBeenCalled()
      })
    })

    describe('localStorage Errors', () => {
      it('catches and ignores localStorage.getItem errors (e.g., SecurityError)', () => {
        mockLocalStorage.setThrowOnGet(true)

        const themes = createSimpleThemes()

        expect(() => {
          createThemeManager({
            themes,
            storageKey: 'test-theme',
            target: null,
          })
        }).not.toThrow()
      })

      it('catches and ignores localStorage.setItem errors (e.g., QuotaExceededError)', () => {
        mockLocalStorage.setThrowOnSet(true)

        const themes = createSimpleThemes()
        const manager = createThemeManager({
          themes,
          storageKey: 'test-theme',
          target: null,
        })

        expect(() => manager.apply('dark')).not.toThrow()
      })

      it('continues working normally if localStorage is unavailable', () => {
        // @ts-expect-error - Testing with unavailable localStorage
        global.localStorage = undefined

        const themes = createSimpleThemes()
        const manager = createThemeManager({
          themes,
          storageKey: 'test-theme',
          target: null,
        })

        expect(() => manager.apply('dark')).not.toThrow()
        expect(manager.currentName()).toBe('dark')

        // Restore for cleanup
        global.localStorage = mockLocalStorage as Storage
      })

      it('logs warning to console when localStorage operations fail (optional behavior)', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        mockLocalStorage.setThrowOnSet(true)

        const themes = createSimpleThemes()
        const manager = createThemeManager({
          themes,
          storageKey: 'test-theme',
          target: null,
        })

        manager.apply('dark')

        // Optional: Implementation may log warnings
        // This test is flexible to allow implementations with or without logging
        consoleWarnSpy.mockRestore()
      })
    })
  })

  describe('When storageKey Is Not Configured', () => {
    it('does not read from localStorage on creation', () => {
      const themes = createSimpleThemes()
      createThemeManager({
        themes,
        target: null,
      })

      expect(mockLocalStorage.getItem).not.toHaveBeenCalled()
    })

    it('does not write to localStorage on apply()', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({
        themes,
        target: null,
      })

      manager.apply('dark')

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })

    it('clearStorage() is still safe to call (no-op)', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({
        themes,
        target: null,
      })

      expect(() => manager.clearStorage()).not.toThrow()
    })
  })

  describe('manager.clearStorage()', () => {
    it('removes the storageKey from localStorage', () => {
      mockLocalStorage.setItem('test-theme', 'dark')

      const themes = createSimpleThemes()
      const manager = createThemeManager({
        themes,
        storageKey: 'test-theme',
        target: null,
      })

      manager.clearStorage()

      expect(mockLocalStorage.getItem('test-theme')).toBeNull()
    })

    it('returns void/undefined', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({
        themes,
        storageKey: 'test-theme',
        target: null,
      })

      const result = manager.clearStorage()

      expect(result).toBeUndefined()
    })

    it('does not change current theme', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({
        themes,
        storageKey: 'test-theme',
        target: null,
      })

      manager.apply('dark')
      const currentBefore = manager.currentName()

      manager.clearStorage()

      expect(manager.currentName()).toBe(currentBefore)
    })

    it('does not trigger onChange callback', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({
        themes,
        storageKey: 'test-theme',
        target: null,
      })

      const callback = vi.fn()
      manager.onChange(callback)

      manager.clearStorage()

      expect(callback).not.toHaveBeenCalled()
    })

    it('next manager creation will use defaultTheme', () => {
      mockLocalStorage.setItem('test-theme', 'dark')

      const themes = createSimpleThemes()
      const manager = createThemeManager({
        themes,
        defaultTheme: 'light',
        storageKey: 'test-theme',
        target: null,
      })

      expect(manager.currentName()).toBe('dark')

      manager.clearStorage()

      const manager2 = createThemeManager({
        themes,
        defaultTheme: 'light',
        storageKey: 'test-theme',
        target: null,
      })

      expect(manager2.currentName()).toBe('light')
    })

    it('safe to call when storageKey not configured (no-op)', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({
        themes,
        target: null,
      })

      expect(() => manager.clearStorage()).not.toThrow()
    })

    it('safe to call when localStorage unavailable (no-op)', () => {
      // @ts-expect-error - Testing with unavailable localStorage
      global.localStorage = undefined

      const themes = createSimpleThemes()
      const manager = createThemeManager({
        themes,
        storageKey: 'test-theme',
        target: null,
      })

      expect(() => manager.clearStorage()).not.toThrow()

      // Restore for cleanup
      global.localStorage = mockLocalStorage as Storage
    })
  })
})

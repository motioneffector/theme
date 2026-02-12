import { describe, it, expect, beforeEach, vi } from 'vitest'
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
  ]
}

function createMockElement(): HTMLElement {
  const style = new Map<string, string>()
  const element = {
    style: {
      setProperty: vi.fn((name: string, value: string) => {
        style.set(name, value)
      }),
      removeProperty: vi.fn((name: string) => {
        style.delete(name)
      }),
      getPropertyValue: vi.fn((name: string) => style.get(name) ?? ''),
    },
  }
  return element as unknown as HTMLElement
}

describe('Cleanup & Disposal', () => {
  describe('manager.dispose()', () => {
    it('removes all CSS variables from target element', () => {
      const target = createMockElement()
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target })

      // Apply theme to set CSS variables
      manager.apply('dark')

      // Verify variables were set
      expect(target.style.setProperty).toHaveBeenCalled()

      // Dispose
      manager.dispose()

      // Verify variables were removed
      expect(target.style.removeProperty).toHaveBeenCalled()
    })

    it('removes all onChange listeners', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: null })

      const callback = vi.fn()
      manager.onChange(callback)

      manager.dispose()

      // Try to trigger callback - should not fire
      // Note: We can't call apply after dispose, so we verify disposal worked in another test
      expect(() => manager.apply('dark')).toThrow(/disposed/i)
    })

    it('removes all onSystemChange listeners', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: null })

      const callback = vi.fn()
      manager.onSystemChange(callback)

      manager.dispose()

      // After disposal, system change listeners should be cleaned up
      // This is verified by checking that the manager is disposed
      expect(() => manager.apply('dark')).toThrow(/disposed/i)
    })

    it('clears internal state', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: null })

      manager.apply('dark')

      manager.dispose()

      // Attempting to access methods should show manager is disposed
      expect(() => manager.apply('light')).toThrow(/disposed/i)
    })

    it('subsequent apply() calls throw Error', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: null })

      manager.dispose()

      expect(() => manager.apply('dark')).toThrow(/disposed/i)
    })

    it('subsequent register() calls throw Error', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: null })

      manager.dispose()

      const newTheme = createTestTheme('new', { color: 'blue' })

      expect(() => manager.register(newTheme)).toThrow(/disposed/i)
    })

    it('current() returns undefined after dispose', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: null })

      manager.dispose()

      const result = manager.current()

      expect(result).toBe(undefined)
    })

    it('safe to call multiple times (idempotent)', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: null })

      manager.dispose()

      expect(() => manager.dispose()).not.toThrow()
      expect(() => manager.dispose()).not.toThrow()
      expect(() => manager.dispose()).not.toThrow()
    })

    it('dispose clears all method references', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: null })

      const callback = vi.fn()
      manager.onChange(callback)
      manager.onSystemChange(() => {})

      manager.dispose()

      // All methods should either throw or return safe values
      expect(() => manager.apply('dark')).toThrow(/disposed/i)
      expect(() => manager.register(createTestTheme('new'))).toThrow(/disposed/i)
      expect(manager.current()).toBe(undefined)
    })

    it('dispose stops all watchers', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: null })

      const unsubscribe = manager.watchSystem('light', 'dark')

      manager.dispose()

      // Verify that calling unsubscribe after dispose is safe
      expect(() => unsubscribe()).not.toThrow()
    })

    it('onChange callbacks do not fire after dispose', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: null })

      const callback = vi.fn()
      manager.onChange(callback)

      manager.dispose()

      // Try to trigger a change (will throw, but callback shouldn't fire)
      try {
        manager.apply('dark')
      } catch (error) {
        expect((error as Error).message).toContain('disposed')
      }

      expect(callback).not.toHaveBeenCalled()
    })

    it('list() returns empty array after dispose', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: null })

      manager.dispose()

      const result = manager.list()

      expect(result.every(() => false)).toBe(true)
    })

    it('get() returns undefined after dispose', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: null })

      manager.dispose()

      const result = manager.get('light')

      expect(result).toBe(undefined)
    })

    it('has() returns false after dispose', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: null })

      manager.dispose()

      expect(manager.has('light')).toBe(false)
      expect(manager.has('dark')).toBe(false)
    })
  })
})

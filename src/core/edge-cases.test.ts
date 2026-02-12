import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createThemeManager } from './theme-manager'
import { createTheme } from './theme'
import type { Theme } from '../types'

// Test helper functions
function createTestTheme(name: string, tokens: Record<string, string> = {}): Theme {
  return { name, tokens: { primary: '#000', ...tokens } }
}

describe('Edge Cases & Error Handling', () => {
  describe('Theme Name Edge Cases', () => {
    it('accepts Unicode theme names: "темная", "暗黑模式"', () => {
      const themes = [
        createTestTheme('темная', { primary: '#000' }),
        createTestTheme('暗黑模式', { primary: '#fff' }),
      ]

      const manager = createThemeManager({ themes, target: null })

      expect(manager.has('темная')).toBe(true)
      expect(manager.has('暗黑模式')).toBe(true)
      expect(manager.get('темная')!.name).toBe('темная')
      expect(manager.get('暗黑模式')!.name).toBe('暗黑模式')
    })

    it('accepts emoji in theme names: "dark 🌙"', () => {
      const themes = [createTestTheme('dark 🌙', { primary: '#000' })]

      const manager = createThemeManager({ themes, target: null })

      expect(manager.has('dark 🌙')).toBe(true)
      manager.apply('dark 🌙')
      expect(manager.currentName()).toBe('dark 🌙')
    })

    it('accepts very long theme names (1000+ characters)', () => {
      const longName = 'a'.repeat(1000)
      const themes = [createTestTheme(longName, { primary: '#000' })]

      const manager = createThemeManager({ themes, target: null })

      expect(manager.has(longName)).toBe(true)
      manager.apply(longName)
      expect(manager.currentName()).toBe(longName)
    })

    it('theme names are compared by string equality (===)', () => {
      const themes = [
        createTestTheme('dark', { primary: '#000' }),
        createTestTheme('Dark', { primary: '#111' }),
      ]

      const manager = createThemeManager({ themes, target: null })

      expect(manager.has('dark')).toBe(true)
      expect(manager.has('Dark')).toBe(true)
      expect(manager.get('dark')).not.toEqual(manager.get('Dark'))
    })

    it('handles theme names that look like object properties: "constructor", "toString", "__proto__"', () => {
      const themes = [
        createTestTheme('constructor', { primary: '#000' }),
        createTestTheme('toString', { primary: '#111' }),
        createTestTheme('__proto__', { primary: '#222' }),
      ]

      const manager = createThemeManager({ themes, target: null })

      expect(manager.has('constructor')).toBe(true)
      expect(manager.has('toString')).toBe(true)
      expect(manager.has('__proto__')).toBe(true)

      manager.apply('constructor')
      expect(manager.currentName()).toBe('constructor')

      manager.apply('toString')
      expect(manager.currentName()).toBe('toString')

      manager.apply('__proto__')
      expect(manager.currentName()).toBe('__proto__')
    })
  })

  describe('Token Name Edge Cases', () => {
    it('handles token names that are JavaScript reserved words: "default", "class"', () => {
      const theme = createTheme({
        name: 'test',
        tokens: {
          default: '#000',
          class: '#111',
          return: '#222',
          function: '#333',
        },
      })

      expect(theme.tokens.default).toBe('#000')
      expect(theme.tokens.class).toBe('#111')
      expect(theme.tokens.return).toBe('#222')
      expect(theme.tokens.function).toBe('#333')
    })

    it('handles token names that are object prototype properties: "constructor", "toString"', () => {
      const theme = createTheme({
        name: 'test',
        tokens: {
          constructor: '#000',
          toString: '#111',
          hasOwnProperty: '#222',
          valueOf: '#333',
        },
      })

      expect(theme.tokens.constructor).toBe('#000')
      expect(theme.tokens.toString).toBe('#111')
      expect(theme.tokens.hasOwnProperty).toBe('#222')
      expect(theme.tokens.valueOf).toBe('#333')
    })

    it('maximum number of tokens is limited only by memory', () => {
      // Create a theme with a large number of tokens
      const tokens: Record<string, string> = {}
      for (let i = 0; i < 1000; i++) {
        tokens[`token${i}`] = `#${i.toString(16).padStart(6, '0')}`
      }

      const theme = createTheme({
        name: 'large',
        tokens,
      })

      expect(theme.tokens.token0).toBe('#000000')
      expect(theme.tokens.token999).toBe('#0003e7')
    })

    it('handles themes with 1000+ tokens', () => {
      const tokens: Record<string, string> = {}
      for (let i = 0; i < 1500; i++) {
        tokens[`color${i}`] = `#${i.toString(16).padStart(6, '0')}`
      }

      const themes = [createTestTheme('large', tokens)]
      const manager = createThemeManager({ themes, target: null })

      manager.apply('large')
      expect(manager.currentName()).toBe('large')

      const allTokens = manager.getAllTokens()
      expect(allTokens.color0).toBe('#000000')
      expect(allTokens.color1499).toBe('#0005db')
    })
  })

  describe('Token Value Edge Cases', () => {
    it('handles very long token values (data URIs, long gradients)', () => {
      const longValue = `linear-gradient(${Array.from({ length: 100 }, (_, i) => `#${i.toString(16).padStart(6, '0')} ${i}%`).join(', ')})`

      const theme = createTheme({
        name: 'test',
        tokens: { gradient: longValue },
      })

      expect(theme.tokens.gradient).toBe(longValue)
      expect(theme.tokens.gradient.length).toBeGreaterThan(1000)
    })

    it('handles token values with special CSS characters', () => {
      const theme = createTheme({
        name: 'test',
        tokens: {
          quotes: '"quoted value"',
          parentheses: 'calc((100% - 20px) / 2)',
          brackets: 'attr(data-color)',
          slashes: 'url(https://example.com/image.png)',
        },
      })

      expect(theme.tokens.quotes).toBe('"quoted value"')
      expect(theme.tokens.parentheses).toBe('calc((100% - 20px) / 2)')
      expect(theme.tokens.brackets).toBe('attr(data-color)')
      expect(theme.tokens.slashes).toBe('url(https://example.com/image.png)')
    })

    it('handles token values that are valid CSS but unusual: "initial", "unset", "revert"', () => {
      const theme = createTheme({
        name: 'test',
        tokens: {
          initial: 'initial',
          unset: 'unset',
          revert: 'revert',
          revertLayer: 'revert-layer',
        },
      })

      expect(theme.tokens.initial).toBe('initial')
      expect(theme.tokens.unset).toBe('unset')
      expect(theme.tokens.revert).toBe('revert')
      expect(theme.tokens.revertLayer).toBe('revert-layer')
    })

    it('preserves exact whitespace in token values', () => {
      const theme = createTheme({
        name: 'test',
        tokens: {
          spaces: '  multiple   spaces  ',
          tabs: '\ttabs\t',
          newlines: 'line1\nline2',
        },
      })

      expect(theme.tokens.spaces).toBe('  multiple   spaces  ')
      expect(theme.tokens.tabs).toBe('\ttabs\t')
      expect(theme.tokens.newlines).toBe('line1\nline2')
    })

    it('does not trim token values', () => {
      const theme = createTheme({
        name: 'test',
        tokens: {
          leading: '  value',
          trailing: 'value  ',
          both: '  value  ',
        },
      })

      expect(theme.tokens.leading).toBe('  value')
      expect(theme.tokens.trailing).toBe('value  ')
      expect(theme.tokens.both).toBe('  value  ')
    })
  })

  describe('Rapid Operations', () => {
    it('multiple rapid apply() calls settle on final theme', () => {
      const themes = [
        createTestTheme('theme1', { primary: '#111' }),
        createTestTheme('theme2', { primary: '#222' }),
        createTestTheme('theme3', { primary: '#333' }),
        createTestTheme('theme4', { primary: '#444' }),
      ]
      const manager = createThemeManager({ themes, target: null })

      manager.apply('theme1')
      manager.apply('theme2')
      manager.apply('theme3')
      manager.apply('theme4')

      expect(manager.currentName()).toBe('theme4')
    })

    it('rapid apply() calls trigger onChange for each change', () => {
      const themes = [
        createTestTheme('theme1', {}),
        createTestTheme('theme2', {}),
        createTestTheme('theme3', {}),
      ]
      const manager = createThemeManager({ themes, target: null })

      const callback = vi.fn()
      manager.onChange(callback)

      manager.apply('theme2')
      manager.apply('theme3')
      manager.apply('theme1')

      expect(callback).toHaveBeenCalledTimes(3)
    })

    it('rapid apply() calls maintain correct previous/new theme in callbacks', () => {
      const themes = [
        createTestTheme('theme1', {}),
        createTestTheme('theme2', {}),
        createTestTheme('theme3', {}),
      ]
      const manager = createThemeManager({ themes, target: null })

      const calls: Array<{ prev: string; next: string }> = []
      manager.onChange((newTheme, prevTheme) => {
        calls.push({ prev: prevTheme.name, next: newTheme.name })
      })

      manager.apply('theme2')
      manager.apply('theme3')

      expect(calls).toEqual([
        { prev: 'theme1', next: 'theme2' },
        { prev: 'theme2', next: 'theme3' },
      ])
    })

    it('rapid register()/unregister() calls maintain consistent state', () => {
      const themes = [createTestTheme('base', {})]
      const manager = createThemeManager({ themes, target: null })

      manager.register(createTestTheme('temp1', {}))
      manager.register(createTestTheme('temp2', {}))
      manager.unregister('temp1')
      manager.register(createTestTheme('temp3', {}))

      expect(manager.has('temp1')).toBe(false)
      expect(manager.has('temp2')).toBe(true)
      expect(manager.has('temp3')).toBe(true)
    })

    it('apply() during onChange callback works correctly', () => {
      const themes = [
        createTestTheme('theme1', {}),
        createTestTheme('theme2', {}),
        createTestTheme('theme3', {}),
      ]
      const manager = createThemeManager({ themes, target: null })

      let callbackCount = 0
      manager.onChange((newTheme) => {
        callbackCount++
        // Only trigger once to avoid infinite loop
        if (callbackCount === 1 && newTheme.name === 'theme2') {
          manager.apply('theme3')
        }
      })

      manager.apply('theme2')

      expect(manager.currentName()).toBe('theme3')
      expect(callbackCount).toBe(2)
    })
  })

  describe('SSR / No-DOM Environment', () => {
    beforeEach(() => {
      // Save original
      global.document = undefined as any
      global.window = undefined as any
    })

    it('manager creation works without document global', () => {
      const themes = [createTestTheme('light', {})]

      expect(() => {
        createThemeManager({ themes, target: null })
      }).not.toThrow()
    })

    it('apply() works without document (skips CSS variable operations)', () => {
      const themes = [
        createTestTheme('light', {}),
        createTestTheme('dark', {}),
      ]
      const manager = createThemeManager({ themes, target: null })

      expect(() => manager.apply('dark')).not.toThrow()
    })

    it('apply() returns theme object even without DOM', () => {
      const themes = [createTestTheme('light', {})]
      const manager = createThemeManager({ themes, target: null })

      const result = manager.apply('light')

      expect(result).toHaveProperty('name', 'light')
      expect(result).toHaveProperty('tokens', { primary: '#000' })
    })

    it('current() works without DOM', () => {
      const themes = [createTestTheme('light', {})]
      const manager = createThemeManager({ themes, target: null })

      const current = manager.current()

      expect(current).toBeDefined()
      expect(current.name).toBe('light')
    })

    it('all non-DOM operations work identically', () => {
      const themes = [
        createTestTheme('light', {}),
        createTestTheme('dark', {}),
      ]
      const manager = createThemeManager({ themes, target: null })

      expect(manager.list()).toEqual(['light', 'dark'])
      expect(manager.has('light')).toBe(true)
      expect(manager.get('dark')).toBeDefined()
      expect(manager.currentName()).toBe('light')

      manager.register(createTestTheme('blue', {}))
      expect(manager.has('blue')).toBe(true)
    })

    it('prefersDark() returns false without window.matchMedia', () => {
      const themes = [createTestTheme('light', {})]
      const manager = createThemeManager({ themes, target: null })

      expect(manager.prefersDark()).toBe(false)
    })

    it('onSystemChange() returns unsubscribe function but never fires without matchMedia', () => {
      const themes = [createTestTheme('light', {})]
      const manager = createThemeManager({ themes, target: null })

      const callback = vi.fn()
      const unsubscribe = manager.onSystemChange(callback)

      unsubscribe()
      expect(callback).not.toHaveBeenCalled()
    })

    it('setting target: null explicitly disables DOM operations', () => {
      // Restore document for this test
      global.document = { documentElement: { style: {} } } as any

      const themes = [createTestTheme('light', {})]
      const manager = createThemeManager({ themes, target: null })

      expect(() => manager.apply('light')).not.toThrow()
    })
  })

  describe('Memory & Performance', () => {
    it('unsubscribed callbacks are garbage-collectible', () => {
      const themes = [createTestTheme('light', {})]
      const manager = createThemeManager({ themes, target: null })

      const callback = vi.fn()
      const unsubscribe = manager.onChange(callback)

      unsubscribe()

      // After unsubscribe, callback should not be called
      manager.apply('light')
      expect(callback).not.toHaveBeenCalled()
    })

    it('unregistered themes are garbage-collectible', () => {
      const themes = [
        createTestTheme('base', {}),
        createTestTheme('temp', {}),
      ]
      const manager = createThemeManager({ themes, target: null })

      manager.apply('base')
      const removed = manager.unregister('temp')

      expect(removed.name).toBe('temp')
      expect(manager.has('temp')).toBe(false)
    })

    it('disposed manager releases references', () => {
      const themes = [createTestTheme('light', {})]
      const manager = createThemeManager({ themes, target: null })

      const callback = vi.fn()
      manager.onChange(callback)

      manager.dispose()

      expect(manager.current()).toBe(undefined)
      expect(manager.list().every(() => false)).toBe(true)
    })

    it('no memory leaks from repeated apply() calls', () => {
      const themes = [
        createTestTheme('theme1', {}),
        createTestTheme('theme2', {}),
      ]
      const manager = createThemeManager({ themes, target: null })

      // Rapidly switch themes
      for (let i = 0; i < 1000; i++) {
        manager.apply(i % 2 === 0 ? 'theme1' : 'theme2')
      }

      expect(manager.currentName()).toBe('theme2')
    })
  })
})

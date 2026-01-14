import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createThemeManager } from './theme-manager'
import type { Theme, ThemeManagerOptions } from '../types'

// Test helper functions
function createTestTheme(name: string, tokens: Record<string, string> = { primary: '#000' }): Theme {
  return { name, tokens }
}

function createSimpleThemes(): Theme[] {
  return [
    createTestTheme('light', { primary: '#000', background: '#fff' }),
    createTestTheme('dark', { primary: '#fff', background: '#000' }),
  ]
}

function createMockElement(): HTMLElement {
  const element = document.createElement('div')
  return element
}

describe('createThemeManager(options)', () => {
  describe('Required Options', () => {
    it('creates a manager when given valid options with themes array', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes })

      expect(manager).toBeDefined()
      expect(manager.list()).toEqual(['light', 'dark'])
    })

    it('throws TypeError if options is undefined', () => {
      // @ts-expect-error - Testing runtime validation
      expect(() => createThemeManager(undefined)).toThrow(TypeError)
    })

    it('throws TypeError if options is null', () => {
      // @ts-expect-error - Testing runtime validation
      expect(() => createThemeManager(null)).toThrow(TypeError)
    })

    it('throws TypeError if options.themes is undefined', () => {
      // @ts-expect-error - Testing runtime validation
      expect(() => createThemeManager({})).toThrow(TypeError)
    })

    it('throws TypeError if options.themes is not an array', () => {
      // @ts-expect-error - Testing runtime validation
      expect(() => createThemeManager({ themes: 'not-an-array' })).toThrow(TypeError)
    })

    it('throws TypeError if options.themes is an empty array', () => {
      expect(() => createThemeManager({ themes: [] })).toThrow(TypeError)
    })

    it('throws TypeError if options.themes contains non-object elements', () => {
      // @ts-expect-error - Testing runtime validation
      expect(() => createThemeManager({ themes: ['not-an-object'] })).toThrow(TypeError)
    })

    it('throws TypeError if any theme is missing \'name\' property', () => {
      // @ts-expect-error - Testing runtime validation
      expect(() => createThemeManager({ themes: [{ tokens: {} }] })).toThrow(TypeError)
    })

    it('throws TypeError if any theme is missing \'tokens\' property', () => {
      // @ts-expect-error - Testing runtime validation
      expect(() => createThemeManager({ themes: [{ name: 'test' }] })).toThrow(TypeError)
    })

    it('throws Error if themes array contains duplicate names (exact match)', () => {
      const themes = [
        createTestTheme('duplicate'),
        createTestTheme('duplicate'),
      ]

      expect(() => createThemeManager({ themes })).toThrow(Error)
    })

    it('throws Error if themes array contains duplicate names (case-sensitive: "Dark" and "dark" are different)', () => {
      const themes = [
        createTestTheme('Dark'),
        createTestTheme('dark'),
      ]

      expect(() => createThemeManager({ themes })).not.toThrow()
    })
  })

  describe('Default Theme Selection', () => {
    it('sets first theme as active if defaultTheme option not specified', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes })

      expect(manager.currentName()).toBe('light')
    })

    it('sets specified defaultTheme as active when provided', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, defaultTheme: 'dark' })

      expect(manager.currentName()).toBe('dark')
    })

    it('throws Error if defaultTheme doesn\'t match any theme name', () => {
      const themes = createSimpleThemes()

      expect(() => createThemeManager({ themes, defaultTheme: 'nonexistent' })).toThrow(Error)
    })

    it('defaultTheme matching is case-sensitive', () => {
      const themes = [createTestTheme('Dark')]

      expect(() => createThemeManager({ themes, defaultTheme: 'dark' })).toThrow(Error)
    })
  })

  describe('Optional: CSS Variable Prefix', () => {
    let mockElement: HTMLElement

    beforeEach(() => {
      mockElement = createMockElement()
    })

    it('defaults to "--color-" if prefix not specified', () => {
      const themes = [createTestTheme('test', { primary: '#000' })]
      const manager = createThemeManager({ themes, target: mockElement })

      expect(mockElement.style.getPropertyValue('--color-primary')).toBe('#000')
    })

    it('accepts custom prefix: "--theme-"', () => {
      const themes = [createTestTheme('test', { primary: '#000' })]
      const manager = createThemeManager({ themes, prefix: '--theme-', target: mockElement })

      expect(mockElement.style.getPropertyValue('--theme-primary')).toBe('#000')
    })

    it('accepts prefix without trailing hyphen: "--c" (no auto-hyphen added)', () => {
      const themes = [createTestTheme('test', { primary: '#000' })]
      const manager = createThemeManager({ themes, prefix: '--c', target: mockElement })

      expect(mockElement.style.getPropertyValue('--cprimary')).toBe('#000')
    })

    it('accepts empty string prefix: "" (tokens become "--tokenName")', () => {
      const themes = [createTestTheme('test', { primary: '#000' })]
      const manager = createThemeManager({ themes, prefix: '', target: mockElement })

      expect(mockElement.style.getPropertyValue('--primary')).toBe('#000')
    })

    it('preserves prefix exactly as provided (no normalization)', () => {
      const themes = [createTestTheme('test', { primary: '#000' })]
      const manager = createThemeManager({ themes, prefix: '--CUSTOM_', target: mockElement })

      expect(mockElement.style.getPropertyValue('--CUSTOM_primary')).toBe('#000')
    })
  })

  describe('Optional: Storage Key', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('does not persist if storageKey not specified', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes })
      manager.apply('dark')

      expect(localStorage.length).toBe(0)
    })

    it('enables persistence when storageKey is provided', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, storageKey: 'test-theme' })
      manager.apply('dark')

      expect(localStorage.getItem('test-theme')).toBe('dark')
    })

    it('accepts any non-empty string as storageKey', () => {
      const themes = createSimpleThemes()

      expect(() => createThemeManager({ themes, storageKey: 'my-custom-key-123' })).not.toThrow()
    })

    it('throws TypeError if storageKey is empty string ""', () => {
      const themes = createSimpleThemes()

      expect(() => createThemeManager({ themes, storageKey: '' })).toThrow(TypeError)
    })
  })

  describe('Optional: Target Element', () => {
    afterEach(() => {
      // Clean up CSS variables from document.documentElement after each test
      document.documentElement.style.removeProperty('--color-primary')
      document.documentElement.style.removeProperty('--color-background')
    })

    it('defaults to document.documentElement if target not specified', () => {
      const themes = [createTestTheme('test', { primary: '#000' })]
      const manager = createThemeManager({ themes })

      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#000')
    })

    it('accepts custom target element for CSS variable injection', () => {
      const themes = [createTestTheme('test', { primary: '#000' })]
      const customElement = createMockElement()
      const manager = createThemeManager({ themes, target: customElement })

      expect(customElement.style.getPropertyValue('--color-primary')).toBe('#000')
      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('')
    })

    it('accepts null target (disables DOM operations, useful for SSR)', () => {
      const themes = [createTestTheme('test', { primary: '#000' })]

      expect(() => createThemeManager({ themes, target: null })).not.toThrow()
    })
  })
})

describe('manager.apply(themeName)', () => {
  let mockElement: HTMLElement

  beforeEach(() => {
    mockElement = createMockElement()
  })

  describe('Basic Functionality', () => {
    it('applies theme by exact name match', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: mockElement })

      const result = manager.apply('dark')

      expect(result.name).toBe('dark')
    })

    it('returns the applied Theme object', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: mockElement })

      const result = manager.apply('dark')

      expect(result).toEqual({ name: 'dark', tokens: { primary: '#fff', background: '#000' } })
    })

    it('throws Error if themeName is undefined', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: mockElement })

      // @ts-expect-error - Testing runtime validation
      expect(() => manager.apply(undefined)).toThrow(Error)
    })

    it('throws Error if themeName is null', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: mockElement })

      // @ts-expect-error - Testing runtime validation
      expect(() => manager.apply(null)).toThrow(Error)
    })

    it('throws Error if themeName is empty string', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: mockElement })

      expect(() => manager.apply('')).toThrow(Error)
    })

    it('throws Error if theme with given name doesn\'t exist', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: mockElement })

      expect(() => manager.apply('nonexistent')).toThrow(Error)
    })

    it('name matching is case-sensitive ("Dark" !== "dark")', () => {
      const themes = [createTestTheme('Dark')]
      const manager = createThemeManager({ themes, target: mockElement })

      expect(() => manager.apply('dark')).toThrow(Error)
    })

    it('calling apply() with already-active theme is a no-op (but still valid)', () => {
      const themes = createSimpleThemes()
      const manager = createThemeManager({ themes, target: mockElement })

      expect(() => manager.apply('light')).not.toThrow()
      expect(() => manager.apply('light')).not.toThrow()
    })
  })

  describe('CSS Variable Generation', () => {
    it('sets CSS variables on target element (default: document.documentElement)', () => {
      const themes = [createTestTheme('test', { primary: '#000', secondary: '#fff' })]
      const manager = createThemeManager({ themes, target: mockElement })

      expect(mockElement.style.getPropertyValue('--color-primary')).toBe('#000')
      expect(mockElement.style.getPropertyValue('--color-secondary')).toBe('#fff')
    })

    it('converts camelCase tokens to kebab-case: "primaryColor" → "--color-primary-color"', () => {
      const themes = [createTestTheme('test', { primaryColor: '#000' })]
      const manager = createThemeManager({ themes, target: mockElement })

      expect(mockElement.style.getPropertyValue('--color-primary-color')).toBe('#000')
    })

    it('preserves lowercase tokens: "primary" → "--color-primary"', () => {
      const themes = [createTestTheme('test', { primary: '#000' })]
      const manager = createThemeManager({ themes, target: mockElement })

      expect(mockElement.style.getPropertyValue('--color-primary')).toBe('#000')
    })

    it('handles consecutive capitals: "BGColor" → "--color-b-g-color"', () => {
      const themes = [createTestTheme('test', { BGColor: '#000' })]
      const manager = createThemeManager({ themes, target: mockElement })

      expect(mockElement.style.getPropertyValue('--color-b-g-color')).toBe('#000')
    })

    it('handles single letter segments: "colorA" → "--color-color-a"', () => {
      const themes = [createTestTheme('test', { colorA: '#000' })]
      const manager = createThemeManager({ themes, target: mockElement })

      expect(mockElement.style.getPropertyValue('--color-color-a')).toBe('#000')
    })

    it('handles numbers in tokens: "gray100" → "--color-gray100" (numbers not separated)', () => {
      const themes = [createTestTheme('test', { gray100: '#e5e5e5' })]
      const manager = createThemeManager({ themes, target: mockElement })

      expect(mockElement.style.getPropertyValue('--color-gray100')).toBe('#e5e5e5')
    })

    it('handles underscores: "primary_hover" → "--color-primary_hover" (underscores preserved)', () => {
      const themes = [createTestTheme('test', { primary_hover: '#000' })]
      const manager = createThemeManager({ themes, target: mockElement })

      expect(mockElement.style.getPropertyValue('--color-primary_hover')).toBe('#000')
    })

    it('applies custom prefix correctly: prefix "--theme-", token "primary" → "--theme-primary"', () => {
      const themes = [createTestTheme('test', { primary: '#000' })]
      const manager = createThemeManager({ themes, prefix: '--theme-', target: mockElement })

      expect(mockElement.style.getPropertyValue('--theme-primary')).toBe('#000')
    })

    it('applies empty prefix correctly: prefix "", token "primary" → "--primary"', () => {
      const themes = [createTestTheme('test', { primary: '#000' })]
      const manager = createThemeManager({ themes, prefix: '', target: mockElement })

      expect(mockElement.style.getPropertyValue('--primary')).toBe('#000')
    })
  })

  describe('Theme Switching', () => {
    it('removes CSS variables from previous theme before applying new theme', () => {
      const themes = [
        createTestTheme('theme1', { color1: '#111' }),
        createTestTheme('theme2', { color2: '#222' }),
      ]
      const manager = createThemeManager({ themes, target: mockElement })

      manager.apply('theme2')

      expect(mockElement.style.getPropertyValue('--color-color1')).toBe('')
      expect(mockElement.style.getPropertyValue('--color-color2')).toBe('#222')
    })

    it('only removes variables that were set by the manager (not other CSS vars)', () => {
      const themes = [
        createTestTheme('theme1', { managed: '#111' }),
        createTestTheme('theme2', { managed: '#222' }),
      ]
      const manager = createThemeManager({ themes, target: mockElement })

      mockElement.style.setProperty('--custom-var', 'custom-value')
      manager.apply('theme2')

      expect(mockElement.style.getPropertyValue('--custom-var')).toBe('custom-value')
    })

    it('handles switching between themes with different token sets', () => {
      const themes = [
        createTestTheme('theme1', { a: '#111', b: '#222' }),
        createTestTheme('theme2', { c: '#333', d: '#444' }),
      ]
      const manager = createThemeManager({ themes, target: mockElement })

      manager.apply('theme2')

      expect(mockElement.style.getPropertyValue('--color-a')).toBe('')
      expect(mockElement.style.getPropertyValue('--color-b')).toBe('')
      expect(mockElement.style.getPropertyValue('--color-c')).toBe('#333')
      expect(mockElement.style.getPropertyValue('--color-d')).toBe('#444')
    })

    it('new theme\'s tokens completely replace old theme\'s tokens', () => {
      const themes = [
        createTestTheme('old', { oldToken1: '#111', oldToken2: '#222', oldToken3: '#333' }),
        createTestTheme('new', { newToken1: '#aaa', newToken2: '#bbb' }),
      ]
      const manager = createThemeManager({ themes, target: mockElement })

      manager.apply('new')

      expect(mockElement.style.getPropertyValue('--color-old-token1')).toBe('')
      expect(mockElement.style.getPropertyValue('--color-old-token2')).toBe('')
      expect(mockElement.style.getPropertyValue('--color-old-token3')).toBe('')
      expect(mockElement.style.getPropertyValue('--color-new-token1')).toBe('#aaa')
      expect(mockElement.style.getPropertyValue('--color-new-token2')).toBe('#bbb')
    })

    it('switching from theme with 10 tokens to theme with 3 tokens leaves only 3 variables', () => {
      const themes = [
        createTestTheme('many', {
          t1: '1',
          t2: '2',
          t3: '3',
          t4: '4',
          t5: '5',
          t6: '6',
          t7: '7',
          t8: '8',
          t9: '9',
          t10: '10',
        }),
        createTestTheme('few', { a: 'a', b: 'b', c: 'c' }),
      ]
      const manager = createThemeManager({ themes, target: mockElement })

      manager.apply('few')

      expect(mockElement.style.getPropertyValue('--color-t1')).toBe('')
      expect(mockElement.style.getPropertyValue('--color-t10')).toBe('')
      expect(mockElement.style.getPropertyValue('--color-a')).toBe('a')
      expect(mockElement.style.getPropertyValue('--color-b')).toBe('b')
      expect(mockElement.style.getPropertyValue('--color-c')).toBe('c')
    })
  })

  describe('CSS Variable Verification Examples', () => {
    describe('Given prefix "--color-" (default)', () => {
      it('token "primary" → CSS var "--color-primary" with token\'s value', () => {
        const themes = [createTestTheme('test', { primary: '#123' })]
        const manager = createThemeManager({ themes, target: mockElement })

        expect(mockElement.style.getPropertyValue('--color-primary')).toBe('#123')
      })

      it('token "textMuted" → CSS var "--color-text-muted" with token\'s value', () => {
        const themes = [createTestTheme('test', { textMuted: '#456' })]
        const manager = createThemeManager({ themes, target: mockElement })

        expect(mockElement.style.getPropertyValue('--color-text-muted')).toBe('#456')
      })

      it('token "backgroundColor" → CSS var "--color-background-color" with token\'s value', () => {
        const themes = [createTestTheme('test', { backgroundColor: '#789' })]
        const manager = createThemeManager({ themes, target: mockElement })

        expect(mockElement.style.getPropertyValue('--color-background-color')).toBe('#789')
      })

      it('token "gray100" → CSS var "--color-gray100" with token\'s value', () => {
        const themes = [createTestTheme('test', { gray100: '#abc' })]
        const manager = createThemeManager({ themes, target: mockElement })

        expect(mockElement.style.getPropertyValue('--color-gray100')).toBe('#abc')
      })
    })

    describe('Given prefix "--theme-"', () => {
      it('token "primary" → CSS var "--theme-primary"', () => {
        const themes = [createTestTheme('test', { primary: '#123' })]
        const manager = createThemeManager({ themes, prefix: '--theme-', target: mockElement })

        expect(mockElement.style.getPropertyValue('--theme-primary')).toBe('#123')
      })

      it('token "textMuted" → CSS var "--theme-text-muted"', () => {
        const themes = [createTestTheme('test', { textMuted: '#456' })]
        const manager = createThemeManager({ themes, prefix: '--theme-', target: mockElement })

        expect(mockElement.style.getPropertyValue('--theme-text-muted')).toBe('#456')
      })
    })

    describe('Given prefix ""', () => {
      it('token "primary" → CSS var "--primary"', () => {
        const themes = [createTestTheme('test', { primary: '#123' })]
        const manager = createThemeManager({ themes, prefix: '', target: mockElement })

        expect(mockElement.style.getPropertyValue('--primary')).toBe('#123')
      })

      it('token "textMuted" → CSS var "--text-muted"', () => {
        const themes = [createTestTheme('test', { textMuted: '#456' })]
        const manager = createThemeManager({ themes, prefix: '', target: mockElement })

        expect(mockElement.style.getPropertyValue('--text-muted')).toBe('#456')
      })
    })
  })
})

describe('manager.current()', () => {
  it('returns the currently active Theme object', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    const current = manager.current()

    expect(current).toEqual({ name: 'light', tokens: { primary: '#000', background: '#fff' } })
  })

  it('returns default theme before any apply() call', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes, defaultTheme: 'dark' })

    expect(manager.current().name).toBe('dark')
  })

  it('returns most recently applied theme after apply() calls', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    manager.apply('dark')
    expect(manager.current().name).toBe('dark')

    manager.apply('light')
    expect(manager.current().name).toBe('light')
  })

  it('returned object has \'name\' and \'tokens\' properties', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    const current = manager.current()

    expect(current).toHaveProperty('name')
    expect(current).toHaveProperty('tokens')
  })

  it('returned object is a deep copy (mutations don\'t affect internal state)', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    const current = manager.current()
    current.name = 'mutated'
    current.tokens.primary = 'mutated'

    expect(manager.current().name).toBe('light')
    expect(manager.current().tokens.primary).toBe('#000')
  })

  it('mutating returned object does not affect subsequent current() calls', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    const first = manager.current()
    first.tokens.primary = 'mutated'

    const second = manager.current()

    expect(second.tokens.primary).toBe('#000')
  })

  it('mutating returned object.tokens does not affect CSS variables', () => {
    const themes = createSimpleThemes()
    const mockElement = createMockElement()
    const manager = createThemeManager({ themes, target: mockElement })

    const current = manager.current()
    current.tokens.primary = 'mutated'

    expect(mockElement.style.getPropertyValue('--color-primary')).toBe('#000')
  })
})

describe('manager.currentName()', () => {
  it('returns string name of currently active theme', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    expect(manager.currentName()).toBe('light')
  })

  it('returns default theme name before any apply() call', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes, defaultTheme: 'dark' })

    expect(manager.currentName()).toBe('dark')
  })

  it('returns most recently applied theme name after apply()', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    manager.apply('dark')
    expect(manager.currentName()).toBe('dark')

    manager.apply('light')
    expect(manager.currentName()).toBe('light')
  })

  it('return value is primitive string (not object reference)', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    const name = manager.currentName()

    expect(typeof name).toBe('string')
  })
})

describe('manager.list()', () => {
  it('returns array of all registered theme names', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    expect(manager.list()).toEqual(['light', 'dark'])
  })

  it('returns names in registration order (initial themes first, then registered)', () => {
    const themes = [
      createTestTheme('first'),
      createTestTheme('second'),
      createTestTheme('third'),
    ]
    const manager = createThemeManager({ themes })
    manager.register(createTestTheme('fourth'))

    expect(manager.list()).toEqual(['first', 'second', 'third', 'fourth'])
  })

  it('returns empty array never (manager requires at least one theme)', () => {
    const themes = [createTestTheme('only')]
    const manager = createThemeManager({ themes })

    expect(manager.list().length).toBeGreaterThan(0)
  })

  it('returned array is a copy (mutations don\'t affect manager)', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    const list = manager.list()
    list.push('fake')

    expect(manager.list()).toEqual(['light', 'dark'])
  })

  it('pushing to returned array doesn\'t add themes', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    const list = manager.list()
    list.push('fake')

    expect(manager.has('fake')).toBe(false)
  })

  it('includes dynamically registered themes', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    manager.register(createTestTheme('dynamic'))

    expect(manager.list()).toContain('dynamic')
  })

  it('excludes unregistered themes', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    manager.register(createTestTheme('temp'))

    manager.unregister('temp')

    expect(manager.list()).not.toContain('temp')
  })
})

describe('manager.get(themeName)', () => {
  it('returns Theme object matching the given name', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    const theme = manager.get('light')

    expect(theme).toEqual({ name: 'light', tokens: { primary: '#000', background: '#fff' } })
  })

  it('returns undefined if theme doesn\'t exist (does not throw)', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    expect(manager.get('nonexistent')).toBeUndefined()
  })

  it('matching is case-sensitive', () => {
    const themes = [createTestTheme('Dark')]
    const manager = createThemeManager({ themes })

    expect(manager.get('dark')).toBeUndefined()
    expect(manager.get('Dark')).toBeDefined()
  })

  it('returned theme is a deep copy', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    const theme = manager.get('light')!
    theme.name = 'mutated'
    theme.tokens.primary = 'mutated'

    const theme2 = manager.get('light')
    expect(theme2?.name).toBe('light')
    expect(theme2?.tokens.primary).toBe('#000')
  })

  it('mutating returned theme doesn\'t affect manager\'s internal state', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    const theme = manager.get('light')!
    theme.tokens.primary = 'mutated'

    expect(manager.get('light')?.tokens.primary).toBe('#000')
  })

  it('mutating returned theme doesn\'t affect current() if it\'s the active theme', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    const theme = manager.get('light')!
    theme.tokens.primary = 'mutated'

    expect(manager.current().tokens.primary).toBe('#000')
  })
})

describe('manager.has(themeName)', () => {
  it('returns true if theme with exact name exists', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    expect(manager.has('light')).toBe(true)
  })

  it('returns false if theme doesn\'t exist', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    expect(manager.has('nonexistent')).toBe(false)
  })

  it('returns false for undefined argument', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    // @ts-expect-error - Testing runtime validation
    expect(manager.has(undefined)).toBe(false)
  })

  it('returns false for null argument', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    // @ts-expect-error - Testing runtime validation
    expect(manager.has(null)).toBe(false)
  })

  it('returns false for empty string argument', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    expect(manager.has('')).toBe(false)
  })

  it('matching is case-sensitive', () => {
    const themes = [createTestTheme('Dark')]
    const manager = createThemeManager({ themes })

    expect(manager.has('dark')).toBe(false)
    expect(manager.has('Dark')).toBe(true)
  })
})

describe('manager.register(theme)', () => {
  it('adds a new theme to the manager', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    manager.register(createTestTheme('new', { color: '#111' }))

    expect(manager.has('new')).toBe(true)
  })

  it('returns void/undefined', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    const result = manager.register(createTestTheme('new'))

    expect(result).toBeUndefined()
  })

  it('new theme is immediately available via get()', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    manager.register(createTestTheme('new', { color: '#111' }))

    expect(manager.get('new')).toEqual({ name: 'new', tokens: { color: '#111' } })
  })

  it('new theme appears at end of list()', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    manager.register(createTestTheme('new'))

    const list = manager.list()
    expect(list[list.length - 1]).toBe('new')
  })

  it('new theme can be applied immediately after registration', () => {
    const themes = createSimpleThemes()
    const mockElement = createMockElement()
    const manager = createThemeManager({ themes, target: mockElement })

    manager.register(createTestTheme('new', { color: '#111' }))
    manager.apply('new')

    expect(manager.currentName()).toBe('new')
  })

  it('does not change current theme', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    manager.register(createTestTheme('new'))

    expect(manager.currentName()).toBe('light')
  })

  it('does not trigger onChange callback', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback = vi.fn()
    manager.onChange(callback)

    manager.register(createTestTheme('new'))

    expect(callback).not.toHaveBeenCalled()
  })

  it('accepts plain objects conforming to Theme interface', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    expect(() => manager.register({ name: 'plain', tokens: { color: '#000' } })).not.toThrow()
  })

  it('accepts themes created via createTheme()', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    const newTheme = createTestTheme('fromHelper')
    expect(() => manager.register(newTheme)).not.toThrow()
  })

  it('throws Error if theme with same name already exists', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    expect(() => manager.register(createTestTheme('light'))).toThrow(Error)
  })

  it('throws TypeError if theme is undefined', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    // @ts-expect-error - Testing runtime validation
    expect(() => manager.register(undefined)).toThrow(TypeError)
  })

  it('throws TypeError if theme is null', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    // @ts-expect-error - Testing runtime validation
    expect(() => manager.register(null)).toThrow(TypeError)
  })

  it('throws TypeError if theme is missing \'name\' property', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    // @ts-expect-error - Testing runtime validation
    expect(() => manager.register({ tokens: {} })).toThrow(TypeError)
  })

  it('throws TypeError if theme is missing \'tokens\' property', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    // @ts-expect-error - Testing runtime validation
    expect(() => manager.register({ name: 'test' })).toThrow(TypeError)
  })

  it('throws TypeError if theme.name is empty string', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    expect(() => manager.register({ name: '', tokens: {} })).toThrow(TypeError)
  })

  it('throws TypeError if theme.tokens is empty object', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    expect(() => manager.register({ name: 'test', tokens: {} })).toThrow(TypeError)
  })
})

describe('manager.unregister(themeName)', () => {
  it('removes theme by name', () => {
    const themes = [...createSimpleThemes(), createTestTheme('temp')]
    const manager = createThemeManager({ themes })

    manager.unregister('temp')

    expect(manager.has('temp')).toBe(false)
  })

  it('returns the removed Theme object', () => {
    const themes = [...createSimpleThemes(), createTestTheme('temp', { color: '#111' })]
    const manager = createThemeManager({ themes })

    const removed = manager.unregister('temp')

    expect(removed).toEqual({ name: 'temp', tokens: { color: '#111' } })
  })

  it('removed theme no longer in list()', () => {
    const themes = [...createSimpleThemes(), createTestTheme('temp')]
    const manager = createThemeManager({ themes })

    manager.unregister('temp')

    expect(manager.list()).not.toContain('temp')
  })

  it('removed theme returns undefined from get()', () => {
    const themes = [...createSimpleThemes(), createTestTheme('temp')]
    const manager = createThemeManager({ themes })

    manager.unregister('temp')

    expect(manager.get('temp')).toBeUndefined()
  })

  it('removed theme returns false from has()', () => {
    const themes = [...createSimpleThemes(), createTestTheme('temp')]
    const manager = createThemeManager({ themes })

    manager.unregister('temp')

    expect(manager.has('temp')).toBe(false)
  })

  it('throws Error if theme doesn\'t exist', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    expect(() => manager.unregister('nonexistent')).toThrow(Error)
  })

  it('throws Error if trying to remove currently active theme', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    expect(() => manager.unregister('light')).toThrow(Error)
  })

  it('does not trigger onChange callback', () => {
    const themes = [...createSimpleThemes(), createTestTheme('temp')]
    const manager = createThemeManager({ themes })
    const callback = vi.fn()
    manager.onChange(callback)

    manager.unregister('temp')

    expect(callback).not.toHaveBeenCalled()
  })

  it('allows re-registering a theme with same name after unregister', () => {
    const themes = [...createSimpleThemes(), createTestTheme('temp')]
    const manager = createThemeManager({ themes })

    manager.unregister('temp')
    manager.register(createTestTheme('temp', { newColor: '#222' }))

    expect(manager.has('temp')).toBe(true)
    expect(manager.get('temp')?.tokens.newColor).toBe('#222')
  })
})

describe('Registration Edge Cases', () => {
  it('can register theme with same tokens but different name', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    const sameTokens = { primary: '#000', background: '#fff' }
    expect(() => manager.register(createTestTheme('clone', sameTokens))).not.toThrow()
  })

  it('registering then immediately applying works correctly', () => {
    const themes = createSimpleThemes()
    const mockElement = createMockElement()
    const manager = createThemeManager({ themes, target: mockElement })

    manager.register(createTestTheme('new', { color: '#111' }))
    manager.apply('new')

    expect(mockElement.style.getPropertyValue('--color-color')).toBe('#111')
  })

  it('unregistering non-active theme while another is active works correctly', () => {
    const themes = [...createSimpleThemes(), createTestTheme('temp')]
    const manager = createThemeManager({ themes })
    manager.apply('dark')

    manager.unregister('light')

    expect(manager.currentName()).toBe('dark')
    expect(manager.has('light')).toBe(false)
  })

  it('manager with single theme: cannot unregister it (would leave zero themes)', () => {
    const themes = [createTestTheme('only')]
    const manager = createThemeManager({ themes })

    expect(() => manager.unregister('only')).toThrow(Error)
  })
})

describe('manager.onChange(callback)', () => {
  it('returns an unsubscribe function', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })

    const unsubscribe = manager.onChange(() => {})

    expect(typeof unsubscribe).toBe('function')
  })

  it('callback fires when theme is applied via apply()', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback = vi.fn()
    manager.onChange(callback)

    manager.apply('dark')

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('callback receives (newTheme, previousTheme) arguments', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback = vi.fn()
    manager.onChange(callback)

    manager.apply('dark')

    expect(callback).toHaveBeenCalledWith(
      { name: 'dark', tokens: { primary: '#fff', background: '#000' } },
      { name: 'light', tokens: { primary: '#000', background: '#fff' } }
    )
  })

  it('newTheme is the newly applied Theme object', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback = vi.fn()
    manager.onChange(callback)

    manager.apply('dark')

    const [newTheme] = callback.mock.calls[0]
    expect(newTheme.name).toBe('dark')
  })

  it('previousTheme is the previously active Theme object', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback = vi.fn()
    manager.onChange(callback)

    manager.apply('dark')

    const [, previousTheme] = callback.mock.calls[0]
    expect(previousTheme.name).toBe('light')
  })

  it('callback themes are copies (mutations don\'t affect manager)', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback = vi.fn()
    manager.onChange(callback)

    manager.apply('dark')

    const [newTheme] = callback.mock.calls[0]
    newTheme.tokens.primary = 'mutated'

    expect(manager.current().tokens.primary).toBe('#fff')
  })

  it('callback does NOT fire on initial manager creation', () => {
    const themes = createSimpleThemes()
    const callback = vi.fn()
    const manager = createThemeManager({ themes })
    manager.onChange(callback)

    expect(callback).not.toHaveBeenCalled()
  })

  it('callback does NOT fire when apply() is called with already-active theme', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback = vi.fn()
    manager.onChange(callback)

    manager.apply('light')

    expect(callback).not.toHaveBeenCalled()
  })

  it('callback does NOT fire when register() is called', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback = vi.fn()
    manager.onChange(callback)

    manager.register(createTestTheme('new'))

    expect(callback).not.toHaveBeenCalled()
  })

  it('callback does NOT fire when unregister() is called', () => {
    const themes = [...createSimpleThemes(), createTestTheme('temp')]
    const manager = createThemeManager({ themes })
    const callback = vi.fn()
    manager.onChange(callback)

    manager.unregister('temp')

    expect(callback).not.toHaveBeenCalled()
  })
})

describe('Multiple Callbacks', () => {
  it('multiple callbacks can be registered', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    manager.onChange(callback1)
    manager.onChange(callback2)
    manager.apply('dark')

    expect(callback1).toHaveBeenCalledTimes(1)
    expect(callback2).toHaveBeenCalledTimes(1)
  })

  it('callbacks fire in registration order', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const order: number[] = []

    manager.onChange(() => order.push(1))
    manager.onChange(() => order.push(2))
    manager.onChange(() => order.push(3))
    manager.apply('dark')

    expect(order).toEqual([1, 2, 3])
  })

  it('one callback throwing does not prevent others from firing', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback1 = vi.fn(() => {
      throw new Error('callback1 error')
    })
    const callback2 = vi.fn()

    manager.onChange(callback1)
    manager.onChange(callback2)

    expect(() => manager.apply('dark')).not.toThrow()
    expect(callback2).toHaveBeenCalledTimes(1)
  })

  it('callback can safely call apply() (does not cause infinite loop if different theme)', () => {
    const themes = [...createSimpleThemes(), createTestTheme('third')]
    const manager = createThemeManager({ themes })
    const callback = vi.fn((newTheme: Theme) => {
      if (newTheme.name === 'dark') {
        manager.apply('third')
      }
    })

    manager.onChange(callback)
    manager.apply('dark')

    expect(callback).toHaveBeenCalledTimes(2)
    expect(manager.currentName()).toBe('third')
  })

  it('callback calling apply() with same theme is no-op', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback = vi.fn((newTheme: Theme) => {
      manager.apply(newTheme.name)
    })

    manager.onChange(callback)
    manager.apply('dark')

    expect(callback).toHaveBeenCalledTimes(1)
  })
})

describe('Unsubscribe Behavior', () => {
  it('calling unsubscribe function stops that callback from firing', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback = vi.fn()
    const unsubscribe = manager.onChange(callback)

    unsubscribe()
    manager.apply('dark')

    expect(callback).not.toHaveBeenCalled()
  })

  it('unsubscribe is idempotent (calling multiple times is safe)', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback = vi.fn()
    const unsubscribe = manager.onChange(callback)

    unsubscribe()
    unsubscribe()
    unsubscribe()
    manager.apply('dark')

    expect(callback).not.toHaveBeenCalled()
  })

  it('unsubscribing one callback doesn\'t affect others', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const unsubscribe1 = manager.onChange(callback1)
    manager.onChange(callback2)

    unsubscribe1()
    manager.apply('dark')

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).toHaveBeenCalledTimes(1)
  })

  it('unsubscribing during callback execution is safe (takes effect after current cycle)', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    let unsubscribe: () => void
    const callback = vi.fn(() => {
      unsubscribe()
    })
    unsubscribe = manager.onChange(callback)

    manager.apply('dark')
    manager.apply('light')

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('unsubscribe returns void/undefined', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const unsubscribe = manager.onChange(() => {})

    const result = unsubscribe()

    expect(result).toBeUndefined()
  })
})

describe('Callback Argument Details', () => {
  it('newTheme.name matches the applied theme name', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback = vi.fn()
    manager.onChange(callback)

    manager.apply('dark')

    const [newTheme] = callback.mock.calls[0]
    expect(newTheme.name).toBe('dark')
  })

  it('newTheme.tokens matches the applied theme tokens', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback = vi.fn()
    manager.onChange(callback)

    manager.apply('dark')

    const [newTheme] = callback.mock.calls[0]
    expect(newTheme.tokens).toEqual({ primary: '#fff', background: '#000' })
  })

  it('previousTheme.name matches the previously active theme', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes })
    const callback = vi.fn()
    manager.onChange(callback)

    manager.apply('dark')

    const [, previousTheme] = callback.mock.calls[0]
    expect(previousTheme.name).toBe('light')
  })

  it('on first apply after creation, previousTheme is the default theme', () => {
    const themes = createSimpleThemes()
    const manager = createThemeManager({ themes, defaultTheme: 'dark' })
    const callback = vi.fn()
    manager.onChange(callback)

    manager.apply('light')

    const [, previousTheme] = callback.mock.calls[0]
    expect(previousTheme.name).toBe('dark')
  })
})

describe('Security: storage key validation', () => {
  it('handles storage key with special characters', () => {
    const themes = createSimpleThemes()

    expect(() =>
      createThemeManager({
        themes,
        storageKey: 'app:theme:v1',
        target: null,
      })
    ).not.toThrow()
  })

  it('handles very long storage keys', () => {
    const themes = createSimpleThemes()
    const longKey = 'theme-' + 'x'.repeat(1000)

    expect(() =>
      createThemeManager({
        themes,
        storageKey: longKey,
        target: null,
      })
    ).not.toThrow()
  })

  it('handles unicode in storage keys', () => {
    const themes = createSimpleThemes()

    expect(() =>
      createThemeManager({
        themes,
        storageKey: 'theme-🎨-中文',
        target: null,
      })
    ).not.toThrow()
  })

  it('applies theme name from storage without executing code', () => {
    const themes = [
      ...createSimpleThemes(),
      createTestTheme('constructor'),
      createTestTheme('toString'),
      createTestTheme('__proto__'),
    ]

    // Test that theme names that match Object.prototype properties work safely
    const manager1 = createThemeManager({
      themes,
      storageKey: 'test-constructor',
      target: null,
    })
    expect(manager1.apply('constructor')).toBeDefined()

    const manager2 = createThemeManager({
      themes,
      storageKey: 'test-toString',
      target: null,
    })
    expect(manager2.apply('toString')).toBeDefined()
  })
})

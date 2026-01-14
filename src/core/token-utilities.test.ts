import { describe, it, expect, beforeEach } from 'vitest'
import { createThemeManager } from './theme-manager'
import type { Theme } from '../types'

// Test helper functions
function createTestTheme(name: string, tokens: Record<string, string> = {}): Theme {
  return { name, tokens: { primary: '#000', ...tokens } }
}

describe('Token Access Utilities', () => {
  describe('manager.getToken(tokenName)', () => {
    it('returns current value of token from active theme', () => {
      const themes = [
        createTestTheme('light', { primary: '#000', secondary: '#666' }),
        createTestTheme('dark', { primary: '#fff', secondary: '#ccc' }),
      ]
      const manager = createThemeManager({ themes, target: null })

      expect(manager.getToken('primary')).toBe('#000')
      expect(manager.getToken('secondary')).toBe('#666')
    })

    it('returns undefined if token doesn\'t exist in active theme', () => {
      const themes = [createTestTheme('light', { primary: '#000' })]
      const manager = createThemeManager({ themes, target: null })

      expect(manager.getToken('nonexistent')).toBeUndefined()
    })

    it('returns value as string', () => {
      const themes = [createTestTheme('light', { primary: '#000' })]
      const manager = createThemeManager({ themes, target: null })

      const value = manager.getToken('primary')

      expect(typeof value).toBe('string')
      expect(value).toBe('#000')
    })

    it('reflects active theme (changes after apply())', () => {
      const themes = [
        createTestTheme('light', { primary: '#000' }),
        createTestTheme('dark', { primary: '#fff' }),
      ]
      const manager = createThemeManager({ themes, target: null })

      expect(manager.getToken('primary')).toBe('#000')

      manager.apply('dark')

      expect(manager.getToken('primary')).toBe('#fff')
    })

    it('token lookup is case-sensitive', () => {
      const themes = [
        createTestTheme('light', {
          primary: '#000',
          Primary: '#111',
          PRIMARY: '#222',
        }),
      ]
      const manager = createThemeManager({ themes, target: null })

      expect(manager.getToken('primary')).toBe('#000')
      expect(manager.getToken('Primary')).toBe('#111')
      expect(manager.getToken('PRIMARY')).toBe('#222')
    })
  })

  describe('Security: prototype pollution prevention in getToken()', () => {
    it('returns undefined for __proto__ token name (blocked)', () => {
      const themes = [createTestTheme('light', { primary: '#000' })]
      const manager = createThemeManager({ themes, target: null })

      expect(manager.getToken('__proto__')).toBeUndefined()
    })

    it('can access constructor token if it exists (safe)', () => {
      const themes = [createTestTheme('light', { constructor: '#000', primary: '#111' })]
      const manager = createThemeManager({ themes, target: null })

      // constructor as a token name is safe - it just shadows the inherited property
      expect(manager.getToken('constructor')).toBe('#000')
    })

    it('can access prototype token if it exists (safe)', () => {
      const themes = [createTestTheme('light', { prototype: '#222', primary: '#111' })]
      const manager = createThemeManager({ themes, target: null })

      // prototype as a token name is safe
      expect(manager.getToken('prototype')).toBe('#222')
    })

    it('cannot access inherited Object.prototype properties', () => {
      const themes = [createTestTheme('light', { primary: '#000' })]
      const manager = createThemeManager({ themes, target: null })

      // Attempting to access inherited properties should return undefined
      // These are not defined as tokens, so they shouldn't be accessible
      expect(manager.getToken('toString')).toBeUndefined()
      expect(manager.getToken('valueOf')).toBeUndefined()
      expect(manager.getToken('hasOwnProperty')).toBeUndefined()
    })

    it('verifies __proto__ access via getToken does not pollute', () => {
      const themes = [createTestTheme('light', { primary: '#000' })]
      const manager = createThemeManager({ themes, target: null })

      const beforePolluted = ({} as Record<string, unknown>).polluted

      // Attempt to access __proto__ via getToken
      const result = manager.getToken('__proto__')
      expect(result).toBeUndefined()

      const afterPolluted = ({} as Record<string, unknown>).polluted
      expect(beforePolluted).toBeUndefined()
      expect(afterPolluted).toBeUndefined()
    })
  })

  describe('manager.getAllTokens()', () => {
    it('returns all tokens from active theme as object', () => {
      const themes = [
        createTestTheme('light', {
          primary: '#000',
          secondary: '#666',
          background: '#fff',
        }),
      ]
      const manager = createThemeManager({ themes, target: null })

      const tokens = manager.getAllTokens()

      expect(tokens).toEqual({
        primary: '#000',
        secondary: '#666',
        background: '#fff',
      })
    })

    it('returned object is a copy (mutations don\'t affect manager)', () => {
      const themes = [createTestTheme('light', { primary: '#000' })]
      const manager = createThemeManager({ themes, target: null })

      const tokens = manager.getAllTokens()
      tokens.primary = '#fff'
      tokens.newToken = '#999'

      const tokensAfter = manager.getAllTokens()
      expect(tokensAfter.primary).toBe('#000')
      expect(tokensAfter.newToken).toBeUndefined()
    })

    it('reflects active theme (changes after apply())', () => {
      const themes = [
        createTestTheme('light', { primary: '#000', secondary: '#666' }),
        createTestTheme('dark', { primary: '#fff', secondary: '#ccc' }),
      ]
      const manager = createThemeManager({ themes, target: null })

      expect(manager.getAllTokens()).toEqual({
        primary: '#000',
        secondary: '#666',
      })

      manager.apply('dark')

      expect(manager.getAllTokens()).toEqual({
        primary: '#fff',
        secondary: '#ccc',
      })
    })

    it('includes all tokens, not just changed ones', () => {
      const themes = [
        createTestTheme('light', {
          primary: '#000',
          secondary: '#666',
          background: '#fff',
          text: '#333',
        }),
      ]
      const manager = createThemeManager({ themes, target: null })

      const tokens = manager.getAllTokens()

      expect(Object.keys(tokens)).toHaveLength(4)
      expect(tokens).toHaveProperty('primary')
      expect(tokens).toHaveProperty('secondary')
      expect(tokens).toHaveProperty('background')
      expect(tokens).toHaveProperty('text')
    })
  })

  describe('manager.getCSSVariableName(tokenName)', () => {
    it('returns the CSS variable name for a given token', () => {
      const themes = [createTestTheme('light', { primary: '#000' })]
      const manager = createThemeManager({ themes, target: null })

      const varName = manager.getCSSVariableName('primary')

      expect(varName).toBe('--color-primary')
    })

    it('applies prefix and camelCase-to-kebab conversion', () => {
      const themes = [createTestTheme('light', { primaryColor: '#000' })]
      const manager = createThemeManager({ themes, target: null })

      const varName = manager.getCSSVariableName('primaryColor')

      expect(varName).toBe('--color-primary-color')
    })

    it('returns name regardless of whether token exists in current theme', () => {
      const themes = [createTestTheme('light', { primary: '#000' })]
      const manager = createThemeManager({ themes, target: null })

      const varName = manager.getCSSVariableName('nonexistent')

      expect(varName).toBe('--color-nonexistent')
    })

    it('example: "primaryColor" → "--color-primary-color" (with default prefix)', () => {
      const themes = [createTestTheme('light', { primary: '#000' })]
      const manager = createThemeManager({ themes, target: null })

      expect(manager.getCSSVariableName('primaryColor')).toBe('--color-primary-color')
    })

    it('respects custom prefix', () => {
      const themes = [createTestTheme('light', { primary: '#000' })]
      const manager = createThemeManager({
        themes,
        prefix: '--theme-',
        target: null,
      })

      expect(manager.getCSSVariableName('primary')).toBe('--theme-primary')
      expect(manager.getCSSVariableName('primaryColor')).toBe('--theme-primary-color')
    })

    it('respects empty prefix', () => {
      const themes = [createTestTheme('light', { primary: '#000' })]
      const manager = createThemeManager({
        themes,
        prefix: '',
        target: null,
      })

      expect(manager.getCSSVariableName('primary')).toBe('--primary')
      expect(manager.getCSSVariableName('primaryColor')).toBe('--primary-color')
    })

    it('handles tokens with numbers', () => {
      const themes = [createTestTheme('light', { gray100: '#e0e0e0' })]
      const manager = createThemeManager({ themes, target: null })

      expect(manager.getCSSVariableName('gray100')).toBe('--color-gray100')
    })

    it('handles tokens with underscores', () => {
      const themes = [createTestTheme('light', { primary_hover: '#333' })]
      const manager = createThemeManager({ themes, target: null })

      expect(manager.getCSSVariableName('primary_hover')).toBe('--color-primary_hover')
    })

    it('handles consecutive capitals', () => {
      const themes = [createTestTheme('light', { BGColor: '#000' })]
      const manager = createThemeManager({ themes, target: null })

      expect(manager.getCSSVariableName('BGColor')).toBe('--color-b-g-color')
    })

    it('handles single letter segments', () => {
      const themes = [createTestTheme('light', { colorA: '#000' })]
      const manager = createThemeManager({ themes, target: null })

      expect(manager.getCSSVariableName('colorA')).toBe('--color-color-a')
    })
  })
})

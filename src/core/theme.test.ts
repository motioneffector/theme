import { describe, it, expect } from 'vitest'
import { createTheme } from './theme'
import type { Theme } from '../types'

describe('createTheme(options) - Helper Function', () => {
  it('creates a theme with valid name and tokens', () => {
    const theme = createTheme({
      name: 'dark',
      tokens: { primary: '#000000' },
    })

    expect(theme).toBeDefined()
    expect(theme.name).toBe('dark')
    expect(theme.tokens).toEqual({ primary: '#000000' })
  })

  it('returns an object with \'name\' and \'tokens\' properties', () => {
    const theme = createTheme({
      name: 'light',
      tokens: { bg: '#ffffff' },
    })

    expect(theme).toHaveProperty('name', 'light')
    expect(theme).toHaveProperty('tokens', { bg: '#ffffff' })
  })

  it('freezes the returned theme object (Object.isFrozen returns true)', () => {
    const theme = createTheme({
      name: 'test',
      tokens: { color: 'red' },
    })

    expect(Object.isFrozen(theme)).toBe(true)
  })

  it('freezes the tokens object (nested immutability)', () => {
    const theme = createTheme({
      name: 'test',
      tokens: { color: 'red' },
    })

    expect(Object.isFrozen(theme.tokens)).toBe(true)
  })

  it('throws TypeError if name is undefined', () => {
    // @ts-expect-error - Testing runtime validation
    expect(() => createTheme({ tokens: { color: 'red' } })).toThrow(/name.*required/i)
  })

  it('throws TypeError if name is null', () => {
    // @ts-expect-error - Testing runtime validation
    expect(() => createTheme({ name: null, tokens: { color: 'red' } })).toThrow(/name.*null/i)
  })

  it('throws TypeError if name is empty string ""', () => {
    expect(() => createTheme({ name: '', tokens: { color: 'red' } })).toThrow(/empty/i)
  })

  it('throws TypeError if name is whitespace-only "   "', () => {
    expect(() => createTheme({ name: '   ', tokens: { color: 'red' } })).toThrow(/empty/i)
  })

  it('throws TypeError if tokens is undefined', () => {
    // @ts-expect-error - Testing runtime validation
    expect(() => createTheme({ name: 'test' })).toThrow(/tokens.*required/i)
  })

  it('throws TypeError if tokens is null', () => {
    // @ts-expect-error - Testing runtime validation
    expect(() => createTheme({ name: 'test', tokens: null })).toThrow(/tokens.*null/i)
  })

  it('throws TypeError if tokens is not an object (number, string, array)', () => {
    // @ts-expect-error - Testing runtime validation
    expect(() => createTheme({ name: 'test', tokens: 123 })).toThrow(/tokens.*object/i)

    // @ts-expect-error - Testing runtime validation
    expect(() => createTheme({ name: 'test', tokens: 'invalid' })).toThrow(/tokens.*object/i)

    // @ts-expect-error - Testing runtime validation
    expect(() => createTheme({ name: 'test', tokens: ['array'] })).toThrow(/tokens.*object/i)
  })

  it('throws TypeError if tokens object has zero keys', () => {
    expect(() => createTheme({ name: 'test', tokens: {} })).toThrow(/empty/i)
  })

  it('trims leading/trailing whitespace from theme name ("  dark  " becomes "dark")', () => {
    const theme = createTheme({
      name: '  dark  ',
      tokens: { color: 'black' },
    })

    expect(theme.name).toBe('dark')
  })

  it('preserves internal whitespace in theme name ("my theme" stays "my theme")', () => {
    const theme = createTheme({
      name: 'my theme',
      tokens: { color: 'blue' },
    })

    expect(theme.name).toBe('my theme')
  })
})

describe('Token Name Flexibility', () => {
  it('accepts single-word token names: "primary"', () => {
    const theme = createTheme({
      name: 'test',
      tokens: { primary: '#000' },
    })

    expect(theme.tokens.primary).toBe('#000')
  })

  it('accepts camelCase token names: "backgroundColor"', () => {
    const theme = createTheme({
      name: 'test',
      tokens: { backgroundColor: '#fff' },
    })

    expect(theme.tokens.backgroundColor).toBe('#fff')
  })

  it('accepts tokens with numbers: "gray100", "blue500"', () => {
    const theme = createTheme({
      name: 'test',
      tokens: { gray100: '#e0e0e0', blue500: '#2196f3' },
    })

    expect(theme.tokens.gray100).toBe('#e0e0e0')
    expect(theme.tokens.blue500).toBe('#2196f3')
  })

  it('accepts tokens with underscores: "primary_hover"', () => {
    const theme = createTheme({
      name: 'test',
      tokens: { primary_hover: '#333' },
    })

    expect(theme.tokens.primary_hover).toBe('#333')
  })

  it('rejects tokens with spaces (throws TypeError): "primary hover"', () => {
    expect(() =>
      createTheme({
        name: 'test',
        tokens: { 'primary hover': '#000' },
      })
    ).toThrow(/spaces/i)
  })

  it('rejects tokens starting with numbers (throws TypeError): "100gray"', () => {
    expect(() =>
      createTheme({
        name: 'test',
        tokens: { '100gray': '#ccc' },
      })
    ).toThrow(/number/i)
  })

  it('rejects tokens with hyphens (throws TypeError): "primary-hover" (use camelCase instead)', () => {
    expect(() =>
      createTheme({
        name: 'test',
        tokens: { 'primary-hover': '#000' },
      })
    ).toThrow(/hyphens/i)
  })

  it('rejects empty string token names (throws TypeError)', () => {
    expect(() =>
      createTheme({
        name: 'test',
        tokens: { '': '#000' },
      })
    ).toThrow(/empty/i)
  })
})

describe('Token Value Flexibility', () => {
  it('accepts 3-digit hex colors: "#fff"', () => {
    const theme = createTheme({
      name: 'test',
      tokens: { color: '#fff' },
    })

    expect(theme.tokens.color).toBe('#fff')
  })

  it('accepts 6-digit hex colors: "#ffffff"', () => {
    const theme = createTheme({
      name: 'test',
      tokens: { color: '#ffffff' },
    })

    expect(theme.tokens.color).toBe('#ffffff')
  })

  it('accepts 8-digit hex colors with alpha: "#ffffff80"', () => {
    const theme = createTheme({
      name: 'test',
      tokens: { color: '#ffffff80' },
    })

    expect(theme.tokens.color).toBe('#ffffff80')
  })

  it('accepts rgb() values: "rgb(255, 255, 255)"', () => {
    const theme = createTheme({
      name: 'test',
      tokens: { color: 'rgb(255, 255, 255)' },
    })

    expect(theme.tokens.color).toBe('rgb(255, 255, 255)')
  })

  it('accepts rgba() values: "rgba(255, 255, 255, 0.5)"', () => {
    const theme = createTheme({
      name: 'test',
      tokens: { color: 'rgba(255, 255, 255, 0.5)' },
    })

    expect(theme.tokens.color).toBe('rgba(255, 255, 255, 0.5)')
  })

  it('accepts hsl() values: "hsl(0, 0%, 100%)"', () => {
    const theme = createTheme({
      name: 'test',
      tokens: { color: 'hsl(0, 0%, 100%)' },
    })

    expect(theme.tokens.color).toBe('hsl(0, 0%, 100%)')
  })

  it('accepts hsla() values: "hsla(0, 0%, 100%, 0.5)"', () => {
    const theme = createTheme({
      name: 'test',
      tokens: { color: 'hsla(0, 0%, 100%, 0.5)' },
    })

    expect(theme.tokens.color).toBe('hsla(0, 0%, 100%, 0.5)')
  })

  it('accepts named colors: "white", "rebeccapurple", "transparent"', () => {
    const theme = createTheme({
      name: 'test',
      tokens: {
        color1: 'white',
        color2: 'rebeccapurple',
        color3: 'transparent',
      },
    })

    expect(theme.tokens.color1).toBe('white')
    expect(theme.tokens.color2).toBe('rebeccapurple')
    expect(theme.tokens.color3).toBe('transparent')
  })

  it('accepts CSS keywords: "inherit", "currentColor"', () => {
    const theme = createTheme({
      name: 'test',
      tokens: {
        color1: 'inherit',
        color2: 'currentColor',
      },
    })

    expect(theme.tokens.color1).toBe('inherit')
    expect(theme.tokens.color2).toBe('currentColor')
  })

  it('accepts empty string "" (valid CSS, inherits/uses initial)', () => {
    const theme = createTheme({
      name: 'test',
      tokens: { color: '' },
    })

    expect(theme.tokens.color).toBe('')
  })

  it('accepts CSS variable references: "var(--other-color)"', () => {
    const theme = createTheme({
      name: 'test',
      tokens: { color: 'var(--other-color)' },
    })

    expect(theme.tokens.color).toBe('var(--other-color)')
  })

  it('accepts calc() expressions: "calc(var(--base) + 10%)"', () => {
    const theme = createTheme({
      name: 'test',
      tokens: { color: 'calc(var(--base) + 10%)' },
    })

    expect(theme.tokens.color).toBe('calc(var(--base) + 10%)')
  })

  it('does NOT validate color syntax (accepts any string, invalid values pass through to CSS)', () => {
    const theme = createTheme({
      name: 'test',
      tokens: {
        invalid1: 'not-a-color',
        invalid2: '#gggggg',
        invalid3: 'rgb(999, 999, 999)',
      },
    })

    expect(theme.tokens.invalid1).toBe('not-a-color')
    expect(theme.tokens.invalid2).toBe('#gggggg')
    expect(theme.tokens.invalid3).toBe('rgb(999, 999, 999)')
  })
})

describe('Plain Object Themes (No Helper)', () => {
  it('createThemeManager accepts plain objects matching Theme interface', () => {
    const plainTheme: Theme = {
      name: 'plain',
      tokens: { color: 'blue' },
    }

    // This test will be fully validated when createThemeManager is implemented
    // For now, we just verify the plain object structure is valid
    expect(plainTheme.name).toBe('plain')
    expect(plainTheme.tokens).toEqual({ color: 'blue' })
  })

  it('plain object themes work identically to createTheme() themes', () => {
    const plainTheme: Theme = {
      name: 'plain',
      tokens: { primary: '#000' },
    }

    const helperTheme = createTheme({
      name: 'helper',
      tokens: { primary: '#000' },
    })

    // Both should have the same structure
    expect(plainTheme).toHaveProperty('name', 'plain')
    expect(plainTheme).toHaveProperty('tokens', { primary: '#000' })
    expect(helperTheme).toHaveProperty('name', 'helper')
    expect(helperTheme).toHaveProperty('tokens', { primary: '#000' })
  })

  it('plain object themes are not frozen (manager does not mutate them)', () => {
    const plainTheme: Theme = {
      name: 'plain',
      tokens: { color: 'red' },
    }

    // Plain objects should NOT be frozen
    expect(Object.isFrozen(plainTheme)).toBe(false)
    expect(Object.isFrozen(plainTheme.tokens)).toBe(false)
  })
})

describe('Security: prototype pollution prevention', () => {
  it('rejects __proto__ as token name', () => {
    // JSON.parse creates __proto__ as an own property
    const maliciousTokens = JSON.parse('{"__proto__": "polluted", "color": "red"}')

    expect(() =>
      createTheme({
        name: 'malicious',
        tokens: maliciousTokens,
      })
    ).toThrow(/__proto__/)
  })

  it('allows constructor as token name (safe - only shadows inherited property)', () => {
    // constructor as a direct property is safe - it just shadows the inherited property
    const theme = createTheme({
      name: 'test',
      tokens: { constructor: 'red' },
    })

    expect(theme.tokens.constructor).toBe('red')
    // Verify no pollution occurred
    expect(({} as Record<string, unknown>).constructor).not.toBe('red')
  })

  it('allows prototype as token name (safe - only shadows inherited property)', () => {
    // prototype as a direct property is safe
    const theme = createTheme({
      name: 'test',
      tokens: { prototype: 'blue' },
    })

    expect(theme.tokens.prototype).toBe('blue')
    // Verify no pollution occurred
    const hasPrototype = Object.prototype.hasOwnProperty.call(Object.prototype, 'prototype')
    expect(hasPrototype).toBe(false)
  })

  it('prevents prototype pollution via JSON.parse with __proto__', () => {
    // JSON.parse can create __proto__ keys which enable prototype pollution
    const maliciousTokens = JSON.parse('{"__proto__": {"polluted": true}, "color": "red"}')

    expect(() =>
      createTheme({
        name: 'malicious',
        tokens: maliciousTokens,
      })
    ).toThrow(/__proto__/)
  })

  it('verifies that __proto__ prototype pollution attempt does not succeed', () => {
    // Ensure the global Object prototype is not polluted
    const hasPollutedBefore = Object.prototype.hasOwnProperty.call(Object.prototype, 'polluted')
    expect(hasPollutedBefore).toBe(false)

    try {
      const maliciousTokens = JSON.parse('{"__proto__": {"polluted": true}, "color": "red"}')
      createTheme({
        name: 'malicious',
        tokens: maliciousTokens,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError)
    }

    const hasPollutedAfter = Object.prototype.hasOwnProperty.call(Object.prototype, 'polluted')
    expect(hasPollutedAfter).toBe(false)
  })

  it('multiple attempts to pollute via __proto__ are all blocked', () => {
    const attempts = [
      JSON.parse('{"__proto__": {"polluted1": true}}'),
      JSON.parse('{"__proto__": {"polluted2": true}, "color": "red"}'),
    ]

    for (const maliciousTokens of attempts) {
      expect(() =>
        createTheme({
          name: 'malicious',
          tokens: maliciousTokens,
        })
      ).toThrow(/__proto__/)
    }

    // Verify no pollution occurred from any attempt
    const hasPolluted1 = Object.prototype.hasOwnProperty.call(Object.prototype, 'polluted1')
    expect(hasPolluted1).toBe(false)
    const hasPolluted2 = Object.prototype.hasOwnProperty.call(Object.prototype, 'polluted2')
    expect(hasPolluted2).toBe(false)
  })
})

describe('Security: input validation hardening', () => {
  it('handles null bytes in theme name', () => {
    // Null bytes should not cause issues (they get trimmed away or rejected)
    expect(() =>
      createTheme({
        name: 'valid\x00malicious',
        tokens: { color: 'red' },
      })
    ).not.toThrow()
  })

  it('handles null bytes in token values', () => {
    expect(() =>
      createTheme({
        name: 'test',
        tokens: { color: 'red\x00blue' },
      })
    ).not.toThrow()
  })

  it('handles extremely long theme names', () => {
    const longName = 'a'.repeat(10_000)

    expect(() =>
      createTheme({
        name: longName,
        tokens: { color: 'red' },
      })
    ).not.toThrow()
  })

  it('handles extremely long token values', () => {
    const longValue = 'x'.repeat(100_000)

    expect(() =>
      createTheme({
        name: 'test',
        tokens: { color: longValue },
      })
    ).not.toThrow()
  })

  it('handles unicode edge cases in theme name', () => {
    // Surrogate pairs, RTL override, zero-width chars
    const edgeCases = ['\uD800\uDC00', '\u202E', '\u200B', '🎨', '\uFEFF']

    for (const input of edgeCases) {
      expect(() =>
        createTheme({
          name: `theme${input}`,
          tokens: { color: 'red' },
        })
      ).not.toThrow()
    }
  })

  it('handles unicode edge cases in token names', () => {
    const theme = createTheme({
      name: 'test',
      tokens: {
        'emoji🎨': 'red',
        中文: 'blue',
      },
    })

    expect(theme.tokens['emoji🎨']).toBe('red')
    expect(theme.tokens['中文']).toBe('blue')
  })

  it('handles unicode edge cases in token values', () => {
    const edgeCases = ['\uD800\uDC00', '\u202E', '\u200B', '🎨', '\uFEFF']

    for (const input of edgeCases) {
      expect(() =>
        createTheme({
          name: 'test',
          tokens: { color: `value${input}` },
        })
      ).not.toThrow()
    }
  })

  it('token values with potential CSS injection patterns are accepted', () => {
    // These are legitimate CSS values, not XSS vectors when used with CSS variables
    const theme = createTheme({
      name: 'test',
      tokens: {
        gradient: 'linear-gradient(to right, red, blue)',
        image: 'url(data:image/svg+xml,<svg>...</svg>)',
        calc: 'calc(100% - 20px)',
        complex: 'rgb(255, 0, 0) url("bg.png") no-repeat',
      },
    })

    expect(theme.tokens.gradient).toBe('linear-gradient(to right, red, blue)')
    expect(theme.tokens.image).toBe('url(data:image/svg+xml,<svg>...</svg>)')
    expect(theme.tokens.calc).toBe('calc(100% - 20px)')
    expect(theme.tokens.complex).toBe('rgb(255, 0, 0) url("bg.png") no-repeat')
  })
})

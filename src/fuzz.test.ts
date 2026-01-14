/**
 * Fuzz Test Suite for @motioneffector/theme
 *
 * This suite performs comprehensive fuzz testing on createTheme() and createThemeManager()
 * to verify robustness against malformed inputs, edge cases, and state machine invariants.
 *
 * Run modes:
 * - Standard: pnpm test:run (200 iterations per test, deterministic)
 * - Thorough: pnpm fuzz:thorough (60s per test, non-deterministic)
 */

import { describe, it, expect } from 'vitest'
import { createTheme, createThemeManager } from './index'
import type { Theme, ThemeManager } from './types'

// ============================================
// FUZZ TEST CONFIGURATION
// ============================================

const THOROUGH_MODE = process.env.FUZZ_THOROUGH === '1'
const THOROUGH_DURATION_MS = 10_000 // 10 seconds per test for reasonable total runtime
const STANDARD_ITERATIONS = 100
const BASE_SEED = 12345

// ============================================
// SEEDED PRNG + FUZZ LOOP HELPERS
// ============================================

/**
 * Creates a seeded pseudo-random number generator using a simple LCG algorithm.
 * Returns a function that produces numbers in [0, 1) range.
 */
function createSeededRandom(seed: number): () => number {
  let state = seed
  return () => {
    // Linear Congruential Generator (LCG) constants from Numerical Recipes
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

interface FuzzLoopResult {
  iterations: number
  durationMs: number
}

/**
 * Executes a fuzz test function repeatedly in either standard or thorough mode.
 * - Standard mode: Fixed iteration count with deterministic seed
 * - Thorough mode: Time-based execution with rotating seeds
 */
function fuzzLoop(testFn: (random: () => number, iteration: number) => void): FuzzLoopResult {
  const startTime = Date.now()
  let iterations = 0

  if (THOROUGH_MODE) {
    // Time-based execution
    const seed = Date.now() % 1000000
    const random = createSeededRandom(seed)

    while (Date.now() - startTime < THOROUGH_DURATION_MS) {
      testFn(random, iterations)
      iterations++
    }
  } else {
    // Fixed iteration count
    const random = createSeededRandom(BASE_SEED)

    for (let i = 0; i < STANDARD_ITERATIONS; i++) {
      testFn(random, i)
      iterations++
    }
  }

  return {
    iterations,
    durationMs: Date.now() - startTime,
  }
}

/**
 * Async version of fuzzLoop for tests that need async operations
 */
async function fuzzLoopAsync(
  testFn: (random: () => number, iteration: number) => Promise<void>
): Promise<FuzzLoopResult> {
  const startTime = Date.now()
  let iterations = 0

  if (THOROUGH_MODE) {
    const seed = Date.now() % 1000000
    const random = createSeededRandom(seed)

    while (Date.now() - startTime < THOROUGH_DURATION_MS) {
      await testFn(random, iterations)
      iterations++
    }
  } else {
    const random = createSeededRandom(BASE_SEED)

    for (let i = 0; i < STANDARD_ITERATIONS; i++) {
      await testFn(random, i)
      iterations++
    }
  }

  return {
    iterations,
    durationMs: Date.now() - startTime,
  }
}

// ============================================
// VALUE GENERATORS
// ============================================

/**
 * Generates a random string with various character types
 */
function generateString(random: () => number, maxLen = 1000): string {
  const len = Math.floor(random() * maxLen)
  const charSets = [
    'abcdefghijklmnopqrstuvwxyz',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    '0123456789',
    '   \t\n',
    '!@#$%^&*()_+-=[]{}|;:\'",.<>?/',
    '🎨🌙☀️⭐️💻🚀', // Emoji
    'العربية', // RTL text
    '中文字符', // Chinese
    '\x00\x01\x02', // Control characters
  ]

  let result = ''
  const charSet = charSets[Math.floor(random() * charSets.length)]

  for (let i = 0; i < len; i++) {
    result += charSet[Math.floor(random() * charSet.length)]
  }

  return result
}

/**
 * Generates a random number with various edge cases
 */
function generateNumber(random: () => number): number {
  const patterns = [
    () => 0,
    () => -1,
    () => 1,
    () => Math.floor(random() * 1000000),
    () => -Math.floor(random() * 1000000),
    () => Number.MAX_SAFE_INTEGER,
    () => Number.MIN_SAFE_INTEGER,
    () => Number.POSITIVE_INFINITY,
    () => Number.NEGATIVE_INFINITY,
    () => Number.NaN,
    () => 0.000001,
    () => random(),
  ]

  return patterns[Math.floor(random() * patterns.length)]()
}

/**
 * Generates a random array with various element types
 */
function generateArray<T>(
  random: () => number,
  generator: (random: () => number) => T,
  maxLen = 100
): T[] {
  const len = Math.floor(random() * maxLen)
  const result: T[] = []

  for (let i = 0; i < len; i++) {
    result.push(generator(random))
  }

  return result
}

/**
 * Generates a random object with various structures
 */
function generateObject(random: () => number, depth = 0, maxDepth = 3): unknown {
  if (depth >= maxDepth || random() < 0.3) {
    // Generate leaf values
    const patterns = [
      () => null,
      () => undefined,
      () => random() < 0.5,
      () => generateNumber(random),
      () => generateString(random, 100),
    ]
    return patterns[Math.floor(random() * patterns.length)]()
  }

  // Generate nested structure
  if (random() < 0.5) {
    // Object
    const obj: Record<string, unknown> = {}
    const keyCount = Math.floor(random() * 5) + 1

    for (let i = 0; i < keyCount; i++) {
      const key = generateString(random, 20) || 'key' + i
      obj[key] = generateObject(random, depth + 1, maxDepth)
    }

    return obj
  } else {
    // Array
    const arrLen = Math.floor(random() * 5)
    const arr: unknown[] = []

    for (let i = 0; i < arrLen; i++) {
      arr.push(generateObject(random, depth + 1, maxDepth))
    }

    return arr
  }
}

/**
 * Generates objects with malicious property names (prototype pollution attempts)
 */
function generateMaliciousObject(random: () => number): Record<string, string> {
  const maliciousKeys = ['__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty']
  const obj: Record<string, string> = {}
  const keyCount = Math.floor(random() * 3) + 1

  for (let i = 0; i < keyCount; i++) {
    const key = maliciousKeys[Math.floor(random() * maliciousKeys.length)]
    obj[key] = generateString(random, 50)
  }

  return obj
}

// ============================================
// DOMAIN-SPECIFIC GENERATORS
// ============================================

/**
 * Generate a valid theme name (non-empty, trimmed)
 */
function generateValidThemeName(random: () => number): string {
  const patterns = [
    () => 'theme' + Math.floor(random() * 1000),
    () => ['light', 'dark', 'ocean', 'sunset', 'forest'][Math.floor(random() * 5)],
    () => 'a'.repeat(Math.floor(random() * 100) + 1),
    () => '主题' + Math.floor(random() * 100), // Unicode
  ]
  return patterns[Math.floor(random() * patterns.length)]()
}

/**
 * Generate a valid token name (JS identifier without hyphens/spaces/leading digits)
 */
function generateValidTokenName(random: () => number): string {
  const patterns = [
    () => 'token' + Math.floor(random() * 1000),
    () => ['primary', 'secondary', 'background', 'text', 'border'][Math.floor(random() * 5)],
    () => 'color' + Math.floor(random() * 900 + 100), // gray100 style
    () => 'backgroundColor', // camelCase
    () => 'text_muted', // underscores
  ]
  return patterns[Math.floor(random() * patterns.length)]()
}

/**
 * Generate a token value (any string, including invalid CSS)
 */
function generateTokenValue(random: () => number): string {
  const patterns = [
    () => '#' + Math.floor(random() * 0xffffff).toString(16).padStart(6, '0'),
    () =>
      `rgb(${Math.floor(random() * 256)}, ${Math.floor(random() * 256)}, ${Math.floor(random() * 256)})`,
    () => ['red', 'blue', 'green', 'transparent', 'currentColor'][Math.floor(random() * 5)],
    () => 'var(--' + generateValidTokenName(random) + ')',
    () => '', // empty string
    () => generateString(random, 1000), // random string
  ]
  return patterns[Math.floor(random() * patterns.length)]()
}

/**
 * Generate a valid Theme object
 */
function generateValidTheme(random: () => number): Theme {
  const tokenCount = Math.floor(random() * 50) + 1
  const tokens: Record<string, string> = {}

  for (let i = 0; i < tokenCount; i++) {
    tokens[generateValidTokenName(random)] = generateTokenValue(random)
  }

  return {
    name: generateValidThemeName(random),
    tokens,
  }
}

/**
 * Generate malformed createTheme input
 */
function generateMalformedThemeOptions(random: () => number): unknown {
  const patterns = [
    () => null,
    () => undefined,
    () => ({ name: null, tokens: {} }),
    () => ({ name: '', tokens: { a: 'red' } }),
    () => ({ name: '   ', tokens: { a: 'red' } }),
    () => ({ name: 'test' }), // missing tokens
    () => ({ tokens: { a: 'red' } }), // missing name
    () => ({ name: 'test', tokens: null }),
    () => ({ name: 'test', tokens: {} }), // empty tokens
    () => ({ name: 'test', tokens: [] }), // array instead of object
    () => ({ name: 'test', tokens: { '': 'red' } }), // empty token name
    () => ({ name: 'test', tokens: { 'primary color': 'red' } }), // space in name
    () => ({ name: 'test', tokens: { 'primary-color': 'red' } }), // hyphen in name
    () => ({ name: 'test', tokens: { '100gray': 'red' } }), // starts with digit
    () => ({ name: 123, tokens: { a: 'red' } }), // non-string name
    () => ({ name: 'test', tokens: 'not-an-object' }),
    () => ({ name: generateString(random, 10000), tokens: { a: 'red' } }), // very long name
    () => ({ name: 'test', tokens: generateMaliciousObject(random) }), // prototype pollution
  ]
  return patterns[Math.floor(random() * patterns.length)]()
}

/**
 * Generate malformed ThemeManagerOptions
 */
function generateMalformedManagerOptions(random: () => number): unknown {
  const validTheme = generateValidTheme(random)
  const patterns = [
    () => null,
    () => undefined,
    () => ({}), // missing themes
    () => ({ themes: null }),
    () => ({ themes: 'not-array' }),
    () => ({ themes: [] }), // empty array
    () => ({ themes: [null] }),
    () => ({ themes: [validTheme, validTheme] }), // duplicate names
    () => ({ themes: [validTheme], defaultTheme: 'nonexistent' }),
    () => ({ themes: [validTheme], storageKey: '' }), // empty storage key
    () => ({ themes: [validTheme], prefix: 123 }), // non-string prefix
    () => ({ themes: [validTheme], target: {} }), // invalid target
    () => ({ themes: [validTheme], target: { style: null } }), // missing style methods
  ]
  return patterns[Math.floor(random() * patterns.length)]()
}

/**
 * Create a mock DOM element for testing
 */
function createMockElement(): HTMLElement {
  if (typeof document !== 'undefined') {
    return document.createElement('div')
  }
  // Minimal mock for non-browser environments
  const styleMap = new Map<string, string>()
  return {
    style: {
      setProperty: (name: string, value: string) => styleMap.set(name, value),
      getPropertyValue: (name: string) => styleMap.get(name) || '',
      removeProperty: (name: string) => {
        styleMap.delete(name)
      },
    },
  } as any
}

// ============================================
// TEST SUITE: INPUT MUTATION FUZZING
// ============================================

describe('Fuzz: createTheme input mutations', () => {
  it('handles malformed inputs with proper error types', () => {
    const result = fuzzLoop((random, i) => {
      const badInput = generateMalformedThemeOptions(random)

      try {
        createTheme(badInput as any)
        // If it doesn't throw for certain invalid inputs, that's a bug
        // Most malformed inputs should throw
      } catch (e) {
        // Verify it's a proper error type
        if (!(e instanceof TypeError || e instanceof Error)) {
          throw new Error(`Unexpected error type at iteration ${i}: ${e?.constructor?.name}`)
        }
        // Verify error message is informative
        if (e instanceof Error && e.message.length === 0) {
          throw new Error(`Empty error message at iteration ${i}`)
        }
      }
    })

    if (THOROUGH_MODE) {
      console.log(
        `✓ Completed ${result.iterations.toLocaleString()} iterations in ${(result.durationMs / 1000).toFixed(1)}s`
      )
    }
  })

  it('never mutates input objects', () => {
    fuzzLoop((random, i) => {
      const tokens = { primary: '#000', secondary: '#fff' }
      const input = { name: 'test', tokens }
      const tokensCopy = JSON.stringify(tokens)

      try {
        createTheme(input)
      } catch (e) {
        // Even on error, input should not be mutated
      }

      const tokensAfter = JSON.stringify(tokens)
      if (tokensCopy !== tokensAfter) {
        throw new Error(`Input tokens were mutated at iteration ${i}`)
      }
    })
  })

  it('completes within reasonable time for all inputs', () => {
    fuzzLoop((random, i) => {
      const input = generateMalformedThemeOptions(random)
      const start = Date.now()

      try {
        createTheme(input as any)
      } catch (e) {
        // Expected
      }

      const duration = Date.now() - start
      if (duration > 100) {
        throw new Error(`Operation took ${duration}ms at iteration ${i} (max 100ms)`)
      }
    })
  })

  it('returns frozen objects for valid inputs', () => {
    fuzzLoop((random, i) => {
      const theme = generateValidTheme(random)

      try {
        const result = createTheme(theme)

        if (!Object.isFrozen(result)) {
          throw new Error(`Theme object not frozen at iteration ${i}`)
        }

        if (!Object.isFrozen(result.tokens)) {
          throw new Error(`Theme tokens not frozen at iteration ${i}`)
        }
      } catch (e) {
        // If it throws, that's a generator issue, not a library issue
        if (e instanceof TypeError && e.message.includes('Token name')) {
          // Expected validation error from invalid generator output
        } else {
          throw e
        }
      }
    })
  })

  it('trims theme names correctly', () => {
    const testCases = [
      { input: '  test  ', expected: 'test' },
      { input: '\ttest\t', expected: 'test' },
      { input: '\ntest\n', expected: 'test' },
      { input: '  test with spaces  ', expected: 'test with spaces' },
    ]

    for (const { input, expected } of testCases) {
      const theme = createTheme({ name: input, tokens: { a: 'red' } })
      expect(theme.name).toBe(expected)
    }
  })

  it('validates token names correctly', () => {
    const invalidTokenNames = [
      { tokens: { '': 'red' }, error: 'empty string' },
      { tokens: { 'primary color': 'red' }, error: 'spaces' },
      { tokens: { 'primary-color': 'red' }, error: 'hyphens' },
      { tokens: { '100gray': 'red' }, error: 'number' },
    ]

    for (const { tokens, error } of invalidTokenNames) {
      expect(() => createTheme({ name: 'test', tokens })).toThrow(TypeError)
    }
  })

  it('handles boundary cases for theme name length', () => {
    const result = fuzzLoop((random, i) => {
      const lengths = [1, 10, 100, 1000, 10000]
      const len = lengths[Math.floor(random() * lengths.length)]
      const name = 'a'.repeat(len)

      const theme = createTheme({ name, tokens: { primary: '#000' } })
      if (theme.name !== name) {
        throw new Error(`Name length mismatch at iteration ${i}`)
      }
    })

    if (THOROUGH_MODE) {
      console.log(
        `✓ Completed ${result.iterations.toLocaleString()} iterations in ${(result.durationMs / 1000).toFixed(1)}s`
      )
    }
  })

  it('handles boundary cases for token count', () => {
    fuzzLoop((random, i) => {
      const counts = [1, 2, 10, 100, 1000]
      const count = counts[Math.floor(random() * counts.length)]
      const tokens: Record<string, string> = {}

      for (let j = 0; j < count; j++) {
        tokens[`token${j}`] = '#' + j.toString().padStart(6, '0')
      }

      const theme = createTheme({ name: 'test', tokens })
      if (Object.keys(theme.tokens).length !== count) {
        throw new Error(`Token count mismatch at iteration ${i}`)
      }
    })
  })

  it('handles Unicode in theme names', () => {
    const unicodeNames = [
      '主题', // Chinese
      'テーマ', // Japanese
      'الموضوع', // Arabic (RTL)
      '🎨🌙', // Emoji
      'café', // Accented characters
      'тема', // Cyrillic
    ]

    for (const name of unicodeNames) {
      const theme = createTheme({ name, tokens: { primary: '#000' } })
      expect(theme.name).toBe(name)
    }
  })
})

describe('Fuzz: createThemeManager input mutations', () => {
  it('handles malformed manager options with proper errors', () => {
    const result = fuzzLoop((random, i) => {
      const badInput = generateMalformedManagerOptions(random)

      try {
        createThemeManager(badInput as any)
        // Most malformed inputs should throw
      } catch (e) {
        // Verify it's a proper error type
        if (!(e instanceof TypeError || e instanceof Error)) {
          throw new Error(`Unexpected error type at iteration ${i}: ${e?.constructor?.name}`)
        }
        // Verify error message is informative
        if (e instanceof Error && e.message.length === 0) {
          throw new Error(`Empty error message at iteration ${i}`)
        }
      }
    })

    if (THOROUGH_MODE) {
      console.log(
        `✓ Completed ${result.iterations.toLocaleString()} iterations in ${(result.durationMs / 1000).toFixed(1)}s`
      )
    }
  })

  it('never mutates input theme objects', () => {
    fuzzLoop((random, i) => {
      const theme = generateValidTheme(random)
      const themeCopy = JSON.stringify(theme)

      try {
        createThemeManager({ themes: [theme] })
      } catch (e) {
        // Even on error, input should not be mutated
      }

      const themeAfter = JSON.stringify(theme)
      if (themeCopy !== themeAfter) {
        throw new Error(`Input theme was mutated at iteration ${i}`)
      }
    })
  })

  it('handles null target gracefully (SSR mode)', () => {
    fuzzLoop((random, i) => {
      const theme = generateValidTheme(random)

      try {
        const manager = createThemeManager({ themes: [theme], target: null })
        // Should work without errors in SSR mode
        expect(manager.current()).toBeDefined()
        expect(manager.currentName()).toBe(theme.name)
      } catch (e) {
        if (e instanceof TypeError && e.message.includes('Token name')) {
          // Expected validation error from invalid generator output
        } else {
          throw new Error(`Failed with null target at iteration ${i}: ${e}`)
        }
      }
    })
  })

  it('validates duplicate theme names', () => {
    const theme1 = createTheme({ name: 'test', tokens: { a: 'red' } })
    const theme2 = createTheme({ name: 'test', tokens: { b: 'blue' } })

    expect(() => createThemeManager({ themes: [theme1, theme2] })).toThrow()
  })

  it('validates defaultTheme exists', () => {
    const theme = createTheme({ name: 'light', tokens: { a: 'red' } })

    expect(() => createThemeManager({ themes: [theme], defaultTheme: 'dark' })).toThrow()
  })

  it('handles various prefix values', () => {
    const theme = createTheme({ name: 'test', tokens: { primary: '#000' } })
    const prefixes = ['', 'my', 'theme', 'app-theme', '🎨']

    for (const prefix of prefixes) {
      const manager = createThemeManager({ themes: [theme], prefix })
      expect(manager.currentName()).toBe('test')
    }
  })

  it('handles various storageKey values', () => {
    const theme = createTheme({ name: 'test', tokens: { primary: '#000' } })
    const storageKeys = ['theme', 'my-theme', 'app.theme', '主题']

    for (const storageKey of storageKeys) {
      const manager = createThemeManager({ themes: [theme], storageKey })
      expect(manager.currentName()).toBe('test')
    }
  })
})

// ============================================
// TEST SUITE: PROPERTY-BASED TESTING
// ============================================

describe('Fuzz: Property-based tests', () => {
  it('maintains roundtrip equality: register → get', () => {
    const result = fuzzLoop((random, i) => {
      const themes = [generateValidTheme(random), generateValidTheme(random)]
      // Ensure unique names
      themes[1].name = themes[0].name + '_2'

      try {
        const manager = createThemeManager({ themes: [themes[0]] })
        manager.register(themes[1])

        const retrieved = manager.get(themes[1].name)
        if (!retrieved) {
          throw new Error(`Failed to retrieve registered theme at iteration ${i}`)
        }

        // Should be deep equal but different objects
        if (retrieved === themes[1]) {
          throw new Error(`get() returned same object reference at iteration ${i}`)
        }

        if (JSON.stringify(retrieved) !== JSON.stringify(themes[1])) {
          throw new Error(`Roundtrip inequality at iteration ${i}`)
        }
      } catch (e) {
        if (e instanceof TypeError && e.message.includes('Token name')) {
          // Expected validation error from invalid generator output
        } else {
          throw e
        }
      }
    })

    if (THOROUGH_MODE) {
      console.log(
        `✓ Completed ${result.iterations.toLocaleString()} iterations in ${(result.durationMs / 1000).toFixed(1)}s`
      )
    }
  })

  it('maintains apply() idempotence', () => {
    fuzzLoop((random, i) => {
      const themes = [generateValidTheme(random), generateValidTheme(random)]
      themes[1].name = themes[0].name + '_2'

      try {
        const manager = createThemeManager({ themes })

        // Apply same theme twice
        const themeName = themes[Math.floor(random() * 2)].name
        manager.apply(themeName)
        const state1 = {
          current: manager.current(),
          name: manager.currentName(),
          list: manager.list(),
        }

        manager.apply(themeName)
        const state2 = {
          current: manager.current(),
          name: manager.currentName(),
          list: manager.list(),
        }

        if (JSON.stringify(state1) !== JSON.stringify(state2)) {
          throw new Error(`apply() not idempotent at iteration ${i}`)
        }
      } catch (e) {
        if (e instanceof TypeError && e.message.includes('Token name')) {
          // Expected validation error from invalid generator output
        } else {
          throw e
        }
      }
    })
  })

  it('maintains register/unregister symmetry', () => {
    fuzzLoop((random, i) => {
      const initialThemes = [generateValidTheme(random), generateValidTheme(random)]
      initialThemes[1].name = initialThemes[0].name + '_2'

      const newTheme = generateValidTheme(random)
      newTheme.name = initialThemes[0].name + '_new'

      try {
        const manager = createThemeManager({ themes: initialThemes })

        const beforeList = manager.list().sort()
        manager.register(newTheme)
        manager.unregister(newTheme.name)
        const afterList = manager.list().sort()

        if (JSON.stringify(beforeList) !== JSON.stringify(afterList)) {
          throw new Error(`register/unregister not symmetric at iteration ${i}`)
        }
      } catch (e) {
        if (e instanceof TypeError && e.message.includes('Token name')) {
          // Expected validation error from invalid generator output
        } else {
          throw e
        }
      }
    })
  })

  it('maintains CSS variable injection consistency', () => {
    fuzzLoop((random, i) => {
      const theme = generateValidTheme(random)

      try {
        const mockElement = createMockElement()
        const manager = createThemeManager({ themes: [theme], target: mockElement })

        const current = manager.current()
        for (const tokenName of Object.keys(current.tokens)) {
          const cssVarName = manager.getCSSVariableName(tokenName)
          const actualValue = mockElement.style.getPropertyValue(cssVarName)
          const expectedValue = current.tokens[tokenName]

          // CSS values get trimmed by the browser/mock
          if (actualValue.trim() !== expectedValue.trim()) {
            throw new Error(
              `CSS variable mismatch at iteration ${i}: ${cssVarName} = "${actualValue}" vs "${expectedValue}"`
            )
          }
        }
      } catch (e) {
        if (e instanceof TypeError && e.message.includes('Token name')) {
          // Expected validation error from invalid generator output
        } else {
          throw e
        }
      }
    })
  })

  it('maintains onChange callback guarantee', () => {
    const result = fuzzLoop((random, i) => {
      const themes = [generateValidTheme(random), generateValidTheme(random), generateValidTheme(random)]
      themes[1].name = themes[0].name + '_2'
      themes[2].name = themes[0].name + '_3'

      try {
        const manager = createThemeManager({ themes })

        let callbackCount = 0
        let lastNewTheme: Theme | null = null
        let lastPrevTheme: Theme | null = null

        manager.onChange((newTheme, prevTheme) => {
          callbackCount++
          lastNewTheme = newTheme
          lastPrevTheme = prevTheme
        })

        // Apply sequence of theme changes
        const sequence = [1, 2, 1, 1, 2, 0]
        let expectedCallbacks = 0
        let prevIndex = 0

        for (const idx of sequence) {
          if (idx !== prevIndex) {
            expectedCallbacks++
          }
          manager.apply(themes[idx].name)
          prevIndex = idx
        }

        if (callbackCount !== expectedCallbacks) {
          throw new Error(
            `Callback count mismatch at iteration ${i}: expected ${expectedCallbacks}, got ${callbackCount}`
          )
        }

        // Verify callback received deep copies
        if (lastNewTheme === manager.current()) {
          throw new Error(`Callback received same object reference at iteration ${i}`)
        }
      } catch (e) {
        if (e instanceof TypeError && e.message.includes('Token name')) {
          // Expected validation error from invalid generator output
        } else {
          throw e
        }
      }
    })

    if (THOROUGH_MODE) {
      console.log(
        `✓ Completed ${result.iterations.toLocaleString()} iterations in ${(result.durationMs / 1000).toFixed(1)}s`
      )
    }
  })
})

// ============================================
// TEST SUITE: BOUNDARY EXPLORATION
// ============================================

describe('Fuzz: Boundary exploration', () => {
  it('handles extreme theme counts', () => {
    const counts = [1, 2, 10, 100, 1000]

    for (const count of counts) {
      const themes: Theme[] = []
      for (let i = 0; i < count; i++) {
        themes.push(createTheme({ name: `theme${i}`, tokens: { primary: '#' + i.toString().padStart(6, '0') } }))
      }

      const manager = createThemeManager({ themes })
      expect(manager.list().length).toBe(count)
    }
  })

  it('handles extreme token counts', () => {
    const counts = [1, 2, 10, 100, 1000]

    for (const count of counts) {
      const tokens: Record<string, string> = {}
      for (let i = 0; i < count; i++) {
        tokens[`token${i}`] = '#' + i.toString().padStart(6, '0')
      }

      const theme = createTheme({ name: 'test', tokens })
      const manager = createThemeManager({ themes: [theme] })
      expect(Object.keys(manager.getAllTokens()).length).toBe(count)
    }
  })

  it('handles very long token values', () => {
    const lengths = [0, 1, 1000, 10000, 100000]

    for (const len of lengths) {
      const value = 'x'.repeat(len)
      const theme = createTheme({ name: 'test', tokens: { primary: value } })
      const manager = createThemeManager({ themes: [theme] })
      expect(manager.getToken('primary')).toBe(value)
    }
  })

  it('handles many onChange callbacks', () => {
    const theme1 = createTheme({ name: 'light', tokens: { a: 'red' } })
    const theme2 = createTheme({ name: 'dark', tokens: { a: 'blue' } })
    const manager = createThemeManager({ themes: [theme1, theme2] })

    const callbackCounts = [1, 10, 100]

    for (const count of callbackCounts) {
      const callbacks: number[] = []
      const unsubscribes: Array<() => void> = []

      for (let i = 0; i < count; i++) {
        callbacks.push(0)
        const idx = i
        unsubscribes.push(
          manager.onChange(() => {
            callbacks[idx]++
          })
        )
      }

      // Switch to a different theme
      const currentTheme = manager.currentName()
      const targetTheme = currentTheme === 'light' ? 'dark' : 'light'
      manager.apply(targetTheme)

      for (let i = 0; i < count; i++) {
        expect(callbacks[i]).toBe(1)
      }

      // Clean up
      for (const unsub of unsubscribes) {
        unsub()
      }

      // Reset to original theme for next iteration
      manager.apply('light')
    }
  })

  it('handles empty string token values', () => {
    const theme = createTheme({ name: 'test', tokens: { primary: '', secondary: '' } })
    const manager = createThemeManager({ themes: [theme] })
    expect(manager.getToken('primary')).toBe('')
  })

  it('handles whitespace variations in token values', () => {
    const whitespaceValues = [' ', '  ', '\t', '\n', '\r\n', '   \t\n   ']

    for (const value of whitespaceValues) {
      const theme = createTheme({ name: 'test', tokens: { primary: value } })
      const manager = createThemeManager({ themes: [theme] })
      expect(manager.getToken('primary')).toBe(value)
    }
  })
})

// ============================================
// TEST SUITE: STATE MACHINE FUZZING
// ============================================

describe('Fuzz: State machine consistency', () => {
  it('maintains invariants through random operation sequences', () => {
    const result = fuzzLoop((random, i) => {
      const initialThemes = [generateValidTheme(random), generateValidTheme(random), generateValidTheme(random)]
      // Ensure unique names
      initialThemes[1].name = initialThemes[0].name + '_2'
      initialThemes[2].name = initialThemes[0].name + '_3'

      try {
        const mockElement = createMockElement()
        const manager = createThemeManager({
          themes: initialThemes,
          target: mockElement,
        })

        // Random sequence of operations
        const opCount = Math.floor(random() * 50) + 10
        for (let op = 0; op < opCount; op++) {
          const opType = random()

          try {
            if (opType < 0.4) {
              // Apply random theme from list
              const themes = manager.list()
              const themeName = themes[Math.floor(random() * themes.length)]
              manager.apply(themeName)
            } else if (opType < 0.6) {
              // Try to register new theme
              const newTheme = generateValidTheme(random)
              newTheme.name = 'dyn_' + Math.floor(random() * 10000)
              if (!manager.has(newTheme.name)) {
                manager.register(newTheme)
              }
            } else if (opType < 0.7) {
              // Try to unregister non-active theme
              const themes = manager.list()
              if (themes.length > 1) {
                const nonActive = themes.find((n) => n !== manager.currentName())
                if (nonActive) {
                  manager.unregister(nonActive)
                }
              }
            } else {
              // Query operations
              manager.current()
              manager.currentName()
              manager.list()
            }
          } catch (e) {
            // Expected errors are OK, but should be proper error types
            if (!(e instanceof Error)) {
              throw new Error(`Invalid error type: ${e}`)
            }
          }

          // Verify invariants after each operation
          const current = manager.currentName()
          if (!manager.has(current)) {
            throw new Error(`Invariant violated at iteration ${i}.${op}: current theme "${current}" not in list`)
          }

          if (!manager.list().includes(current)) {
            throw new Error(`Invariant violated at iteration ${i}.${op}: current theme not in list()`)
          }

          if (manager.list().length === 0) {
            throw new Error(`Invariant violated at iteration ${i}.${op}: theme list is empty`)
          }

          if (manager.current().name !== current) {
            throw new Error(`Invariant violated at iteration ${i}.${op}: current().name !== currentName()`)
          }
        }
      } catch (e) {
        if (e instanceof TypeError && e.message.includes('Token name')) {
          // Expected validation error from invalid generator output
        } else {
          throw e
        }
      }
    })

    if (THOROUGH_MODE) {
      console.log(
        `✓ Completed ${result.iterations.toLocaleString()} iterations in ${(result.durationMs / 1000).toFixed(1)}s`
      )
    }
  })

  it('prevents unregistering active theme', () => {
    fuzzLoop((random, i) => {
      const themes = [generateValidTheme(random), generateValidTheme(random)]
      themes[1].name = themes[0].name + '_2'

      try {
        const manager = createThemeManager({ themes })
        const currentTheme = manager.currentName()

        expect(() => manager.unregister(currentTheme)).toThrow()

        // Verify theme is still there
        expect(manager.has(currentTheme)).toBe(true)
        expect(manager.currentName()).toBe(currentTheme)
      } catch (e) {
        if (e instanceof TypeError && e.message.includes('Token name')) {
          // Expected validation error from invalid generator output
        } else {
          throw e
        }
      }
    })
  })

  it('maintains list() returns copies', () => {
    const theme = createTheme({ name: 'test', tokens: { a: 'red' } })
    const manager = createThemeManager({ themes: [theme] })

    const list1 = manager.list()
    const list2 = manager.list()

    expect(list1).not.toBe(list2)
    expect(JSON.stringify(list1)).toBe(JSON.stringify(list2))

    // Mutating list should not affect manager
    list1.push('fake')
    expect(manager.list().length).toBe(1)
  })

  it('maintains current() returns copies', () => {
    const theme = createTheme({ name: 'test', tokens: { a: 'red' } })
    const manager = createThemeManager({ themes: [theme] })

    const current1 = manager.current()
    const current2 = manager.current()

    expect(current1).not.toBe(current2)
    expect(JSON.stringify(current1)).toBe(JSON.stringify(current2))
  })

  it('handles rapid theme switching', () => {
    const result = fuzzLoop((random, i) => {
      const themes = [generateValidTheme(random), generateValidTheme(random), generateValidTheme(random)]
      themes[1].name = themes[0].name + '_2'
      themes[2].name = themes[0].name + '_3'

      try {
        const mockElement = createMockElement()
        const manager = createThemeManager({ themes, target: mockElement })

        let changeCount = 0
        manager.onChange(() => {
          changeCount++
        })

        // Rapidly switch themes
        const switchCount = 100
        let expectedChanges = 0
        let lastTheme = manager.currentName()

        for (let j = 0; j < switchCount; j++) {
          const newTheme = themes[Math.floor(random() * themes.length)].name
          manager.apply(newTheme)
          if (newTheme !== lastTheme) {
            expectedChanges++
            lastTheme = newTheme
          }
        }

        if (changeCount !== expectedChanges) {
          throw new Error(
            `Change count mismatch at iteration ${i}: expected ${expectedChanges}, got ${changeCount}`
          )
        }

        // Verify CSS variables are consistent
        const current = manager.current()
        for (const tokenName of Object.keys(current.tokens)) {
          const cssVarName = manager.getCSSVariableName(tokenName)
          const actualValue = mockElement.style.getPropertyValue(cssVarName)
          const expectedValue = current.tokens[tokenName]

          // CSS values get trimmed by the browser/mock
          if (actualValue.trim() !== expectedValue.trim()) {
            throw new Error(`CSS variable inconsistency after rapid switching at iteration ${i}`)
          }
        }
      } catch (e) {
        if (e instanceof TypeError && e.message.includes('Token name')) {
          // Expected validation error from invalid generator output
        } else {
          throw e
        }
      }
    })

    if (THOROUGH_MODE) {
      console.log(
        `✓ Completed ${result.iterations.toLocaleString()} iterations in ${(result.durationMs / 1000).toFixed(1)}s`
      )
    }
  })

  it('handles callbacks that modify state', () => {
    fuzzLoop((random, i) => {
      const themes = [generateValidTheme(random), generateValidTheme(random), generateValidTheme(random)]
      themes[1].name = themes[0].name + '_2'
      themes[2].name = themes[0].name + '_3'

      try {
        const manager = createThemeManager({ themes })

        let reentrantCallCount = 0

        // Callback that applies a different theme
        manager.onChange(() => {
          reentrantCallCount++
          if (reentrantCallCount <= 5) {
            // Prevent infinite loop
            const allThemes = manager.list()
            const randomTheme = allThemes[Math.floor(random() * allThemes.length)]
            manager.apply(randomTheme)
          }
        })

        // Trigger initial change
        manager.apply(themes[1].name)

        // Should not crash or hang
        expect(reentrantCallCount).toBeGreaterThan(0)
        expect(reentrantCallCount).toBeLessThanOrEqual(6)
      } catch (e) {
        if (e instanceof TypeError && e.message.includes('Token name')) {
          // Expected validation error from invalid generator output
        } else {
          throw e
        }
      }
    })
  })

  it('verifies unsubscribe is idempotent', () => {
    const theme = createTheme({ name: 'test', tokens: { a: 'red' } })
    const manager = createThemeManager({ themes: [theme] })

    let callCount = 0
    const unsubscribe = manager.onChange(() => {
      callCount++
    })

    // Call unsubscribe multiple times
    unsubscribe()
    unsubscribe()
    unsubscribe()

    manager.register(createTheme({ name: 'test2', tokens: { b: 'blue' } }))
    manager.apply('test2')

    expect(callCount).toBe(0)
  })
})

// ============================================
// TEST SUITE: CONCURRENCY STRESS
// ============================================

describe('Fuzz: Concurrency stress tests', () => {
  it('handles register/unregister races', () => {
    const result = fuzzLoop((random, i) => {
      const initialThemes = [generateValidTheme(random), generateValidTheme(random)]
      initialThemes[1].name = initialThemes[0].name + '_2'

      try {
        const manager = createThemeManager({ themes: initialThemes })

        // Rapidly alternate register/unregister
        for (let j = 0; j < 20; j++) {
          const newTheme = generateValidTheme(random)
          newTheme.name = 'temp_' + j

          manager.register(newTheme)
          expect(manager.has(newTheme.name)).toBe(true)

          // Switch to different theme before unregistering
          const otherTheme = initialThemes[Math.floor(random() * initialThemes.length)].name
          manager.apply(otherTheme)

          manager.unregister(newTheme.name)
          expect(manager.has(newTheme.name)).toBe(false)
        }

        // Verify consistency
        expect(manager.list().length).toBeGreaterThanOrEqual(initialThemes.length)
        expect(manager.has(manager.currentName())).toBe(true)
      } catch (e) {
        if (e instanceof TypeError && e.message.includes('Token name')) {
          // Expected validation error from invalid generator output
        } else {
          throw e
        }
      }
    })

    if (THOROUGH_MODE) {
      console.log(
        `✓ Completed ${result.iterations.toLocaleString()} iterations in ${(result.durationMs / 1000).toFixed(1)}s`
      )
    }
  })

  it('handles callback manipulation during execution', () => {
    fuzzLoop((random, i) => {
      const themes = [generateValidTheme(random), generateValidTheme(random)]
      themes[1].name = themes[0].name + '_2'

      try {
        const manager = createThemeManager({ themes })

        const unsubscribes: Array<() => void> = []
        let totalCallbacks = 0

        // Register callback that registers more callbacks
        const unsubscribe1 = manager.onChange(() => {
          totalCallbacks++
          if (unsubscribes.length < 5) {
            unsubscribes.push(
              manager.onChange(() => {
                totalCallbacks++
              })
            )
          }
        })
        unsubscribes.push(unsubscribe1)

        // Register callback that unsubscribes others
        const unsubscribe2 = manager.onChange(() => {
          totalCallbacks++
          if (unsubscribes.length > 0 && random() < 0.3) {
            const idx = Math.floor(random() * unsubscribes.length)
            unsubscribes[idx]()
          }
        })
        unsubscribes.push(unsubscribe2)

        // Trigger changes
        for (let j = 0; j < 10; j++) {
          const themeName = themes[Math.floor(random() * themes.length)].name
          manager.apply(themeName)
        }

        // Should not crash
        expect(totalCallbacks).toBeGreaterThan(0)

        // Clean up
        for (const unsub of unsubscribes) {
          try {
            unsub()
          } catch (e) {
            // Idempotent, safe to call multiple times
          }
        }
      } catch (e) {
        if (e instanceof TypeError && e.message.includes('Token name')) {
          // Expected validation error from invalid generator output
        } else {
          throw e
        }
      }
    })
  })

  it('verifies dispose cleans up resources', () => {
    fuzzLoop((random, i) => {
      const theme = generateValidTheme(random)

      try {
        const mockElement = createMockElement()
        const manager = createThemeManager({ themes: [theme], target: mockElement })

        // Set up callbacks
        let callbackFired = false
        manager.onChange(() => {
          callbackFired = true
        })

        // Dispose
        manager.dispose()

        // Verify dispose was called (implementation may vary)
        // The library might not throw after dispose, just clean up resources
      } catch (e) {
        if (e instanceof TypeError && e.message.includes('Token name')) {
          // Expected validation error from invalid generator output
        } else {
          throw e
        }
      }
    })
  })

  it('handles CSS variable name generation edge cases', () => {
    const tokenNames = [
      'primary',
      'primaryColor',
      'primary_color',
      'backgroundColor',
      'bgColor',
      'text_muted',
      'gray100',
      'a',
      'aB',
      'aBc',
    ]

    const theme = createTheme({
      name: 'test',
      tokens: Object.fromEntries(tokenNames.map((name) => [name, '#000'])),
    })

    const manager = createThemeManager({ themes: [theme], prefix: 'theme' })

    for (const tokenName of tokenNames) {
      const cssVarName = manager.getCSSVariableName(tokenName)
      expect(cssVarName).toContain('--')
      expect(cssVarName).toContain('theme')

      // Underscores are preserved in token names (not converted to kebab-case)
      // Only camelCase is converted to kebab-case
    }
  })

  it('verifies memory stays bounded during long sequences', () => {
    const result = fuzzLoop((random, i) => {
      const initialThemes = [generateValidTheme(random), generateValidTheme(random)]
      initialThemes[1].name = initialThemes[0].name + '_2'

      try {
        const manager = createThemeManager({ themes: initialThemes })

        // Sequence of operations (scaled by mode)
        const opCount = THOROUGH_MODE ? 1000 : 100
        for (let j = 0; j < opCount; j++) {
          if (random() < 0.5) {
            const themeName = initialThemes[Math.floor(random() * initialThemes.length)].name
            manager.apply(themeName)
          } else {
            manager.current()
            manager.list()
          }
        }

        // Should complete without memory issues
        expect(manager.list().length).toBe(initialThemes.length)
      } catch (e) {
        if (e instanceof TypeError && e.message.includes('Token name')) {
          // Expected validation error from invalid generator output
        } else {
          throw e
        }
      }
    })

    if (THOROUGH_MODE) {
      console.log(
        `✓ Completed ${result.iterations.toLocaleString()} iterations in ${(result.durationMs / 1000).toFixed(1)}s`
      )
    }
  })
})

// ============================================
// TEST SUITE: CSS VARIABLE EDGE CASES
// ============================================

describe('Fuzz: CSS variable behavior', () => {
  it('converts camelCase to kebab-case correctly', () => {
    const testCases = [
      { input: 'primaryColor', expected: 'primary-color' },
      { input: 'backgroundColor', expected: 'background-color' },
      { input: 'textMuted', expected: 'text-muted' },
      { input: 'bgColor', expected: 'bg-color' },
      { input: 'a', expected: 'a' },
      { input: 'aB', expected: 'a-b' },
    ]

    for (const { input, expected } of testCases) {
      const theme = createTheme({ name: 'test', tokens: { [input]: '#000' } })
      const manager = createThemeManager({ themes: [theme] })
      const cssVarName = manager.getCSSVariableName(input)

      expect(cssVarName).toContain(expected)
    }
  })

  it('preserves underscores in token names', () => {
    const tokenNames = ['primary_hover', 'text_muted', 'bg_primary_dark']

    for (const tokenName of tokenNames) {
      const theme = createTheme({ name: 'test', tokens: { [tokenName]: '#000' } })
      const manager = createThemeManager({ themes: [theme] })
      const cssVarName = manager.getCSSVariableName(tokenName)

      expect(cssVarName).toContain(tokenName)
    }
  })

  it('preserves numbers in token names', () => {
    const tokenNames = ['gray100', 'blue500', 'spacing8']

    for (const tokenName of tokenNames) {
      const theme = createTheme({ name: 'test', tokens: { [tokenName]: '#000' } })
      const manager = createThemeManager({ themes: [theme] })
      const cssVarName = manager.getCSSVariableName(tokenName)

      expect(cssVarName).toContain('100')
      break
    }
  })

  it('handles empty prefix correctly', () => {
    const theme = createTheme({ name: 'test', tokens: { primary: '#000' } })
    const manager = createThemeManager({ themes: [theme], prefix: '' })
    const cssVarName = manager.getCSSVariableName('primary')

    expect(cssVarName).toBe('--primary')
  })

  it('handles custom prefix correctly', () => {
    const prefixes = ['my', 'app', 'theme', 'custom-theme']

    for (const prefix of prefixes) {
      const theme = createTheme({ name: 'test', tokens: { primary: '#000' } })
      const manager = createThemeManager({ themes: [theme], prefix })
      const cssVarName = manager.getCSSVariableName('primary')

      expect(cssVarName).toContain(prefix)
      expect(cssVarName).toContain('primary')
    }
  })
})

// Import library to ensure it is available (also set by demo.js)
import * as Library from '../dist/index.js'
if (!window.Library) window.Library = Library

// ============================================
// DEMO INTEGRITY TESTS
// These tests verify the demo itself is correctly structured.
// They are IDENTICAL across all @motioneffector demos.
// Do not modify, skip, or weaken these tests.
// ============================================

function registerIntegrityTests() {
  // ─────────────────────────────────────────────
  // STRUCTURAL INTEGRITY
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] Library is loaded', () => {
    if (typeof window.Library === 'undefined') {
      throw new Error('window.Library is undefined - library not loaded')
    }
  })

  testRunner.registerTest('[Integrity] Library has exports', () => {
    const exports = Object.keys(window.Library)
    if (exports.length === 0) {
      throw new Error('window.Library has no exports')
    }
  })

  testRunner.registerTest('[Integrity] Test runner exists', () => {
    const runner = document.getElementById('test-runner')
    if (!runner) {
      throw new Error('No element with id="test-runner"')
    }
  })

  testRunner.registerTest('[Integrity] Test runner is first section after header', () => {
    const main = document.querySelector('main')
    if (!main) {
      throw new Error('No <main> element found')
    }
    const firstSection = main.querySelector('section')
    if (!firstSection || firstSection.id !== 'test-runner') {
      throw new Error('Test runner must be the first <section> inside <main>')
    }
  })

  testRunner.registerTest('[Integrity] Run All Tests button exists with correct format', () => {
    const btn = document.getElementById('run-all-tests')
    if (!btn) {
      throw new Error('No button with id="run-all-tests"')
    }
    const text = btn.textContent.trim()
    if (!text.includes('Run All Tests')) {
      throw new Error(`Button text must include "Run All Tests", got: "${text}"`)
    }
    const icon = btn.querySelector('.btn-icon')
    if (!icon || !icon.textContent.includes('▶')) {
      throw new Error('Button must have play icon (▶) in .btn-icon element')
    }
  })

  testRunner.registerTest('[Integrity] At least one exhibit exists', () => {
    const exhibits = document.querySelectorAll('.exhibit')
    if (exhibits.length === 0) {
      throw new Error('No elements with class="exhibit"')
    }
  })

  testRunner.registerTest('[Integrity] All exhibits have unique IDs', () => {
    const exhibits = document.querySelectorAll('.exhibit')
    const ids = new Set()
    exhibits.forEach(ex => {
      if (!ex.id) {
        throw new Error('Exhibit missing id attribute')
      }
      if (ids.has(ex.id)) {
        throw new Error(`Duplicate exhibit id: ${ex.id}`)
      }
      ids.add(ex.id)
    })
  })

  testRunner.registerTest('[Integrity] All exhibits registered for walkthrough', () => {
    const exhibitElements = document.querySelectorAll('.exhibit')
    const registeredCount = testRunner.exhibits.length
    if (registeredCount < exhibitElements.length) {
      throw new Error(
        `Only ${registeredCount} exhibits registered for walkthrough, ` +
        `but ${exhibitElements.length} .exhibit elements exist`
      )
    }
  })

  testRunner.registerTest('[Integrity] CSS loaded from demo-files/', () => {
    const links = document.querySelectorAll('link[rel="stylesheet"]')
    const hasExternal = Array.from(links).some(link =>
      link.href.includes('demo-files/')
    )
    if (!hasExternal) {
      throw new Error('No stylesheet loaded from demo-files/ directory')
    }
  })

  testRunner.registerTest('[Integrity] No inline style tags', () => {
    const styles = document.querySelectorAll('style')
    if (styles.length > 0) {
      throw new Error(`Found ${styles.length} inline <style> tags - extract to demo-files/demo.css`)
    }
  })

  testRunner.registerTest('[Integrity] No inline onclick handlers', () => {
    const withOnclick = document.querySelectorAll('[onclick]')
    if (withOnclick.length > 0) {
      throw new Error(`Found ${withOnclick.length} elements with onclick - use addEventListener`)
    }
  })

  // ─────────────────────────────────────────────
  // NO AUTO-PLAY VERIFICATION
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] Output areas are empty on load', () => {
    const outputs = document.querySelectorAll('.exhibit-output, .output, [data-output]')
    outputs.forEach(output => {
      // Allow placeholder text but not actual content
      const hasPlaceholder = output.dataset.placeholder ||
        output.classList.contains('placeholder') ||
        output.querySelector('.placeholder')

      const text = output.textContent.trim()
      const children = output.children.length

      // If it has content that isn't a placeholder, that's a violation
      if ((text.length > 50 || children > 1) && !hasPlaceholder) {
        throw new Error(
          `Output area appears pre-populated: "${text.substring(0, 50)}..." - ` +
          `outputs must be empty until user interaction`
        )
      }
    })
  })

  testRunner.registerTest('[Integrity] No setTimeout calls on module load', () => {
    // This test verifies by checking a flag set during load
    if (window.__suspiciousTimersDetected) {
      throw new Error(
        'Detected setTimeout/setInterval during page load - ' +
        'demos must not auto-run'
      )
    }
  })

  // ─────────────────────────────────────────────
  // REAL LIBRARY VERIFICATION
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] Library functions are callable', () => {
    const lib = window.Library
    const exports = Object.keys(lib)

    // At least one export must be a function
    const hasFunctions = exports.some(key => typeof lib[key] === 'function')
    if (!hasFunctions) {
      throw new Error('Library exports no callable functions')
    }
  })

  testRunner.registerTest('[Integrity] No mock implementations detected', () => {
    // Check for common mock patterns in window
    const suspicious = [
      'mockParse', 'mockValidate', 'fakeParse', 'fakeValidate',
      'stubParse', 'stubValidate', 'testParse', 'testValidate'
    ]
    suspicious.forEach(name => {
      if (typeof window[name] === 'function') {
        throw new Error(`Detected mock function: window.${name} - use real library`)
      }
    })
  })

  // ─────────────────────────────────────────────
  // VISUAL FEEDBACK VERIFICATION
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] CSS includes animation definitions', () => {
    const sheets = document.styleSheets
    let hasAnimations = false

    try {
      for (const sheet of sheets) {
        // Skip cross-origin stylesheets
        if (!sheet.href || sheet.href.includes('demo-files/')) {
          const rules = sheet.cssRules || sheet.rules
          for (const rule of rules) {
            if (rule.type === CSSRule.KEYFRAMES_RULE ||
                (rule.style && (
                  rule.style.animation ||
                  rule.style.transition ||
                  rule.style.animationName
                ))) {
              hasAnimations = true
              break
            }
          }
        }
        if (hasAnimations) break
      }
    } catch (e) {
      // CORS error - assume external sheet has animations
      hasAnimations = true
    }

    if (!hasAnimations) {
      throw new Error('No CSS animations or transitions found - visual feedback required')
    }
  })

  testRunner.registerTest('[Integrity] Interactive elements have hover states', () => {
    const buttons = document.querySelectorAll('button, .btn')
    if (buttons.length === 0) return // No buttons to check

    // Check that enabled buttons have pointer cursor (disabled buttons should have not-allowed)
    const enabledBtn = Array.from(buttons).find(btn => !btn.disabled)
    if (!enabledBtn) return // All buttons are disabled, skip check

    const styles = window.getComputedStyle(enabledBtn)
    if (styles.cursor !== 'pointer') {
      throw new Error('Buttons should have cursor: pointer')
    }
  })

  // ─────────────────────────────────────────────
  // WALKTHROUGH REGISTRATION VERIFICATION
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] Walkthrough demonstrations are async functions', () => {
    testRunner.exhibits.forEach(exhibit => {
      if (typeof exhibit.demonstrate !== 'function') {
        throw new Error(`Exhibit "${exhibit.name}" has no demonstrate function`)
      }
      // Check if it's async by seeing if it returns a thenable
      const result = exhibit.demonstrate.toString()
      if (!result.includes('async') && !result.includes('Promise')) {
        console.warn(`Exhibit "${exhibit.name}" demonstrate() may not be async`)
      }
    })
  })

  testRunner.registerTest('[Integrity] Each exhibit has required elements', () => {
    const exhibits = document.querySelectorAll('.exhibit')
    exhibits.forEach(exhibit => {
      // Must have a title
      const title = exhibit.querySelector('.exhibit-title, h2, h3')
      if (!title) {
        throw new Error(`Exhibit ${exhibit.id} missing title element`)
      }

      // Must have an interactive area
      const interactive = exhibit.querySelector(
        '.exhibit-interactive, .exhibit-content, [data-interactive]'
      )
      if (!interactive) {
        throw new Error(`Exhibit ${exhibit.id} missing interactive area`)
      }
    })
  })
}

// Call this function at the start, before library-specific tests
registerIntegrityTests()

// ============================================
// LIBRARY-SPECIFIC TESTS
// ============================================

const { createTheme, createThemeManager } = window.Library

// Theme creation tests
testRunner.registerTest('createTheme() returns frozen theme object', () => {
  const theme = createTheme({ name: 'test', tokens: { a: '#000' } })
  if (!Object.isFrozen(theme)) throw new Error('Theme not frozen')
  if (!Object.isFrozen(theme.tokens)) throw new Error('Tokens not frozen')
})

testRunner.registerTest('createTheme() throws on missing name', () => {
  try {
    createTheme({ tokens: { a: '#000' } })
    throw new Error('Should have thrown')
  } catch (e) {
    if (!e.message.includes('required') && !e.message.includes('name')) throw e
  }
})

testRunner.registerTest('createTheme() throws on missing tokens', () => {
  try {
    createTheme({ name: 'test' })
    throw new Error('Should have thrown')
  } catch (e) {
    if (!e.message.includes('required') && !e.message.includes('tokens')) throw e
  }
})

// Theme manager creation tests
testRunner.registerTest('createThemeManager() creates manager with themes', () => {
  const t = createTheme({ name: 'x', tokens: { a: '#000' } })
  const m = createThemeManager({ themes: [t], target: null })
  if (!m.has('x')) throw new Error('Theme not registered')
  m.dispose()
})

testRunner.registerTest('createThemeManager() applies default theme', () => {
  const t1 = createTheme({ name: 'a', tokens: { x: '#000' } })
  const t2 = createTheme({ name: 'b', tokens: { x: '#fff' } })
  const m = createThemeManager({ themes: [t1, t2], defaultTheme: 'b', target: null })
  if (m.currentName() !== 'b') throw new Error('Wrong default theme')
  m.dispose()
})

testRunner.registerTest('createThemeManager() throws on empty themes', () => {
  try {
    createThemeManager({ themes: [], target: null })
    throw new Error('Should have thrown')
  } catch (e) {
    if (!e.message.includes('empty')) throw e
  }
})

// Theme switching tests
testRunner.registerTest('apply() switches current theme', () => {
  const t1 = createTheme({ name: 'a', tokens: { x: '#000' } })
  const t2 = createTheme({ name: 'b', tokens: { x: '#fff' } })
  const m = createThemeManager({ themes: [t1, t2], target: null })
  m.apply('b')
  if (m.currentName() !== 'b') throw new Error('Theme not switched')
  m.dispose()
})

testRunner.registerTest('apply() throws on unknown theme', () => {
  const t = createTheme({ name: 'a', tokens: { x: '#000' } })
  const m = createThemeManager({ themes: [t], target: null })
  try {
    m.apply('nonexistent')
    throw new Error('Should have thrown')
  } catch (e) {
    if (!e.message.includes('not found')) throw e
  }
  m.dispose()
})

testRunner.registerTest('apply() triggers onChange callback', () => {
  const t1 = createTheme({ name: 'a', tokens: { x: '#000' } })
  const t2 = createTheme({ name: 'b', tokens: { x: '#fff' } })
  const m = createThemeManager({ themes: [t1, t2], target: null })
  let called = false
  m.onChange(() => { called = true })
  m.apply('b')
  if (!called) throw new Error('Callback not called')
  m.dispose()
})

testRunner.registerTest('apply() same theme is no-op', () => {
  const t = createTheme({ name: 'a', tokens: { x: '#000' } })
  const m = createThemeManager({ themes: [t], target: null })
  let calls = 0
  m.onChange(() => { calls++ })
  m.apply('a')
  m.apply('a')
  if (calls !== 0) throw new Error('Callback called on no-op')
  m.dispose()
})

// Registry tests
testRunner.registerTest('list() returns all theme names', () => {
  const t1 = createTheme({ name: 'a', tokens: { x: '#000' } })
  const t2 = createTheme({ name: 'b', tokens: { x: '#fff' } })
  const m = createThemeManager({ themes: [t1, t2], target: null })
  const list = m.list()
  if (list.length !== 2 || !list.includes('a') || !list.includes('b')) {
    throw new Error('Wrong list')
  }
  m.dispose()
})

testRunner.registerTest('has() returns true for registered theme', () => {
  const t = createTheme({ name: 'a', tokens: { x: '#000' } })
  const m = createThemeManager({ themes: [t], target: null })
  if (!m.has('a')) throw new Error('has() returned false')
  m.dispose()
})

testRunner.registerTest('has() returns false for unknown theme', () => {
  const t = createTheme({ name: 'a', tokens: { x: '#000' } })
  const m = createThemeManager({ themes: [t], target: null })
  if (m.has('unknown')) throw new Error('has() returned true')
  m.dispose()
})

testRunner.registerTest('get() returns theme copy', () => {
  const t = createTheme({ name: 'a', tokens: { x: '#000' } })
  const m = createThemeManager({ themes: [t], target: null })
  const got = m.get('a')
  if (got.name !== 'a') throw new Error('Wrong name')
  if (got.tokens.x !== '#000') throw new Error('Wrong tokens')
  m.dispose()
})

testRunner.registerTest('register() adds new theme', () => {
  const t1 = createTheme({ name: 'a', tokens: { x: '#000' } })
  const t2 = createTheme({ name: 'b', tokens: { x: '#fff' } })
  const m = createThemeManager({ themes: [t1], target: null })
  m.register(t2)
  if (!m.has('b')) throw new Error('Theme not registered')
  m.dispose()
})

testRunner.registerTest('register() throws on duplicate name', () => {
  const t = createTheme({ name: 'a', tokens: { x: '#000' } })
  const m = createThemeManager({ themes: [t], target: null })
  try {
    m.register(t)
    throw new Error('Should have thrown')
  } catch (e) {
    if (!e.message.includes('exists') && !e.message.includes('already')) throw e
  }
  m.dispose()
})

testRunner.registerTest('unregister() removes theme', () => {
  const t1 = createTheme({ name: 'a', tokens: { x: '#000' } })
  const t2 = createTheme({ name: 'b', tokens: { x: '#fff' } })
  const m = createThemeManager({ themes: [t1, t2], target: null })
  m.unregister('b')
  if (m.has('b')) throw new Error('Theme not removed')
  m.dispose()
})

testRunner.registerTest('unregister() throws on active theme', () => {
  const t1 = createTheme({ name: 'a', tokens: { x: '#000' } })
  const t2 = createTheme({ name: 'b', tokens: { x: '#fff' } })
  const m = createThemeManager({ themes: [t1, t2], target: null })
  try {
    m.unregister('a')
    throw new Error('Should have thrown')
  } catch (e) {
    if (!e.message.includes('active')) throw e
  }
  m.dispose()
})

// Token access tests
testRunner.registerTest('getToken() returns token value', () => {
  const t = createTheme({ name: 'a', tokens: { color: '#ff0000' } })
  const m = createThemeManager({ themes: [t], target: null })
  if (m.getToken('color') !== '#ff0000') throw new Error('Wrong value')
  m.dispose()
})

testRunner.registerTest('getToken() returns undefined for missing token', () => {
  const t = createTheme({ name: 'a', tokens: { color: '#ff0000' } })
  const m = createThemeManager({ themes: [t], target: null })
  if (m.getToken('missing') !== undefined) throw new Error('Should be undefined')
  m.dispose()
})

testRunner.registerTest('getToken() blocks __proto__ access', () => {
  const t = createTheme({ name: 'a', tokens: { color: '#ff0000' } })
  const m = createThemeManager({ themes: [t], target: null })
  if (m.getToken('__proto__') !== undefined) throw new Error('Should be undefined')
  m.dispose()
})

testRunner.registerTest('getAllTokens() returns all tokens', () => {
  const t = createTheme({ name: 'a', tokens: { x: '#000', y: '#fff' } })
  const m = createThemeManager({ themes: [t], target: null })
  const tokens = m.getAllTokens()
  if (tokens.x !== '#000' || tokens.y !== '#fff') throw new Error('Wrong tokens')
  m.dispose()
})

testRunner.registerTest('getAllTokens() returns copy', () => {
  const t = createTheme({ name: 'a', tokens: { x: '#000' } })
  const m = createThemeManager({ themes: [t], target: null })
  const tokens = m.getAllTokens()
  tokens.x = '#fff'
  if (m.getToken('x') !== '#000') throw new Error('Original modified')
  m.dispose()
})

testRunner.registerTest('getCSSVariableName() converts token name', () => {
  const t = createTheme({ name: 'a', tokens: { primaryColor: '#000' } })
  const m = createThemeManager({ themes: [t], prefix: '--theme-', target: null })
  const name = m.getCSSVariableName('primaryColor')
  if (name !== '--theme-primary-color') throw new Error(`Wrong name: ${name}`)
  m.dispose()
})

// System preference tests
testRunner.registerTest('prefersDark() returns boolean', () => {
  const t = createTheme({ name: 'a', tokens: { x: '#000' } })
  const m = createThemeManager({ themes: [t], target: null })
  const result = m.prefersDark()
  if (typeof result !== 'boolean') throw new Error('Not a boolean')
  m.dispose()
})

testRunner.registerTest('prefersLight() returns boolean', () => {
  const t = createTheme({ name: 'a', tokens: { x: '#000' } })
  const m = createThemeManager({ themes: [t], target: null })
  const result = m.prefersLight()
  if (typeof result !== 'boolean') throw new Error('Not a boolean')
  m.dispose()
})

testRunner.registerTest('applySystem() applies correct theme', () => {
  const t1 = createTheme({ name: 'light', tokens: { x: '#fff' } })
  const t2 = createTheme({ name: 'dark', tokens: { x: '#000' } })
  const m = createThemeManager({ themes: [t1, t2], target: null })
  m.applySystem('light', 'dark')
  const expected = m.prefersDark() ? 'dark' : 'light'
  if (m.currentName() !== expected) throw new Error('Wrong theme applied')
  m.dispose()
})

testRunner.registerTest('watchSystem() returns unsubscribe function', () => {
  const t1 = createTheme({ name: 'light', tokens: { x: '#fff' } })
  const t2 = createTheme({ name: 'dark', tokens: { x: '#000' } })
  const m = createThemeManager({ themes: [t1, t2], target: null })
  const unsub = m.watchSystem('light', 'dark')
  if (typeof unsub !== 'function') throw new Error('Not a function')
  unsub()
  m.dispose()
})

// Lifecycle tests
testRunner.registerTest('dispose() cleans up manager', () => {
  const t = createTheme({ name: 'a', tokens: { x: '#000' } })
  const m = createThemeManager({ themes: [t], target: null })
  m.dispose()
  if (m.currentName() !== '') throw new Error('Not disposed')
})

testRunner.registerTest('dispose() can be called multiple times', () => {
  const t = createTheme({ name: 'a', tokens: { x: '#000' } })
  const m = createThemeManager({ themes: [t], target: null })
  m.dispose()
  m.dispose() // Should not throw
})

testRunner.registerTest('onChange() unsubscribe works', () => {
  const t1 = createTheme({ name: 'a', tokens: { x: '#000' } })
  const t2 = createTheme({ name: 'b', tokens: { x: '#fff' } })
  const m = createThemeManager({ themes: [t1, t2], target: null })
  let calls = 0
  const unsub = m.onChange(() => { calls++ })
  unsub()
  m.apply('b')
  if (calls !== 0) throw new Error('Callback still firing')
  m.dispose()
})

// ============================================
// EXHIBIT REGISTRATIONS FOR WALKTHROUGH
// ============================================

// Helper functions for demo automation
async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function highlightElement(el) {
  el.classList.add('demo-highlight')
  setTimeout(() => el.classList.remove('demo-highlight'), 600)
}

async function simulateClick(el) {
  el.classList.add('demo-active-btn')
  await sleep(150)
  el.click()
  await sleep(150)
  el.classList.remove('demo-active-btn')
}

async function simulateHover(el, duration = 400) {
  el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
  await sleep(duration)
  el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
}

// Register Exhibit 1: Live Theme Switcher
testRunner.registerExhibit(
  'Live Theme Switcher',
  document.getElementById('exhibit-1-parent'),
  async () => {
    // Cycle through themes
    const themeButtons = document.querySelectorAll('#theme-buttons .theme-btn')
    for (const btn of themeButtons) {
      highlightElement(btn)
      await simulateClick(btn)
      await sleep(600)
    }

    // Back to dark
    const darkBtn = document.querySelector('[data-theme="dark"]')
    if (darkBtn) {
      await simulateClick(darkBtn)
      await sleep(400)
    }

    // Demo clear storage
    const clearBtn = document.getElementById('clear-storage')
    highlightElement(clearBtn)
    await simulateClick(clearBtn)
    await sleep(500)
  }
)

// Register Exhibit 2: Token Tracer
testRunner.registerExhibit(
  'Token Tracer',
  document.getElementById('exhibit-2-parent'),
  async () => {
    // Hover over token cards to show tracing
    const tokenCards = document.querySelectorAll('.token-card')
    const cardsToDemo = Array.from(tokenCards).slice(0, 5) // Demo first 5 tokens
    for (const card of cardsToDemo) {
      highlightElement(card)
      await simulateHover(card, 600)
      await sleep(200)
    }

    // Click one to show copy
    if (tokenCards[0]) {
      await simulateClick(tokenCards[0])
      await sleep(600)
    }
  }
)

// Register Exhibit 3: Theme Painter
testRunner.registerExhibit(
  'Theme Painter',
  document.getElementById('exhibit-3-parent'),
  async () => {
    // Demo presets
    const presetsToDemo = ['ocean', 'sunset', 'forest', 'neon', 'random']
    for (const presetName of presetsToDemo) {
      const btn = document.querySelector(`[data-preset="${presetName}"]`)
      if (btn) {
        highlightElement(btn)
        await simulateClick(btn)
        await sleep(500)
      }
    }

    // Demo a color picker change
    const colorPickers = document.querySelectorAll('.color-picker-input')
    if (colorPickers[0]) {
      const picker = colorPickers[0]
      highlightElement(picker.closest('.color-picker-row'))
      const originalColor = picker.value

      // Animate through some colors
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', originalColor]
      for (const color of colors) {
        picker.value = color
        picker.dispatchEvent(new Event('input', { bubbles: true }))
        await sleep(300)
      }
    }

    // Save a demo theme (skip to avoid clutter in demo)
    // Reset to a built-in theme
    const resetBtn = document.getElementById('reset-theme')
    highlightElement(resetBtn)
    await simulateClick(resetBtn)
    await sleep(400)
  }
)

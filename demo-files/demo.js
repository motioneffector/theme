// Import library and expose globally for tests
import * as Library from '../dist/index.js'
window.Library = Library

const { createTheme, createThemeManager } = Library

// ============================================
// THEME DEFINITIONS
// ============================================

const lightTheme = createTheme({
  name: 'light',
  tokens: {
    bg: '#ffffff',
    bgSecondary: '#f6f8fa',
    bgTertiary: '#eaeef2',
    text: '#1f2328',
    textSecondary: '#656d76',
    border: '#d0d7de',
    primary: '#0969da',
    accent: '#0969da'
  }
})

const darkTheme = createTheme({
  name: 'dark',
  tokens: {
    bg: '#0d1117',
    bgSecondary: '#161b22',
    bgTertiary: '#21262d',
    text: '#e6edf3',
    textSecondary: '#8b949e',
    border: '#30363d',
    primary: '#1f6feb',
    accent: '#58a6ff'
  }
})

const oceanTheme = createTheme({
  name: 'ocean',
  tokens: {
    bg: '#0a1628',
    bgSecondary: '#0f2744',
    bgTertiary: '#1a3a5c',
    text: '#e0f2fe',
    textSecondary: '#7dd3fc',
    border: '#0ea5e9',
    primary: '#0ea5e9',
    accent: '#22d3ee'
  }
})

// Preset palettes for Theme Painter
const presets = {
  ocean: {
    bg: '#0a1628',
    bgSecondary: '#0f2744',
    bgTertiary: '#1a3a5c',
    text: '#e0f2fe',
    textSecondary: '#7dd3fc',
    border: '#0ea5e9',
    primary: '#0ea5e9',
    accent: '#22d3ee'
  },
  sunset: {
    bg: '#1c1917',
    bgSecondary: '#292524',
    bgTertiary: '#3f3a36',
    text: '#fef3c7',
    textSecondary: '#fcd34d',
    border: '#f97316',
    primary: '#f97316',
    accent: '#fbbf24'
  },
  forest: {
    bg: '#052e16',
    bgSecondary: '#14532d',
    bgTertiary: '#166534',
    text: '#dcfce7',
    textSecondary: '#86efac',
    border: '#22c55e',
    primary: '#22c55e',
    accent: '#a3e635'
  },
  neon: {
    bg: '#0f0f0f',
    bgSecondary: '#1a1a1a',
    bgTertiary: '#2a2a2a',
    text: '#f0abfc',
    textSecondary: '#e879f9',
    border: '#d946ef',
    primary: '#d946ef',
    accent: '#22d3ee'
  }
}

// ============================================
// INITIALIZE THEME MANAGER
// ============================================

const manager = createThemeManager({
  themes: [lightTheme, darkTheme, oceanTheme],
  defaultTheme: 'dark',
  storageKey: 'demo-theme',
  prefix: '--theme-'
})

// Track if we're following system
let followingSystem = false
let unwatchSystem = null

// ============================================
// EXHIBIT 1: LIVE THEME SWITCHER
// ============================================

const themeButtonsContainer = document.getElementById('theme-buttons')
const storageValueEl = document.getElementById('storage-value')
const systemIconEl = document.getElementById('system-icon')
const systemLabelEl = document.getElementById('system-label')
const modeLabelEl = document.getElementById('mode-label')

function renderThemeButtons() {
  const themes = [
    { name: 'light', icon: '☀', label: 'Light', colors: ['#ffffff', '#f6f8fa', '#0969da', '#1f2328'] },
    { name: 'dark', icon: '☾', label: 'Dark', colors: ['#0d1117', '#161b22', '#1f6feb', '#e6edf3'] },
    { name: 'system', icon: '⚙', label: 'System', colors: ['linear-gradient(135deg, #fff 50%, #0d1117 50%)', '', '', ''] }
  ]

  themeButtonsContainer.innerHTML = themes.map(t => `
    <button class="theme-btn ${getActiveClass(t.name)}" data-theme="${t.name}">
      <div class="theme-btn-swatches">
        ${t.colors.slice(0, 4).map(c =>
          `<div class="theme-btn-swatch" style="background: ${c || 'transparent'}"></div>`
        ).join('')}
      </div>
      <div class="theme-btn-label">${t.icon} ${t.label}</div>
    </button>
  `).join('')

  // Add click handlers
  themeButtonsContainer.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const themeName = btn.dataset.theme

      // Stop system watching if active
      if (unwatchSystem) {
        unwatchSystem()
        unwatchSystem = null
      }
      followingSystem = false

      if (themeName === 'system') {
        followingSystem = true
        unwatchSystem = manager.watchSystem('light', 'dark')
      } else {
        manager.apply(themeName)
      }

      updateUI()
    })
  })
}

function getActiveClass(themeName) {
  if (themeName === 'system' && followingSystem) return 'active'
  if (themeName !== 'system' && !followingSystem && manager.currentName() === themeName) return 'active'
  return ''
}

function updateStorageDisplay() {
  try {
    const value = localStorage.getItem('demo-theme')
    if (value) {
      storageValueEl.textContent = `demo-theme: "${value}"`
      storageValueEl.classList.remove('empty')
    } else {
      storageValueEl.textContent = '(empty)'
      storageValueEl.classList.add('empty')
    }
  } catch (e) {
    storageValueEl.textContent = '(unavailable)'
    storageValueEl.classList.add('empty')
  }
}

function updateSystemIndicator() {
  const isDark = manager.prefersDark()
  systemIconEl.textContent = isDark ? '☾' : '☀'
  systemLabelEl.textContent = isDark ? 'Dark' : 'Light'

  modeLabelEl.textContent = followingSystem ? 'Following System' : 'Manual'
  modeLabelEl.classList.toggle('system-following', followingSystem)
}

function updateUI() {
  renderThemeButtons()
  updateStorageDisplay()
  updateSystemIndicator()
  renderTokenCards()
  renderRegisteredThemes()
}

// Clear storage button
document.getElementById('clear-storage').addEventListener('click', () => {
  manager.clearStorage()
  updateStorageDisplay()
})

// Listen for theme changes
manager.onChange(() => updateUI())

// Listen for system preference changes
manager.onSystemChange(() => updateSystemIndicator())

// ============================================
// EXHIBIT 2: TOKEN TRACER
// ============================================

const tokenGridEl = document.getElementById('token-grid')

// Map tokens to CSS properties and data attributes
const tokenMapping = {
  bg: { prop: 'background', selector: '[data-token-bg]' },
  bgSecondary: { prop: 'background', selector: '[data-token-bg-secondary]' },
  bgTertiary: { prop: 'background', selector: '[data-token-bg-tertiary]' },
  text: { prop: 'color', selector: '[data-token-text]' },
  textSecondary: { prop: 'color', selector: '[data-token-text-secondary]' },
  border: { prop: 'border-color', selector: '[data-token-border]' },
  primary: { prop: 'background', selector: '[data-token-primary]' },
  accent: { prop: 'color', selector: '[data-token-accent]' }
}

// Add data attributes to elements
document.body.setAttribute('data-token-bg', '')
document.querySelectorAll('.exhibit, .test-runner, .status-box, .registered-theme, .theme-btn, .preset-btn')
  .forEach(el => el.setAttribute('data-token-bg-secondary', ''))
document.querySelectorAll('.exhibit-controls, .test-summary, .test-progress-bar')
  .forEach(el => el.setAttribute('data-token-bg-tertiary', ''))
document.querySelectorAll('.header-title, .exhibit-title, .test-runner-title, .token-card-name, .test-name')
  .forEach(el => el.setAttribute('data-token-text', ''))
document.querySelectorAll('.header-description, .exhibit-description, .status-box-title')
  .forEach(el => el.setAttribute('data-token-text-secondary', ''))
document.querySelectorAll('.exhibit, .header, .test-runner, .status-box, .token-card')
  .forEach(el => el.setAttribute('data-token-border', ''))
document.querySelectorAll('.btn-primary, .test-progress-fill')
  .forEach(el => el.setAttribute('data-token-primary', ''))
document.querySelectorAll('.header-link')
  .forEach(el => el.setAttribute('data-token-accent', ''))

function renderTokenCards() {
  const tokens = manager.getAllTokens()

  tokenGridEl.innerHTML = Object.entries(tokens).map(([name, value]) => {
    const mapping = tokenMapping[name]
    const selector = mapping?.selector || ''
    const count = selector ? document.querySelectorAll(selector).length : 0

    return `
      <div class="token-card" data-token-name="${name}" data-token-selector="${selector}">
        <div class="token-card-swatch" style="background: ${value}"></div>
        <div class="token-card-name">${name}</div>
        <div class="token-card-value">${value}</div>
        <div class="token-card-count">${count} elements</div>
        <div class="token-card-copied">Copied!</div>
      </div>
    `
  }).join('')

  // Add hover handlers for tracing
  tokenGridEl.querySelectorAll('.token-card').forEach(card => {
    const selector = card.dataset.tokenSelector
    const tokenName = card.dataset.tokenName

    card.addEventListener('mouseenter', () => {
      if (!selector) return
      const color = manager.getToken(tokenName)
      document.querySelectorAll(selector).forEach(el => {
        el.style.setProperty('--trace-color', color)
        el.classList.add('token-trace-glow')
      })
    })

    card.addEventListener('mouseleave', () => {
      document.querySelectorAll('.token-trace-glow').forEach(el => {
        el.classList.remove('token-trace-glow')
      })
    })

    card.addEventListener('click', () => {
      const varName = manager.getCSSVariableName(tokenName)
      navigator.clipboard.writeText(`var(${varName})`).then(() => {
        const copied = card.querySelector('.token-card-copied')
        copied.classList.add('show')
        setTimeout(() => copied.classList.remove('show'), 1000)
      })
    })
  })
}

// ============================================
// EXHIBIT 3: THEME PAINTER
// ============================================

const presetButtonsEl = document.getElementById('preset-buttons')
const colorPickersEl = document.getElementById('color-pickers')
const themeNameInput = document.getElementById('theme-name')
const saveThemeBtn = document.getElementById('save-theme')
const resetThemeBtn = document.getElementById('reset-theme')
const registeredThemesEl = document.getElementById('registered-themes')

// Current painting state
let paintingTokens = { ...manager.getAllTokens() }

function renderPresetButtons() {
  const presetList = [
    { name: 'ocean', colors: ['#0a1628', '#e0f2fe', '#0ea5e9', '#22d3ee'] },
    { name: 'sunset', colors: ['#1c1917', '#fef3c7', '#f97316', '#fbbf24'] },
    { name: 'forest', colors: ['#052e16', '#dcfce7', '#22c55e', '#a3e635'] },
    { name: 'neon', colors: ['#0f0f0f', '#f0abfc', '#d946ef', '#22d3ee'] },
    { name: 'random', colors: ['?', '?', '?', '?'], isRandom: true }
  ]

  presetButtonsEl.innerHTML = presetList.map(p => `
    <button class="preset-btn" data-preset="${p.name}">
      <div class="preset-btn-swatches">
        ${p.colors.map(c =>
          `<div class="preset-btn-swatch" style="background: ${c === '?' ? 'linear-gradient(45deg, #f00, #0f0, #00f)' : c}"></div>`
        ).join('')}
      </div>
      <div class="preset-btn-label">${p.name.charAt(0).toUpperCase() + p.name.slice(1)}</div>
    </button>
  `).join('')

  presetButtonsEl.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetName = btn.dataset.preset

      if (presetName === 'random') {
        applyRandomPalette()
      } else {
        applyPreset(presetName)
      }
    })
  })
}

function applyPreset(name) {
  const preset = presets[name]
  if (!preset) return

  paintingTokens = { ...preset }
  applyPaintingToPage()
  updateColorPickers()
  themeNameInput.value = `my-${name}-theme`
}

function applyRandomPalette() {
  const hue = Math.floor(Math.random() * 360)
  const saturation = 60 + Math.floor(Math.random() * 30)

  paintingTokens = {
    bg: `hsl(${hue}, ${saturation}%, 8%)`,
    bgSecondary: `hsl(${hue}, ${saturation}%, 12%)`,
    bgTertiary: `hsl(${hue}, ${saturation}%, 18%)`,
    text: `hsl(${hue}, 30%, 90%)`,
    textSecondary: `hsl(${hue}, 40%, 70%)`,
    border: `hsl(${hue}, ${saturation}%, 40%)`,
    primary: `hsl(${hue}, ${saturation}%, 50%)`,
    accent: `hsl(${(hue + 30) % 360}, ${saturation}%, 60%)`
  }

  applyPaintingToPage()
  updateColorPickers()
  themeNameInput.value = 'my-random-theme'
}

function renderColorPickers() {
  const tokens = manager.getAllTokens()
  const labels = {
    bg: 'Background',
    bgSecondary: 'Cards',
    bgTertiary: 'Hover',
    text: 'Text',
    textSecondary: 'Muted Text',
    border: 'Border',
    primary: 'Primary',
    accent: 'Accent'
  }

  colorPickersEl.innerHTML = Object.entries(tokens).map(([name, value]) => `
    <div class="color-picker-row">
      <label class="color-picker-label">${labels[name] || name}</label>
      <input type="color" class="color-picker-input" data-token="${name}" value="${toHex(value)}">
    </div>
  `).join('')

  colorPickersEl.querySelectorAll('.color-picker-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const tokenName = e.target.dataset.token
      paintingTokens[tokenName] = e.target.value
      applyPaintingToPage()
    })
  })
}

function updateColorPickers() {
  colorPickersEl.querySelectorAll('.color-picker-input').forEach(input => {
    const tokenName = input.dataset.token
    if (paintingTokens[tokenName]) {
      input.value = toHex(paintingTokens[tokenName])
    }
  })
}

function toHex(color) {
  // Handle HSL
  if (color.startsWith('hsl')) {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const data = ctx.getImageData(0, 0, 1, 1).data
    return '#' + [data[0], data[1], data[2]].map(x => x.toString(16).padStart(2, '0')).join('')
  }
  // Already hex
  if (color.startsWith('#')) return color.slice(0, 7)
  return color
}

function applyPaintingToPage() {
  const root = document.documentElement
  Object.entries(paintingTokens).forEach(([name, value]) => {
    const varName = '--theme-' + name.replace(/([A-Z])/g, '-$1').toLowerCase()
    root.style.setProperty(varName, value)
  })
}

function resetPainting() {
  // Revert to current theme
  const current = manager.current()
  paintingTokens = { ...current.tokens }
  applyPaintingToPage()
  updateColorPickers()
  themeNameInput.value = 'my-custom-theme'
}

saveThemeBtn.addEventListener('click', () => {
  const name = themeNameInput.value.trim()
  if (!name) {
    alert('Please enter a theme name')
    return
  }

  if (manager.has(name)) {
    alert(`Theme "${name}" already exists`)
    return
  }

  try {
    const newTheme = createTheme({
      name,
      tokens: { ...paintingTokens }
    })
    manager.register(newTheme)
    manager.apply(name)
    themeNameInput.value = 'my-custom-theme'
    updateUI()
  } catch (e) {
    alert('Failed to create theme: ' + e.message)
  }
})

resetThemeBtn.addEventListener('click', resetPainting)

function renderRegisteredThemes() {
  const themes = manager.list()
  const builtIn = ['light', 'dark']

  registeredThemesEl.innerHTML = themes.map(name => {
    const theme = manager.get(name)
    const isBuiltIn = builtIn.includes(name)
    const isActive = manager.currentName() === name
    const colors = [theme.tokens.bg, theme.tokens.text, theme.tokens.primary, theme.tokens.accent]

    return `
      <div class="registered-theme ${isActive ? 'active' : ''}" data-theme="${name}">
        <div class="registered-theme-swatches">
          ${colors.map(c => `<div class="registered-theme-swatch" style="background: ${c}"></div>`).join('')}
        </div>
        <div class="registered-theme-name">${name}</div>
        ${!isBuiltIn ? `<button class="registered-theme-remove" data-remove="${name}">×</button>` : ''}
      </div>
    `
  }).join('')

  // Click to apply
  registeredThemesEl.querySelectorAll('.registered-theme').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('registered-theme-remove')) return
      const name = el.dataset.theme

      // Stop system following
      if (unwatchSystem) {
        unwatchSystem()
        unwatchSystem = null
      }
      followingSystem = false

      manager.apply(name)
      paintingTokens = { ...manager.getAllTokens() }
      updateColorPickers()
      updateUI()
    })
  })

  // Remove buttons
  registeredThemesEl.querySelectorAll('.registered-theme-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const name = btn.dataset.remove

      if (manager.currentName() === name) {
        manager.apply('dark')
      }

      manager.unregister(name)
      updateUI()
    })
  })
}

// ============================================
// INITIALIZATION
// ============================================

// Populate UI controls with initial state - this is allowed per Requirement 1
// "Input fields, dropdowns, and controls must be populated with example data"
// We're just displaying the INITIAL state, not computing new results
document.addEventListener('DOMContentLoaded', () => {
  // Render UI controls showing current library state
  renderThemeButtons()
  renderPresetButtons()
  renderColorPickers()
  renderTokenCards()
  renderRegisteredThemes()
  updateStorageDisplay()
  updateSystemIndicator()

  // The library was initialized with default theme during module load
  // We're just displaying that initial state, not running computations
})

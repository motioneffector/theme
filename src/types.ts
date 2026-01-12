export interface Theme {
  name: string
  tokens: Record<string, string>
}

export interface ThemeManagerOptions {
  themes: Theme[]
  defaultTheme?: string
  storageKey?: string
  prefix?: string
  target?: HTMLElement | null
}

export type ChangeCallback = (newTheme: Theme, previousTheme: Theme) => void
export type SystemChangeCallback = (scheme: 'dark' | 'light') => void
export type Unsubscribe = () => void

export interface ThemeManager {
  apply(themeName: string): Theme
  current(): Theme
  currentName(): string
  list(): string[]
  get(themeName: string): Theme | undefined
  has(themeName: string): boolean
  register(theme: Theme): void
  unregister(themeName: string): Theme
  onChange(callback: ChangeCallback): Unsubscribe
  clearStorage(): void
  prefersDark(): boolean
  prefersLight(): boolean
  onSystemChange(callback: SystemChangeCallback): Unsubscribe
  applySystem(lightThemeName: string, darkThemeName: string): Theme
  watchSystem(lightThemeName: string, darkThemeName: string): Unsubscribe
  getToken(tokenName: string): string | undefined
  getAllTokens(): Record<string, string>
  getCSSVariableName(tokenName: string): string
  dispose(): void
}

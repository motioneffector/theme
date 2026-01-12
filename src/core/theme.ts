import type { Theme } from '../types'

/**
 * Creates a new theme with validated name and tokens.
 *
 * @param options - Theme configuration with name and tokens
 * @returns A frozen Theme object with immutable name and tokens
 *
 * @throws {TypeError} If name is undefined, null, empty, or whitespace-only
 * @throws {TypeError} If tokens is undefined, null, not an object, or empty
 * @throws {TypeError} If any token name contains spaces, starts with a number, contains hyphens, or is empty
 *
 * @example
 * ```typescript
 * const theme = createTheme({
 *   name: 'dark',
 *   tokens: { primary: '#000000', secondary: '#333333' }
 * })
 * ```
 */
export function createTheme(options: { name: string; tokens: Record<string, string> }): Theme {
  // Validate name is provided
  if (options.name === undefined) {
    throw new TypeError('Theme name is required')
  }

  if (options.name === null) {
    throw new TypeError('Theme name cannot be null')
  }

  // Validate name is a non-empty string after trimming
  const trimmedName = options.name.trim()

  if (trimmedName === '') {
    throw new TypeError('Theme name cannot be empty or whitespace-only')
  }

  // Validate tokens is provided
  if (options.tokens === undefined) {
    throw new TypeError('Theme tokens are required')
  }

  if (options.tokens === null) {
    throw new TypeError('Theme tokens cannot be null')
  }

  // Validate tokens is an object (not array, not primitive)
  if (typeof options.tokens !== 'object' || Array.isArray(options.tokens)) {
    throw new TypeError('Theme tokens must be an object')
  }

  // Validate tokens has at least one key
  const tokenKeys = Object.keys(options.tokens)

  if (tokenKeys.length === 0) {
    throw new TypeError('Theme tokens cannot be empty')
  }

  // Validate each token name
  for (const tokenName of tokenKeys) {
    // Check for empty string
    if (tokenName === '') {
      throw new TypeError('Token name cannot be an empty string')
    }

    // Check for spaces
    if (tokenName.includes(' ')) {
      throw new TypeError(`Token name cannot contain spaces: "${tokenName}"`)
    }

    // Check for hyphens
    if (tokenName.includes('-')) {
      throw new TypeError(`Token name cannot contain hyphens: "${tokenName}"`)
    }

    // Check if starts with a number
    if (/^\d/.test(tokenName)) {
      throw new TypeError(`Token name cannot start with a number: "${tokenName}"`)
    }
  }

  // Create the theme object with frozen tokens
  const theme: Theme = {
    name: trimmedName,
    tokens: Object.freeze({ ...options.tokens }),
  }

  // Freeze the theme object itself
  return Object.freeze(theme)
}

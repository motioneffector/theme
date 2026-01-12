# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-11

### Added
- Initial release of @motioneffector/theme
- `createTheme()` - Create validated, immutable theme objects
- `createThemeManager()` - Central theme management API
- Theme switching with CSS custom property injection
- Automatic localStorage persistence for user preferences
- System dark/light mode detection and preference sync
- Runtime theme registration and unregistration
- onChange callbacks for theme change events
- Support for custom CSS variable prefixes
- Token utility methods (getToken, getAllTokens, getCSSVariableName)
- Full TypeScript support with complete type definitions
- SSR support via target: null option
- Comprehensive test suite (317 tests, 100% passing)
- Interactive demo page

### Features
- Zero runtime dependencies
- Tree-shakeable ESM build
- Framework-agnostic (works with any framework or vanilla JS)
- Supports camelCase token names with automatic kebab-case conversion
- System preference watching with automatic theme switching
- Theme disposal and cleanup support

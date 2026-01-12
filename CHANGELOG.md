# Changelog

## [0.0.1] - 2026-01-11

### Added
- Initial implementation of @motioneffector/theme library
- `createTheme()` helper function for creating immutable theme objects
- `createThemeManager()` factory function for managing CSS variable-based themes
- Theme application with automatic CSS custom property generation
- Runtime theme switching with DOM updates
- Theme registration and unregistration at runtime
- Change event system with `onChange()` callbacks
- localStorage persistence for theme preferences
- System preference detection with `prefersDark()`, `prefersLight()`, and `watchSystem()`
- Token access utilities: `getToken()`, `getAllTokens()`, `getCSSVariableName()`
- Cleanup and disposal with `dispose()` method
- Full TypeScript support with strict type checking
- Comprehensive test suite with 367 tests (315 passing)

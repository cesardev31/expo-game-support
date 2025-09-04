# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.17] - 2025-09-04

### Added
- Export `SpriteAnimator`, rendering types (`IRenderer`, `TextureInfo`, `DrawOptions`, `Rect as RenderRect`) and `GLRenderer` from `src/index.ts`.
- README section for rendering with `GLRenderer` (Expo GL), including `GLView` setup and `gl.endFrameEXP()` usage.
- Exports overview and platform notes (web-only texture upload helper, native texture upload guidance).
- Expanded installation instructions to include `expo-asset`, `expo-av`, and `expo-gl`.
- CONTRIBUTING guide translated and expanded to English with setup, scripts, coding standards, testing, PR process, and releases.

### Changed
- Consistent import quotes in `src/index.ts`.
- Documentation updates across README for features and types.

### Fixed
- Removed unused `@ts-expect-error` directive in `src/render/TextureHelpers.ts` to eliminate TypeScript warning.

## [0.0.1] - 2024-01-01

### Added
- Initial release of expo-game-support library
- Core game engine with configurable game loop
- Physics engine with gravity, forces, and collision detection
- Touch input manager with gesture recognition
- Vector2D math utilities
- GameObject base class with physics integration
- Collision detection (AABB and circular)
- TypeScript support with full type definitions
- Comprehensive documentation and examples
- Basic game example and Pong game implementation

### Features
- **GameEngine**: Main engine coordinating all systems
- **PhysicsEngine**: Complete physics simulation
- **TouchInputManager**: Optimized touch input handling
- **GameLoop**: Fixed and variable timestep support
- **CollisionDetector**: Multiple collision detection algorithms
- **Vector2D**: Complete 2D vector mathematics
- **GameObject**: Base class for all game entities

### Supported Gestures
- Tap and double tap
- Long press
- Swipe with direction detection
- Multi-touch support

### Performance Optimizations
- Dead zone configuration for touch inputs
- Efficient collision detection algorithms
- Optimized game loop with FPS control
- Memory-efficient object management

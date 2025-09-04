# Contributing to Expo Game Support

Thanks for your interest in contributing to `expo-game-support`! This guide walks you through setting up your environment, coding standards, testing, and our PR process.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm (or yarn, pnpm)
- Git
- Expo CLI (for running the example app):
  ```bash
  npm i -g expo-cli
  ```

### Development Setup

1. Fork the repository, then clone your fork:

```bash
git clone https://github.com/cesardev31/expo-game-support.git
cd expo-game-support
```

2. Install dependencies (root contains the library; `game-test/` is an example app):

```bash
npm install
```

3. Build the library in watch mode while developing:

```bash
npm run dev
```

4. Run the example app (optional) to test changes in a real Expo project:

```bash
cd game-test
npm install
npx expo start
```

## 📜 Scripts

- `npm run build` — compile TypeScript to `dist/`
- `npm run dev` — watch build for local development
- `npm run lint` — run ESLint over `src/**/*.ts(x)`
- `npm run test` — run unit tests (Jest)

## 🧭 Coding Standards

- TypeScript strict mode is enabled; keep types accurate and avoid `any`.
- Follow the existing folder structure and platform file conventions (`*.web.ts` / `*.native.ts` when needed).
- Keep public APIs typed and re-exported from `src/index.ts`.
- Document platform-specific behavior (e.g., web-only helpers) with clear comments.

### Linting & Formatting

- Run `npm run lint` and fix reported issues before submitting a PR.
- Keep imports ordered and avoid unused symbols.

### Testing

- Add or update tests when changing behavior or fixing bugs.
- Prefer unit tests close to the impacted modules; use Jest.

## 🔀 Branching & Pull Requests

1. Create a feature branch from `main`:

```bash
git checkout -b feat/my-feature
```

2. Make focused commits with clear messages:

```
feat(renderer): add GLRenderer begin/end frame helpers
fix(touch): handle multi-touch end event ordering
docs(readme): document exports and platform notes
```

3. Push your branch and open a Pull Request:

```bash
git push origin feat/my-feature
```

4. PR checklist:

- [ ] CI is green (build, lint, tests)
- [ ] README/docs updated if public API changes
- [ ] Changelog entry added (see below)

## 🧾 Changelog & Versioning

We follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and semantic versioning.

- Add a new entry under `## [Unreleased]` or the next version in `CHANGELOG.md` with sections: `Added`, `Changed`, `Fixed`, `Removed`, `Breaking`.
- Maintainers will bump the version and publish as needed.

## 🛠️ Release (Maintainers)

1. Ensure `npm run build` is clean and `dist/` is up to date.
2. Update `CHANGELOG.md` and `package.json` version.
3. `npm publish` from the `expo-game-support/` directory.

## 🤝 Code of Conduct

Please be respectful and collaborative. We are committed to providing a friendly, safe, and welcoming environment for all. Report unacceptable behavior via GitHub issues.

## 📝 Contribution Process

### 1) Reporting Bugs

- Use the bug report issue template.
- Include clear reproduction steps.
- Provide environment details (OS, Node, Expo/RN versions).
- Add a minimal code sample if possible.

### 2) Requesting Features

- Use the feature request issue template.
- Explain the use case and benefits.
- Propose API examples when relevant.

### 3) Pull Requests

#### Before Submitting

- Ensure tests pass: `npm test`
- Lint passes: `npm run lint`
- Build succeeds: `npm run build`
- Update documentation where applicable

#### Commit Conventions

We recommend [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add circular collision detection
fix: resolve memory leak in TouchInputManager
docs: update README with rendering examples
test: add unit tests for PhysicsEngine
refactor: optimize collision algorithm
```

#### PR Structure

- Descriptive title
- Clear description of changes
- References to related issues
- Screenshots/GIFs when applicable

## 📐 Project Architecture

```
src/
├── core/           # Core components
│   ├── GameEngine.ts
│   ├── GameLoop.ts
│   └── GameObject.ts
├── physics/        # Physics system
│   ├── PhysicsEngine.ts
│   └── CollisionDetector.ts
├── input/          # Input handling
│   ├── TouchInputManager.ts
│   └── TouchInputManagerRN.ts
├── render/         # Optional rendering layer
│   ├── GLRenderer.ts
│   ├── IRenderer.ts
│   └── TextureHelpers.ts
├── assets/         # Asset management
│   ├── AssetManager.ts
│   └── SpriteAnimator.ts
├── math/           # Math utilities
│   └── Vector2D.ts
├── types/          # Type definitions
│   ├── index.ts
│   └── assets.ts
└── index.ts        # Entry point (exports)
```

## 🧪 Testing

### Running Tests

```bash
npm test                 # All tests
npm test -- --watch      # Watch mode
npm test -- --coverage   # Coverage
```

### Writing Tests

- Use Jest for unit tests.
- Place tests under `src/__tests__/`.
- Name files `*.test.ts` or `*.test.tsx`.
- Aim for meaningful coverage and test behavior, not implementation.

### Example Test

```typescript
import { Vector2D } from "../math/Vector2D";

describe("Vector2D", () => {
  it("adds vectors correctly", () => {
    const v1 = new Vector2D(1, 2);
    const v2 = new Vector2D(3, 4);
    const result = v1.add(v2);

    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });
});
```

## 📚 Documentation

### Update Docs

- Update `README.md` when public APIs change.
- Add JSDoc comments to public types and methods.
- Keep `CHANGELOG.md` updated for releases.
- Add or update examples under `/examples/`.

### JSDoc Style

```typescript
/**
 * Apply a force to the game object.
 * @param force - Force vector to apply
 * @example
 * gameObject.applyForce(new Vector2D(100, 0));
 */
applyForce(force: Vector2D): void {
  // implementation
}
```

## 🎨 Code Style

### TypeScript

- Use strict typing and avoid `any`.
- Document public interfaces and classes.
- Prefer descriptive names.

### Formatting

- 2 spaces indentation
- Semicolons required
- Consistent quotes
- Trailing commas where appropriate

### ESLint

```bash
npm run lint        # Check
npm run lint:fix    # Auto-fix
```

## 🚀 Performance

### Considerations

- Avoid unnecessary allocations in the game loop.
- Use object pooling for frequently created objects.
- Optimize collision algorithms.
- Minimize garbage collection pressure.

### Profiling

```typescript
console.time("collision-detection");
// code to measure
console.timeEnd("collision-detection");
```

## ✅ PR Checklist

- [ ] Tests pass
- [ ] Lint passes
- [ ] Docs updated (if applicable)
- [ ] Changelog updated (if applicable)
- [ ] Performance considerations reviewed
- [ ] Backward compatibility maintained
- [ ] Examples updated (if applicable)

## ❓ Need Help?

- Open an issue labeled "question"
- Search existing issues
- Check the documentation
- Contact maintainers via issues

## 🏷️ Releases

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- MAJOR: incompatible API changes
- MINOR: backwards-compatible features
- PATCH: backwards-compatible bug fixes

### Release Process

1. Update `CHANGELOG.md`
2. Bump version in `package.json`
3. Create a git tag
4. Publish to npm

Thank you for contributing to expo-game-support! 🎮

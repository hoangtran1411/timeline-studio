# Contributing to Timeline Studio

Thank you for your interest in contributing to **Timeline Studio**! We welcome contributions, bug fixes, feature proposals, and documentation improvements.

Please take a moment to review this document before submitting your pull request.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any violations or unacceptable behavior to [chi3xitin2010@gmail.com](mailto:chi3xitin2010@gmail.com).

---

## Getting Started

### Prerequisites

- **Node.js**: v22.x or later (v24 LTS recommended)
- **Package Manager**: `npm` (v10+)
- **Git**: For version control

### Local Development Setup

1. **Fork and clone the repository**:

   ```bash
   git clone https://github.com/<your-username>/timeline-studio.git
   cd timeline-studio
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Architectural & Design Guidelines

Before submitting code changes, familiarize yourself with our project documentation:

- [`DESIGN.md`](DESIGN.md): The core aesthetic philosophy ("Engineering Tactile Minimalism"), monochrome color tokens, and notebook quad grid mechanics.
- [`keyword.md`](keyword.md): The official dictionary for UI components (Track Wire, Knot Peg, Node Lock, Bottom Matrix Panel, etc.).

### Key Architectural Tenets

1. **Anti-AI Slop**: Avoid neon gradients, garish saturated blues, and gratuitous glassmorphism. Maintain the calm, distraction-free monochrome drafting aesthetic.
2. **Lean Database Philosophy**: Store presentation layout properties (splitters, panel widths, collapsed states) in browser `localStorage`. Do not add presentation layout columns to SQLite tables.
3. **Responsive Pointer Capture**: When adding drag or resize interactions, always use `setPointerCapture` and clean up on pointer up to prevent dropped drag states.

---

## Contribution Workflow

### 1. Branch Naming Conventions

Create a topic branch from `main`:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 2. Code Quality Checks

Before committing your changes, make sure all verification checks pass:

- **TypeScript Compilation**:

  ```bash
  npx tsc --noEmit
  ```

- **ESLint**:

  ```bash
  npm run lint
  ```

- **Markdown Linting**:

  ```bash
  npm run lint:md
  ```

- **Production Build**:

  ```bash
  npm run build
  ```

### 3. Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Description |
| :--- | :--- |
| `feat:` | Adds a new feature or interactive control |
| `fix:` | Bug fixes or layout regressions |
| `docs:` | Documentation updates (`README.md`, `keyword.md`, etc.) |
| `style:` | Formatting or aesthetic adjustments adhering to `DESIGN.md` |
| `refactor:` | Code reorganization without behavioral alterations |
| `perf:` | Performance optimizations |
| `ci:` | Changes to CI configuration (GitHub Actions, etc.) |
| `chore:` | Maintenance tasks, dependency updates |

---

## Pull Request Process

1. Ensure your branch is rebased on the latest `main`.
2. Push your topic branch to your fork on GitHub.
3. Open a Pull Request against the `main` branch of `hoangtran1411/timeline-studio`.
4. Provide a clear description of the problem solved, visual changes (with screenshots if relevant), and verification steps.
5. All automated GitHub Actions CI checks must pass before merging.

---

## Reporting Bugs

Please [open an issue](https://github.com/hoangtran1411/timeline-studio/issues/new) with:

- A clear and descriptive title.
- Steps to reproduce the behavior.
- Expected vs. actual behavior.
- Screenshots if applicable.
- Your environment (OS, browser, Node.js version).

---

## Feature Requests

We encourage feature requests! Please [open an issue](https://github.com/hoangtran1411/timeline-studio/issues/new) with:

- A clear description of the feature.
- The problem it solves or the use case it addresses.
- Any design mockups or references if applicable.

---

Thank you for helping make Timeline Studio better!

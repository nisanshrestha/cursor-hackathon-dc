# Quickstart: Devnotes Code Visualization Extension

**Feature**: 001-devnotes-code-visualization  
**Date**: 2025-01-30  
**Purpose**: Get the extension built, tested, and running locally in the Extension Development Host (VS Code or a compatible fork).

---

## Prerequisites

- **Node.js**: 18.x or 20.x (LTS). Check: `node -v`.
- **npm**: 10.x or later. Check: `npm -v`.
- **VS Code or fork**: VS Code 1.60+, or Windsurf, Codex, Cursor, AntiGravity (extension-compatible build).
- **Git**: Optional; required for branch-based workflow and running repo scripts.

---

## 1. Clone and Branch

```bash
git clone <repo-url>
cd <repo-root>
git checkout 001-devnotes-code-visualization
```

If the branch does not exist yet, create it and ensure the spec and plan are under `specs/001-devnotes-code-visualization/`.

---

## 2. Install Dependencies

From the repository root (where `package.json` lives):

```bash
npm install
```

This installs the VS Code extension dependencies and TypeScript typings (`@types/vscode`, etc.).

---

## 3. Build

Compile TypeScript to `out/`:

```bash
npm run compile
```

Or run the compiler in watch mode:

```bash
npm run watch
```

---

## 4. Run Tests

- **Unit tests** (analyzer/parser logic, no VS Code):
  - Run the unit test suite if present, e.g. `npm run test:unit` or `npx mocha out/tests/unit/**/*.js`.
- **Extension host tests** (commands, panel, integration):
  - `npm run test` or as configured in `package.json` (e.g. launch Extension Tests from VS Code Run and Debug).

Ensure the extension compiles and tests pass before running in the host.

---

## 5. Run the Extension in the Development Host

1. Open the repository root in VS Code (or compatible fork).
2. Press **F5** (or Run → Start Debugging) to launch the Extension Development Host.
3. In the new window:
   - Open a code file (or a folder).
   - Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
   - Run a Devnotes command (e.g. “Devnotes: Analyze and visualize”) once implemented.
4. Set the API endpoint and API key in Settings (or when prompted) so the analysis request can be sent.

---

## 6. Configuration

Before using analysis, configure:

- **API endpoint**: e.g. `https://api.openai.com/v1/chat/completions` (or your provider’s URL).
- **API key**: Stored via VS Code Secrets; set in Settings or when the extension prompts.
- **Model**: e.g. `gpt-4o-mini` (configurable in Settings).

Exact setting names and UI are defined in the implementation (e.g. under a “Devnotes” or “Code Analyzer” namespace in Settings).

---

## 7. Project Layout (Reference)

```text
<repo-root>/
├── src/
│   ├── extension.ts
│   ├── commands/
│   ├── services/
│   ├── webview/
│   ├── config/
│   └── devnotes/
├── out/
├── tests/
├── package.json
├── tsconfig.json
└── specs/001-devnotes-code-visualization/
    ├── plan.md
    ├── research.md
    ├── data-model.md
    ├── quickstart.md (this file)
    └── contracts/
```

---

## 8. Troubleshooting

- **Extension does not activate**: Check that `package.json` has the correct `main` (e.g. `./out/extension.js`) and that `npm run compile` completed without errors.
- **Commands not visible**: Ensure `contributes.commands` and optional `contributes.keybindings` are defined in `package.json` and that the extension host was restarted (e.g. relaunch F5).
- **API errors**: Verify endpoint URL and API key; check network; ensure request body matches the [analysis API contract](./contracts/analysis-api.md).
- **Panel not movable**: Use the standard VS Code/fork layout (e.g. move panel to side or secondary sidebar); the extension uses WebviewView/WebviewPanel so placement follows the host.

---

## 9. Next Steps

- Implement tasks from `tasks.md` (created by `/speckit.tasks`).
- Run the Constitution Check and quality checklist before merging.
- See [plan.md](./plan.md) and [spec.md](./spec.md) for scope and requirements.

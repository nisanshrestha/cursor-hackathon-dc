# Research: Devnotes Code Visualization

**Feature**: 001-devnotes-code-visualization  
**Date**: 2025-01-30  
**Purpose**: Resolve technical choices and align with VS Code extension best practices, security, Command Palette shortcuts, and movable UI compatible with VS Code and forks.

---

## 1. VS Code Extension Architecture and Best Practices

**Decision**: Use the standard VS Code Extension API only; structure as single extension with a thin activation layer (`extension.ts`) that registers commands and wires a webview/panel; keep all analyzer logic (API client, response parsing, Mermaid extraction) in separate modules under `src/services` and `src/devnotes` with no direct dependency on `vscode` in those modules so they can be unit-tested without the extension host.

**Rationale**: VS Code and its forks (Windsurf, Codex, Cursor, AntiGravity) share the same extension API and host. Using only the public API and avoiding private or host-specific APIs ensures the extension runs identically everywhere. Isolating core logic improves testability and keeps the extension maintainable.

**Alternatives considered**: Putting all logic inside `extension.ts` was rejected because it would make unit testing and TDD for the analyzer difficult. Using a separate Node CLI or daemon was rejected because the spec and constitution require the product to be a VS Code extension with all functionality in the extension host.

---

## 2. Security and Safety

**Decision**: Store API endpoint and API key using VS Code’s configuration and, for the key, the Secrets API (`vscode.env.asExternalUri` not required for this feature). Never log, persist, or transmit active file or workspace content except in the single request to the configured API when the user explicitly triggers analysis. No automatic or background sending of code.

**Rationale**: Aligns with the constitution (Security and Privacy). The VS Code Secrets API is the recommended way to store credentials and is supported across VS Code and compatible forks. Explicit user action for every API call keeps the extension predictable and safe.

**Alternatives considered**: Storing the API key in workspace settings or a plain config value was rejected for the key (sensitive); endpoint URL in config is acceptable. Sending code on file save or on idle was rejected because it would violate the “no automatic sending” principle.

---

## 3. Command Palette and Shortcuts

**Decision**: Expose all primary actions as VS Code commands (e.g. “Devnotes: Analyze and visualize”, “Devnotes: Open custom context”, “Devnotes: Generate holistic .devnotes”). Register them in `package.json` under `contributes.commands` so they appear in the Command Palette. Add default keybindings under `contributes.keybindings` for the main actions so users have shortcuts out of the box; document that users can reassign shortcuts in Keyboard Shortcuts (same behavior in VS Code and forks).

**Rationale**: Command Palette is the standard way to discover and run extension actions in VS Code and forks. Contributing keybindings gives a consistent “shortcut utility” experience and allows each user (or fork) to override keys if desired.

**Alternatives considered**: Only commands without default keybindings was rejected because the user asked for “shortcut utility within the Command Prompt window” (interpreted as Command Palette and shortcuts). Using a custom “command prompt” UI was rejected in favor of the standard Command Palette to stay idiomatic and compatible across hosts.

---

## 4. Movable Window (Results Panel)

**Decision**: Show annotations and Mermaid diagrams in a VS Code Webview hosted in a **WebviewView** (sidebar panel) or in a **WebviewPanel**. Prefer **WebviewView** when the primary use is a side panel that the user can show/hide and move (e.g. to secondary side bar); use **WebviewPanel** if the user needs to drag the view to the editor area or position it freely. Both are standard API types and support user-controlled placement (sidebar left/right, editor group, etc.) so the “window” is movable wherever the user wants within the editor layout. Do not rely on window or desktop positioning outside the editor.

**Rationale**: VS Code and forks use the same layout model: panels and side bars can be moved by the user (e.g. “Move Panel to Right”). WebviewView and WebviewPanel are part of the standard API and work across VS Code, Windsurf, Codex, Cursor, and AntiGravity, so the results “window” is movable in the same way in all of them.

**Alternatives considered**: A simple Output channel was rejected for the main visualization because it does not support rich layout or movable panels. A separate external window (e.g. Electron or browser) was rejected because it would not be “within” the VS Code editor and would diverge from fork behavior. Using only WebviewPanel (no WebviewView) was considered; the implementation can offer both (e.g. sidebar view by default with an option to open in a panel) so the user can choose where to place the result.

---

## 5. Compatibility with VS Code Forks (Windsurf, Codex, Cursor, AntiGravity)

**Decision**: Use only the public VS Code Extension API documented at https://code.visualstudio.com/api. Avoid Node version–specific or host-specific APIs. Declare the minimum engine in `package.json` (e.g. `"vscode": "^1.60.0"`) and run extension host tests on the minimum supported version. Do not depend on Cursor-, Windsurf-, or fork-specific features for core functionality.

**Rationale**: Forks that support VS Code extensions implement the same API surface. Sticking to the public API and a declared engine version maximizes the chance that the extension works on VS Code and all mentioned forks without special casing.

**Alternatives considered**: Using Cursor-only or Windsurf-only APIs was rejected for core features so that a single codebase works everywhere. Fork-specific enhancements could be added later as optional features if they do not break the standard path.

---

## 6. HTTP Client for Analysis API

**Decision**: Use Node’s built-in `https`/`http` modules for the outbound request to the analysis API, as in the constitution’s preference for built-in modules. No mandatory dependency on `node-fetch` or `axios` for the main flow.

**Rationale**: Keeps dependencies minimal and aligns with the constitution. The extension host runs in a Node environment where `https`/`http` are available in all supported versions.

**Alternatives considered**: `node-fetch` or `axios` would be acceptable if the team later decides to standardize on them; for the initial plan, built-in modules are sufficient and avoid extra supply-chain and versioning concerns.

---

## Summary Table

| Topic              | Decision                                      | Rationale / Notes                                      |
|--------------------|-----------------------------------------------|--------------------------------------------------------|
| Architecture       | Thin extension.ts + testable services/devnotes | TDD, fork compatibility, maintainability              |
| API credentials    | Config + Secrets API; no auto-send            | Security, constitution compliance                      |
| Commands & shortcuts | contributes.commands + keybindings           | Command Palette and “shortcut utility”                 |
| Results UI         | WebviewView / WebviewPanel                    | Movable within editor; same on VS Code and forks       |
| Fork compatibility | Public VS Code API only; declared engine      | One codebase for VS Code and forks                     |
| HTTP               | Built-in https/http                           | Constitution; minimal dependencies                     |

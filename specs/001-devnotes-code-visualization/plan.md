# Implementation Plan: Devnotes Code Visualization

**Branch**: `001-devnotes-code-visualization` | **Date**: 2025-01-30 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/001-devnotes-code-visualization/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The extension reads the active file (and optionally directory and user-tagged content), sends context to a configurable analysis API with system prompts, and displays returned annotations and Mermaid diagrams (class, entity/model, sequence). Users can add custom context (text/images) saved as `.devnotes` beside the active file and generate a holistic top-level `.devnotes`. Technical approach: VS Code Extension API with TypeScript; commands exposed via Command Palette with shortcuts; results in a movable webview/panel; API key and endpoint via VS Code secrets/config; compatible with VS Code and forks (Windsurf, Codex, Cursor, AntiGravity).

## Technical Context

**Language/Version**: TypeScript 4.x+ (target ES2020); Node.js as provided by VS Code extension host  
**Primary Dependencies**: VS Code Extension API (`vscode`), no mandatory runtime HTTP library (built-in `https`/`http` preferred per constitution)  
**Storage**: File system only — `.devnotes` files beside active file and at workspace root; no database  
**Testing**: Mocha + VS Code test runner for extension host tests; unit tests for analyzer/parser logic without VS Code  
**Target Platform**: VS Code 1.60+ and compatible forks (Windsurf, Codex, Cursor, AntiGravity) — use standard Extension API only so behavior is identical across hosts  
**Project Type**: Single VS Code extension (monorepo root = extension root)  
**Performance Goals**: Analysis trigger-to-display under 30s for typical file sizes (spec SC-001); UI responsive (no main-thread blocking)  
**Constraints**: Secure (API key/endpoint via VS Code secrets/config); no code sent without explicit user action; Command Palette shortcuts for all main actions; results panel/webview movable and dockable per user preference  
**Scale/Scope**: Single workspace; typical payload: one active file + optional tagged files + optional .devnotes (size limits TBD in design to avoid API limits)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with `.specify/memory/constitution.md`:

- **Extension-First**: Feature exposed via VS Code commands/config; core logic (API client, response parsing, Mermaid extraction) modular and testable in isolation. **PASS**
- **Active-File-to-API Contract**: Only active editor content (or user-selected/tagged content) sent to API; response treated as structured text and/or Mermaid. **PASS**
- **Digestible Output**: Outputs presented as readable text and valid Mermaid (in editors/webview), not raw API payloads. **PASS**
- **Test-First**: Analyzer/parser logic covered by TDD; table-driven tests where applicable; extension registration covered by extension host tests. **PASS**
- **Security and Privacy**: API key/endpoint via VS Code config or secrets API; no automatic sending of code; no logging/persistence of code beyond the single API request. **PASS**

**Gates**: All passed. No violations.

*Re-check after Phase 1 design*: Constitution Check re-evaluated after research.md, data-model.md, contracts/, and quickstart.md. All gates still pass; no new violations. API contract and data model align with Active-File-to-API Contract and Digestible Output; security and Command Palette / movable panel align with research decisions.

## Project Structure

### Documentation (this feature)

```text
specs/001-devnotes-code-visualization/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API request/response shapes)
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks - not created by plan)
```

### Source Code (repository root)

```text
src/
├── extension.ts           # Activation, command registration, panel/webview wiring
├── commands/              # Command handlers (analyze, tag, save devnotes, holistic)
├── services/              # API client, response parser, Mermaid extractor (testable)
├── webview/               # Webview content provider, HTML/JS for movable panel
├── config/                # Reading API URL, API key, model from VS Code config/secrets
└── devnotes/              # .devnotes read/write, aggregation for top-level

out/                       # Compiled JS (tsc)
tests/
├── unit/                  # Services, parser, Mermaid extraction (no VS Code)
├── integration/           # Extension host tests (commands, panel)
└── runTest.ts / runTest.js

package.json               # Manifest: commands, configuration, keybindings
tsconfig.json
```

**Structure Decision**: Single VS Code extension at repo root. Core logic lives in `src/services` and `src/devnotes` for testability without the extension host. UI and lifecycle in `src/extension.ts` and `src/webview`. Commands and shortcuts in `package.json` contribute to Command Palette and allow user-defined keybindings.

## Complexity Tracking

No constitution violations. This section left empty.

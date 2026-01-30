# Devnotes: Code Visualization

VS Code extension that analyzes code (active file or selection) via a configurable API and displays annotations and Mermaid diagrams in a movable panel.

## Install

1. Clone and open the repo in VS Code (or compatible fork: Windsurf, Codex, Cursor, AntiGravity).
2. Run `npm install` then `npm run compile`.
3. Press **F5** to launch the Extension Development Host.

## Configure

- **API endpoint**: Settings → search `devnotes.analysisApiUrl` (default: OpenAI chat completions URL).
- **API key**: Settings → `devnotes.analysisApiKey`, or leave empty to be prompted when you run the command.
- **Model**: Settings → `devnotes.analysisModel` (e.g. `gpt-4o-mini`).

## Commands

- **Devnotes: Analyze and visualize** — Sends the active file (or selection), or tagged context if set, to the API and shows annotations and Mermaid diagrams in a webview panel. Shortcut: `Ctrl+Shift+D` / `Cmd+Shift+D`.
- **Devnotes: Add current file (or selection) to context** — Adds the active file or selection to the tagged set used for analysis.
- **Devnotes: Remove from context** — Remove one tagged item from context (quick pick).
- **Devnotes: Clear context** — Clear all tagged items.
- **Devnotes: Open custom context** — Open a panel to edit custom context and business logic; saved as `.devnotes` beside the active file.
- **Devnotes: Generate holistic .devnotes** — Aggregate all `.devnotes` and diagram references in the workspace into one top-level `.devnotes` at workspace root.

## Usage

1. Open a code file (or select a region).
2. Run **Devnotes: Analyze and visualize** from the Command Palette or use the shortcut.
3. Enter your API key if not set. Results appear in a movable panel.

See `specs/001-devnotes-code-visualization/quickstart.md` for full steps.

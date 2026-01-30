# Data Model: Devnotes Code Visualization

**Feature**: 001-devnotes-code-visualization  
**Date**: 2025-01-30  
**Purpose**: Entities, fields, relationships, and validation rules derived from the feature spec. No implementation details; describes what the extension manipulates.

---

## 1. Active File Context

**Description**: The content and identity of the currently focused editor at the time the user triggers analysis.

| Field / Concept   | Description                                      | Validation / Rules |
|-------------------|--------------------------------------------------|--------------------|
| Content           | Full text of the active editor document          | Non-empty when analysis is allowed; size limit TBD for API |
| Language / path  | Document language id and file path (if a file)   | Path used to resolve sibling `.devnotes` path |
| Selection         | Optional: user-selected region (start/end)       | If present, only selected text is used as “active” content for API |

**Relationships**: Used to build **API request**; determines directory for **per-file .devnotes** read/write.

**State**: Ephemeral; not persisted by the extension except as part of a single API request when user triggers analysis.

---

## 2. Tagged / Included Set

**Description**: The set of files or regions the user has marked as important for analysis context.

| Field / Concept   | Description                                      | Validation / Rules |
|-------------------|--------------------------------------------------|--------------------|
| Entries           | List of items: file path + optional range (start/end) | No duplicate paths; paths within workspace |
| Content snapshot  | For each entry, the text content (full file or range) at time of analysis | Size limit TBD (total payload to API) |

**Relationships**: Combined with **Active file context** (and optionally **per-file .devnotes**) to build **API request**.

**State**: In-memory or UI state until user triggers analysis; not persisted long-term unless the extension adds a “saved context” feature later.

---

## 3. API Request (Analysis)

**Description**: The payload sent to the configurable analysis API when the user explicitly runs analysis.

| Field / Concept   | Description                                      | Validation / Rules |
|-------------------|--------------------------------------------------|--------------------|
| System prompt      | Instructions for the API (e.g. “produce annotations and Mermaid diagrams”) | Provided by extension; may be configurable later |
| Active content     | Text from **Active file context** (full or selection) | Non-empty when analysis is allowed |
| Directory summary  | Optional: high-level listing or summary of current directory | Optional; size bounded |
| Tagged content     | Optional: labeled list of file/region contents from **Tagged / included set** | Optional; total size bounded |
| Custom context     | Optional: contents of **per-file .devnotes** for active file | Optional |

**Relationships**: Built from **Active file context**, **Tagged / included set**, and optionally **.devnotes (per-file)**. Produces **API response**.

**State**: Transient; sent once per user action; not stored by the extension (per constitution).

---

## 4. API Response (Analysis)

**Description**: The structured response from the analysis API that the extension parses and displays.

| Field / Concept   | Description                                      | Validation / Rules |
|-------------------|--------------------------------------------------|--------------------|
| Annotations       | Plain text: summaries, explanations, notes       | Parsed and displayed as readable text |
| Diagram definitions | One or more Mermaid diagram definitions (class, entity/model, sequence) | Each is valid Mermaid syntax; type inferred or labeled |
| Error / message   | Optional: error or message from API             | Displayed to user; no raw payload as “success” content |

**Relationships**: Parsed from API; **Mermaid diagram artifact**(s) extracted and displayed or saved; annotations displayed in UI.

**State**: Parsed in memory; diagram source may be written to workspace (e.g. `.md` or embedded in **.devnotes (top-level)**); raw response not persisted.

---

## 5. Mermaid Diagram Artifact

**Description**: A single diagram definition produced by the API and displayed or stored by the extension.

| Field / Concept   | Description                                      | Validation / Rules |
|-------------------|--------------------------------------------------|--------------------|
| Source            | Raw Mermaid syntax (string)                      | Valid Mermaid for supported types (class, entity, sequence) |
| Type              | Class | Entity/Model | Sequence (or unknown)           | Inferred from content or API label if present |
| Title / label     | Optional: user- or API-supplied label            | For display and aggregation |

**Relationships**: Extracted from **API response**; displayed in webview/editor; may be referenced or embedded in **.devnotes (top-level)**.

**State**: May be written to workspace (e.g. as part of holistic .devnotes or separate file); format TBD in implementation.

---

## 6. .devnotes (per-file)

**Description**: A file stored beside the active file containing the user’s custom text and/or image references for context and business logic.

| Field / Concept   | Description                                      | Validation / Rules |
|-------------------|--------------------------------------------------|--------------------|
| Path              | Same directory as active file; name `.devnotes` (or configurable) | Single file per directory; overwrite on save |
| Content           | Free-form text and/or image references (paths or embedded) | Format TBD (e.g. Markdown); size limit TBD |
| Relationship      | “Belongs to” the directory (and thus to any active file in that directory) | Read when building API request for that context; written when user saves custom context |

**Relationships**: Optional input to **API request**; source for **.devnotes (top-level)** aggregation.

**State**: Persisted on disk; read on demand when user opens custom-context UI or runs analysis.

---

## 7. .devnotes (top-level)

**Description**: A file at workspace (or repo) root that aggregates per-file .devnotes and diagram references into a single holistic view.

| Field / Concept   | Description                                      | Validation / Rules |
|-------------------|--------------------------------------------------|--------------------|
| Path              | Workspace root (or configurable root); name `.devnotes` | Single file per workspace; overwrite or merge TBD |
| Content           | Aggregated content: references or embedded per-file .devnotes; references or embedded Mermaid diagram artifacts | Format TBD (e.g. Markdown with sections); generated by extension |
| Scope             | Set of per-file .devnotes and diagram artifacts discovered in workspace | Bounded by workspace; discovery rules TBD |

**Relationships**: Built from **.devnotes (per-file)** and **Mermaid diagram artifact**(s) produced in the workspace.

**State**: Persisted on disk; regenerated or updated when user runs “generate holistic .devnotes”.

---

## Entity Relationship Summary

```text
Active file context ──┬──► API request
Tagged / included set ─┼──► API request
.devnotes (per-file) ──┘

API request ──► API response ──► Annotations (display)
                    │
                    └──► Mermaid diagram artifact(s) ──► display / .devnotes (top-level)

.devnotes (per-file) ──► .devnotes (top-level)
Mermaid diagram artifact(s) ──► .devnotes (top-level)
```

---

## Validation Rules (Summary)

- **API request**: Active content non-empty when analysis is allowed; total payload size within API limits (TBD).
- **API response**: Parsed into annotations and diagram definitions; invalid Mermaid handled (show raw source, do not lose content).
- **.devnotes (per-file)**: Single path per directory; write only on explicit user save.
- **.devnotes (top-level)**: Single path per workspace; overwrite or merge policy TBD; confirm if existing user edits exist (per spec edge case).

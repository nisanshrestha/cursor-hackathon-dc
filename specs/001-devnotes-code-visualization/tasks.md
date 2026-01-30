# Tasks: Devnotes Code Visualization

**Input**: Design documents from `specs/001-devnotes-code-visualization/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Unit tests for analyzer/parser logic are included per constitution (Test-First). Extension host tests for commands/panel are included where needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g. US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (extension root = repo root per plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure per plan.md

- [x] T001 Create project structure per plan: `src/extension.ts`, `src/commands/`, `src/services/`, `src/webview/`, `src/config/`, `src/devnotes/`, `tests/unit/`, `tests/integration/` at repo root
- [x] T002 Initialize TypeScript project: add `package.json` with VS Code engine `^1.60.0`, `main` pointing to `out/extension.js`, and `tsconfig.json` with target ES2020 and `rootDir`/`outDir` per plan
- [x] T003 [P] Configure ESLint and Prettier (or project lint/format) for `src/` and `tests/` at repo root

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story. Config, API client, response parser, and Mermaid extractor are testable without VS Code.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Add extension configuration in `package.json`: `contributes.configuration` for API URL, API key (secret), and model (e.g. `devnotes.analysisApiUrl`, `devnotes.analysisApiKey`, `devnotes.analysisModel`)
- [x] T005 Implement config reader in `src/config/settings.ts`: read API URL, model from workspace config; read API key from VS Code Secrets API (or config fallback), no plain-text logging of key
- [x] T006 Implement HTTPS API client in `src/services/apiClient.ts`: POST JSON to configurable URL with `Authorization: Bearer` header, use Node `https`/`http` only; accept request body and return `{ statusCode, body }` or throw
- [x] T007 Implement response parser in `src/services/responseParser.ts`: parse OpenAI-compatible JSON response (`choices[0].message.content`), return `{ annotations: string, diagramBlocks: string[] }`; handle error response shape and invalid JSON
- [x] T008 Implement Mermaid extractor in `src/services/mermaidExtractor.ts`: extract ```mermaid ... ``` blocks from a string; return array of `{ source, type? }` (type inferred: classDiagram, erDiagram, sequenceDiagram); strip fences
- [x] T009 [P] Add unit tests for `src/services/responseParser.ts` in `tests/unit/responseParser.test.ts`: valid response, error response, missing choices, invalid JSON (table-driven preferred)
- [x] T010 [P] Add unit tests for `src/services/mermaidExtractor.ts` in `tests/unit/mermaidExtractor.test.ts`: single/multiple blocks, no blocks, mixed content (table-driven preferred)
- [x] T011 Implement extension activation in `src/extension.ts`: `activate()` registers no-op or placeholder commands; `deactivate()` empty; export activate/deactivate

**Checkpoint**: Foundation ready — config, API client, parser, and Mermaid extractor exist and are unit-tested; extension activates.

---

## Phase 3: User Story 1 - Generate Annotations and Mermaid Diagrams from Active Context (Priority: P1) 🎯 MVP

**Goal**: User opens a code file, runs "analyze and visualize"; extension sends active file (and optional directory context) to API and displays annotations and diagrams in a movable panel.

**Independent Test**: Trigger analysis on an open file; verify API is called with active content and that annotations and at least one diagram appear in the results panel.

- [x] T012 [US1] Implement command "Devnotes: Analyze and visualize" handler in `src/commands/analyze.ts`: get active editor and document; if none, show warning and return; read document.getText() (or selection)
- [x] T013 [US1] Build analysis request in `src/commands/analyze.ts`: build user message string from active content; optionally append directory listing (e.g. current file dir) with bounded size; call config for API URL, key, model
- [x] T014 [US1] Call API from command: use `src/services/apiClient.ts` with system prompt (e.g. produce annotations and Mermaid diagrams) and user message; use `src/config/settings.ts` for URL/key/model; handle network/API errors with user message
- [x] T015 [US1] Parse API response in command: use `src/services/responseParser.ts` and `src/services/mermaidExtractor.ts`; obtain annotations text and diagram blocks; on parse failure or error response, show error message and do not display raw payload as success
- [x] T016 [US1] Create webview panel or WebviewView in `src/webview/resultsProvider.ts`: content provider that accepts annotations string and diagram artifacts array; render annotations and Mermaid blocks (e.g. markdown + code blocks or embedded renderer)
- [x] T017 [US1] Wire command to webview: after parsing response, show results in the webview (movable panel per research.md); ensure panel is movable/dockable by user
- [x] T018 [US1] Register "Devnotes: Analyze and visualize" in `package.json` under `contributes.commands` and add default keybinding under `contributes.keybindings` for Command Palette shortcut
- [x] T019 [US1] Add activation event in `package.json` for the analyze command (e.g. `onCommand:devnotes.analyze`) and ensure extension activates on command
- [x] T020 [US1] Handle edge case: no active file — show "Active file (or selection) required" and do not send any content to API
- [x] T021 [US1] Handle edge case: API error or invalid response — surface clear message to user; never show raw API payload as successful content

**Checkpoint**: User Story 1 is fully functional: analyze from active file, see annotations and diagrams in movable panel; shortcuts work.

---

## Phase 4: User Story 2 - Tag, Highlight, and Include Files for Context (Priority: P2)

**Goal**: User can tag or highlight files/regions; only tagged content (and active file scope) is sent to the API.

**Independent Test**: Tag one or more files or regions, run analysis; verify request payload includes only tagged content (and default active file scope).

- [x] T022 [US2] Define tagged/included set state: in-memory or workspace state in `src/services/taggedContext.ts` — list of `{ path, range? }` and method to add/remove/get content snapshots for workspace
- [x] T023 [US2] Add UI or command to "Include file in context": e.g. command "Devnotes: Add current file (or selection) to context" that adds active file path and optional selection range to tagged set; show feedback
- [x] T024 [US2] Add command "Devnotes: Remove from context" or clear action: remove entry from tagged set; optional: list current tagged files in quick pick
- [x] T025 [US2] When building analysis request in `src/commands/analyze.ts`, if tagged set is non-empty, include only tagged file/region contents (and optional active file) in user message; if empty, use default (active file only or active file + directory summary)
- [x] T026 [US2] Register new commands in `package.json` (add to context, remove from context) and optional keybindings

**Checkpoint**: User Stories 1 and 2 work: user can restrict context to tagged files/regions and run analysis.

---

## Phase 5: User Story 3 - Add Custom Context and Business Logic in .devnotes (Priority: P3)

**Goal**: User can add text or images in a dedicated input; content is saved as `.devnotes` beside the active file and optionally included in analysis.

**Independent Test**: Open custom-context input, add text, save; verify `.devnotes` exists next to active file; reopen and edit; optionally run analysis and see .devnotes included in request.

- [x] T027 [US3] Implement .devnotes read/write in `src/devnotes/fileDevnotes.ts`: resolve path as same directory as a given file path, name `.devnotes`; readFile and writeFile (overwrite on save); handle missing file
- [x] T028 [US3] Add command "Devnotes: Open custom context": open webview or editor for custom context; load content from `.devnotes` for active file's directory if exists; provide save action
- [x] T029 [US3] On save in custom context UI: get active file path, resolve sibling `.devnotes` path, write user content (text; image as path or embedded per design); show confirmation
- [x] T030 [US3] When building analysis request in `src/commands/analyze.ts`, optionally append contents of active file's `.devnotes` to user message (e.g. "Custom context" section) if file exists
- [x] T031 [US3] Register "Devnotes: Open custom context" in `package.json` and optional keybinding

**Checkpoint**: User can add custom context in .devnotes beside active file and use it in analysis.

---

## Phase 6: User Story 4 - Generate Holistic Top-Level .devnotes (Priority: P4)

**Goal**: User runs "Generate holistic .devnotes"; extension aggregates per-file .devnotes and diagram artifacts into one top-level `.devnotes` at workspace root.

**Independent Test**: Create multiple .devnotes and run analysis to produce diagrams; run "generate holistic .devnotes"; verify top-level `.devnotes` exists and references or embeds content.

- [x] T032 [US4] Implement discovery in `src/devnotes/aggregate.ts`: find all `.devnotes` files in workspace and collect paths; find generated Mermaid/diagram artifacts (e.g. from previous analysis output or saved diagram files) in workspace; define scope (e.g. workspace root)
- [x] T033 [US4] Implement aggregation in `src/devnotes/aggregate.ts`: build single document (e.g. Markdown) that references or embeds per-file .devnotes content and diagram definitions; order/sections TBD
- [x] T034 [US4] Implement write of top-level .devnotes: resolve workspace root; write aggregated content to `<workspaceRoot>/.devnotes`; overwrite or merge per spec (confirm if existing user edits per edge case)
- [x] T035 [US4] Add command "Devnotes: Generate holistic .devnotes": run discovery, aggregation, write; if no .devnotes or diagrams found, create minimal file or show message "Nothing to aggregate"
- [x] T036 [US4] Register "Devnotes: Generate holistic .devnotes" in `package.json` and optional keybinding

**Checkpoint**: User can generate a single top-level .devnotes from all per-file .devnotes and diagram artifacts.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and quality.

- [x] T037 [P] Update README or docs at repo root: how to install, configure API key/URL, run from source (F5), and use each command per quickstart.md
- [x] T038 Verify quickstart.md: run `npm install`, `npm run compile`, run extension (F5), and validate steps in `specs/001-devnotes-code-visualization/quickstart.md`
- [x] T039 Security pass: ensure API key is never logged or persisted in plain text; ensure no code is sent to API without explicit user action (command); review config and secrets usage
- [x] T040 Add extension host test(s) in `tests/integration/` for at least one command (e.g. analyze with mock API or no-op) and ensure extension activates and command is registered
- [x] T041 [P] Code cleanup: remove dead code, align naming with data-model and contracts; ensure all tasks reference correct file paths

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3–6)**: All depend on Foundational. US1 can start next; US2/US3/US4 can start after US1 (or in parallel if team splits work).
- **Polish (Phase 7)**: Depends on desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: After Phase 2 — no dependency on other stories. **MVP.**
- **User Story 2 (P2)**: After Phase 2; extends US1 (same analyze command, adds tagged context).
- **User Story 3 (P3)**: After Phase 2; extends US1 (same analyze command, adds .devnotes input).
- **User Story 4 (P4)**: After Phase 2; uses .devnotes (US3) and diagram output (US1); can be implemented after US1 and US3.

### Within Each User Story

- Services/parsers before command handlers; command handlers before package.json registration.
- Edge cases and error handling within the same story phase.

### Parallel Opportunities

- T003, T009, T010, T037, T041 can run in parallel with other tasks in their phase.
- After Phase 2, US2 and US3 can be worked in parallel by different developers; US4 after US1 and US3.

---

## Parallel Example: Phase 2

```text
# Unit tests can run in parallel:
T009: tests/unit/responseParser.test.ts
T010: tests/unit/mermaidExtractor.test.ts

# Config and API client can be done in parallel (different files):
T004 + T005 (config) vs T006 (apiClient)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational  
3. Complete Phase 3: User Story 1  
4. **STOP and VALIDATE**: Run extension (F5), open a file, run "Devnotes: Analyze and visualize", confirm annotations and diagram in panel.  
5. Demo or iterate.

### Incremental Delivery

1. Setup + Foundational → foundation ready.  
2. Add User Story 1 → test independently (MVP).  
3. Add User Story 2 → test tagged context.  
4. Add User Story 3 → test .devnotes save/load and inclusion in analysis.  
5. Add User Story 4 → test holistic .devnotes generation.  
6. Polish → docs, quickstart, security, integration test.

### Parallel Team Strategy

- Phase 1–2 together.  
- Then: Dev A — US1; Dev B — US2; Dev C — US3; after US1 and US3, Dev C or A — US4.  
- Polish together.

---

## Notes

- [P] tasks = different files, no dependencies on other incomplete tasks in same phase.
- [USn] label maps to spec.md user stories for traceability.
- Each user story phase is independently testable per Independent Test in spec.
- Commit after each task or logical group.
- All file paths are relative to repository root (extension root).

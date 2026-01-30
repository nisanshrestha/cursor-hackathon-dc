# Feature Specification: Devnotes Code Visualization

**Feature Branch**: `001-devnotes-code-visualization`  
**Created**: 2025-01-30  
**Status**: Draft  
**Input**: User description: "VS Code Extension to make vibe coded or LLM generated code more digestible through visualization. Read active files and parse directory. User can tag, highlight, include files for context. API called with system prompts to generate annotations and visualizations using Mermaid (Class, Model, Sequence diagrams). Extension parses API response to display diagrams and structured response. User can add text or images for custom context and business logic saved in .devnotes beside active file. .devnotes plus mermaid files generate holistic top-level .devnotes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Annotations and Mermaid Diagrams from Active Context (Priority: P1)

As a developer working with vibe-coded or LLM-generated code, I want the extension to read my active file and optionally the surrounding directory, send that context to an analysis API with system prompts, and receive back annotated explanations and visualizations so that I can understand the code without reading it line by line.

**Why this priority**: Core value of the feature; without this flow, no visualization or annotation is produced.

**Independent Test**: User opens a code file, triggers analysis; the extension sends the active file (and optionally directory context) to the API and displays the returned annotations and diagrams. Can be tested by verifying that triggering analysis on a file results in displayed text and at least one diagram.

**Acceptance Scenarios**:

1. **Given** an active code file is open, **When** the user runs the "analyze and visualize" action, **Then** the extension sends the active file content (and any selected directory context) to the configured API and displays the structured response.
2. **Given** the API returns annotations and Mermaid diagram definitions, **When** the response is received, **Then** the extension parses the response and displays all annotations and diagrams (e.g., in editor panes, webview, or output).
3. **Given** the API returns multiple diagram types (e.g., class, entity model, sequence), **When** the response is parsed, **Then** each diagram is presented in a form the user can view (e.g., rendered or as editable Mermaid source).

---

### User Story 2 - Tag, Highlight, and Include Files for Context (Priority: P2)

As a developer, I want to tag, highlight, or explicitly include specific files or regions as important to the analysis context so that the API receives only the code I care about and produces more relevant annotations and diagrams.

**Why this priority**: Improves relevance of output; depends on P1 (API call and display) being in place.

**Independent Test**: User selects or tags files (or regions); triggers analysis; the payload sent to the API includes only the user-selected context. Can be tested by comparing API payload with and without tagged files.

**Acceptance Scenarios**:

1. **Given** the user has tagged or highlighted one or more files or regions, **When** analysis is triggered, **Then** the extension includes only the tagged/highlighted content (and any configured active file or directory scope) in the request to the API.
2. **Given** no files are tagged, **When** analysis is triggered, **Then** the extension uses a default scope (e.g., active file only or active file plus directory listing) so that analysis still runs.
3. **Given** the user removes a tag or highlight, **When** analysis is triggered again, **Then** the updated set of included content is sent to the API.

---

### User Story 3 - Add Custom Context and Business Logic in .devnotes (Priority: P3)

As a developer, I want to type or paste text or attach images in a dedicated input area to add custom context and business logic, and have that saved next to my active file as a `.devnotes` file so that my notes travel with the code and can be used in future analysis.

**Why this priority**: Enriches context for analysis and creates a persistent artifact; builds on P1 and P2.

**Independent Test**: User opens the custom-context input, adds text or an image, saves; a `.devnotes` file appears next to the active file with that content. Can be tested by saving and reopening the file.

**Acceptance Scenarios**:

1. **Given** the user has the custom-context input open and enters text or adds an image, **When** they save, **Then** the extension writes or updates a `.devnotes` file in the same directory as the active file with that content.
2. **Given** a `.devnotes` file already exists beside the active file, **When** the user opens the custom-context input, **Then** the extension loads and displays the existing content so the user can edit it.
3. **Given** the user has added custom context, **When** analysis is triggered, **Then** the extension MAY include the contents of the active file’s `.devnotes` in the request to the API so annotations and diagrams can reflect that context (scope of inclusion to be defined in design).

---

### User Story 4 - Generate Holistic Top-Level .devnotes (Priority: P4)

As a developer, I want the extension to combine the per-file `.devnotes` and the generated Mermaid diagram files into a single, holistic top-level `.devnotes` (e.g., at repo or workspace root) so that I have one place to see high-level context and all diagrams for the project.

**Why this priority**: Delivers the "holistic" view; depends on .devnotes (P3) and diagram output (P1) existing.

**Independent Test**: User has multiple `.devnotes` and diagram outputs; runs "generate holistic .devnotes"; a top-level `.devnotes` is created or updated that aggregates content and diagram references. Can be tested by running the action and verifying the top-level file content.

**Acceptance Scenarios**:

1. **Given** the user has at least one `.devnotes` file and at least one generated Mermaid/diagram artifact in the workspace, **When** the user runs the "generate holistic .devnotes" action, **Then** the extension produces or updates a top-level `.devnotes` that references or embeds the aggregated context and diagrams.
2. **Given** the top-level `.devnotes` already exists, **When** the user runs the action again, **Then** the extension updates it with the current set of .devnotes and diagram files so the holistic view stays in sync.
3. **Given** no .devnotes or diagrams exist, **When** the user runs the action, **Then** the extension either creates an empty/minimal top-level .devnotes or informs the user that nothing was found to aggregate.

---

### Edge Cases

- What happens when no file is active? The extension MUST inform the user that an active file (or explicit file selection) is required, and MUST NOT send arbitrary workspace content to the API without user action.
- What happens when the API is unavailable or returns an error? The extension MUST surface a clear message to the user and MUST NOT display raw or partial response as if it were valid.
- What happens when the API response contains invalid or unsupported Mermaid? The extension SHOULD display the raw diagram source when rendering fails so the user can correct or copy it, and SHOULD not lose the content.
- What happens when the user has no tagged files and the active file is very large? The extension MAY apply a reasonable size or token limit for the payload sent to the API and inform the user if content was truncated.
- What happens when saving .devnotes would overwrite an existing file? The extension MUST write only to the designated `.devnotes` path (e.g., same directory as active file); overwrite behavior is acceptable for that path. Confirmation MAY be required for top-level .devnotes if it already exists and has user edits.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST read the active editor’s content and MAY read the current directory or workspace structure to build analysis context.
- **FR-002**: The extension MUST allow users to tag, highlight, or explicitly include specific files or regions so that only user-selected content is sent as context when the user so chooses.
- **FR-003**: The extension MUST call a configurable analysis API with system prompts and user-provided context (active file, optional directory, optional tagged content, optional .devnotes) to request annotations and visualizations.
- **FR-004**: The extension MUST support visualizations in Mermaid format, including at least: class diagrams (for objects), entity/model diagrams (for data models), and sequence diagrams (for API or call flows).
- **FR-005**: The extension MUST parse the API response and display all returned annotations and diagrams in a structured way (e.g., in editors, webview, or output channel), not as a single raw blob.
- **FR-006**: The extension MUST provide a way for users to input free-form text or images as custom context and business logic.
- **FR-007**: The extension MUST save that custom context in a `.devnotes` file in the same directory as the active file when the user saves.
- **FR-008**: The extension MUST provide an action to generate or update a holistic top-level `.devnotes` that aggregates per-file `.devnotes` and Mermaid diagram artifacts.
- **FR-009**: The extension MUST NOT send code or workspace content to the API without an explicit user action (e.g., running an analysis command).
- **FR-010**: The extension MUST allow configuration of the API endpoint and credentials; credentials MUST be stored in a secure manner (e.g., VS Code secrets or configuration).

### Key Entities

- **Active file context**: The content and path of the currently focused editor; the primary input for analysis when no tags are set.
- **Tagged / included set**: The set of files or regions the user has marked as important for context; used to build the payload for the API.
- **API request**: The payload sent to the analysis API (e.g., system prompt, active file content, directory summary, tagged content, optional .devnotes content).
- **API response**: The structured response from the API containing annotations (text) and Mermaid diagram definitions (one or more diagrams of various types).
- **.devnotes (per-file)**: A file stored beside the active file containing the user’s custom text and/or image references for context and business logic.
- **.devnotes (top-level)**: A file at workspace or repo root that aggregates per-file .devnotes and diagram references into a single holistic view.
- **Mermaid diagram artifact**: A diagram definition (e.g., class, entity/model, sequence) produced by the API and displayed or saved by the extension.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can trigger analysis from the active file and see annotations and at least one diagram within a reasonable time (e.g., under 30 seconds for typical file sizes) under normal API conditions.
- **SC-002**: Users can include only the files they tag in the analysis context and observe that the API response reflects that subset (e.g., diagrams mention only the included modules).
- **SC-003**: Users can add custom context (text or image) and have it persisted in a `.devnotes` file next to the active file, and optionally see that context reflected in a subsequent analysis.
- **SC-004**: Users can generate a top-level `.devnotes` that references or embeds all per-file .devnotes and diagram artifacts in the workspace so that one document provides a holistic view.
- **SC-005**: Users report that vibe-coded or LLM-generated code is easier to understand (e.g., via survey or feedback) when using annotations and diagrams produced by the extension.

## Assumptions

- The analysis API is external and configurable; the extension does not mandate a specific provider.
- Mermaid is the chosen diagram format for visualizations; the API is expected to return valid Mermaid syntax for the supported diagram types.
- Per-file `.devnotes` are stored in the same directory as the active file; the top-level `.devnotes` is at a defined root (e.g., workspace root or repository root).
- Users have network access to the analysis API when using the visualization feature.
- Image handling in .devnotes may be implemented as references (paths or embedded data) depending on design; the spec does not prescribe storage format.

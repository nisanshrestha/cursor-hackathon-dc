# Contract: Analysis API (External)

**Feature**: 001-devnotes-code-visualization  
**Date**: 2025-01-30  
**Purpose**: Define the request and response shapes between the extension and the configurable analysis API (e.g. OpenAI-compatible chat completions). The API is external; the extension MUST support a configurable endpoint and credentials.

---

## 1. Transport and Authentication

- **Protocol**: HTTPS POST to a configurable base URL (e.g. `https://api.openai.com/v1/chat/completions` or equivalent).
- **Authentication**: API key sent in request header (e.g. `Authorization: Bearer <key>`). Key stored via VS Code Secrets API or configuration; never logged or persisted in plain text.
- **Content-Type**: `application/json`.

---

## 2. Request Shape

The extension sends a **single** request per user-triggered analysis. Body structure is compatible with OpenAI chat completions so that the same contract works with OpenAI, Azure OpenAI, and other compatible providers.

### 2.1 Body (JSON)

| Field        | Type   | Required | Description |
|-------------|--------|----------|-------------|
| `model`     | string | Yes      | Model identifier (e.g. `gpt-4o-mini`). Configurable. |
| `messages`  | array  | Yes      | List of message objects (see below). |
| `max_tokens`| number | No       | Maximum tokens in the response (e.g. 4096). Extension may set a default. |
| `temperature` | number | No     | Sampling temperature (e.g. 0.2). Extension may set a default. |

### 2.2 Message Object

| Field    | Type   | Required | Description |
|---------|--------|----------|-------------|
| `role`  | string | Yes      | `"system"` \| `"user"` \| `"assistant"` |
| `content` | string | Yes    | Message content (plain text). |

### 2.3 Message Sequence

- **First message**: `role: "system"`. Content = system prompt instructing the API to produce annotations and Mermaid diagrams (class, entity/model, sequence). Prompt is provided by the extension; may be configurable later.
- **Second message**: `role: "user"`. Content = concatenated context:
  - Active file content (or selected region).
  - Optional: directory summary (e.g. file names or tree).
  - Optional: labeled tagged/included file contents.
  - Optional: contents of the active file’s `.devnotes`.

Order and formatting of the user message (e.g. sections with headers) are implementation-defined; total length MUST respect API/provider limits (extension may truncate or warn).

---

## 3. Response Shape

The extension expects a JSON response compatible with OpenAI chat completions.

### 3.1 Success Response (HTTP 2xx)

| Field                | Type   | Description |
|----------------------|--------|-------------|
| `choices`            | array  | At least one item. |
| `choices[0].message` | object | Assistant message. |
| `choices[0].message.content` | string | Full response text. |

**Content semantics**: The `content` string MUST contain:
- Plain text annotations (summaries, explanations, notes).
- Zero or more Mermaid diagram definitions. Each diagram MAY be wrapped in a fenced code block with language `mermaid` (e.g. ` ```mermaid ... ``` `). The extension will parse and extract these for display and for aggregation into the top-level `.devnotes`.

Diagram types supported: **classDiagram**, **erDiagram** (entity/model), **sequenceDiagram**. Others MAY be supported if the API returns them and the parser recognizes them.

### 3.2 Error Response (HTTP 4xx / 5xx)

| Field     | Type   | Description |
|----------|--------|-------------|
| `error`  | object | Optional. |
| `error.message` | string | Human- or machine-readable error message. |

The extension MUST NOT treat an error response as successful content. It MUST surface a clear message to the user and MUST NOT display raw or partial response as if it were valid (per spec edge case).

---

## 4. Parsing and Digestible Output

- The extension parses `choices[0].message.content` to separate:
  - **Annotations**: Text outside Mermaid code blocks (or all text if no blocks). Displayed as readable content in the UI.
  - **Diagrams**: Each ```mermaid ... ``` block (or equivalent) is extracted as a **Mermaid diagram artifact** and displayed (e.g. in webview) and/or saved for holistic `.devnotes`.
- If the response contains invalid or unsupported Mermaid, the extension SHOULD display the raw diagram source so the user can correct or copy it, and MUST NOT lose the content.

---

## 5. Out of Scope

- Streaming responses: not required for this contract; can be added later if the extension supports streaming.
- Multiple requests (e.g. separate request per diagram type): not required; a single request/response is sufficient for the current spec.

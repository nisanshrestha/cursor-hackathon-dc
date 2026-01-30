<!--
  Sync Impact Report
  Version change: (template/placeholder) → 1.0.0
  Modified principles: N/A (initial fill from template)
  Added sections: None (all sections present in template were filled)
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ (Constitution Check references principles; no content change needed)
    - .specify/templates/spec-template.md ✅ (scope/requirements align; no mandatory section change)
    - .specify/templates/tasks-template.md ✅ (task categorization aligns with principles; no change needed)
  Follow-up TODOs: None. All placeholders replaced.
-->

# Code Analyzer Extension Constitution

## Core Principles

### Extension-First

The product is a VS Code extension. All functionality MUST be exposed through the extension host: commands, configuration, and editor integration. Core logic (API client, response parsing, diagram generation) MUST be modular and testable in isolation so that the extension layer remains thin and the "analyzer" behavior can be validated without launching VS Code.

Rationale: Keeps the codebase maintainable and allows tests to run against the analyzer logic independently of the IDE.

### Active-File-to-API Contract

The extension MUST send only the active editor's content (or user-selected region) to the analysis API. The API response MUST be treated as structured output comprising one or more of: plain text (summaries, explanations, notes) and Mermaid diagram code. The extension MUST NOT send repository content, file paths, or workspace metadata unless explicitly specified in a future amendment.

Rationale: Clear contract between editor input and API output keeps the feature predictable and limits data sent to the API.

### Digestible Output

All outputs produced from the API response MUST be presented in forms that make code and repository understanding easier: readable text (in editor, webview, or output channel) and valid Mermaid diagrams (opened as documents or rendered where supported). The extension MUST NOT display raw API payloads without parsing them into these digestible formats.

Rationale: Aligns the product with the goal of making code and repo more digestible rather than exposing low-level API responses.

### Test-First

TDD is mandatory for analyzer logic: tests written, user or spec approval, tests fail, then implement (Red-Green-Refactor). Table-driven tests are preferred where multiple inputs or response shapes are validated. Extension registration and command wiring MAY be covered by integration tests that run in the extension host.

Rationale: Ensures API contract and parsing behavior remain correct as the extension evolves.

### Security and Privacy

API keys and endpoint configuration MUST be stored using VS Code's configuration or secrets APIs. The extension MUST NOT log, persist, or transmit active file content beyond the single request to the configured analysis API. Users MUST be able to trigger analysis explicitly (e.g., via command); no automatic sending of code without user action.

Rationale: Protects user code and credentials and keeps the extension compliant with typical security expectations.

## Additional Constraints

- **Technology**: VS Code Extension API (Node.js in extension host), TypeScript for implementation. LLM or analysis API is external; extension MUST support configurable endpoint and API key.
- **Compatibility**: Target VS Code engine version as declared in `package.json`; avoid reliance on Node-only APIs that are not available in the extension host when possible.
- **Dependencies**: Prefer built-in Node modules for HTTP where feasible; add runtime dependencies only when necessary and document them.

## Development Workflow

- Features and fixes MUST be specified (e.g., via spec or checklist) before implementation. Constitution principles MUST be checked in planning (e.g., plan.md Constitution Check).
- Code review MUST verify that active-file-to-API contract and digestible-output behavior are preserved, and that no new automatic code sending or key leakage is introduced.
- Releases MUST follow semantic versioning; constitution version is independent and documented in this file.

## Governance

This constitution governs the Code Analyzer VS Code extension. All implementation and design decisions MUST align with the Core Principles and Additional Constraints. Amendments require: (1) proposal and rationale, (2) update to this file with version and date, (3) Sync Impact Report comment at the top, and (4) propagation to any dependent templates or docs. PRs and reviews MUST verify compliance with the constitution; deviations MUST be justified and documented in the plan or spec.

**Version**: 1.0.0 | **Ratified**: 2025-01-30 | **Last Amended**: 2025-01-30

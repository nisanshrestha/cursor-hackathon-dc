import * as vscode from 'vscode';
import { getConfigSync } from '../config/settings';
import { postJson, isLocalhostUrl } from '../services/apiClient';
import { parseAnalysisResponse, parseStructuredResponse } from '../services/responseParser';
import { getTaggedEntries, getTaggedContentSnapshots } from '../services/taggedContext';
import { readDevnotesForFile } from '../devnotes/fileDevnotes';
import { getResultsWebviewProvider } from '../webview/resultsProvider';
import { getCustomContextProvider } from '../webview/customContextProvider';

/** Hardcoded mock API response for demo (structured mermaid_diagram + code_insights). */
const MOCK_ANALYSIS_RESPONSE = {
    mermaid_diagram:
        'sequenceDiagram\\n    participant C as Client\\n    participant R as FastAPI Router\\n    participant S as DevelopersService\\n    participant D as PynamoDB\\n\\n    Note over C,R: GET /developers/{name}\\n    C->>R: GET /developers/{name}\\n    R->>S: retrieve_developer(name)\\n    S->>D: Query developer\\n    D-->>S: Return result\\n    S-->>R: Return developer\\n    R-->>C: 200 OK with developer\\n\\n    Note over C,R: POST /developers\\n    C->>R: POST /developers\\n    R->>S: create_developer(developer)\\n    alt success\\n        S->>D: Create developer\\n        D-->>S: Confirm creation\\n        S-->>R: Return developer\\n        R-->>C: 201 Created\\n    else developer already exists\\n        S-->>R: Raise ValueError\\n        R-->>C: 409 Conflict\\n    end\\n\\n    Note over C,R: PATCH /developers\\n    C->>R: PATCH /developers\\n    R->>S: update_developer(developer)\\n    alt success\\n        S->>D: Update developer\\n        D-->>S: Confirm update\\n        S-->>R: Return developer\\n        R-->>C: 200 OK\\n    else developer not found\\n        S-->>R: Raise DoesNotExist\\n        R-->>C: 404 Not Found\\n    end',
    code_insights: [
        { mermaidStartLine: 8, codeStartLine: 9, codeEndLine: 11 },
        { mermaidStartLine: 17, codeStartLine: 14, codeEndLine: 20 },
        { mermaidStartLine: 18, codeStartLine: 16, codeEndLine: 18 },
        { mermaidStartLine: 25, codeStartLine: 19, codeEndLine: 20 },
        { mermaidStartLine: 31, codeStartLine: 23, codeEndLine: 29 },
        { mermaidStartLine: 34, codeStartLine: 25, codeEndLine: 27 },
        { mermaidStartLine: 39, codeStartLine: 28, codeEndLine: 29 },
    ],
};

const SYSTEM_PROMPT = `You are a code analyst. Given source code, produce annotations (summaries, explanations) and Mermaid diagrams.
Output plain text annotations, then one or more Mermaid diagrams in fenced code blocks with language "mermaid".
Supported diagram types: classDiagram (for objects), erDiagram (entity/model), sequenceDiagram (for API/call flows).
Output ONLY the annotations and \`\`\`mermaid ... \`\`\` blocks. No other markdown.`;

function getWorkspaceRoot(): string | undefined {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders?.length) return undefined;
    return folders[0].uri.fsPath;
}

async function runAnalyze(context: vscode.ExtensionContext, useMock: boolean): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    const taggedEntries = getTaggedEntries();
    const root = getWorkspaceRoot();

    let userContent: string;
    if (taggedEntries.length > 0 && root) {
        const snapshots = await getTaggedContentSnapshots(root);
        const parts = snapshots.map((s) => `## ${s.label}\n\n${s.content}`);
        userContent = parts.join('\n\n---\n\n');
    } else {
        if (!editor) {
            vscode.window.showWarningMessage('Active file (or selection) required.');
            return;
        }
        const document = editor.document;
        const selection = editor.selection;
        userContent = selection.isEmpty ? document.getText() : document.getText(selection);
        if (!userContent.trim()) {
            vscode.window.showWarningMessage('Active file (or selection) required.');
            return;
        }
        const devnotesContent = await readDevnotesForFile(document.uri.fsPath);
        if (devnotesContent.trim()) {
            userContent = userContent + '\n\n---\n\n## Custom context (.devnotes)\n\n' + devnotesContent;
        }
    }

    const config = getConfigSync();
    const sourceFilePath = vscode.window.activeTextEditor?.document.uri.fsPath ?? '';

    const isLocalhost = isLocalhostUrl(config.apiUrl);
    let apiKey = config.apiKey;
    if (!useMock && !config.useMockResponse && !isLocalhost && !apiKey) {
        const key = await vscode.window.showInputBox({
            prompt: 'Enter Devnotes API key (or set devnotes.analysisApiKey in settings)',
            placeHolder: 'sk-...',
            ignoreFocusOut: true,
        });
        if (key === undefined) return;
        apiKey = key.trim();
    }

    await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Devnotes: Analyzing...', cancellable: false },
        async () => {
            try {
                let parsed;
                if (useMock || config.useMockResponse) {
                    const mockBody = JSON.stringify(MOCK_ANALYSIS_RESPONSE);
                    parsed = parseStructuredResponse(mockBody) ?? {
                        annotations: '',
                        diagramBlocks: [],
                        code_insights: [],
                    };
                    if (parsed.code_insights) {
                        (parsed as { sourceFilePath?: string }).sourceFilePath = sourceFilePath;
                    }
                } else {
                        const body = {
                            model: config.model,
                            messages: [
                                { role: 'system' as const, content: SYSTEM_PROMPT },
                                { role: 'user' as const, content: userContent },
                            ],
                            max_tokens: 4096,
                            temperature: 0.2,
                        };
                        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
                        const result = await postJson(config.apiUrl, body, headers);
                        parsed = parseAnalysisResponse(result.body, result.statusCode);
                        if (parsed.error) {
                            vscode.window.showErrorMessage(`Devnotes: ${parsed.error}`);
                            return;
                        }
                        if (parsed.code_insights && sourceFilePath) {
                            (parsed as { sourceFilePath?: string }).sourceFilePath = sourceFilePath;
                        }
                    }
                    const resultsProvider = getResultsWebviewProvider(context);
                    resultsProvider.show(
                        parsed.annotations,
                        parsed.diagramBlocks,
                        parsed.code_insights,
                        (parsed as { sourceFilePath?: string }).sourceFilePath
                    );
                    const customProvider = getCustomContextProvider();
                    if (customProvider && parsed.diagramBlocks.length > 0) {
                        customProvider.setLastDiagram({
                            mermaid_diagram: parsed.diagramBlocks[0],
                            code_insights: parsed.code_insights ?? [],
                            sourceFilePath,
                        });
                    }
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    vscode.window.showErrorMessage(`Devnotes: ${msg}`);
                }
            }
        );
}

export function registerAnalyzeCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('devnotes.analyze', () => runAnalyze(context, false));
}

export function registerAnalyzeWithMockCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('devnotes.analyzeWithMock', () => runAnalyze(context, true));
}

import * as vscode from 'vscode';
import type { CodeInsight } from '../services/responseParser';

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildHtml(
    annotations: string,
    diagramBlocks: string[],
    codeInsights: CodeInsight[] = [],
    sourceFilePath: string = ''
): string {
    const annotationsHtml = escapeHtml(annotations).replace(/\n/g, '<br/>');
    const diagramsHtml = diagramBlocks
        .map(
            (block) =>
                `<div class="mermaid-block"><pre class="mermaid">${escapeHtml(block)}</pre></div>`
        )
        .join('');
    const insightsJson = JSON.stringify(
        codeInsights.map((i) => ({ mermaidStartLine: i.mermaidStartLine, codeStartLine: i.codeStartLine, codeEndLine: i.codeEndLine }))
    ).replace(/</g, '\\u003c');
    const filePathJson = JSON.stringify(sourceFilePath);
    const insightsListHtml =
        codeInsights.length > 0 && sourceFilePath
            ? `
  <div class="section-title">Code links (diagram line → code lines)</div>
  <ul class="code-insights-list" id="code-insights-list"></ul>
  <script>
    (function() {
      var insights = ${insightsJson};
      var filePath = ${filePathJson};
      var list = document.getElementById('code-insights-list');
      if (list && insights.length) {
        insights.forEach(function(ins) {
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.className = 'code-insight-link';
          a.href = '#';
          a.textContent = 'Diagram line ' + ins.mermaidStartLine + ' \u2192 Code lines ' + ins.codeStartLine + '-' + ins.codeEndLine;
          a.onclick = function(e) { e.preventDefault(); window.vscodePostMessage({ type: 'openCodeAt', filePath: filePath, codeStartLine: ins.codeStartLine, codeEndLine: ins.codeEndLine }); };
          li.appendChild(a);
          list.appendChild(li);
        });
      }
    })();
  </script>`
            : '';
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: var(--vscode-font-family); padding: 1em; }
    .annotations { white-space: pre-wrap; margin-bottom: 1em; }
    .mermaid-block { margin: 1em 0; }
    pre.mermaid { background: var(--vscode-textBlockQuote-background); padding: 0.5em; overflow: auto; }
    .empty { color: var(--vscode-descriptionForeground); font-size: 13px; }
    .section-title { font-size: 11px; font-weight: 600; color: var(--vscode-descriptionForeground); margin: 12px 0 6px; }
    .code-insights-list { list-style: none; padding: 0; margin: 0; }
    .code-insights-list li { margin: 4px 0; }
    .code-insight-link { color: var(--vscode-textLink-foreground); cursor: pointer; text-decoration: underline; font-size: 12px; }
    .code-insight-link:hover { color: var(--vscode-textLink-activeForeground); }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
</head>
<body>
  <script>
    var vscode = acquireVsCodeApi();
    window.vscodePostMessage = function(msg) { vscode.postMessage(msg); };
  </script>
  <div class="annotations">${annotationsHtml || '(No annotations)'}</div>
  ${diagramsHtml || ''}
  ${insightsListHtml}
  <script>
    mermaid.initialize({ startOnLoad: true });
  </script>
</body>
</html>`;
}

export class ResultsWebviewViewProvider implements vscode.WebviewViewProvider {
    private _view: vscode.WebviewView | undefined;
    private _lastAnnotations = '';
    private _lastDiagramBlocks: string[] = [];
    private _lastCodeInsights: CodeInsight[] = [];
    private _lastSourceFilePath = '';

    constructor(_context: vscode.ExtensionContext) {
        void _context;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = buildHtml(
            this._lastAnnotations,
            this._lastDiagramBlocks,
            this._lastCodeInsights,
            this._lastSourceFilePath
        );
        webviewView.webview.onDidReceiveMessage((msg) => this._onMessage(msg));
    }

    private _onMessage(msg: { type: string; filePath?: string; codeStartLine?: number; codeEndLine?: number }): void {
        if (
            msg.type === 'openCodeAt' &&
            msg.filePath != null &&
            msg.codeStartLine != null &&
            msg.codeEndLine != null
        ) {
            const uri = vscode.Uri.file(msg.filePath);
            const startLine = Math.max(0, msg.codeStartLine - 1);
            const endLine = Math.max(0, msg.codeEndLine - 1);
            void vscode.window.showTextDocument(uri, {
                selection: new vscode.Range(startLine, 0, endLine, 0),
            });
        }
    }

    public show(
        annotations: string,
        diagramBlocks: string[],
        codeInsights?: CodeInsight[],
        sourceFilePath?: string
    ): void {
        this._lastAnnotations = annotations;
        this._lastDiagramBlocks = diagramBlocks;
        this._lastCodeInsights = codeInsights ?? [];
        this._lastSourceFilePath = sourceFilePath ?? '';
        if (this._view) {
            this._view.webview.html = buildHtml(
                annotations,
                diagramBlocks,
                this._lastCodeInsights,
                this._lastSourceFilePath
            );
            this._view.show?.(true);
        }
    }
}

let providerInstance: ResultsWebviewViewProvider | null = null;

export function getResultsWebviewProvider(context: vscode.ExtensionContext): ResultsWebviewViewProvider {
    if (!providerInstance) {
        providerInstance = new ResultsWebviewViewProvider(context);
    }
    return providerInstance;
}

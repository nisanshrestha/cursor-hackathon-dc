import * as vscode from 'vscode';
import { readDevnotesForFile, writeDevnotesForFile } from '../devnotes/fileDevnotes';
import {
    getTaggedEntries,
    removeTaggedEntry,
    clearTaggedEntries,
    persistTaggedEntries,
    TaggedEntry,
} from '../services/taggedContext';
import type { CodeInsight } from '../services/responseParser';

const VIEW_TYPE = 'devnotes.customContext';

export interface LastDiagramData {
    mermaid_diagram: string;
    code_insights: CodeInsight[];
    sourceFilePath: string;
}

function taggedEntriesForWebview(entries: TaggedEntry[]): { path: string; label: string; range?: TaggedEntry['range'] }[] {
    return entries.map((e) => ({
        path: e.path,
        label: e.label ?? e.path,
        range: e.range,
    }));
}

function getHtml(
    initialContent: string,
    taggedEntries: { path: string; label: string; range?: TaggedEntry['range'] }[],
    emptyMessage?: string,
    diagramData?: LastDiagramData
): string {
    const contentJson = JSON.stringify(initialContent);
    const entriesJson = JSON.stringify(taggedEntries).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
    const emptyHtml = emptyMessage ? `<p class="empty-msg">${emptyMessage.replace(/</g, '&lt;')}</p>` : '';
    const diagramJson = diagramData
        ? JSON.stringify({
              mermaid: diagramData.mermaid_diagram,
              insights: diagramData.code_insights,
              filePath: diagramData.sourceFilePath,
          }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
        : 'null';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --vscode-font-family: var(--vscode-font-family, system-ui, sans-serif);
      --vscode-font-size: var(--vscode-font-size, 13px);
      --bg: var(--vscode-editor-background, #1e1e1e);
      --fg: var(--vscode-editor-foreground, #d4d4d4);
      --border: var(--vscode-panel-border, #3c3c3c);
      --input-bg: var(--vscode-input-background, #3c3c3c);
      --input-fg: var(--vscode-input-foreground, #ccc);
      --input-border: var(--vscode-input-border, transparent);
      --btn-bg: var(--vscode-button-background, #0e639c);
      --btn-fg: var(--vscode-button-foreground, #fff);
      --btn-hover: var(--vscode-button-hoverBackground, #1177bb);
      --chip-bg: var(--vscode-badge-background, #4d4d4d);
      --chip-fg: var(--vscode-badge-foreground, #fff);
      --section-fg: var(--vscode-descriptionForeground, #989898);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 12px 16px;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--fg);
      background: var(--bg);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .empty-msg { color: var(--section-fg); font-size: 12px; margin: 8px 0; }
    .section { margin-bottom: 16px; }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--section-fg);
      margin-bottom: 8px;
    }
    .context-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 6px;
      background: var(--chip-bg);
      color: var(--chip-fg);
      font-size: 12px;
      max-width: 280px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .chip span { overflow: hidden; text-overflow: ellipsis; }
    .chip-btn {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      border: none;
      border-radius: 4px;
      background: rgba(255,255,255,0.2);
      color: inherit;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .chip-btn:hover { background: rgba(255,255,255,0.35); }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn {
      padding: 6px 12px;
      border-radius: 4px;
      border: none;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
    }
    .btn-primary { background: var(--btn-bg); color: var(--btn-fg); }
    .btn-primary:hover { background: var(--btn-hover); }
    .btn-secondary {
      background: var(--input-bg);
      color: var(--input-fg);
      border: 1px solid var(--input-border);
    }
    .btn-secondary:hover { background: var(--vscode-list-hoverBackground, #2a2d2e); }
    .custom-preview {
      width: 100%;
      min-height: 120px;
      padding: 12px;
      font-family: var(--vscode-editor-font-family, var(--vscode-font-family));
      font-size: var(--vscode-editor-font-size, var(--vscode-font-size));
      color: var(--input-fg);
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      border-radius: 6px;
      cursor: pointer;
      overflow: auto;
      line-height: 1.5;
    }
    .custom-preview:hover { border-color: var(--vscode-focusBorder, #007acc); }
    .custom-preview .edit-hint {
      font-size: 11px;
      color: var(--section-fg);
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--border);
    }
    .custom-preview h1, .custom-preview h2, .custom-preview h3 { margin: 0.6em 0 0.3em; }
    .custom-preview pre { background: var(--chip-bg); padding: 8px; border-radius: 4px; overflow: auto; }
    .custom-preview code { font-family: var(--vscode-editor-font-family); }
    .custom-preview ul, .custom-preview ol { margin: 0.4em 0; padding-left: 1.5em; }
    .custom-preview p { margin: 0.4em 0; }
    .custom-input {
      width: 100%;
      min-height: 120px;
      padding: 12px;
      font-family: var(--vscode-editor-font-family, var(--vscode-font-family));
      font-size: var(--vscode-editor-font-size, var(--vscode-font-size));
      color: var(--input-fg);
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      border-radius: 6px;
      resize: vertical;
      outline: none;
      display: none;
    }
    .custom-input.visible { display: block; }
    .custom-preview.hidden { display: none; }
    .custom-input:focus { border-color: var(--vscode-focusBorder, #007acc); }
    .custom-input::placeholder { color: var(--section-fg); }
    #context-list { display: contents; }
    .custom-actions { margin-top: 12px; display: flex; gap: 8px; align-items: center; }
    .save-in-edit { display: none; }
    .edit-mode .save-in-edit { display: inline-block; }
    .edit-mode .custom-preview { display: none; }
    .edit-mode .custom-input { display: block; }
    .diagram-section { margin-top: 16px; border-top: 1px solid var(--border); padding-top: 12px; }
    .diagram-container { background: var(--input-bg); border-radius: 6px; padding: 12px; margin: 8px 0; overflow: auto; }
    .diagram-container pre.mermaid { margin: 0; }
    .code-insights-list { list-style: none; padding: 0; margin: 8px 0 0; }
    .code-insights-list li { margin: 4px 0; }
    .code-insight-link {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      background: var(--chip-bg);
      color: var(--chip-fg);
      font-size: 11px;
      cursor: pointer;
      text-decoration: none;
    }
    .code-insight-link:hover { background: var(--btn-hover); }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
</head>
<body>
  <div id="empty-message">${emptyHtml}</div>
  <div class="section">
    <div class="section-title">Context</div>
    <div class="context-bar">
      <div id="context-list"></div>
      <div class="actions">
        <button class="btn btn-secondary" id="add-context">Add current file</button>
        <button class="btn btn-secondary" id="clear-context">Clear all</button>
      </div>
    </div>
  </div>
  <div class="section custom-section" style="flex:1;">
    <div class="section-title">Custom instructions (.devnotes)</div>
    <div class="custom-preview" id="custom-preview" title="Double-click to edit">
      <div id="preview-content"></div>
      <div class="edit-hint">Double-click to edit</div>
    </div>
    <textarea class="custom-input" id="content" placeholder="Add custom context, instructions, or notes for this folder..."></textarea>
    <div class="custom-actions">
      <button class="btn btn-primary save-in-edit" id="save">Save</button>
    </div>
  </div>
  <div class="section diagram-section">
    <div class="section-title">Diagram</div>
    <div class="diagram-container" id="diagram-container"></div>
    <ul class="code-insights-list" id="code-insights-list"></ul>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    const contentEl = document.getElementById('content');
    const previewEl = document.getElementById('custom-preview');
    const previewContent = document.getElementById('preview-content');
    const contextList = document.getElementById('context-list');
    const addBtn = document.getElementById('add-context');
    const clearBtn = document.getElementById('clear-context');
    const saveBtn = document.getElementById('save');
    const emptyEl = document.getElementById('empty-message');
    const sectionEl = document.querySelector('.custom-section');

    let entries = [];
    let rawContent = '';
    let isEditMode = false;

    function updatePreview() {
      if (typeof marked !== 'undefined') {
        var html = rawContent ? (marked.parse ? marked.parse(rawContent) : marked(rawContent)) : '';
        previewContent.innerHTML = html || '<span class="empty-msg">No custom instructions. Double-click to add.</span>';
      } else {
        previewContent.textContent = rawContent || 'No custom instructions. Double-click to add.';
      }
    }
    function enterEditMode() {
      isEditMode = true;
      contentEl.value = rawContent;
      sectionEl.classList.add('edit-mode');
      contentEl.focus();
    }
    function exitEditMode() {
      isEditMode = false;
      rawContent = contentEl.value;
      updatePreview();
      sectionEl.classList.remove('edit-mode');
    }
    function renderChips() {
      contextList.innerHTML = '';
      entries.forEach((e) => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        const span = document.createElement('span');
        span.textContent = e.label || e.path;
        span.setAttribute('title', e.path || '');
        const btn = document.createElement('button');
        btn.className = 'chip-btn';
        btn.setAttribute('aria-label', 'Remove');
        btn.textContent = '×';
        btn.onclick = () => vscode.postMessage({ type: 'remove', path: e.path, range: e.range });
        chip.appendChild(span);
        chip.appendChild(btn);
        contextList.appendChild(chip);
      });
    }
    function setState(data) {
      if (data.content != null) {
        rawContent = data.content;
        contentEl.value = data.content;
        if (!isEditMode) updatePreview();
      }
      if (Array.isArray(data.entries)) { entries = data.entries; renderChips(); }
      if (data.emptyMessage != null) emptyEl.innerHTML = data.emptyMessage ? '<p class="empty-msg">' + data.emptyMessage.replace(/</g, '&lt;') + '</p>' : '';
      if (data.diagramData) updateDiagram(data.diagramData);
    }
    function updateDiagram(d) {
      var container = document.getElementById('diagram-container');
      var listEl = document.getElementById('code-insights-list');
      if (!container || !listEl) return;
      if (!d.mermaid) { container.innerHTML = ''; listEl.innerHTML = ''; return; }
      container.innerHTML = '<pre class="mermaid">' + (d.mermaid || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
      listEl.innerHTML = '';
      (d.insights || []).forEach(function(ins) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.className = 'code-insight-link';
        a.textContent = 'Diagram line ' + ins.mermaidStartLine + ' \u2192 Code lines ' + ins.codeStartLine + '-' + ins.codeEndLine;
        a.onclick = function() { vscode.postMessage({ type: 'openCodeAt', filePath: d.filePath, codeStartLine: ins.codeStartLine, codeEndLine: ins.codeEndLine }); };
        li.appendChild(a);
        listEl.appendChild(li);
      });
      if (typeof mermaid !== 'undefined') mermaid.run({ nodes: container.querySelectorAll('.mermaid') });
    }
    previewEl.ondblclick = function(e) { e.preventDefault(); enterEditMode(); };
    addBtn.onclick = () => vscode.postMessage({ type: 'addToContext' });
    clearBtn.onclick = () => vscode.postMessage({ type: 'clearContext' });
    saveBtn.onclick = () => {
      rawContent = contentEl.value;
      vscode.postMessage({ type: 'save', content: rawContent });
      exitEditMode();
    };
    window.addEventListener('message', e => {
      if (e.data.type === 'setState') setState(e.data);
    });
    rawContent = ${contentJson};
    contentEl.value = rawContent;
    updatePreview();
    entries = ${entriesJson};
    renderChips();
    if (${diagramJson}) updateDiagram(${diagramJson});
  </script>
</body>
</html>`;
}

export class CustomContextViewProvider implements vscode.WebviewViewProvider {
    private _view: vscode.WebviewView | undefined;
    private _extensionContext: vscode.ExtensionContext | undefined;
    private _currentFilePath: string | undefined;
    private _lastDiagram: LastDiagramData | undefined;

    constructor(context: vscode.ExtensionContext) {
        this._extensionContext = context;
    }

    public setLastDiagram(data: LastDiagramData): void {
        this._lastDiagram = data;
        this._view?.webview.postMessage({
            type: 'setState',
            diagramData: {
                mermaid: data.mermaid_diagram,
                insights: data.code_insights,
                filePath: data.sourceFilePath,
            },
        });
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void | Thenable<void> {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };
        this._updateHtml();
        webviewView.webview.onDidReceiveMessage((msg) => this._onMessage(msg));
    }

    private _updateHtml(): void {
        if (!this._view) return;
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            this._view.webview.html = getHtml('', [], 'Open a file to associate .devnotes with its directory.', this._lastDiagram);
            return;
        }
        const filePath = editor.document.uri.fsPath;
        this._currentFilePath = filePath;
        void Promise.all([readDevnotesForFile(filePath), Promise.resolve(getTaggedEntries())]).then(([content, entries]) => {
            if (this._view) {
                this._view.webview.html = getHtml(content, taggedEntriesForWebview(entries), undefined, this._lastDiagram);
            }
        });
    }

    private _onMessage(msg: {
        type: string;
        content?: string;
        path?: string;
        range?: TaggedEntry['range'];
        filePath?: string;
        codeStartLine?: number;
        codeEndLine?: number;
    }): void {
        if (msg.type === 'openCodeAt' && msg.filePath != null && msg.codeStartLine != null && msg.codeEndLine != null) {
            const uri = vscode.Uri.file(msg.filePath);
            const startLine = Math.max(0, msg.codeStartLine - 1);
            const endLine = Math.max(0, msg.codeEndLine - 1);
            void vscode.window.showTextDocument(uri, { selection: new vscode.Range(startLine, 0, endLine, 0) });
            return;
        }
        if (!this._extensionContext) return;
        if (msg.type === 'save' && typeof msg.content === 'string') {
            if (!this._currentFilePath) return;
            writeDevnotesForFile(this._currentFilePath, msg.content)
                .then(() => vscode.window.showInformationMessage('Saved to .devnotes'))
                .catch((err) =>
                    vscode.window.showErrorMessage('Failed to save: ' + (err instanceof Error ? err.message : String(err)))
                );
            return;
        }
        if (msg.type === 'addToContext') {
            void vscode.commands.executeCommand('devnotes.addToContext').then(() => {
                this._view?.webview.postMessage({ type: 'setState', entries: taggedEntriesForWebview(getTaggedEntries()) });
            });
            return;
        }
        if (msg.type === 'remove' && msg.path) {
            removeTaggedEntry(msg.path, msg.range);
            persistTaggedEntries(this._extensionContext.globalState);
            this._view?.webview.postMessage({ type: 'setState', entries: taggedEntriesForWebview(getTaggedEntries()) });
            return;
        }
        if (msg.type === 'clearContext') {
            clearTaggedEntries();
            persistTaggedEntries(this._extensionContext.globalState);
            this._view?.webview.postMessage({ type: 'setState', entries: [] });
        }
    }

    public async focusAndRefresh(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Open a file first to associate .devnotes with its directory.');
            return;
        }
        const filePath = editor.document.uri.fsPath;
        this._currentFilePath = filePath;
        const [content, entries] = await Promise.all([
            readDevnotesForFile(filePath),
            Promise.resolve(getTaggedEntries()),
        ]);
        this._view?.webview.postMessage({
            type: 'setState',
            content,
            entries: taggedEntriesForWebview(entries),
            emptyMessage: '',
        });
        this._view?.show?.(true);
    }
}

let customContextProviderInstance: CustomContextViewProvider | null = null;

export function getCustomContextProvider(): CustomContextViewProvider | null {
    return customContextProviderInstance;
}

export function registerCustomContextView(context: vscode.ExtensionContext): vscode.Disposable[] {
    const provider = new CustomContextViewProvider(context);
    customContextProviderInstance = provider;
    return [
        vscode.window.registerWebviewViewProvider(VIEW_TYPE, provider),
        vscode.commands.registerCommand('devnotes.openCustomContext', () => provider.focusAndRefresh()),
    ];
}

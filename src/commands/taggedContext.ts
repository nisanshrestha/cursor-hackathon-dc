import * as path from 'path';
import * as vscode from 'vscode';
import {
    addTaggedEntry,
    clearTaggedEntries,
    getTaggedEntries,
    removeTaggedEntry,
    persistTaggedEntries,
    TaggedEntry,
} from '../services/taggedContext';

function getWorkspaceRoot(): string | undefined {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders?.length) return undefined;
    return folders[0].uri.fsPath;
}

export function registerAddToContextCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('devnotes.addToContext', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Open a file first.');
            return;
        }
        const root = getWorkspaceRoot();
        const doc = editor.document;
        const filePath = doc.uri.fsPath;
        const relativePath = root ? vscode.workspace.asRelativePath(doc.uri) : filePath;
        const selection = editor.selection;
        const entry: TaggedEntry = {
            path: relativePath,
            label: path.basename(relativePath) + (selection.isEmpty ? '' : ' (selection)'),
        };
        if (!selection.isEmpty) {
            entry.range = {
                start: { line: selection.start.line, character: selection.start.character },
                end: { line: selection.end.line, character: selection.end.character },
            };
        }
        addTaggedEntry(entry);
        persistTaggedEntries(context.globalState);
        const count = getTaggedEntries().length;
        vscode.window.showInformationMessage(`Added to context (${count} item(s) in context).`);
    });
}

export function registerRemoveFromContextCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('devnotes.removeFromContext', async () => {
        const entries = getTaggedEntries();
        if (entries.length === 0) {
            vscode.window.showInformationMessage('Context is already empty.');
            return;
        }
        const items = entries.map((e) => ({ label: e.label ?? e.path, entry: e }));
        const picked = await vscode.window.showQuickPick(items, {
            placeHolder: 'Choose an item to remove from context',
            matchOnDescription: true,
        });
        if (!picked) return;
        removeTaggedEntry(picked.entry.path, picked.entry.range);
        persistTaggedEntries(context.globalState);
        vscode.window.showInformationMessage('Removed from context.');
    });
}

export function registerClearContextCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('devnotes.clearContext', async () => {
        clearTaggedEntries();
        persistTaggedEntries(context.globalState);
        vscode.window.showInformationMessage('Context cleared.');
    });
}


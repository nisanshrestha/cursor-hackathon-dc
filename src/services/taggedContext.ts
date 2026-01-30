import * as vscode from 'vscode';
import * as path from 'path';

export interface TaggedEntry {
    path: string;
    range?: { start: { line: number; character: number }; end: { line: number; character: number } };
    label?: string;
}

const STATE_KEY = 'devnotes.taggedContext';
let inMemoryEntries: TaggedEntry[] = [];

export function getTaggedEntries(): TaggedEntry[] {
    return [...inMemoryEntries];
}

export function addTaggedEntry(entry: TaggedEntry): void {
    if (inMemoryEntries.some((e) => e.path === entry.path && !e.range && !entry.range)) return;
    const range = entry.range;
    if (range && inMemoryEntries.some((e) => e.path === entry.path && e.range && e.range.start.line === range.start.line)) return;
    inMemoryEntries.push(entry);
}

export function removeTaggedEntry(filePath: string, range?: TaggedEntry['range']): void {
    if (range) {
        inMemoryEntries = inMemoryEntries.filter(
            (e) => e.path !== filePath || !e.range || e.range.start.line !== range.start.line
        );
    } else {
        inMemoryEntries = inMemoryEntries.filter((e) => e.path !== filePath);
    }
}

export function clearTaggedEntries(): void {
    inMemoryEntries = [];
}

export async function getTaggedContentSnapshots(workspaceRoot: string): Promise<{ label: string; content: string }[]> {
    const results: { label: string; content: string }[] = [];
    for (const entry of inMemoryEntries) {
        const uri = vscode.Uri.file(path.isAbsolute(entry.path) ? entry.path : path.join(workspaceRoot, entry.path));
        try {
            const doc = await vscode.workspace.openTextDocument(uri);
            let content: string;
            if (entry.range) {
                const start = new vscode.Position(entry.range.start.line, entry.range.start.character);
                const end = new vscode.Position(entry.range.end.line, entry.range.end.character);
                content = doc.getText(new vscode.Range(start, end));
            } else {
                content = doc.getText();
            }
            const label = entry.label ?? path.basename(entry.path);
            results.push({ label, content });
        } catch {
            results.push({ label: entry.label ?? entry.path, content: '(could not read file)' });
        }
    }
    return results;
}

export function persistTaggedEntries(context: vscode.Memento): void {
    context.update(STATE_KEY, inMemoryEntries);
}

export function loadTaggedEntries(context: vscode.Memento): void {
    const stored = context.get<TaggedEntry[]>(STATE_KEY);
    if (Array.isArray(stored)) inMemoryEntries = stored;
}

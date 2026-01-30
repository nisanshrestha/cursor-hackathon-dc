import * as vscode from 'vscode';
import {
    discoverDevnotesAndDiagrams,
    buildAggregatedDocument,
    writeTopLevelDevnotes,
} from '../devnotes/aggregate';

export function registerGenerateHolisticDevnotesCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('devnotes.generateHolistic', async () => {
        const result = await discoverDevnotesAndDiagrams();
        if (!result) {
            vscode.window.showWarningMessage('No workspace folder open.');
            return;
        }
        if (result.devnotesPaths.length === 0 && result.diagramPaths.length === 0) {
            vscode.window.showInformationMessage('No .devnotes or diagram files found to aggregate.');
            const content = '# Holistic .devnotes\n\nNothing to aggregate yet. Add .devnotes files or run analysis to generate diagrams.';
            await writeTopLevelDevnotes(result.workspaceRoot, content);
            return;
        }
        const content = await buildAggregatedDocument(result);
        await writeTopLevelDevnotes(result.workspaceRoot, content);
        vscode.window.showInformationMessage('Holistic .devnotes generated at workspace root.');
    });
}

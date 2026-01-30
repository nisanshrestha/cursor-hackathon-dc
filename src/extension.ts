import * as vscode from 'vscode';
import { loadTaggedEntries } from './services/taggedContext';
import { registerAnalyzeCommand, registerAnalyzeWithMockCommand } from './commands/analyze';
import {
    registerAddToContextCommand,
    registerRemoveFromContextCommand,
    registerClearContextCommand,
} from './commands/taggedContext';
import { registerCustomContextView } from './webview/customContextProvider';
import { getResultsWebviewProvider } from './webview/resultsProvider';
import { registerGenerateHolisticDevnotesCommand } from './commands/holisticDevnotes';

export function activate(context: vscode.ExtensionContext): void {
    loadTaggedEntries(context.globalState);
    context.subscriptions.push(registerAnalyzeCommand(context));
    context.subscriptions.push(registerAnalyzeWithMockCommand(context));
    context.subscriptions.push(registerAddToContextCommand(context));
    context.subscriptions.push(registerRemoveFromContextCommand(context));
    context.subscriptions.push(registerClearContextCommand(context));
    for (const d of registerCustomContextView(context)) {
        context.subscriptions.push(d);
    }
    const resultsProvider = getResultsWebviewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('devnotes.results', resultsProvider)
    );
    context.subscriptions.push(registerGenerateHolisticDevnotesCommand());
}

export function deactivate(): void {
    // Extension cleanup if needed
}

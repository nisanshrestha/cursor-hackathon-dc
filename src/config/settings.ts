import * as vscode from 'vscode';

const SECTION = 'devnotes';

export interface DevnotesConfig {
    apiUrl: string;
    apiKey: string;
    model: string;
    useMockResponse: boolean;
}

export async function getConfig(): Promise<DevnotesConfig> {
    const config = vscode.workspace.getConfiguration(SECTION);
    const apiUrl = config.get<string>('analysisApiUrl', 'https://api.openai.com/v1/chat/completions');
    const model = config.get<string>('analysisModel', 'gpt-4o-mini');
    const apiKey = config.get<string>('analysisApiKey', '');
    const useMockResponse = config.get<boolean>('useMockResponse', false);
    return { apiUrl, apiKey, model, useMockResponse };
}

export function getConfigSync(): DevnotesConfig {
    const config = vscode.workspace.getConfiguration(SECTION);
    return {
        apiUrl: config.get<string>('analysisApiUrl', 'https://api.openai.com/v1/chat/completions'),
        apiKey: config.get<string>('analysisApiKey', ''),
        model: config.get<string>('analysisModel', 'gpt-4o-mini'),
        useMockResponse: config.get<boolean>('useMockResponse', false),
    };
}

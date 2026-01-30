import { extractMermaidBlocks } from './mermaidExtractor';

export interface CodeInsight {
    mermaidStartLine: number;
    codeStartLine: number;
    codeEndLine: number;
}

export interface ParsedResponse {
    annotations: string;
    diagramBlocks: string[];
    code_insights?: CodeInsight[];
    error?: string;
}

function normalizeMermaidNewlines(s: string): string {
    return s.replace(/\\n/g, '\n');
}

/** Parse structured API response: { mermaid_diagram, code_insights } */
export function parseStructuredResponse(rawBody: string): ParsedResponse | null {
    let data: { mermaid_diagram?: string; code_insights?: CodeInsight[] };
    try {
        data = JSON.parse(rawBody) as typeof data;
    } catch {
        return null;
    }
    if (typeof data.mermaid_diagram !== 'string') return null;
    const mermaid = normalizeMermaidNewlines(data.mermaid_diagram);
    const code_insights = Array.isArray(data.code_insights) ? data.code_insights : [];
    return {
        annotations: '',
        diagramBlocks: [mermaid],
        code_insights,
    };
}

export function parseAnalysisResponse(rawBody: string, statusCode: number): ParsedResponse {
    if (statusCode < 200 || statusCode >= 300) {
        return { annotations: '', diagramBlocks: [], error: `API error ${statusCode}: ${rawBody.slice(0, 200)}` };
    }
    const structured = parseStructuredResponse(rawBody);
    if (structured) return structured;

    let data: { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
    try {
        data = JSON.parse(rawBody) as typeof data;
    } catch {
        return { annotations: '', diagramBlocks: [], error: `Invalid JSON: ${rawBody.slice(0, 200)}` };
    }
    if (data.error?.message) {
        return { annotations: '', diagramBlocks: [], error: data.error.message };
    }
    const content = data.choices?.[0]?.message?.content?.trim() ?? '';
    const artifacts = extractMermaidBlocks(content);
    const diagramBlocks = artifacts.map((a) => a.source);
    const fenceRegex = /```mermaid\s*[\s\S]*?```/gi;
    const annotations = content.replace(fenceRegex, '').trim();
    return { annotations, diagramBlocks };
}

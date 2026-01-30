export interface MermaidArtifact {
    source: string;
    type?: 'classDiagram' | 'erDiagram' | 'sequenceDiagram' | 'unknown';
}

const MERMAID_FENCE = /```mermaid\s*([\s\S]*?)```/gi;

function inferType(source: string): MermaidArtifact['type'] {
    const s = source.trim();
    if (/^\s*classDiagram/i.test(s)) return 'classDiagram';
    if (/^\s*erDiagram/i.test(s)) return 'erDiagram';
    if (/^\s*sequenceDiagram/i.test(s)) return 'sequenceDiagram';
    return 'unknown';
}

export function extractMermaidBlocks(content: string): MermaidArtifact[] {
    const out: MermaidArtifact[] = [];
    let m: RegExpExecArray | null;
    MERMAID_FENCE.lastIndex = 0;
    while ((m = MERMAID_FENCE.exec(content)) !== null) {
        const source = m[1].trim();
        if (source) out.push({ source, type: inferType(source) });
    }
    return out;
}

const assert = require('assert');
const { extractMermaidBlocks } = require('../../out/services/mermaidExtractor');

describe('mermaidExtractor', () => {
    it('extracts single mermaid block', () => {
        const content = 'text\n\n```mermaid\nclassDiagram\nA --> B\n```\nmore';
        const blocks = extractMermaidBlocks(content);
        assert.strictEqual(blocks.length, 1);
        assert.ok(blocks[0].source.includes('classDiagram'));
        assert.strictEqual(blocks[0].type, 'classDiagram');
    });

    it('extracts multiple mermaid blocks', () => {
        const content = '```mermaid\nsequenceDiagram\nA->>B: hi\n```\n\n```mermaid\nerDiagram\nE1 ||--o{ E2\n```';
        const blocks = extractMermaidBlocks(content);
        assert.strictEqual(blocks.length, 2);
        assert.strictEqual(blocks[0].type, 'sequenceDiagram');
        assert.strictEqual(blocks[1].type, 'erDiagram');
    });

    it('returns empty array when no blocks', () => {
        const blocks = extractMermaidBlocks('just text');
        assert.strictEqual(blocks.length, 0);
    });

    it('handles mixed content', () => {
        const content = 'intro\n```mermaid\nclassDiagram\nX\n```\noutro';
        const blocks = extractMermaidBlocks(content);
        assert.strictEqual(blocks.length, 1);
        assert.ok(blocks[0].source.trim().includes('X'));
    });
});

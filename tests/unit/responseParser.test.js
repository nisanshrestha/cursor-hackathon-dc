const assert = require('assert');
const path = require('path');
const { parseAnalysisResponse } = require('../../out/services/responseParser');

describe('responseParser', () => {
    it('returns annotations and diagramBlocks for valid response', () => {
        const body = JSON.stringify({
            choices: [{ message: { content: 'Summary here.\n\n```mermaid\nclassDiagram\nA --> B\n```' } }],
        });
        const r = parseAnalysisResponse(body, 200);
        assert.strictEqual(r.error, undefined);
        assert.ok(r.annotations.includes('Summary here'));
        assert.strictEqual(r.diagramBlocks.length, 1);
        assert.ok(r.diagramBlocks[0].includes('classDiagram'));
    });

    it('returns error for non-2xx status', () => {
        const r = parseAnalysisResponse('{"error":"unauthorized"}', 401);
        assert.ok(r.error);
        assert.strictEqual(r.diagramBlocks.length, 0);
    });

    it('returns error for invalid JSON', () => {
        const r = parseAnalysisResponse('not json', 200);
        assert.ok(r.error);
    });

    it('returns error when API returns error message', () => {
        const body = JSON.stringify({ error: { message: 'Rate limit' } });
        const r = parseAnalysisResponse(body, 200);
        assert.strictEqual(r.error, 'Rate limit');
    });
});

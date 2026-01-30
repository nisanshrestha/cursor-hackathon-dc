/**
 * Integration test: extension entry exists after compile and exposes activate/deactivate.
 * Full extension host test: run via VS Code "Extension Tests" (F5 with "Extension Tests" config).
 * Run with: npm run test:integration (after npm run compile).
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');

describe('Extension integration', () => {
    it('out/extension.js exists and contains activate and deactivate', () => {
        const extPath = path.join(__dirname, '../../out/extension.js');
        assert.ok(fs.existsSync(extPath), 'out/extension.js should exist after compile');
        const content = fs.readFileSync(extPath, 'utf8');
        assert.ok(content.includes('activate'), 'extension should export activate');
        assert.ok(content.includes('deactivate'), 'extension should export deactivate');
    });
});

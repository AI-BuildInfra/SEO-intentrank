import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

describe('SEO-IntentRank Official MCP Registry Schema Validation Tests', () => {
  test('server.json strictly validates against official 2025-12-11 MCP schema', async () => {
    const res = await fetch('https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json');
    assert.strictEqual(res.ok, true, `Failed to fetch official schema: ${res.status}`);
    const schema = await res.json();

    const serverJsonRaw = fs.readFileSync('server.json', 'utf-8');
    const serverJson = JSON.parse(serverJsonRaw);

    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(serverJson);

    if (!valid) {
      console.error('Ajv Validation Errors:', validate.errors);
    }
    assert.strictEqual(valid, true, `server.json failed schema validation: ${JSON.stringify(validate.errors)}`);
    assert.strictEqual(serverJson.name, 'io.github.AI-BuildInfra/SEO-intentrank');
    assert.strictEqual(serverJson.version, '1.0.1');
  });
});

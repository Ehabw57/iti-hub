import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from '@babel/core';
import { intlayerOptimizeBabelPlugin } from '@intlayer/babel';

const root = fileURLToPath(new URL('../', import.meta.url));
const src = path.join(root, 'src');

// Exercise the real production optimizer, including on Windows where its
// filename filtering can skip transforms that run on Linux deployment hosts.
for (const relative of readdirSync(src, { recursive: true })) {
  if (!/\.[jt]sx?$/.test(relative)) continue;
  const filename = path.join(src, relative);
  const code = readFileSync(filename, 'utf8');
  if (!/\buseIntlayer\s*\(/.test(code)) continue;

  test(`production dictionary imports: ${relative}`, () => {
    const result = transformSync(code, {
      filename,
      ast: true,
      parserOpts: { plugins: ['jsx'] },
      plugins: [[intlayerOptimizeBabelPlugin, {
        dictionariesDir: path.join(root, '.intlayer/dictionary'),
      }]],
    });
    const dictionaryImports = new Set(result.ast.program.body
      .filter(node => node.type === 'ImportDeclaration' && node.source.value.endsWith('.json'))
      .flatMap(node => node.specifiers.map(specifier => specifier.local.name)));
    let calls = 0;
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'CallExpression' && node.callee.name === 'useIntlayer') {
        calls++;
        assert.ok(dictionaryImports.has(node.arguments[0]?.name),
          'The production hook must receive an imported dictionary, not a computed key. Use a literal useIntlayer key.');
      }
      for (const value of Object.values(node)) {
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object') visit(value);
      }
    }
    visit(result.ast.program);
    assert.ok(calls > 0);
  });
}

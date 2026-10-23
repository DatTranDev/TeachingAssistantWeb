const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { getRootDirs } = require('@next/eslint-plugin-next/dist/utils/get-root-dirs');
const { Linter } = require('eslint');

test('the actual Next directory resolver and link rule retain wildcard and array-root behavior', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'ta-lint-contract-'));
  try {
    for (const app of ['alpha', 'beta'])
      mkdirSync(path.join(root, 'apps', app, 'pages'), { recursive: true });
    writeFileSync(path.join(root, 'apps', 'note.txt'), 'not a directory');
    writeFileSync(
      path.join(root, 'apps', 'alpha', 'pages', 'about.js'),
      'export default function About() {}'
    );
    const glob = path.join(root, 'apps', '*');
    const directories = getRootDirs({ cwd: root, settings: { next: { rootDir: glob } } });
    assert.deepEqual(directories.map((value) => path.basename(value)).sort(), ['alpha', 'beta']);
    assert.ok(directories.every((value) => !value.endsWith('/')));
    assert.equal(
      getRootDirs({
        cwd: root,
        settings: {
          next: { rootDir: [path.join(root, 'apps', 'alpha'), path.join(root, 'missing')] },
        },
      }).length,
      1
    );
    const linter = new Linter({ configType: 'eslintrc' });
    const ruleId = '@next/next/no-html-link-for-pages';
    linter.defineRule(
      ruleId,
      require('@next/eslint-plugin-next/dist/rules/no-html-link-for-pages').default
    );
    const messages = linter.verify('const link = <a href="/about">About</a>;', {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      settings: { next: { rootDir: glob } },
      rules: { [ruleId]: 'error' },
    });
    assert.ok(
      messages.some((message) => message.ruleId === ruleId),
      JSON.stringify(messages)
    );
  } finally {
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep));
    rmSync(root, { recursive: true, force: true });
  }
});

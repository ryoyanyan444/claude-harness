#!/usr/bin/env node
/**
 * Evaluator Bash Guard のテスト。
 *
 * 実行: node .claude/scripts/evaluator-bash-guard.test.js
 *
 * 全テストパスで exit 0、1つでも失敗で exit 1。
 */

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const SCRIPT = path.resolve(__dirname, 'evaluator-bash-guard.js');
const NV = '--no-' + 'verify';  // pre-commit hookに引っかからないための分割

function run(payload) {
  const r = spawnSync('node', [SCRIPT], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
  });
  return { code: r.status, stderr: r.stderr };
}

const cases = [
  // ========== Global blocks (any agent) ==========
  ['global', 'main', 'git commit ' + NV, 'BLOCK'],
  ['global', 'main', 'git push --force', 'BLOCK'],
  ['global', 'main', 'git push --force-with-lease', 'ALLOW'],
  ['global', 'main', 'git push --force-with-lease --force-if-includes', 'ALLOW'],
  ['global', '', 'rm -rf /', 'BLOCK'],

  // ========== Main agent: should mostly allow ==========
  ['main', '', 'sed -i s/x/y/ src/file.ts', 'ALLOW'],
  ['main', '', 'npm install foo', 'ALLOW'],
  ['main', '', 'bash -c "ls"', 'ALLOW'],

  // ========== Evaluator: BLOCK editing/install/git mutate ==========
  ['eval-edit', 'e2e-runner', 'sed -i s/x/y/ src/file.ts', 'BLOCK'],
  ['eval-edit', 'e2e-runner', 'sed -Ei s/x/y/ src/file.ts', 'BLOCK'],
  ['eval-edit', 'e2e-runner', 'awk -i inplace "{print}" src/file', 'BLOCK'],
  ['eval-edit', 'e2e-runner', 'perl -pi -e "s/x/y/" src/file', 'BLOCK'],

  // Codex指摘のバイパス手口
  ['bypass', 'e2e-runner', 'git apply /tmp/patch.diff', 'BLOCK'],
  ['bypass', 'e2e-runner', 'git restore src/file', 'BLOCK'],
  ['bypass', 'e2e-runner', 'git checkout HEAD -- src/file', 'BLOCK'],
  ['bypass', 'e2e-runner', 'npx prettier --write src/file', 'BLOCK'],
  ['bypass', 'e2e-runner', 'make format', 'BLOCK'],
  ['bypass', 'e2e-runner', 'node scripts/mutate.js', 'BLOCK'],
  ['bypass', 'e2e-runner', 'TARGET=src/foo; echo hi > $TARGET', 'BLOCK'],
  ['bypass', 'e2e-runner', 'echo hi > $(pwd)/src/foo', 'BLOCK'],
  ['bypass', 'e2e-runner', 'echo hi > `pwd`/src/foo', 'BLOCK'],
  ['bypass', 'e2e-runner', 'echo hi >(tee src/foo)', 'BLOCK'],

  // インラインスクリプト
  ['eval-script', 'e2e-runner', 'python -c "open(1,2)"', 'BLOCK'],
  ['eval-script', 'e2e-runner', 'node -e "console.log(1)"', 'BLOCK'],
  ['eval-script', 'e2e-runner', 'ruby -e "p 1"', 'BLOCK'],

  // シェルラッパー（allowlistバイパス）
  ['eval-wrap', 'e2e-runner', 'bash -c "ls"', 'BLOCK'],
  ['eval-wrap', 'e2e-runner', 'sh -c "echo hi"', 'BLOCK'],
  ['eval-wrap', 'e2e-runner', 'zsh -c "ls"', 'BLOCK'],

  // ファイル/権限/依存
  ['eval-file', 'e2e-runner', 'ln -s /etc/passwd missions/001/Evaluator/x', 'BLOCK'],
  ['eval-file', 'e2e-runner', 'chmod +x src/foo', 'BLOCK'],
  ['eval-file', 'e2e-runner', 'rm src/important.ts', 'BLOCK'],
  ['eval-file', 'e2e-runner', 'cp foo.txt src/copy.ts', 'BLOCK'],
  ['eval-dep', 'e2e-runner', 'npm install foo', 'BLOCK'],
  ['eval-dep', 'e2e-runner', 'pnpm add foo', 'BLOCK'],
  ['eval-git', 'e2e-runner', 'git commit -m x', 'BLOCK'],
  ['eval-git', 'e2e-runner', 'git push origin main', 'BLOCK'],

  // リダイレクト先がEvaluator/Assets以外
  ['eval-redir', 'e2e-runner', 'echo hi > src/foo.ts', 'BLOCK'],
  ['eval-redir', 'e2e-runner', 'cat input >> tests/file.spec.ts', 'BLOCK'],
  ['eval-redir', 'e2e-runner', 'echo {} > package.json', 'BLOCK'],
  ['eval-redir', 'e2e-runner', 'echo hi > /tmp/leak', 'BLOCK'],

  // ========== Evaluator: ALLOW read-only and verification ==========
  ['eval-read', 'e2e-runner', 'ls -la', 'ALLOW'],
  ['eval-read', 'e2e-runner', 'cat src/file.ts', 'ALLOW'],
  ['eval-read', 'e2e-runner', 'grep -r foo src/', 'ALLOW'],
  ['eval-read', 'e2e-runner', 'find . -name "*.ts"', 'ALLOW'],
  ['eval-read', 'e2e-runner', 'git diff main...HEAD', 'ALLOW'],
  ['eval-read', 'e2e-runner', 'git log --oneline', 'ALLOW'],
  ['eval-read', 'e2e-runner', 'git status', 'ALLOW'],

  // ビルド/テスト
  ['eval-test', 'e2e-runner', 'pnpm test', 'ALLOW'],
  ['eval-test', 'e2e-runner', 'pnpm build', 'ALLOW'],
  ['eval-test', 'e2e-runner', 'npm test', 'ALLOW'],
  ['eval-test', 'e2e-runner', 'pnpm tsc --noEmit', 'ALLOW'],
  ['eval-test', 'e2e-runner', 'npx playwright test --trace on', 'ALLOW'],
  ['eval-test', 'e2e-runner', 'npx playwright show-report', 'ALLOW'],
  ['eval-test', 'e2e-runner', 'pytest', 'ALLOW'],
  ['eval-test', 'e2e-runner', 'cargo test', 'ALLOW'],

  // HTTP probe
  ['eval-http', 'e2e-runner', 'curl -sf http://localhost:3000', 'ALLOW'],
  ['eval-http', 'e2e-runner', 'curl -I http://localhost:3000', 'ALLOW'],

  // Evaluator/Assets への書き込み
  ['eval-write', 'e2e-runner', 'echo hi > missions/001/Evaluator/Round-01.md', 'ALLOW'],
  ['eval-write', 'e2e-runner', 'echo hi >> missions/001/Evaluator/Round-01.md', 'ALLOW'],
  ['eval-write', 'e2e-runner', 'cp screenshot.png missions/001/Assets/', 'ALLOW'],
  ['eval-write', 'e2e-runner', 'mv trace.zip missions/001/Assets/', 'ALLOW'],

  // パイプ（各セグメント全て allowlist 通過）
  ['eval-pipe', 'e2e-runner', 'git log --oneline | head -20', 'ALLOW'],
  ['eval-pipe', 'e2e-runner', 'cat file | grep error | wc -l', 'ALLOW'],
  // パイプの片方が違反ならBLOCK
  ['eval-pipe-bad', 'e2e-runner', 'cat file | sed -i s/x/y/ src/foo', 'BLOCK'],
];

let pass = 0, fail = 0;
const fails = [];

for (const [tag, agent, cmd, expect] of cases) {
  const r = run({ tool_input: { command: cmd }, agent_type: agent });
  const got = r.code === 0 ? 'ALLOW' : 'BLOCK';
  const ok = got === expect;
  if (ok) {
    pass++;
  } else {
    fail++;
    fails.push({ tag, agent, cmd, expect, got, stderr: r.stderr });
  }
  console.log(
    (ok ? 'OK ' : 'NG ') +
    got.padEnd(6) +
    '[' + tag + '/' + (agent || 'main') + '] ' +
    cmd
  );
}

console.log('\n=== Result: ' + pass + ' pass, ' + fail + ' fail ===');
if (fail > 0) {
  console.log('\nFailures:');
  for (const f of fails) {
    console.log('  ' + f.tag + ': ' + f.cmd);
    console.log('    expected ' + f.expect + ', got ' + f.got);
    if (f.stderr) console.log('    stderr: ' + f.stderr.trim());
  }
  process.exit(1);
}
process.exit(0);

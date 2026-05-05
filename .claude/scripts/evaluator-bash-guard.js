#!/usr/bin/env node
/**
 * Evaluator Bash Guard
 *
 * Claude Code の PreToolUse hook から呼ばれる。
 * stdin から JSON payload を受け取り、agent_type が 'e2e-runner' の場合に
 * Bash コマンドを完全 Allowlist で検査する。
 *
 * Exit codes:
 *   0 - 通過（stdout に元の payload を出力）
 *   2 - ブロック（stderr に理由を出力）
 *
 * テストは evaluator-bash-guard.test.js を参照。
 */

'use strict';

const FS = require('fs');

// ========== 1. Global blocks (全エージェント共通) ==========
const GLOBAL_BLOCKS = [
  /git\s+(commit|push)\b[^|;&]*--no-verify\b/,
  /git\s+push\b[^|;&]*\s(--force(?!-)|-f)(\s|$)/,
  /\brm\s+-rf\s+\/(\s|$)/,
  /\bsudo\s+rm\s+-rf\b/,
];

// ========== 2. Evaluator allowlist ==========
//
// 各正規表現は1セグメント（パイプ・&&・||・;・&で分割した1単位）に対してマッチ。
// 1つでもマッチすれば許可、すべて外れたら拒否。
//
const ALLOWLIST = [
  // 読み取り専用検査
  /^(ls|cat|head|tail|less|more|grep|egrep|fgrep|rg|ripgrep|find|file|wc|stat|tree|du|df|hexdump|xxd|od|cmp|diff|md5sum|sha256sum|date|pwd|echo|true|false|whoami|hostname|uname|which|type|env|printenv)(\s|$)/,

  // Git read-only verb のみ
  /^git\s+(status|log|diff|show|ls-files|ls-tree|blame|rev-parse|rev-list|describe|tag|branch|remote|config\s+--get|config\s+--list|fetch\s+--dry-run)(\s|$)/,

  // パッケージマネージャ run/build/test/lint/coverage（編集系verbは別途排除）
  /^(pnpm|npm|yarn)\s+(run\s+)?(build|test|lint|coverage|tsc|typecheck|check|exec)(\s|$)/,
  /^(pnpm|npm|yarn)\s+(test|build|lint)(\s|$)/,

  // npx の安全なツール（prettier --write 等は明示除外）
  /^npx\s+(tsc(\s+--noEmit)?|playwright(\s+(test|show-report|show-trace))?|jest|vitest|eslint(\s+--no-fix)?|stylelint(\s+--no-fix)?|@playwright\/test)(\s|$)/,

  // 他言語のテストランナー
  /^pytest(\s|$)/,
  /^cargo\s+(build|test|check|fmt\s+--check|clippy)(\s|$)/,
  /^go\s+(build|test|vet)(\s|$)/,
  /^mvn\s+(test|verify|compile)(\s|$)/,
  /^gradle\s+(test|build|check)(\s|$)/,

  // HTTP probes（read-only）
  /^curl\s+(-[sIfL]+|-sf|-I|--head|--silent|--include)(\s|$)/,
  /^wget\s+--spider(\s|$)/,

  // Evaluator/Assets への書き込みのみ許可
  /^(echo|printf)\s+[^>]*>>?\s*missions\/[^/]+\/(Evaluator|Assets)\/[^\s|;&]+\s*$/,
  /^cat\s+[^>]*>>?\s*missions\/[^/]+\/(Evaluator|Assets)\/[^\s|;&]+\s*$/,
  /^cp\s+\S+\s+missions\/[^/]+\/(Evaluator|Assets)\/?\S*\s*$/,
  /^mv\s+\S+\s+missions\/[^/]+\/(Evaluator|Assets)\/?\S*\s*$/,
  /^tee(\s+-a)?\s+missions\/[^/]+\/(Evaluator|Assets)\/[^\s|;&]+\s*$/,
];

// ========== 3. シェル展開禁止トークン ==========
//
// 変数・コマンド置換・プロセス置換を含むコマンドは即拒否。
// allowlist 通過のために変数経由で書き込み先を偽装する手口を防ぐ。
//
const DANGEROUS_TOKENS = ['$(', '`', '${', '>(', '<('];
const VARIABLE_REGEX = /\$[A-Za-z_]/;

// ========== Main ==========

function main() {
  let raw = '';
  process.stdin.on('data', (chunk) => { raw += chunk; });
  process.stdin.on('end', () => {
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error('[evaluator-guard] invalid JSON input');
      process.exit(0);
    }

    const cmd = (data.tool_input && data.tool_input.command) || '';
    const agent = data.agent_type || '';

    // Global blocks
    for (const re of GLOBAL_BLOCKS) {
      if (re.test(cmd)) {
        console.error('[evaluator-guard] BLOCKED (global): ' + cmd);
        process.exit(2);
      }
    }

    // Evaluator 以外はそのまま通過
    if (agent !== 'e2e-runner') {
      process.stdout.write(raw);
      process.exit(0);
    }

    // Evaluator: 厳格チェック

    // 1. 危険なシェル展開を拒否
    for (const tok of DANGEROUS_TOKENS) {
      if (cmd.includes(tok)) {
        console.error('[evaluator-guard] BLOCKED (shell expansion '+ tok +'): ' + cmd);
        process.exit(2);
      }
    }
    if (VARIABLE_REGEX.test(cmd)) {
      console.error('[evaluator-guard] BLOCKED (variable expansion): ' + cmd);
      process.exit(2);
    }

    // 2. パイプ・論理演算子で分割し各セグメントを検査
    const segments = cmd
      .split(/(?:&&|\|\||;|\|(?!\|)|&(?!&))/)
      .map((s) => s.trim())
      .filter(Boolean);

    // リダイレクト先が Evaluator/Assets でなければBLOCK（Allowlist通過前の必須チェック）
    const ALLOWED_WRITE_PREFIX = /^(\.\/)?missions\/[^/]+\/(Evaluator|Assets)\//;

    for (const seg of segments) {
      // > / >> / >& の後の最初の non-space トークンを検査
      const redirRe = /(>{1,2})\s+(\S+)/g;
      let m;
      while ((m = redirRe.exec(seg)) !== null) {
        const target = m[2];
        if (!ALLOWED_WRITE_PREFIX.test(target)) {
          console.error('[evaluator-guard] BLOCKED (write target outside Evaluator/Assets): ' + target);
          console.error('[evaluator-guard]   segment: ' + seg);
          console.error('[evaluator-guard]   full: ' + cmd);
          process.exit(2);
        }
      }
      // tee の後のターゲット
      const teeRe = /\btee(?:\s+-a)?\s+(\S+)/g;
      while ((m = teeRe.exec(seg)) !== null) {
        const target = m[1];
        if (!ALLOWED_WRITE_PREFIX.test(target)) {
          console.error('[evaluator-guard] BLOCKED (tee target outside Evaluator/Assets): ' + target);
          process.exit(2);
        }
      }

      // 書き込み先チェックを通った後、コマンド形態が allowlist に含まれるか確認
      let matched = false;
      for (const allow of ALLOWLIST) {
        if (allow.test(seg)) { matched = true; break; }
      }
      if (!matched) {
        console.error('[evaluator-guard] BLOCKED (allowlist mismatch): ' + seg);
        console.error('[evaluator-guard]   full command: ' + cmd);
        console.error('[evaluator-guard]   See EVALUATOR_PROMPT.md for allowed commands.');
        process.exit(2);
      }
    }

    // 通過
    process.stdout.write(raw);
    process.exit(0);
  });
}

if (require.main === module) {
  main();
} else {
  module.exports = { GLOBAL_BLOCKS, ALLOWLIST, DANGEROUS_TOKENS, VARIABLE_REGEX };
}

# 開発ワークフロー

機能開発は3フェーズで回す。

```
Planner → Generator → Evaluator（Playwright）
```

---

## Phase 1: Planner

**エージェント:** `planner`

実装前に計画を立てる。コードは書かない。

```
Use the planner agent to plan [機能名]
```

**出力物:**
- 実装フェーズの分解
- 依存関係と順序
- リスクと注意点
- テスト対象となるユーザーフロー

---

## Phase 2: Generator

**エージェント:** メインのClaude Codeセッション + `code-reviewer`

Plannerの出力をもとにコードを実装する。

1. Plannerの計画通りに実装
2. 実装後に `code-reviewer` でレビュー
3. CriticalとHighの指摘を修正

---

## Phase 3: Evaluator（Playwright）

**エージェント:** `e2e-runner`

GeneratorのコードをPlaywrightで実際に動かして検証する。

```
Use the e2e-runner agent to validate [実装した機能] on [URL]
```

**e2e-runner がやること:**
- 対象ユーザーフローのE2Eテストを作成・実行
- スクリーンショット・動画・トレースを取得
- フレーキーなテストを検出してquarantine
- PASS/FAILを根拠付きで報告

**判定基準:**
- Critical journey 100% PASS → マージOK
- FAILがある → Generatorフェーズに戻る

---

## フロー図

```
planner
  ↓
  実装計画
  ↓
Claude Code（実装）
  ↓
code-reviewer
  ↓
  Critical/High修正
  ↓
e2e-runner（Playwright）
  ↓
  PASS → 完了
  FAIL → Generatorに戻る
```

---

## Playwright セットアップ

```bash
npm install -D @playwright/test
npx playwright install
```

`playwright.config.ts` の最低限の設定:

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    trace: 'on-first-retry',
  },
})
```

---

## ハーネス自体の監査

このワークフローを正しく運用できているか確認したい場合は `harness-auditor` を使う:

```
Use the harness-auditor agent to audit my ~/.claude/ setup
```

# 開発ワークフロー

機能開発は **ミッション単位** で `Planner → Generator → Evaluator` の3フェーズを回します。

```
[Spec.md] → [実装] → [検証]
  Planner   Generator   Evaluator
```

各フェーズの成果物は `missions/NNN-mission-name/` に保存し、再現可能性を担保します。

---

## ミッションフォルダ構造

```
missions/
└── 001-add-login/
    ├── Spec.md                       # Plannerの最終成果物（ユーザー承認必須）
    ├── Planner-Discussion/
    │   ├── Round-01-Claude.md
    │   └── Round-02-Claude.md
    ├── Generator/
    │   └── Round-01.md               # 実装報告
    ├── Evaluator/
    │   └── Round-01.md               # 検証結果＋証拠
    └── Assets/                       # スクショ・トレース等
```

新規ミッション開始時は [`missions/000-template/`](./missions/000-template/) を複製してください。

---

## Phase 1: Planner（計画）

**エージェント:** `planner`

実装はしません。仕様書 `Spec.md` を作るのが唯一の成果物です。

### 手順

1. ミッションフォルダ作成: `cp -r missions/000-template missions/NNN-機能名`
2. Claude Code で：
   ```
   Use the planner agent. Read missions/NNN-機能名/Spec.md template
   and produce a complete Spec.md.
   Save discussion to missions/NNN-機能名/Planner-Discussion/Round-01-Claude.md
   ```
3. **Spec.md には必ず「検証可能な受け入れ条件」を書く**
4. ユーザーが Spec.md を承認するまで先に進まない

### Plannerの成果物
- `Spec.md` — 受け入れ条件・スコープ・非機能要件
- `Planner-Discussion/Round-XX-*.md` — 議論ログ

---

## Phase 2: Generator（実装）

**エージェント:** メインの Claude Code セッション（必要に応じて `code-reviewer`）

### 手順

1. Spec.md を読む
2. 計画通りに実装
3. 実装後、`code-reviewer` で内部レビュー（CRITICAL/HIGH指摘を修正）
4. **Generator報告書を `Generator/Round-01.md` に書く**

### Generator の成果物
- 動くコード
- `Generator/Round-01.md` — 変更ファイル・受け入れ条件への対応・実行確認結果

### Generator が守るルール
- Spec.md の受け入れ条件を変えない（変えたい場合は Planner に戻る）
- 自分でテストを quarantine しない
- Evaluator の判定を待ってから次フェーズに進む

---

## Phase 3: Evaluator（検証）

**エージェント:** `e2e-runner`（独立検証専用に硬化済み）

⚠️ **必ず [`EVALUATOR_PROMPT.md`](./EVALUATOR_PROMPT.md) と [`SEVERITY.md`](./SEVERITY.md) を読み込んでから実行する。**

### 手順

1. dev server を起動: `npm run dev`
2. Claude Code で：
   ```
   Use the e2e-runner agent. Follow EVALUATOR_PROMPT.md strictly.
   Validate missions/NNN-機能名/ against Spec.md acceptance criteria.
   Save report to missions/NNN-機能名/Evaluator/Round-01.md
   ```
3. Evaluator は **Read のみ**。コードを書き換えないし、テストを修正しない
4. 各受け入れ条件に **証拠（ログ・スクショ・grep結果）** が必須

### 判定（[SEVERITY.md](./SEVERITY.md) 参照）

| 判定 | 条件 | 次のアクション |
|------|------|-------------|
| PASS | High なし、BLOCKED なし | ミッション完了 |
| FAIL | High が1つでもある | Generator に差し戻し |
| BLOCKED | 検証不能（環境不足等） | 環境を整えて再評価 |

### Evaluator の成果物
- `Evaluator/Round-01.md` — 受け入れ条件ごとの PASS/FAIL/BLOCKED ＋証拠
- `Assets/` — スクショ・Playwright トレース・実行ログ

---

## 差し戻しループ

```
Generator → Evaluator
              ↓
          ┌───┴───┐
        PASS    FAIL
          ↓       ↓
        完了   Generator Round-02
                  ↓
              Evaluator Round-02
                  ↓
                ...
```

3ラウンド以上繰り返して PASS しない場合は **Planner に戻る**（仕様自体に無理がある可能性）。

---

## Playwright セットアップ

Evaluator は Playwright で実機検証します。

### 公式パターン推奨（v1.56+）

```bash
npx playwright init-agents --loop=claude
```

これで `specs/`（テスト計画）と `tests/`（実テスト）が自動生成されます。

### 手動セットアップ

```bash
npm install -D @playwright/test
npx playwright install
```

`playwright.config.ts` 最低限：

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    trace: 'on-first-retry',
  },
})
```

---

## ハーネス自体の監査

このワークフローを正しく運用できているかは `harness-auditor` で確認します。

```
Use the harness-auditor agent to audit my ~/.claude/ setup
```

---

## 参考
- [TandemKit](https://github.com/FlineDev/TandemKit) — 同パターンの先行実装
- [Playwright Test Agents](https://playwright.dev/docs/test-agents) — 公式エージェント

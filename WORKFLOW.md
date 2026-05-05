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
    │   ├── Round-01-Codex.md         # Codex独立調査（Codex不在ならスキップ可）
    │   ├── Round-02-Claude.md        # Codex差分を再調査
    │   └── Round-02-Codex.md         # 収束判定
    ├── Generator/
    │   └── Round-01.md               # 実装報告
    ├── Evaluator/
    │   ├── Round-01.md               # 検証結果＋証拠（Claude）
    │   └── Discussion/
    │       ├── Round-01-Codex.md     # Codex独立検証
    │       ├── Round-02-Claude.md    # Codex差分を再調査
    │       └── Round-02-Codex.md     # 収束判定（3ラウンド停止条件含む）
    ├── Assets/                       # スクショ・トレース等
    ├── ChangedFiles-01.txt           # 各ラウンドの変更ファイル一覧
    └── Summary.md                    # ミッション完了時の総括
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

1. **Spec.md の「検証環境」欄に書かれたコマンドで** dev server を起動
   （プロジェクトに固有なので Spec.md を参照）
2. Claude Code で：
   ```
   Use the e2e-runner agent. Follow EVALUATOR_PROMPT.md strictly.
   Read the verification commands from missions/NNN-機能名/Spec.md.
   Validate against Spec.md acceptance criteria.
   Save report to missions/NNN-機能名/Evaluator/Round-01.md
   ```
3. Evaluator は **Read + 限定された Bash のみ**（[`EVALUATOR_PROMPT.md`](./EVALUATOR_PROMPT.md) のBash許可範囲参照）
4. 各受け入れ条件に **証拠（ログ・スクショ・grep結果）** が必須
5. （任意）Codex がある場合: `Evaluator/Discussion/Round-01-Codex.md` で独立検証→差分があれば収束ラウンド

### 判定（[SEVERITY.md](./SEVERITY.md) 参照）

| 判定 | 条件 | 次のアクション |
|------|------|-------------|
| PASS | High なし、BLOCKED なし | ミッション完了 |
| FAIL | High が1つでもある | Generator に差し戻し |
| BLOCKED | 検証不能（環境不足等） | 環境を整えて再評価 |

### Evaluator の成果物
- `Evaluator/Round-01.md` — 受け入れ条件ごとの PASS/FAIL/BLOCKED ＋証拠
- `Evaluator/Discussion/Round-01-Codex.md` — Codex独立検証（任意）
- `Assets/` — スクショ・Playwright トレース・実行ログ
- `ChangedFiles-XX.txt` — 各ラウンドの変更ファイル一覧
- `Summary.md` — ミッション完了時の総括

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

これで `specs/`（テスト計画）と `tests/`（実テスト）と Claude向け instructions が自動生成されます。

### 手動セットアップ

[`playwright-template/`](./playwright-template/) に最小構成があります：

```bash
cp -rn playwright-template/. ./
npm install -D @playwright/test
npx playwright install
```

Spec.md の「検証環境」欄に baseURL とコマンドを書いてください。

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

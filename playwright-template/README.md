# Playwright 任意テンプレート

> ⚠️ **これは「コピーしてターゲットプロジェクトに移植する」テンプレートです。**
> このディレクトリ単体では実行できません（package.json・依存関係なし）。
> ターゲットプロジェクトの dev server / API / UI に対して動作させることを前提としています。

Evaluator フェーズで Playwright を採用する場合の最小構成です。

## 公式 init-agents（推奨）

Playwright v1.56+ には公式の Test Agents（Planner/Generator/Healer）があります。
これを使うのが最も再現性が高いです：

```bash
npx playwright init-agents --loop=claude
```

これで `specs/` と `tests/` と `.github/copilot-instructions.md` が自動生成されます。
このテンプレートはあくまで手動採用したい場合の出発点です。

---

## 構成

```
playwright-template/
├── playwright.config.ts        # 最低限の設定
├── specs/                      # テスト計画（Markdown）
│   └── login.spec.md           # 例
└── tests/
    └── e2e/
        ├── seed.spec.ts        # 共通setup
        └── login.spec.ts       # 例
```

## 使い方

このテンプレートは **既存のWebアプリプロジェクト（dev serverが立つやつ）** に上乗せして使います。
スタンドアロンのサンプルアプリは含まれません。

1. **ターゲットプロジェクト（あなたのWebアプリ）のルート** にコピー：
   ```bash
   cd /path/to/your-app
   cp -rn /path/to/claude-harness/playwright-template/. ./
   ```
2. 依存をインストール：
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```
3. `playwright.config.ts` の `baseURL` を **ターゲットアプリの dev server URL** に合わせて変更
4. ターゲットアプリの dev server を起動（例: `npm run dev`）
5. テスト実行: `npx playwright test`

`tests/e2e/login.spec.ts` はサンプルなので、ターゲットアプリの実セレクタに合わせて書き換えてください。

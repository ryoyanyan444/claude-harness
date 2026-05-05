# claude-harness

Claude Code のハーネスエンジニアリング設定テンプレート。
hooks / agents / rules をそのまま使えるかたちで配布しています。

## セットアップ

```bash
git clone <this-repo> claude-harness
cp -r claude-harness/.claude/agents/* ~/.claude/agents/
cp -r claude-harness/.claude/rules/* ~/.claude/rules/
```

settings.json は既存設定とマージが必要なため、上書きコピーせず中身を参考にしてください。

## ディレクトリ構造

```
.claude/
├── agents/
│   ├── harness-auditor.md      # ← ハーネス監査エージェント（メイン）
│   ├── planner.md
│   ├── code-reviewer.md
│   ├── security-reviewer.md
│   ├── tdd-guide.md
│   ├── build-error-resolver.md
│   └── ...
├── rules/
│   ├── common/                 # 言語非依存のルール
│   └── web/                    # Web/フロントエンド固有ルール
└── settings.json               # hooksテンプレート（要カスタマイズ）
```

## 開発ワークフロー

**Planner → Generator → Evaluator（Playwright）** の3フェーズで開発する。

詳細は [WORKFLOW.md](./WORKFLOW.md) を参照。

## ハーネス監査の使い方

1. agents をセットアップ後、プロジェクトで Claude Code を起動
2. 以下を入力:

```
Use the harness-auditor agent to audit my ~/.claude/ setup
```

3. 監査レポートが出力される

## リポジトリ自体の監査

`AUDIT_PROMPT.md` の内容を Claude に貼り付けることで、このリポジトリ自体の品質を監査できます。

## カスタマイズ

- `settings.json` の hooks コマンドをプロジェクトのツール（pnpm/yarn/npm）に合わせて変更
- `rules/` に言語固有ディレクトリを追加（例: `rules/python/`, `rules/golang/`）
- `agents/` に用途固有のエージェントを追加

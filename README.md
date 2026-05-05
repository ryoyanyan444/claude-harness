# claude-harness

Claude Code でハーネスエンジニアリングを始めるためのテンプレート。
**Planner → Generator → Evaluator（Playwright）** の開発パイプラインを再現できる。

---

## 何が入っているか

| 要素 | 役割 |
|------|------|
| `WORKFLOW.md` | 3フェーズ開発の手順書 |
| `EVALUATOR_PROMPT.md` | 採点者の手抜き防止プロンプト |
| `SEVERITY.md` | High/Medium/Low の判定基準 |
| `missions/000-template/` | ミッションフォルダの雛形 |
| `.claude/agents/` | サブエージェント13個 |
| `.claude/rules/` | コーディング規約・テスト要件 |
| `.claude/settings.json` | hooks テンプレート |

---

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/ryoyanyan444/claude-harness.git
cd claude-harness
```

### 2. 既存設定をバックアップ（重要）

既存の `~/.claude/` を上書きする可能性があります。**必ずバックアップを取ってください。**

```bash
test -d ~/.claude && cp -r ~/.claude ~/.claude.backup.$(date +%Y%m%d_%H%M%S)
```

### 3. 配置

`-n` で既存ファイルを上書きしません：

```bash
mkdir -p ~/.claude/agents ~/.claude/rules
cp -rn .claude/agents/. ~/.claude/agents/
cp -rn .claude/rules/. ~/.claude/rules/
```

同名ファイルがある場合は手動でマージしてください。

### 4. settings.json の手動マージ

`~/.claude/settings.json` が既にある場合は上書きせず、`.claude/settings.json` の `hooks` セクションを参考に追記してください。

### 5. Claude Code を再起動

サブエージェントの再読み込みのため、Claude Code を一度終了して再起動します。

### 6. インストール確認

```bash
ls ~/.claude/agents/ | grep -E 'harness-auditor|e2e-runner|planner'
```

3つとも表示されれば成功。Claude Code 内で：

```
Use the harness-auditor agent to audit my ~/.claude/ setup
```

監査レポートが返ってくればセットアップ完了。

### ロールバック手順

問題があった場合：

```bash
# バックアップからの復旧
rm -rf ~/.claude
mv ~/.claude.backup.YYYYMMDD_HHMMSS ~/.claude
```

---

## 開発ワークフロー

3フェーズで回します。詳細は [`WORKFLOW.md`](./WORKFLOW.md)。

```
[Spec.md] → [実装] → [検証]
  Planner   Generator   Evaluator
```

各ミッションは `missions/NNN-name/` に保存し、再現可能性を担保します。

新規ミッション開始：

```bash
cp -r missions/000-template missions/001-my-feature
```

---

## ハーネス監査

セットアップが正しく機能しているか確認：

```
Use the harness-auditor agent to audit my ~/.claude/ setup
```

---

## リポジトリ自体の監査

このリポジトリ自体の品質を別Claudeに監査させたい場合は [`AUDIT_PROMPT.md`](./AUDIT_PROMPT.md) の内容を貼り付けてください。

---

## ディレクトリ構造

```
claude-harness/
├── WORKFLOW.md              # 開発パイプラインの手順書
├── EVALUATOR_PROMPT.md      # 硬化Evaluatorプロンプト
├── SEVERITY.md              # 重大度判定基準
├── AUDIT_PROMPT.md          # リポジトリ監査用プロンプト
├── missions/
│   └── 000-template/        # ミッション雛形
│       ├── Spec.md
│       ├── Planner-Discussion/
│       ├── Generator/
│       ├── Evaluator/
│       └── Assets/
└── .claude/
    ├── agents/              # 13個のサブエージェント
    ├── rules/               # common/ + web/
    └── settings.json        # hooks テンプレート
```

---

## カスタマイズ

- `~/.claude/settings.json` の hooks コマンドをプロジェクトのツール（pnpm/yarn/npm）に差し替え
- `~/.claude/rules/` に言語固有ディレクトリを追加（例: `rules/python/`）
- `~/.claude/agents/` に用途固有のエージェントを追加

---

## 参考

- [TandemKit](https://github.com/FlineDev/TandemKit) — 同パターンの先行実装
- [Playwright Test Agents](https://playwright.dev/docs/test-agents) — Playwright公式エージェント
- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) — Claude Code エコシステムまとめ

---

## License

MIT

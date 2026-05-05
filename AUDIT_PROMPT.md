# claude-harness リポジトリ監査プロンプト

このプロンプトをClaude（Codex等）に渡して、リポジトリ自体の品質を監査させる。

---

## 使い方

以下をそのまま貼り付ける：

---

このリポジトリ `claude-harness`（https://github.com/ryoyanyan444/claude-harness）は、
Planner→Generator→Evaluator（Playwright）のパイプラインを
Claude Codeで再現するためのハーネステンプレートです。

以下の3軸で監査してください。**品質軸が最優先**です。

---

## 軸A: 品質（最優先・絶対に妥協しない）

ハーネスとして実機能するかを徹底検証してください。

### A-1: パイプラインの実装可能性
- WORKFLOW.md の Planner→Generator→Evaluator の流れが、
  実際に Claude Code のサブエージェント呼び出し構文で動作するか
- missions/000-template/ の雛形が再現可能で、各フェーズの成果物が定義されているか
- e2e-runner を Evaluator として呼び出す具体的な手順が明確か

### A-2: Evaluator の独立性
- e2e-runner.md の tools が Read/Bash/Grep/Glob のみで、Write/Edit を持っていないか
- EVALUATOR_PROMPT.md が「コード書き換え禁止」「quarantine禁止」を強制しているか
- 受け入れ条件ごとに証拠（ログ・スクショ・トレース）が必須化されているか
- BLOCKED 判定が明確に定義されているか（SEVERITY.md 参照）

### A-3: hooks の機能性
- .claude/settings.json の各 hook が動作するか
  - PreToolUse: `git push --force` をブロックするが `--force-with-lease` は通すか
  - PostToolUse: テンプレート扱いと明示されているか
  - Stop: テンプレート扱いと明示されているか
- 絶対パス（/Users/等）が含まれていないか

### A-4: harness-auditor 自体の品質
- find コマンドが存在しないディレクトリでエラーにならないか（test -d ガード）
- coverage 検証コマンドの実在チェックが含まれているか
- 出力フォーマットが具体的で行動可能か

### A-5: 既存ベストプラクティスとの比較

以下と比較し、欠けている重要パターンを指摘してください：
- TandemKit (FlineDev): https://github.com/FlineDev/TandemKit
- Playwright Test Agents: https://playwright.dev/docs/test-agents
- shanraisshan/claude-code-best-practice
- anothervibecoder-s/claudecode-harness

特に以下のパターンが取り入れられているか：
- 収束プロトコル（複数ラウンドの議論）
- 硬化Evaluatorプロンプト（Claudeの効率最適化バイアス対策）
- 重大度ベースのPASS/FAIL判定
- 「記憶から議論しない、実ソースを再調査」原則
- ミッションフォルダ構造（Spec.md → Generator/ → Evaluator/）

---

## 軸B: 個人情報漏洩

公開リポジトリのため、以下のパターンを `git grep` で検索してください：

```bash
# 個人を特定する情報
git grep -i -E '@gmail|@yahoo|@outlook|/Users/[a-z0-9_-]+|/home/[a-z0-9_-]+'

# 認証情報
git grep -i -E 'API_KEY=|SECRET=|TOKEN=|PASSWORD=|sk-[a-zA-Z0-9]{20,}'

# 自然言語的な事業名・本名（リポジトリ作者に確認すること）
# - リポジトリ作者から提供される NG ワードリストがあればそれを使用
# - ない場合は、不自然に登場する固有名詞を全て報告
```

ヒットがあれば全て報告してください（コメント・docstring内も含む）。
GitHubの公開ハンドル（リポジトリのowner名）はLICENSE/clone URLに登場しますが、これは公開済み情報のため許容してください。

---

## 軸C: 抜け漏れ

### C-1: 必須ファイル
- LICENSE, README, .gitignore は揃っているか
- WORKFLOW.md, EVALUATOR_PROMPT.md, SEVERITY.md が揃っているか
- missions/000-template/ に Spec.md / Planner-Discussion/ / Generator/ / Evaluator/ / Assets/ が揃っているか
- ドキュメント間のリンクが切れていないか

### C-2: 整合性
- agents/ の実ファイルと rules/common/agents.md の記述に矛盾がないか
- WORKFLOW.md と README.md と harness-auditor.md の説明が一致しているか
- testing.md が80%カバレッジ必須としているなら、実行手段が実在するか

### C-3: セットアップ手順
- 利用者が clone → 配置 → 動作確認まで迷わず到達できるか
- 既存設定の上書きリスクが警告されているか
- バックアップ・ロールバック手順があるか
- Claude Code 再起動の指示があるか

---

## 出力フォーマット

```markdown
# 監査レポート

## 総合判定
- 品質: [PASS / WARN / FAIL]
- 個人情報: [CLEAN / LEAK_DETECTED]
- 抜け漏れ: [PASS / WARN / FAIL]

## 軸A: 品質の指摘
| 重大度 | ファイル:行 | 問題 | 推奨修正 |

## 軸B: 漏洩リスク
[grep結果]

## 軸C: 抜け漏れ
| 項目 | 状態 | 修正案 |

## 既存ベストプラクティスから取り入れるべきパターン（優先度付き）
1. [...]

## 次のアクション（最大5つ、優先度順）
```

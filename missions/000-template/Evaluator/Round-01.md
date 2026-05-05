# Evaluator Round-01

> このファイルを生成する前に、必ず [`/EVALUATOR_PROMPT.md`](../../../EVALUATOR_PROMPT.md) を熟読すること。

## サマリー
- 総合判定: PASS / FAIL / BLOCKED
- 検証日時: YYYY-MM-DD HH:MM
- 検証範囲: [対象ファイル一覧]

## 受け入れ条件ごとの判定

### 条件1: [Spec.md から引用]
- 判定: PASS
- 証拠:
  - `src/foo.ts:42` の実装が条件Xを満たす
  - 実行ログ:
    ```
    $ pnpm test src/foo
    ✓ should handle X
    ```
- 理由: [証拠から判定への論理]

### 条件2: [Spec.md から引用]
- 判定: FAIL
- 証拠:
  - `src/bar.ts:88` でエラーハンドリングが欠落
- 理由: 受け入れ条件「全エラーを呼び出し元に伝搬」に違反

### 条件3: [Spec.md から引用]
- 判定: BLOCKED
- 理由: ローカルにDBが立っていないため統合テスト未実行
- 必要なもの: docker-compose up または DATABASE_URL

## 重大度別の指摘

### High（FAIL扱い）
- [致命的な問題]

### Medium（条件付きPASS）
- [改善が必要だがリリース可能]

### Low（PASS可）
- [軽微な提案]

## 差し戻し時の Generator への指示
[FAIL / BLOCKED の場合のみ]

## 自己チェック
- [ ] すべての受け入れ条件に証拠を添えたか
- [ ] PASS のうち目視確認だけのものはないか
- [ ] BLOCKED を PASS にすり替えていないか
- [ ] テストの quarantine / skip を提案していないか
- [ ] コードを書き換えていないか

# Evaluator Round-01 (Codex)

> Claude が書いた `Evaluator/Round-01.md` とは独立して、
> 同じ Spec.md / Generator/Round-01.md を Codex が再評価する。
>
> 必ず冒頭に [`/EVALUATOR_PROMPT.md`](../../../EVALUATOR_PROMPT.md) を読み込むこと。

## 受け入れ条件ごとの判定

### 条件1: [Spec.md から引用]
- 判定: PASS / FAIL / BLOCKED
- 証拠: [Claude とは独立に取得した証拠]
- Claude 判定との差分: [一致 / 相違あり]

### 条件2: ...
（以下同様）

## Claude Evaluator との差分まとめ
| 条件 | Claude判定 | Codex判定 | 差分理由 |
|------|----------|-----------|---------|

## 収束判定
- [ ] 全判定が一致 → Round-01.md を最終版として採用
- [ ] High/Medium で不一致 → Round-02 へ（再調査必須）

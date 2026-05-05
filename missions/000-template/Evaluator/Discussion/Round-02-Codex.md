# Evaluator Round-02 (Codex)

> Round-02-Claude.md を読み、未収束の論点について再度独立検証する。
> 必要なら証拠を取り直すこと。

> 必ず冒頭に [`/EVALUATOR_PROMPT.md`](../../../../EVALUATOR_PROMPT.md) を再読すること。

## 未収束の論点
- [Round-02-Claude.md に書かれた残不一致を引用]

## 再取得した証拠
- [パス] — ...

## 立場の更新
- [Codex 側の更新と理由]

## 収束判定

- [ ] 全条件で High/Medium 不一致がゼロ → **収束**。Round-02 を最終判定として採用
- [ ] まだ不一致が残る → Round-03 へ

## 収束しない場合の Round-03 への申し送り
- [...]

## 3ラウンド到達時の停止条件

3ラウンド経ても High/Medium が収束しない場合：
1. ミッションを **BLOCKED** として人間判断を仰ぐ
2. Spec.md の受け入れ条件自体を見直す（Plannerに戻る）
3. 個別不一致を Summary.md の「残課題」に記録して別ミッション化

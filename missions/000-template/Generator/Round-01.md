# Generator Round-01

## 実装サマリー
[何を作ったか1〜3行]

## 変更ファイル
- 新規: `src/auth/login.ts`
- 変更: `src/router.ts`
- 削除: なし

## 受け入れ条件への対応
- 条件1: `src/auth/login.ts:42` で実装
- 条件2: `src/auth/login.ts:88` で実装
- 条件3: `src/auth/session.ts:15` で Set-Cookie 設定

## 実行確認
- [ ] ビルド成功: `pnpm build`
- [ ] ユニットテスト: `pnpm test src/auth`
- [ ] 型チェック: `pnpm tsc --noEmit`

## 既知の未対応
- [このラウンドで未着手の項目]

## Evaluator への引き継ぎ
- 検証が必要なフロー: [例「/login へのPOST」]
- 必要な環境: [例「DATABASE_URL 設定済み」]
- 注意点: [例「セッションは 24h 有効」]

# Test Plan: Login Flow

> Markdown形式のテスト計画。Generator が tests/e2e/login.spec.ts に変換する。

## ゴール
ユーザーが /login でログインし、保護ページにアクセスできることを確認する。

## シナリオ

### S1: 正常系 — 有効な認証情報でログイン
1. /login に遷移
2. email に `test@example.com` を入力
3. password に `valid-password` を入力
4. submit ボタンをクリック
5. /dashboard にリダイレクトされることを確認
6. ヘッダーにユーザー名が表示されることを確認

**期待結果**: dashboard ページが表示される / Set-Cookie に sessionId が含まれる

### S2: 異常系 — 無効なパスワード
1. /login に遷移
2. email に `test@example.com` を入力
3. password に `wrong-password` を入力
4. submit ボタンをクリック
5. エラーメッセージが表示されることを確認

**期待結果**: エラーメッセージ「Invalid credentials」が表示される / 401 ステータス

### S3: 異常系 — 空入力
1. /login に遷移
2. submit ボタンをクリック（フィールド空）
3. バリデーションエラーが表示されることを確認

**期待結果**: 各フィールドに required エラーが表示される

## 非機能
- ログインAPI の p95 < 500ms
- パスワードはネットワーク経由で平文送信されない（HTTPS必須）

# Spec: [機能名]

## 背景・目的
なぜこれが必要か、誰のためか。

## スコープ
- やる: [箇条書き]
- やらない: [箇条書き]

## 受け入れ条件（Evaluator が検証する）

各条件は **検証可能** な形で書くこと。

1. [条件1: 例「/login にPOSTすると 200 が返る」]
2. [条件2: 例「無効なパスワードで POST すると 401 が返る」]
3. [条件3: 例「成功時に Set-Cookie ヘッダーに sessionId が含まれる」]

## 非機能要件
- パフォーマンス: [例「p95 < 200ms」]
- セキュリティ: [例「CSRF トークン必須」]
- アクセシビリティ: [例「キーボードのみで完結」]

---

## 検証環境（Evaluator が読む欄・必須）

Evaluator はここに書かれたコマンド以外は実行しません。各プロジェクトのツールに合わせて埋めてください。

### dev server 起動コマンド
```bash
# 例: pnpm dev / npm run dev / cargo run / python manage.py runserver
[ここに実コマンド]
```

### baseURL
```
# 例: http://localhost:3000 / http://localhost:8080
[ここにURL]
```

### ビルドコマンド
```bash
# 例: pnpm build / npm run build / cargo build
[ここに実コマンド]
```

### テスト実行コマンド
```bash
# 例: pnpm test / npm test / pytest
[ここに実コマンド]
```

### E2Eテスト実行コマンド
```bash
# 例: npx playwright test / npx playwright test --trace on
[ここに実コマンド]
```

### カバレッジ計測コマンド（testing.md で80%必須）
```bash
# 例: pnpm test --coverage / npm run coverage / pytest --cov
[ここに実コマンド]
```

### seed/setup コマンド（必要な場合）
```bash
# 例: docker-compose up -d / pnpm db:seed
[必要なら記入、不要なら "なし"]
```

---

## 検証手段
- [ ] ユニットテスト（対象モジュール）
- [ ] 統合テスト（API endpoint）
- [ ] E2E テスト（Playwright で `[フロー名]`）
- [ ] 手動検証（[必要なら]）

## 関連ファイル
- 既存: `src/auth/...`
- 新規: `src/auth/login.ts`

## 承認
- [ ] User: [日時]

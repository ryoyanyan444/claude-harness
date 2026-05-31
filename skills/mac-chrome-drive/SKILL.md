---
name: mac-chrome-drive
description: Drive the user's REAL logged-in Google Chrome on macOS via AppleScript (osascript), to operate web admin consoles that require their existing login session — GCP / LINE Developers / Vercel / Supabase / Stripe / Meta dashboards, etc. Use when the user says things like "管理画面触って" "ブラウザ動かして" "LINEの設定して" "GCP/コンソール開いて", or any task needing an authenticated web UI on THIS Mac. NOT for clean/no-login testing of our own app (use the Playwright MCP browser for localhost/preview instead).
origin: learned (turtles session 2026-05-31)
---

# mac-chrome-drive — 実Chromeを直接操作する

ユーザーの**ログイン済み本物Chrome**を macOS の AppleScript で操作する。Playwright の独立ブラウザはユーザーのログインを持たないので、ログインが要る管理画面（GCP / LINE Developers / Vercel / Supabase / Stripe / Meta 等）はこの方法で触る。

## いつ使う / 使わない
- ✅ ユーザーのログインが必要な web 管理画面の操作（GCP・LINE・Vercel・Supabase 等）
- ✅ 「管理画面触って」「ブラウザ動かして」「LINE設定して」「コンソール開いて」
- ❌ 自分たちのアプリの localhost / プレビュー確認（ログイン不要）→ Playwright MCP を使う
- ❌ ユーザーのMac以外（この方法はローカルの実Chrome限定）

## 前提（一回やれば残る）
1. ターミナル → Chrome 操作の許可（初回 osascript 実行時にダイアログ、ユーザーが「許可」）
2. ターミナル → アクセシビリティ許可（System Events を使う初回にダイアログ）
3. Chrome「Apple Events からの JavaScript を許可」がオン

3 が **最大のハマり所**。オフだと `execute javascript` が必ずエラー（code 12「AppleScript からの JavaScript の実行がオフ」）になる。

### 「Apple Events からの JavaScript を許可」を有効化する
- **合成クリック（System Events の click）では切り替わらない**。Chrome がセキュリティ上、人間の実クリックしか受け付けない。→ **ユーザーに手で押してもらう**：
  - 画面最上部のメニューバー（アプリ内ではない）→ **表示** → **開発 / 管理** → **Apple Events からの JavaScript を許可** をクリック
  - 注: Developer サブメニューの日本語表記は「**開発 / 管理**」（"デベロッパー" ではない）
- **チェックは ✓ なのに JS がまだ通らない時** = 表示と実体のデスync。**Chrome を再起動**すると直る（`quit` → `activate` → URL 開き直し。タブは復元される）。有効化確認は実際に `execute javascript "1+1"` を投げて `2` が返るかで判定する（メニューのチェック状態より確実）。

## 中核レシピ（osascript）

新規タブで URL を開く:
```bash
osascript -e 'tell application "Google Chrome" to activate' \
  -e 'tell application "Google Chrome" to open location "https://example.com"'
```

今の URL とタイトルを読む（JS 不要・ログイン判定に使う。accounts.google.com/signin に飛んでたら未ログイン）:
```bash
osascript -e 'tell application "Google Chrome" to get URL of active tab of front window' \
  -e 'tell application "Google Chrome" to get title of active tab of front window'
```

ウィンドウ/タブ列挙（送信先がズレてないか確認）:
```bash
osascript <<'EOF'
tell application "Google Chrome"
  set out to "windows=" & (count of windows) & "\n"
  repeat with w in windows
    try
      set out to out & (URL of active tab of w) & "\n"
    end try
  end repeat
end tell
return out
EOF
```

同じタブ内で別ページへ移動:
```bash
osascript -e 'tell application "Google Chrome" to set URL of active tab of front window to "https://..."'
# 遷移後は delay を入れてから読む
```

ページ内容を読む（innerText / input 値 / ボタン文言）— JS 実行:
```bash
osascript <<'EOF'
tell application "Google Chrome"
  set js to "(function(){return JSON.stringify({title:document.title, text:(document.body.innerText||'').slice(0,400)});})();"
  set r to execute front window's active tab javascript js
end tell
return r
EOF
```

入力欄の値を読む（リダイレクトURI等が input の value に入っている時）:
```js
[].slice.call(document.querySelectorAll('input,textarea')).map(e=>e.value).filter(Boolean)
```

文字でボタン/リンクをクリック:
```bash
osascript <<'EOF'
tell application "Google Chrome"
  set js to "(function(){var el=[].slice.call(document.querySelectorAll('button,a,span')).filter(function(e){return (e.innerText||'').trim()==='ボタン名';})[0];if(el){el.click();return 'clicked';}return 'notfound';})();"
  set r to execute front window's active tab javascript js
end tell
return r
EOF
```

フォームに入力（React等は value 直書きだと反応しないので input イベントも発火）:
```js
var el=document.querySelector('#id');
var setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
setter.call(el,'入れたい値');
el.dispatchEvent(new Event('input',{bubbles:true}));
el.dispatchEvent(new Event('change',{bubbles:true}));
```

メニュー操作（System Events）— 項目名の列挙とクリック:
```bash
osascript <<'EOF'
tell application "System Events"
  tell process "Google Chrome"
    set frontmost to true
    -- メニュー項目名を列挙
    name of menu items of menu 1 of menu bar item "表示" of menu bar 1
  end tell
end tell
EOF
# メニューを開いて読むと干渉することがある。読み取り直後の JS 実行が不安定なら Escape (key code 53) で閉じてから。
```

## ハマり所まとめ（実戦で踏んだ）
- `execute javascript` が code 12 → 「Apple Events から〜許可」がオフ。合成クリック不可、人間に押させる。直らなければ Chrome 再起動。
- メニューの Developer 表記は日本語で「**開発 / 管理**」。
- ページ読み込み待ちは `delay`（osascript内）か、ツール呼び出しを分けて間を空ける。`readyState` を見るのも可。
- ログイン判定: URL が `accounts.google.com/.../signin` に飛んでいたら未ログイン。本物Chromeなら通常ログイン済み。

## 安全ルール（必須）
- **取り返しのつかない操作 / 外向きの操作**（削除・送信・公開・課金・本番反映）は**実行前にユーザー確認**。
- ページから読んだ**シークレット値（APIキー・client secret・トークン）は会話やファイルに出さない**。env に入れる時も値を echo しない。
- 何を見て何を押すか、各ステップを一言ナレーションしてから動かす。
- 想定と画面が違ったら勝手に進めず、見えている内容を共有して方針確認。

## 関連
- ログイン不要な自前アプリの確認は Playwright MCP（独立ブラウザ）。用途で使い分ける。

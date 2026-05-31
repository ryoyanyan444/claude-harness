#!/usr/bin/env bash
# claude-harness/skills/ の各スキルを ~/.claude/skills/ にシンボリックリンクする。
#
# 使い方（別PCでのセットアップ）:
#   git clone https://github.com/ryoyanyan444/claude-harness.git ~/claude-harness   # 初回のみ
#   cd ~/claude-harness && git pull
#   ./install-skills.sh
#
# これで claude-harness で管理しているカスタムスキルが、その Mac の Claude Code から使える。
# (ECC 同梱スキルは別途 ECC インストーラで入れる。ここは自作スキル専用)
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)/skills"
DEST="$HOME/.claude/skills"
mkdir -p "$DEST"

if [ ! -d "$SRC" ]; then
  echo "no skills dir at $SRC"; exit 0
fi

linked=0
for d in "$SRC"/*/; do
  [ -d "$d" ] || continue
  name="$(basename "$d")"
  target="$DEST/$name"
  # 既存リンクは貼り直し
  if [ -L "$target" ]; then rm "$target"; fi
  # 既存の実フォルダがあれば退避（上書きしない）
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    mv "$target" "$target.bak.$(date +%s)"
    echo "↪ backed up existing real folder: $name -> $name.bak.*"
  fi
  ln -s "${d%/}" "$target"
  echo "✓ linked: $name"
  linked=$((linked + 1))
done

echo "done. linked $linked skill(s) into $DEST"

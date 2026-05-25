# アップデート履歴

---

## ver 1.2 — Notion連携 UI 改善
> 2026-05-25

### ユーザー向け：何が変わったか

#### プレビューパネルの追加（PC）
Notionのページ・DBエントリを選択すると、画面右側に **プレビューパネル** が表示されるようになりました。チェックボックスのオン／オフをリアルタイムで反映するため、AIツールに渡す内容をその場で確認しながら選べます。

#### スマホ対応の強化
- スマホでは右側のプレビューパネルは表示されません。代わりに、本文テキストの下に **「内容を確認する ▼」ボタン** が追加されました。タップすると本文の全文を表示でき、もう一度タップすると折りたたみ状態に戻ります。
- レイアウトをスマホ（縦並び）・PC（横並び）で自動切り替えするようにしました。画面がつぶれる問題を修正しています。

#### ボタンのデザイン改善
「前の画面に戻る」ボタンをアイコンのみから **背景付きの角丸ボタン** に変更し、タップ・クリックしやすくしました。

### 開発者向け：変更ファイルと実装詳細

**変更ファイル：** `app/notion/page.tsx`

| 変更箇所 | 内容 |
|---|---|
| 外側コンテナ | `view === "content"` 時に `max-w-5xl` へ拡張 |
| コンテンツ選択エリア | `flex flex-col lg:flex-row gap-4 lg:items-start` でモバイル縦・PC横レイアウト |
| 左カード | `flex-1 min-w-0 lg:min-w-135` で最小幅を確保（lg以上のみ） |
| 右プレビューパネル | `hidden lg:block w-80 shrink-0 lg:min-w-135 sticky top-4` で追加。`compileContent()` の結果をリアルタイム表示 |
| ページ一覧カード | `lg:min-w-135` を追加 |
| 本文展開ボタン | `bodyExpanded` state で制御。`lg:hidden` によりスマホのみ表示 |
| 本文テキスト | `line-clamp-3` → `bodyExpanded` が `true` のとき制限解除 |
| 戻るボタン | `p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg` で視認性向上 |

**追加 state**

```ts
const [bodyExpanded, setBodyExpanded] = useState(false);
```

**追加 import**

```ts
import { ..., ChevronDown, ChevronUp } from "lucide-react";
```

---

## ver 1.1 — AIライティングツール機能追加
> 2026-05-24

### ユーザー向け：何が変わったか

- **Gemini API連携**：Google の AI（Gemini）を使ったテキスト生成に対応しました。
- **Notion連携**：Notionのデータベース・ページの内容をAIツールの元ネタとして使えるようになりました。
- **SNSツール**：SNS投稿の文章作成機能を追加しました。
- **設定ページ**：APIキーなどの設定を管理する専用ページを追加しました。

### 開発者向け：変更ファイルと実装詳細

- `app/api/notion/` — Notion API連携エンドポイント（databases・pages・content・database-entries）
- `app/writing/` — ブログ・要約・リライト・メール生成ページ
- `app/sns/` — SNS投稿作成ページ
- `app/settings/` — APIキー設定ページ（AES暗号化 + localStorage保存）
- `lib/clientKeys.ts` — 暗号化APIキー管理ユーティリティ
- `lib/rateLimit.ts` — サーバーサイドレート制限（60req/時）

---

## ver 1.0 — 初回リリース
> 2026-05-24

- Next.js App Router によるプロジェクト初期セットアップ

---

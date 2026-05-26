# アップデート履歴

---

## ver 1.12 — 設定ページのカード幅統一・Notion連携のエラー表示バグ修正
> 2026-05-26

### ユーザー向け：何が変わったか

#### 設定ページのカードの大きさが揃った
PCで設定ページを表示したとき、左カラムと右カラムのカード幅が異なって見える問題を修正しました。どちらのカラムも同じ幅で表示されるようになりました。

#### Notion連携でエラーメッセージが消える問題を修正
APIトークンが未設定の状態で「データベース」→「ページ」→「データベース」とタブを切り替えると、「APIトークンが設定されていません」のエラーメッセージが消えてしまう問題を修正しました。

### 開発者向け：変更ファイルと実装詳細

**変更ファイル：** `app/settings/page.tsx`

- 右カラムの `xl:min-w-135` を削除。`flex-1` のみにすることで左右カラムが常に等幅になる
- セキュリティ説明カードに `shadow-sm` を追加（他のカードと視覚的スタイルを統一）

**変更ファイル：** `app/notion/page.tsx`

- `handleTabChange` の "databases" ブランチに `if (databases.length === 0) fetchDatabases()` を追加。タブ切り替え時に `setError("")` でエラーが消えた後、データベース未取得の場合に再フェッチしてエラーを再表示するよう修正

---

## ver 1.11 — エージェントファイルの改行修正・設定ページのiPad Pro対応
> 2026-05-26

### ユーザー向け：何が変わったか

#### iPad Pro / Nexus Hub サイズで設定ページがぺちゃんこになる問題を修正
Googleデベロッパーツールで iPad Pro（1024px 幅）や Nexus Hub などのサイズに切り替えると、設定ページのカードが極端に狭くなる問題を修正しました。1280px 以上の画面でのみ2カラム表示になるように変更しました。

### 開発者向け：変更ファイルと実装詳細

**変更ファイル：** `app/settings/page.tsx`

- 2カラムレイアウトのブレークポイントを `lg:` (1024px) → `xl:` (1280px) に変更（`lg:flex-row` → `xl:flex-row`、`lg:items-start` → `xl:items-start`、右カラムの `lg:min-w-135` → `xl:min-w-135`）
- iPad Pro はちょうど1024px幅のため、`lg:` では2カラムが起動してしまい各カラムが極端に狭くなっていた

**変更ファイル：** `.claude/agents/playwright-ui-reviewer.md`, `.claude/agents/nextjs-best-practices-reviewer.md`

- `description` フィールドの `\\n` リテラルを YAML block scalar（`|-`）形式に変換。エージェントの説明文に `\n` という文字列が表示されていた問題を解消

---

## ver 1.10 — 設定ページのモバイル表示を修正
> 2026-05-26

### ユーザー向け：何が変わったか

#### スマホで設定ページのカードが見切れる問題を修正
スマホで設定ページを開いたとき、カードが画面幅より広くなって右側が見切れていた問題を修正しました。

### 開発者向け：変更ファイルと実装詳細

**変更ファイル：** `app/settings/page.tsx`

- 外側コンテナに `w-full` を追加し、モバイルで幅が確定するように修正
- `items-start` を `lg:items-start` に変更。`items-start` はモバイル (`flex-col`) でも効いており、各カラムが `align-items: start` = content幅に縮まる原因になっていた
- Gemini・Notion の input に `min-w-0` を追加。`flex-1` でも `min-width: auto` により入力欄が縮まず親を押し広げていた問題を解消

---

## ver 1.9 — モバイルの横スクロールを修正
> 2026-05-26

### ユーザー向け：何が変わったか

#### スマホで画面が横にスクロールできてしまう問題を修正
スマホで設定ページなどを開いたとき、画面が横に 45px ほどスクロールできてしまう問題を修正しました。

### 開発者向け：変更ファイルと実装詳細

**変更ファイル：** `app/layout.tsx`

`<main>` タグに `min-w-0` を追加。Flexbox の子要素はデフォルトで `min-width: auto` が適用されるため、コンテンツ幅が親を超えて横スクロールが発生していた。`min-w-0` を付与することで正しく `flex-1` の範囲に収まるようになった。

---

## ver 1.8 — 設定ページのレイアウト崩れを修正
> 2026-05-26

### ユーザー向け：何が変わったか

#### デスクトップで設定ページが横にはみ出す問題を修正
設定ページで右側のカードが画面外にはみ出して見えていた問題を修正しました。

#### モバイルで「暗号化して保存」ボタンが縦に折れる問題を修正
スマホで表示したとき、ボタンのテキストが縦に折り返されて読みにくくなっていた問題を修正しました。

### 開発者向け：変更ファイルと実装詳細

**変更ファイル：** `app/settings/page.tsx`

- 左カラムの `lg:min-w-150` を削除（`flex-1 min-w-0` のみに）。固定の最小幅指定が原因で `max-w-5xl` のコンテナを超えるオーバーフローが発生していた
- 「暗号化して保存」ボタン2か所（Gemini・Notion）に `whitespace-nowrap` を追加。モバイルで1文字幅に折り返されていた問題を解消

---

## ver 1.7 — コード品質改善・バグ修正・バージョン管理の自動化
> 2026-05-26

### ユーザー向け：何が変わったか

#### リセット後、複数タブを開いていても全タブが正しくリセットされるように修正
「APIキーをすべて削除してリセット」を実行したとき、他のタブでアプリを開いていてもリセットが正しく反映されなかった問題を修正しました。

#### 設定ページへのリンクがスムーズに遷移するように修正
Notion連携でエラーが出たときに表示される「設定ページへ →」リンクが、ページ全体を読み直さずにスムーズに移動するようになりました。

### 開発者向け：変更ファイルと実装詳細

**変更ファイル：** `components/UnlockModal.tsx`、`lib/clientKeys.ts`、`components/KeysProvider.tsx`、`app/notion/page.tsx`、`lib/version.ts`、`next.config.ts`、`package.json`

**リセット時の他タブ通知漏れ修正：**
- `lib/clientKeys.ts` に `SESSION_MASTER = "session_master_pw"` を export 追加
- `components/KeysProvider.tsx` でローカル定数を import に統一
- `components/UnlockModal.tsx` のリセット処理に `localStorage.removeItem(SESSION_MASTER)` を追加（他タブへの合図となるキーの削除が抜けていた）

**`<a>` → `next/link` に変更（`app/notion/page.tsx` L318）：**
- 設定ページへのリンクがフルリロードを起こしていたため、SPA遷移に修正

**Notionトークンリセット時のクリア処理の誤発火防止（`app/notion/page.tsx`）：**
- `useRef` で前回の `notionTokenSet` 値を記憶し、`true → false` の変化時のみクリア処理が動くよう修正。初回マウント時に不要なクリアが走っていた問題を解消。

**eslint-disable コメント解消（`app/notion/page.tsx`）：**
- `getToken` 関数を `useCallback` でメモ化し、`fetchDatabases` / `fetchPages` の依存配列に正しく記載できるよう修正。`// eslint-disable-next-line` 2行を削除。

**バージョン管理の自動化：**
- `next.config.ts` で `package.json` の `version` フィールドを `NEXT_PUBLIC_APP_VERSION` 環境変数としてビルド時に埋め込む設定を追加
- `lib/version.ts` が環境変数から読み取るよう変更
- 次回以降は `package.json` の `version` を更新するだけでサイドバーのバージョン表示も自動で反映される

---

## ver 1.6 — Notionリセット後の表示が残る問題を修正
> 2026-05-25

### ユーザー向け：何が変わったか

#### APIキーをリセットした後、Notion連携ページが自動でクリアされるように修正
「APIキーをすべて削除してリセット」を実行した後、Notion連携ページに移動するとDBリストがそのまま表示され続ける問題を修正しました。リセット後はNotionページの内容も即座にクリアされます。

### 開発者向け：変更ファイルと実装詳細

**変更ファイル：** `app/notion/page.tsx`

**原因：** Notionページコンポーネントは取得したDBリスト・ページ一覧をReact stateに保持する。リセット時に `KeysProvider` がトークンを削除しても、Notionページ側のstateには通知が届いていなかった。

**対策：** `useKeys()` から `notionTokenSet` を購読し、`false` に変化したタイミングで全stateをリセットする `useEffect` を追加。

```ts
useEffect(() => {
  if (notionTokenSet) return;
  setDatabases([]); setPages([]); setSelectedDb(null);
  setEntries([]); setSelectedEntry(null);
  setView("db-list"); setActiveTab("databases"); setError("");
}, [notionTokenSet]);
```

---

## ver 1.5 — iOSのズーム・スクロール改善＋バージョン表示追加
> 2026-05-25

### ユーザー向け：何が変わったか

#### 別タブから戻ったときに画面が拡大される問題を修正
Notionなど外部サイトに移動してアプリに戻ると画面がズームされてしまう問題を修正しました。

#### スクロールが引っかかる問題を修正
スマホでスクロールがぎこちなく感じられる問題を修正しました。iOS Safariのネイティブスクロールが使われるようになり、スムーズに動作します。

#### バージョン番号を表示
サイドバーのタイトル「AI Writing」の横にバージョン番号（例：v1.5）が表示されるようになりました。アップデートのたびに番号が変わります。

### 開発者向け：変更ファイルと実装詳細

**変更ファイル：** `components/UnlockModal.tsx`、`app/layout.tsx`、`components/Sidebar.tsx`、`lib/version.ts`（新規）

**ズーム修正：** `UnlockModal` の入力欄から `autoFocus` を削除。ページ復帰時に一瞬 `isLocked` が `true` になる際にiOS Safariが自動フォーカス→ズームしていた。

**スクロール修正：** `html/body` の `h-full` と `main` の `overflow-y-auto` をスマホでは無効化（`md:` プレフィックスに変更）。スマホでは自然なページスクロールを使用し、デスクトップのみ固定レイアウトを維持。

| クラス | 変更前 | 変更後 |
|---|---|---|
| `html` | `h-full` | `md:h-full` |
| `body` | `h-full` | `md:h-full` |
| `main` | `overflow-y-auto` | `md:overflow-y-auto` |

**バージョン表示：** `lib/version.ts` にバージョン定数 `APP_VERSION` を追加。`Sidebar.tsx` のデスクトップサイドバー・スマホトップバー・スマホドロワーの3箇所で表示。

---

## ver 1.4 — スマホでのページ更新時パスワードリセットを修正
> 2026-05-25

### ユーザー向け：何が変わったか

#### ページを更新してもパスワードが維持されるように修正
スマホでページを更新（リロード）するとマスターパスワードがリセットされてAPIキーが使えなくなる問題を修正しました。修正後はページを更新しても自動でロック解除された状態が維持されます。

> APIキーをすべて削除した場合は、パスワードも合わせてクリアされます。

### 開発者向け：変更ファイルと実装詳細

**変更ファイル：** `components/KeysProvider.tsx`、`app/settings/page.tsx`

**原因：** iOS Safariなどのモバイルブラウザはページ更新時に `sessionStorage` をクリアする動作があり、前回（ver 1.3）で追加したパスワードの保存先として不十分だった。

**対策：** マスターパスワードの保存先を `sessionStorage` → `localStorage` に変更。

| 保存先 | 内容 | 消えるタイミング |
|---|---|---|
| `localStorage` | 暗号化済みキー＋マスターパスワード | 手動削除時のみ |
| `sessionStorage` | 復号済みキー（平文） | タブを閉じたとき |
| メモリ変数 | 復号済みキー（キャッシュ） | ページリロード時 |

**`app/settings/page.tsx` の変更点**
- セキュリティ説明文を実態に合わせて更新（「ブラウザを閉じると消えます」→「この端末のブラウザにのみ保存されます」）

---

## ver 1.3 — スマホでのパスワード初期化バグ修正
> 2026-05-25

### ユーザー向け：何が変わったか

#### 外部サイトから戻ってもパスワードが維持されるように修正
スマホで外部サイト（Notionなど）に移動した後アプリに戻ると、マスターパスワードがリセットされてAPIキーが使えなくなる問題を修正しました。修正後は、同じタブを開き続けている限りパスワードを再入力する必要はありません。

> タブを閉じて開き直した場合は、従来通りパスワードの再入力が必要です。

### 開発者向け：変更ファイルと実装詳細

**変更ファイル：** `lib/clientKeys.ts`、`components/KeysProvider.tsx`

**原因：** 復号済みキーとマスターパスワードはJavaScriptのモジュール変数・React stateにのみ保持されていた。スマホブラウザは外部サイトへの移動時にページをリロードするため、メモリが消えてロック状態になっていた。

**対策：** `sessionStorage` を復元用のバックアップとして追加。

| 保存先 | 内容 | 消えるタイミング |
|---|---|---|
| `localStorage` | 暗号化済みキー | 手動削除時のみ |
| `sessionStorage` | 復号済みキー＋パスワード | タブを閉じたとき |
| メモリ変数 | 復号済みキー（キャッシュ） | ページリロード時 |

**`lib/clientKeys.ts` の変更点**
- `getGeminiKey()` / `getNotionToken()`：メモリになければ `sessionStorage` を参照するように変更
- `setInMemoryGeminiKey()` / `setInMemoryNotionToken()`：メモリと同時に `sessionStorage` にも保存するように変更

**`components/KeysProvider.tsx` の変更点**
- `unlock()`：成功時に `sessionStorage` へパスワードを保存
- `initMasterPassword()`：`sessionStorage` へパスワードを保存
- `useEffect`：起動時に `sessionStorage` のパスワードが残っていれば自動復号・自動ロック解除
- `removeGeminiKey()` / `removeNotionToken()`：全キー削除時に `sessionStorage` も合わせてクリア

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

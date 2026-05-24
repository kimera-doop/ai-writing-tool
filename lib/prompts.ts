export function blogPrompt(theme: string, target: string, wordCount: string, tone: string, reference?: string): string {
  return `あなたは優秀なブログライターです。以下の条件でブログ記事を書いてください。

テーマ: ${theme}
ターゲット読者: ${target}
文字数目安: ${wordCount}文字
トーン: ${tone}
${reference ? `\n参照コンテンツ（元ネタとして活用してください）:\n${reference}\n` : ""}
記事は以下の構成で書いてください：
1. 魅力的なタイトル（# タイトル の形式）
2. 導入部（読者の興味を引く）
3. 本文（## 見出し を使って内容を整理する）
4. まとめ

マークダウン形式で記述してください。`;
}

export function emailPrompt(purpose: string, recipient: string, content: string, tone: string): string {
  return `あなたはビジネスメール作成の専門家です。以下の条件でメールを作成してください。

目的: ${purpose}
宛先: ${recipient}
内容の概要: ${content}
トーン: ${tone}

以下の形式で出力してください：
件名: [件名]

[本文]`;
}

export function summaryPrompt(text: string, length: string, format: string): string {
  return `以下のテキストを要約してください。

要約の長さ: ${length}
形式: ${format}

テキスト:
${text}

指定された形式と長さで要約のみを出力してください。`;
}

export function rewritePrompt(text: string, direction: string): string {
  return `以下の文章をリライトしてください。

変更の方向性: ${direction}
注意事項: 元の意味を変えずに、指定された方向性で改善してください。

元の文章:
${text}

リライト後の文章のみを出力してください。`;
}

export function snsXPrompt(content: string): string {
  return `以下の内容を基に、X（旧Twitter）への日本語投稿文を作成してください。

条件：
- 日本語で140文字以内（ハッシュタグ含む）
- 関連するハッシュタグを2〜3個付ける
- 読者の関心を引く書き方
- 個人ブランディングに適した内容

元の内容：
${content}

140文字以内の投稿文（ハッシュタグ含む）のみを出力してください。文字数の説明は不要です。`;
}

export function snsFacebookPrompt(content: string): string {
  return `以下の内容を基に、Facebook向けの投稿文を作成してください。

条件：
- 親しみやすく温かみのある文体
- 適度に絵文字を使う
- 読みやすい改行を入れる
- 300〜500文字程度
- 個人ブランディングに適した内容

元の内容：
${content}

投稿文のみを出力してください。`;
}

export function snsWantedlyPrompt(content: string): string {
  return `以下の内容を基に、Wantedlyのストーリー記事を作成してください。

【文体・トーンの条件】
- 一人称（私）で語る、親しみやすく正直な文体
- 冒頭は「読者が抱きがちな思い込み」や「共感できる問い」から入る
- 課題・きっかけ → 行動・経過 → 苦戦した点 → 気づき・学び → 今後の展望 の流れで書く
- 苦戦や失敗・気づいたことを包み隠さず正直に書く
- 数字や成果より「そこで感じたこと・変わったこと」を前面に出す
- 読んでいる人が「自分もそうかも」と感じられる言葉を選ぶ
- 体験を通じて得た本質的な気づきを、自分の言葉で締めくくる

【フォーマットの条件】
- 800〜1200文字程度
- 読みやすい構成（## 見出し付き）
- マークダウン形式

元の内容：
${content}

記事のみを出力してください。`;
}

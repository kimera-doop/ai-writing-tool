import { getGeminiKey } from "./clientKeys";

export async function generateContent(prompt: string): Promise<string> {
  const key = getGeminiKey();
  if (!key) {
    throw new Error(
      "Gemini APIキーが設定されていません。設定ページでAPIキーを入力してください。"
    );
  }

  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // サーバーへキーを渡す（HTTPS通信のため盗聴不可）
      "X-Gemini-Key": key,
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "不明なエラー" }));
    throw new Error(error.error || "生成に失敗しました");
  }

  const data = await response.json();
  return data.text;
}

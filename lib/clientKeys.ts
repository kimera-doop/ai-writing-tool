"use client";

// ブラウザのメモリ上にのみ保存（ページを閉じると消える）
let _geminiKey: string | null = null;
let _notionToken: string | null = null;

export const ENC_GEMINI_STORAGE = "enc_gemini_key";
export const ENC_NOTION_STORAGE = "enc_notion_token";

/** 復号済みGemini APIキーをメモリから取得 */
export function getGeminiKey(): string | null {
  return _geminiKey;
}

/** 復号済みGemini APIキーをメモリにセット */
export function setInMemoryGeminiKey(key: string | null): void {
  _geminiKey = key;
}

/** 復号済みNotionトークンをメモリから取得 */
export function getNotionToken(): string | null {
  return _notionToken;
}

/** 復号済みNotionトークンをメモリにセット */
export function setInMemoryNotionToken(token: string | null): void {
  _notionToken = token;
}

/** localStorageに暗号化済みキーが存在するか確認 */
export function hasEncryptedKeys(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    localStorage.getItem(ENC_GEMINI_STORAGE) ||
    localStorage.getItem(ENC_NOTION_STORAGE)
  );
}

"use client";

// ブラウザのメモリ上にキャッシュ（高速アクセス用）
let _geminiKey: string | null = null;
let _notionToken: string | null = null;

export const ENC_GEMINI_STORAGE = "enc_gemini_key";
export const ENC_NOTION_STORAGE = "enc_notion_token";
export const SESSION_MASTER = "session_master_pw";

// sessionStorage キー（タブを閉じると消える）
const SESSION_GEMINI = "session_gemini_key";
const SESSION_NOTION = "session_notion_token";

/** 復号済みGemini APIキーを取得（メモリ → sessionStorage の順で探す） */
export function getGeminiKey(): string | null {
  if (_geminiKey) return _geminiKey;
  if (typeof window !== "undefined") {
    const val = sessionStorage.getItem(SESSION_GEMINI);
    if (val) { _geminiKey = val; return val; }
  }
  return null;
}

/** 復号済みGemini APIキーをメモリとsessionStorageにセット */
export function setInMemoryGeminiKey(key: string | null): void {
  _geminiKey = key;
  if (typeof window !== "undefined") {
    if (key) sessionStorage.setItem(SESSION_GEMINI, key);
    else sessionStorage.removeItem(SESSION_GEMINI);
  }
}

/** 復号済みNotionトークンを取得（メモリ → sessionStorage の順で探す） */
export function getNotionToken(): string | null {
  if (_notionToken) return _notionToken;
  if (typeof window !== "undefined") {
    const val = sessionStorage.getItem(SESSION_NOTION);
    if (val) { _notionToken = val; return val; }
  }
  return null;
}

/** 復号済みNotionトークンをメモリとsessionStorageにセット */
export function setInMemoryNotionToken(token: string | null): void {
  _notionToken = token;
  if (typeof window !== "undefined") {
    if (token) sessionStorage.setItem(SESSION_NOTION, token);
    else sessionStorage.removeItem(SESSION_NOTION);
  }
}

/** localStorageに暗号化済みキーが存在するか確認 */
export function hasEncryptedKeys(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    localStorage.getItem(ENC_GEMINI_STORAGE) ||
    localStorage.getItem(ENC_NOTION_STORAGE)
  );
}

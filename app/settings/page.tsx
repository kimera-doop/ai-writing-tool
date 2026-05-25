"use client";

import { useState } from "react";
import { Eye, EyeOff, CheckCircle, Trash2, Lock, KeyRound, Loader2 } from "lucide-react";
import { useKeys } from "@/components/KeysProvider";

export default function SettingsPage() {
  const {
    masterPassword,
    isLocked,
    geminiKeySet,
    notionTokenSet,
    initMasterPassword,
    saveGeminiKey,
    saveNotionToken,
    removeGeminiKey,
    removeNotionToken,
  } = useKeys();

  // マスターパスワード設定フォーム
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Gemini APIキーフォーム
  const [geminiInput, setGeminiInput] = useState("");
  const [geminiShow, setGeminiShow] = useState(false);
  const [geminiSaving, setGeminiSaving] = useState(false);
  const [geminiSaved, setGeminiSaved] = useState(false);
  const [geminiError, setGeminiError] = useState("");

  // Notion トークンフォーム
  const [notionInput, setNotionInput] = useState("");
  const [notionShow, setNotionShow] = useState(false);
  const [notionSaving, setNotionSaving] = useState(false);
  const [notionSaved, setNotionSaved] = useState(false);
  const [notionError, setNotionError] = useState("");

  const validatePassword = (pwd: string): string[] => {
    const missing: string[] = [];
    if (pwd.length < 8) missing.push("8文字以上");
    if (!/[A-Z]/.test(pwd)) missing.push("大文字（A〜Z）");
    if (!/[a-z]/.test(pwd)) missing.push("小文字（a〜z）");
    if (!/[0-9]/.test(pwd)) missing.push("数字（0〜9）");
    if (!/[^A-Za-z0-9]/.test(pwd)) missing.push("記号（!@#$%など）");
    return missing;
  };

  const handleSetPassword = () => {
    const missing = validatePassword(newPassword);
    if (missing.length > 0) {
      setPasswordError(`次の条件が不足しています：${missing.join("、")}`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("パスワードが一致しません");
      return;
    }
    setPasswordError("");
    initMasterPassword(newPassword);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2000);
  };

  const handleSaveGemini = async () => {
    if (!geminiInput.trim()) return;
    setGeminiSaving(true);
    setGeminiError("");
    try {
      await saveGeminiKey(geminiInput.trim());
      setGeminiInput("");
      setGeminiSaved(true);
      setTimeout(() => setGeminiSaved(false), 2000);
    } catch (e) {
      setGeminiError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setGeminiSaving(false);
    }
  };

  const handleSaveNotion = async () => {
    if (!notionInput.trim()) return;
    setNotionSaving(true);
    setNotionError("");
    try {
      await saveNotionToken(notionInput.trim());
      setNotionInput("");
      setNotionSaved(true);
      setTimeout(() => setNotionSaved(false), 2000);
    } catch (e) {
      setNotionError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setNotionSaving(false);
    }
  };

  if (isLocked) {
    return (
      <div className="p-4 md:p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">設定</h1>
        <p className="text-gray-500 text-sm">
          設定を変更するには、まずロック解除画面でマスターパスワードを入力してください。
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <p className="text-gray-500 mt-1 text-sm">
          APIキーはマスターパスワードで暗号化されてブラウザに保存されます
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* 左カラム：設定フォーム群 */}
      <div className="flex-1 min-w-0 lg:min-w-150 space-y-4">

        {/* ── マスターパスワード ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
            <Lock size={16} className="text-indigo-500" />
            マスターパスワード
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            APIキーを暗号化するためのパスワードです。このパスワード自体は保存されません。ブラウザを開くたびに入力が必要です。
          </p>

          {masterPassword ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
              <CheckCircle size={15} />
              このセッションでは設定済みです
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新しいマスターパスワード（8文字以上）"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
                placeholder="もう一度入力"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
              <button
                onClick={handleSetPassword}
                disabled={!newPassword || !confirmPassword}
                className={`w-full py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed ${
                  passwordSaved
                    ? "bg-green-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white"
                }`}
              >
                {passwordSaved ? "設定しました！" : "マスターパスワードを設定"}
              </button>
            </div>
          )}
        </div>

        {/* ── Gemini APIキー ── */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${!masterPassword ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <KeyRound size={16} className="text-blue-500" />
              Gemini APIキー <span className="text-red-500 text-xs font-normal">（必須）</span>
            </h2>
            {geminiKeySet && (
              <span className="flex items-center gap-1 text-green-600 text-xs">
                <CheckCircle size={13} />
                暗号化済み・保存済み
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            AIによる文章生成に使用します。
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:underline ml-1"
            >
              Google AI Studioで無料取得 →
            </a>
          </p>

          {geminiKeySet && (
            <div className="flex items-center gap-2 mb-3 bg-gray-50 rounded-lg px-4 py-2.5">
              <span className="text-sm font-mono text-gray-500 flex-1">
                {geminiShow ? "（復号にはロック解除が必要です）" : "••••••••••••••••••••"}
              </span>
              <button
                onClick={() => setGeminiShow(!geminiShow)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {geminiShow ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={() => {
                  if (confirm("Gemini APIキーを削除しますか？")) removeGeminiKey();
                }}
                className="text-gray-400 hover:text-red-500 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="password"
              value={geminiInput}
              onChange={(e) => setGeminiInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveGemini()}
              placeholder={geminiKeySet ? "新しいキーを入力して上書き" : "AIzaSy..."}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
            />
            <button
              onClick={handleSaveGemini}
              disabled={!geminiInput.trim() || geminiSaving || !masterPassword}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed ${
                geminiSaved
                  ? "bg-green-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white"
              }`}
            >
              {geminiSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : geminiSaved ? (
                "保存しました！"
              ) : (
                "暗号化して保存"
              )}
            </button>
          </div>
          {geminiError && <p className="text-red-500 text-sm mt-2">{geminiError}</p>}
        </div>

        {/* ── Notion APIトークン ── */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${!masterPassword ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <KeyRound size={16} className="text-gray-500" />
              Notion APIトークン <span className="text-gray-400 text-xs font-normal">（オプション）</span>
            </h2>
            {notionTokenSet && (
              <span className="flex items-center gap-1 text-green-600 text-xs">
                <CheckCircle size={13} />
                暗号化済み・保存済み
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            NotionのページをAIのネタ元に使う場合のみ必要です。
            <a
              href="https://www.notion.so/my-integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:underline ml-1"
            >
              Notionでインテグレーション作成 →
            </a>
          </p>

          {notionTokenSet && (
            <div className="flex items-center gap-2 mb-3 bg-gray-50 rounded-lg px-4 py-2.5">
              <span className="text-sm font-mono text-gray-500 flex-1">
                {notionShow ? "（復号にはロック解除が必要です）" : "••••••••••••••••••••"}
              </span>
              <button
                onClick={() => setNotionShow(!notionShow)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {notionShow ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={() => {
                  if (confirm("Notionトークンを削除しますか？")) removeNotionToken();
                }}
                className="text-gray-400 hover:text-red-500 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="password"
              value={notionInput}
              onChange={(e) => setNotionInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveNotion()}
              placeholder={notionTokenSet ? "新しいトークンを入力して上書き" : "secret_..."}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
            />
            <button
              onClick={handleSaveNotion}
              disabled={!notionInput.trim() || notionSaving || !masterPassword}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed ${
                notionSaved
                  ? "bg-green-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white"
              }`}
            >
              {notionSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : notionSaved ? (
                "保存しました！"
              ) : (
                "暗号化して保存"
              )}
            </button>
          </div>
          {notionError && <p className="text-red-500 text-sm mt-2">{notionError}</p>}
        </div>

      </div>

      {/* 右カラム：セキュリティ説明＋リセット */}
      <div className="flex-1 min-w-0 lg:min-w-135 space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-sm text-blue-700">
          <p className="font-semibold mb-2">セキュリティについて</p>
          <ul className="space-y-2 list-disc list-inside text-blue-600">
            <li>APIキーはAES-256で暗号化されてブラウザに保存されます</li>
            <li>DevToolsで見ても暗号化された文字列のみ表示されます</li>
            <li>マスターパスワードはこの端末のブラウザにのみ保存されます</li>
            <li>パスワードを忘れた場合はキーを削除して再入力が必要です</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
          <h2 className="font-semibold text-red-600 mb-1">データのリセット</h2>
          <p className="text-sm text-gray-500 mb-4">
            保存されているすべての暗号化APIキーを削除します。マスターパスワードを変更したい場合や、最初からやり直したい場合に使用してください。
          </p>
          <button
            onClick={() => {
              if (confirm("保存されているすべてのAPIキーが削除されます。本当にリセットしますか？\n\nリセット後は設定画面でAPIキーを再登録してください。")) {
                removeGeminiKey();
                removeNotionToken();
              }
            }}
            className="w-full py-2 border border-red-300 text-red-500 hover:bg-red-50 font-medium rounded-lg text-sm transition-colors cursor-pointer"
          >
            APIキーをすべて削除してリセット
          </button>
        </div>
      </div>

      </div>
    </div>
  );
}

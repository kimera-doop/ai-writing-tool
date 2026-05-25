"use client";

import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { useKeys } from "./KeysProvider";
import { ENC_GEMINI_STORAGE, ENC_NOTION_STORAGE } from "@/lib/clientKeys";

export default function UnlockModal() {
  const { isLocked, unlock } = useKeys();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isLocked) return null;

  const handleUnlock = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    const ok = await unlock(password);
    setLoading(false);
    if (!ok) {
      setError("パスワードが違います。もう一度入力してください。");
      setPassword("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
            <Lock size={22} className="text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">ロック解除</h2>
          <p className="text-sm text-gray-500 mt-1 text-center">
            マスターパスワードを入力してAPIキーを復号します
          </p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
          placeholder="マスターパスワード"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-3"
        />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={handleUnlock}
          disabled={!password.trim() || loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              復号中...
            </>
          ) : (
            "ロック解除"
          )}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          パスワードはサーバーに送信されません
        </p>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center mb-2">パスワードを忘れた場合</p>
          <button
            onClick={() => {
              if (confirm("保存されているすべてのAPIキーが削除されます。リセットしてよいですか？\n\n※リセット後、設定画面でAPIキーを再登録してください。")) {
                localStorage.removeItem(ENC_GEMINI_STORAGE);
                localStorage.removeItem(ENC_NOTION_STORAGE);
                window.location.reload();
              }
            }}
            className="w-full py-2 border border-red-300 text-red-500 hover:bg-red-50 font-medium rounded-xl text-sm transition-colors cursor-pointer"
          >
            APIキーをすべて削除してリセット
          </button>
        </div>
      </div>
    </div>
  );
}

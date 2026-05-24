"use client";

import { useState, useEffect } from "react";
import { generateContent } from "@/lib/gemini";
import { emailPrompt } from "@/lib/prompts";
import { getLastResult, saveLastResult, deleteLastResult } from "@/lib/history";
import CollapsibleOutput from "@/components/CollapsibleOutput";
import { Loader2 } from "lucide-react";

export default function EmailPage() {
  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState("取引先");
  const [content, setContent] = useState("");
  const [tone, setTone] = useState("丁寧");
  const [output, setOutput] = useState("");
  const [outputTitle, setOutputTitle] = useState("");
  const [justGenerated, setJustGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const nc = sessionStorage.getItem("notion_content");
    if (nc) {
      setContent(nc);
      sessionStorage.removeItem("notion_content");
    }
    const saved = getLastResult("email");
    if (saved) {
      setOutput(saved.content);
      setOutputTitle(saved.title);
      setJustGenerated(false);
    }
  }, []);

  const handleGenerate = async () => {
    if (!purpose.trim() || !content.trim()) {
      setError("目的と内容の概要を入力してください");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const prompt = emailPrompt(purpose, recipient, content, tone);
      const result = await generateContent(prompt);
      const title = `${purpose}（${recipient}宛）`;
      setOutput(result);
      setOutputTitle(title);
      setJustGenerated(true);
      saveLastResult("email", title, result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">メール作成</h1>
        <p className="text-gray-500 mt-1">
          目的と宛先を入力するだけで、ビジネスメールを自動作成します
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールの目的 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="例: 会議の日程調整、契約更新のお願い"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              宛先
            </label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option>取引先</option>
              <option>上司</option>
              <option>同僚</option>
              <option>部下</option>
              <option>顧客</option>
              <option>社外の方</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              トーン
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option>丁寧</option>
              <option>フォーマル</option>
              <option>カジュアル</option>
              <option>フレンドリー</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            内容の概要 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="例: 来週の月曜日に会議を設定したい。オンラインで30分程度。"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              作成中...
            </>
          ) : (
            "メールを作成する"
          )}
        </button>
      </div>

      {output && (
        <div className="mt-6">
          <CollapsibleOutput
            title={outputTitle}
            content={output}
            defaultOpen={justGenerated}
            onDelete={() => {
              deleteLastResult("email");
              setOutput("");
              setOutputTitle("");
            }}
          />
        </div>
      )}
    </div>
  );
}

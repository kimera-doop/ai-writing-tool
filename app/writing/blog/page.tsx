"use client";

import { useState, useEffect } from "react";
import { generateContent } from "@/lib/gemini";
import { blogPrompt } from "@/lib/prompts";
import { getLastResult, saveLastResult, deleteLastResult } from "@/lib/history";
import CollapsibleOutput from "@/components/CollapsibleOutput";
import { Loader2 } from "lucide-react";

export default function BlogPage() {
  const [theme, setTheme] = useState("");
  const [target, setTarget] = useState("");
  const [wordCount, setWordCount] = useState("1000");
  const [tone, setTone] = useState("フォーマル");
  const [notionRef, setNotionRef] = useState("");
  const [output, setOutput] = useState("");
  const [outputTitle, setOutputTitle] = useState("");
  const [justGenerated, setJustGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const nc = sessionStorage.getItem("notion_content");
    if (nc) {
      setNotionRef(nc);
      sessionStorage.removeItem("notion_content");
    }
    const saved = getLastResult("blog");
    if (saved) {
      setOutput(saved.content);
      setOutputTitle(saved.title);
      setJustGenerated(false);
    }
  }, []);

  const handleGenerate = async () => {
    if (!theme.trim()) {
      setError("テーマを入力してください");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const prompt = blogPrompt(theme, target || "一般読者", wordCount, tone, notionRef || undefined);
      const result = await generateContent(prompt);
      setOutput(result);
      setOutputTitle(theme);
      setJustGenerated(true);
      saveLastResult("blog", theme, result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ブログ記事生成</h1>
        <p className="text-gray-500 mt-1">
          テーマを入力するだけで、見出し付きのブログ記事を自動生成します
        </p>
      </div>

      {notionRef && (
        <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-sm text-indigo-700 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium mb-0.5">Notionから参照コンテンツを読み込みました</p>
            <p className="text-xs text-indigo-500 truncate">{notionRef.slice(0, 80)}…</p>
          </div>
          <button onClick={() => setNotionRef("")} className="text-indigo-400 hover:text-indigo-600 shrink-0 cursor-pointer text-xs">解除</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            テーマ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="例: 副業でブログを始めるメリット"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ターゲット読者
          </label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="例: 20〜30代の会社員"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              文字数目安
            </label>
            <select
              value={wordCount}
              onChange={(e) => setWordCount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="500">500文字</option>
              <option value="1000">1000文字</option>
              <option value="1500">1500文字</option>
              <option value="2000">2000文字</option>
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
              <option>フォーマル</option>
              <option>カジュアル</option>
              <option>親しみやすい</option>
              <option>専門的</option>
            </select>
          </div>
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
              生成中...（少しお待ちください）
            </>
          ) : (
            "記事を生成する"
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
              deleteLastResult("blog");
              setOutput("");
              setOutputTitle("");
            }}
          />
        </div>
      )}
    </div>
  );
}

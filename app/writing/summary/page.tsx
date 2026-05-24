"use client";

import { useState, useEffect } from "react";
import { generateContent } from "@/lib/gemini";
import { summaryPrompt } from "@/lib/prompts";
import { getLastResult, saveLastResult, deleteLastResult } from "@/lib/history";
import CollapsibleOutput from "@/components/CollapsibleOutput";
import { Loader2 } from "lucide-react";

export default function SummaryPage() {
  const [text, setText] = useState("");
  const [length, setLength] = useState("中（300字程度）");
  const [format, setFormat] = useState("箇条書き");
  const [output, setOutput] = useState("");
  const [outputTitle, setOutputTitle] = useState("");
  const [justGenerated, setJustGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const nc = sessionStorage.getItem("notion_content");
    if (nc) {
      setText(nc);
      sessionStorage.removeItem("notion_content");
    }
    const saved = getLastResult("summary");
    if (saved) {
      setOutput(saved.content);
      setOutputTitle(saved.title);
      setJustGenerated(false);
    }
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("要約するテキストを入力してください");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const prompt = summaryPrompt(text, length, format);
      const result = await generateContent(prompt);
      const preview = text.slice(0, 25).replace(/\n/g, " ");
      const title = `要約：${preview}${text.length > 25 ? "…" : ""}`;
      setOutput(result);
      setOutputTitle(title);
      setJustGenerated(true);
      saveLastResult("summary", title, result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">要約</h1>
        <p className="text-gray-500 mt-1">長い文章を読みやすい形に要約します</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            要約するテキスト <span className="text-red-500">*</span>
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="要約したいテキストを貼り付けてください..."
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              要約の長さ
            </label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option>短（100字程度）</option>
              <option>中（300字程度）</option>
              <option>長（500字程度）</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              形式
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option>箇条書き</option>
              <option>段落形式</option>
              <option>見出し付き</option>
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
              要約中...
            </>
          ) : (
            "要約する"
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
              deleteLastResult("summary");
              setOutput("");
              setOutputTitle("");
            }}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { generateContent } from "@/lib/gemini";
import { rewritePrompt } from "@/lib/prompts";
import { getLastResult, saveLastResult, deleteLastResult } from "@/lib/history";
import CollapsibleOutput from "@/components/CollapsibleOutput";
import { Loader2 } from "lucide-react";

export default function RewritePage() {
  const [text, setText] = useState("");
  const [direction, setDirection] = useState("よりフォーマルに");
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
    const saved = getLastResult("rewrite");
    if (saved) {
      setOutput(saved.content);
      setOutputTitle(saved.title);
      setJustGenerated(false);
    }
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("リライトする文章を入力してください");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const prompt = rewritePrompt(text, direction);
      const result = await generateContent(prompt);
      const title = `リライト（${direction}）`;
      setOutput(result);
      setOutputTitle(title);
      setJustGenerated(true);
      saveLastResult("rewrite", title, result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">リライト</h1>
        <p className="text-gray-500 mt-1">
          既存の文章を指定した方向性で改善します
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            変更の方向性
          </label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option>よりフォーマルに</option>
            <option>よりカジュアルに</option>
            <option>より簡潔に</option>
            <option>より詳しく</option>
            <option>読みやすく整理</option>
            <option>説得力を高める</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            元の文章 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="リライトしたい文章を入力してください..."
            rows={8}
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
              リライト中...
            </>
          ) : (
            "リライトする"
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
              deleteLastResult("rewrite");
              setOutput("");
              setOutputTitle("");
            }}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { generateContent } from "@/lib/gemini";
import { snsXPrompt, snsFacebookPrompt, snsWantedlyPrompt } from "@/lib/prompts";
import { saveSnsContent } from "@/lib/storage";
import CopyButton from "@/components/CopyButton";
import { Loader2, Save, Check } from "lucide-react";

type Platform = "x" | "facebook" | "wantedly";

const tabs: { id: Platform; label: string; emoji: string }[] = [
  { id: "x", label: "X（Twitter）", emoji: "𝕏" },
  { id: "facebook", label: "Facebook", emoji: "📘" },
  { id: "wantedly", label: "Wantedly", emoji: "🟢" },
];

export default function SnsCreatePage() {
  const [topic, setTopic] = useState("");
  const [activeTab, setActiveTab] = useState<Platform>("x");
  const [outputs, setOutputs] = useState<Record<Platform, string>>({
    x: "",
    facebook: "",
    wantedly: "",
  });
  const [loading, setLoading] = useState<Platform | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Notionページから遷移してきた場合、内容を自動入力する
  useEffect(() => {
    const notionContent = sessionStorage.getItem("notion_content");
    if (notionContent) {
      setTopic(notionContent);
      sessionStorage.removeItem("notion_content");
    }
  }, []);

  const generateForPlatform = async (platform: Platform): Promise<string> => {
    let prompt = "";
    if (platform === "x") prompt = snsXPrompt(topic);
    else if (platform === "facebook") prompt = snsFacebookPrompt(topic);
    else prompt = snsWantedlyPrompt(topic);
    return generateContent(prompt);
  };

  const handleGenerateSingle = async (platform: Platform) => {
    if (!topic.trim()) {
      setError("トピックや内容を入力してください");
      return;
    }
    setError("");
    setLoading(platform);
    try {
      const result = await generateForPlatform(platform);
      setOutputs((prev) => ({ ...prev, [platform]: result }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateAll = async () => {
    if (!topic.trim()) {
      setError("トピックや内容を入力してください");
      return;
    }
    setError("");
    const platforms: Platform[] = ["x", "facebook", "wantedly"];
    const errors: string[] = [];
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      setLoading(platform);
      try {
        const result = await generateForPlatform(platform);
        setOutputs((prev) => ({ ...prev, [platform]: result }));
      } catch (e) {
        errors.push(`${platform === "x" ? "X" : platform === "facebook" ? "Facebook" : "Wantedly"}：${e instanceof Error ? e.message : "エラー"}`);
      }
      setLoading(null);
      // レート制限対策：次のAPI呼び出しまで2秒待機
      if (i < platforms.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    if (errors.length > 0) {
      setError(errors.join(" / "));
    }
  };

  const handleSave = () => {
    const hasContent = outputs.x || outputs.facebook || outputs.wantedly;
    if (!hasContent) return;
    saveSnsContent({
      topic,
      xContent: outputs.x,
      facebookContent: outputs.facebook,
      wantedlyContent: outputs.wantedly,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasAnyOutput = outputs.x || outputs.facebook || outputs.wantedly;

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SNSコンテンツ作成</h1>
        <p className="text-gray-500 mt-1">
          トピックを入力して、各SNS向けの投稿文を自動生成します
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            トピック・内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="今日あったこと、書いたブログ記事の内容、伝えたいことなどを自由に入力してください..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* 一括生成 */}
        <button
          onClick={handleGenerateAll}
          disabled={loading !== null}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading !== null && loading !== "x" && loading !== "facebook" && loading !== "wantedly" ? (
            <><Loader2 size={16} className="animate-spin" />生成中...</>
          ) : (
            "全プラットフォームで一括生成"
          )}
        </button>

        {/* 個別生成 */}
        <div className="flex gap-2">
          {(["x", "facebook", "wantedly"] as Platform[]).map((platform) => {
            const label = platform === "x" ? "𝕏 のみ" : platform === "facebook" ? "Facebook のみ" : "Wantedly のみ";
            return (
              <button
                key={platform}
                onClick={() => handleGenerateSingle(platform)}
                disabled={loading !== null}
                className="flex-1 py-2 border border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-40 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading === platform ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : null}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {hasAnyOutput && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* タブ */}
          <div className="flex border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.emoji} {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {outputs[activeTab] ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => handleGenerateSingle(activeTab)}
                    disabled={loading !== null}
                    className="text-xs text-gray-400 hover:text-indigo-600 disabled:text-gray-300 flex items-center gap-1 cursor-pointer"
                  >
                    {loading === activeTab ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      "↺ 再生成"
                    )}
                  </button>
                  <CopyButton text={outputs[activeTab]} />
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                  {outputs[activeTab]}
                </pre>
                {activeTab === "x" && (
                  <p className="mt-3 text-xs text-gray-400">
                    文字数: {outputs.x.length} 文字
                    {outputs.x.length > 140 && (
                      <span className="text-red-500 ml-2">
                        ※140文字を超えています。再生成を試してください。
                      </span>
                    )}
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">まだ生成されていません</p>
                <button
                  onClick={() => handleGenerateSingle(activeTab)}
                  disabled={loading !== null}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  このプラットフォームだけ生成する
                </button>
              </div>
            )}
          </div>

          <div className="px-6 pb-6 border-t border-gray-50 pt-4">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                saved
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
              {saved ? "保存しました！" : "ライブラリに保存"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  getSnsLibrary,
  updateSnsStatus,
  deleteSnsContent,
  SnsContent,
} from "@/lib/storage";
import CopyButton from "@/components/CopyButton";
import { Trash2, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

type Platform = "x" | "facebook" | "wantedly";

const platformTabs: { id: Platform; label: string }[] = [
  { id: "x", label: "X（Twitter）" },
  { id: "facebook", label: "Facebook" },
  { id: "wantedly", label: "Wantedly" },
];

function getContent(item: SnsContent, platform: Platform): string {
  if (platform === "x") return item.xContent;
  if (platform === "facebook") return item.facebookContent;
  return item.wantedlyContent;
}

export default function SnsLibraryPage() {
  const [library, setLibrary] = useState<SnsContent[]>([]);
  const [activeTab, setActiveTab] = useState<Platform>("x");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLibrary(getSnsLibrary());
  }, []);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleMarkPosted = (id: string) => {
    updateSnsStatus(id, "posted");
    setLibrary(getSnsLibrary());
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("このコンテンツを削除しますか？")) return;
    deleteSnsContent(id);
    setOpenIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    setLibrary(getSnsLibrary());
  };

  const visibleItems = library.filter((item) => getContent(item, activeTab));

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SNSライブラリ</h1>
        <p className="text-gray-500 mt-1">生成したSNSコンテンツを管理します</p>
      </div>

      {/* プラットフォームタブ */}
      <div className="flex gap-2 mb-6">
        {platformTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">
            {library.length === 0
              ? "保存されたコンテンツがありません"
              : "このプラットフォーム向けのコンテンツがありません"}
          </p>
          <a
            href="/sns/create"
            className="inline-block mt-3 text-sm text-indigo-600 hover:text-indigo-700"
          >
            SNSコンテンツを作成する →
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const content = getContent(item, activeTab);
            const isOpen = openIds.has(item.id);
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100"
              >
                {/* ヘッダー（クリックで開閉） */}
                <button
                  onClick={() => toggleOpen(item.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-xs text-gray-400 mb-0.5">
                      {new Date(item.createdAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {item.topic.slice(0, 60)}{item.topic.length > 60 ? "…" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        item.status === "posted"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.status === "posted" ? (
                        <><CheckCircle size={10} />投稿済み</>
                      ) : (
                        <><Clock size={10} />下書き</>
                      )}
                    </span>
                    <span
                      role="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="削除"
                    >
                      <Trash2 size={14} />
                    </span>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* 展開コンテンツ */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed mb-4">
                      {content}
                    </pre>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CopyButton text={content} />
                      {item.status === "draft" && (
                        <button
                          onClick={() => handleMarkPosted(item.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <CheckCircle size={14} />
                          投稿済みにする
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

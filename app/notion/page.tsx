"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  FileText,
  Loader2,
  ExternalLink,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { getNotionToken } from "@/lib/clientKeys";

interface NotionDatabase {
  id: string;
  title: string;
  url: string;
}

interface NotionEntry {
  id: string;
  title: string;
  snippet: string;
  content: string;
  url: string;
  createdAt: string;
}

type View = "db-list" | "entry-list" | "content";

const destinations = [
  { label: "ブログ記事生成に使う", href: "/writing/blog", color: "bg-blue-600 hover:bg-blue-700" },
  { label: "SNS投稿の作成に使う", href: "/sns/create", color: "bg-pink-600 hover:bg-pink-700" },
  { label: "要約に使う", href: "/writing/summary", color: "bg-purple-600 hover:bg-purple-700" },
  { label: "リライトに使う", href: "/writing/rewrite", color: "bg-orange-600 hover:bg-orange-700" },
  { label: "メール作成に使う", href: "/writing/email", color: "bg-green-600 hover:bg-green-700" },
];

export default function NotionPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("db-list");

  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [selectedDb, setSelectedDb] = useState<NotionDatabase | null>(null);
  const [entries, setEntries] = useState<NotionEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<NotionEntry | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getToken = () => {
    const token = getNotionToken();
    if (!token) {
      setError("Notion APIトークンが設定されていません。設定ページで入力してください。");
      return null;
    }
    return token;
  };

  const fetchDatabases = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError("");
    setDatabases([]);
    try {
      const res = await fetch("/api/notion/databases", {
        headers: { "X-Notion-Token": token },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "データベースの取得に失敗しました");
      setDatabases(data.databases);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEntries = async (db: NotionDatabase) => {
    const token = getToken();
    if (!token) return;
    setSelectedDb(db);
    setEntries([]);
    setSelectedEntry(null);
    setView("entry-list");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/notion/database-entries?databaseId=${db.id}`, {
        headers: { "X-Notion-Token": token },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "エントリーの取得に失敗しました");
      setEntries(data.entries);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, [fetchDatabases]);

  const handleEntrySelect = (entry: NotionEntry) => {
    setSelectedEntry(entry);
    setView("content");
  };

  const sendToTool = (href: string, entry: NotionEntry) => {
    const text = `【タイトル】${entry.title}\n\n${entry.content}`;
    sessionStorage.setItem("notion_content", text);
    router.push(href);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notion連携</h1>
        <p className="text-gray-500 mt-1">
          DBのエントリをAIツールの元ネタとして使用します
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
          <p>{error}</p>
          {error.includes("設定") && (
            <a href="/settings" className="underline mt-1 inline-block">
              設定ページへ →
            </a>
          )}
        </div>
      )}

      {/* DB一覧 */}
      {view === "db-list" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Database size={16} />
              データベース一覧
            </h2>
            <button
              onClick={fetchDatabases}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer disabled:text-gray-300"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              更新
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-6">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">取得中...</span>
            </div>
          ) : databases.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">
              アクセス可能なデータベースが見つかりません。NotionインテグレーションをDBに接続してください。
            </p>
          ) : (
            <div className="space-y-2">
              {databases.map((db) => (
                <button
                  key={db.id}
                  onClick={() => fetchEntries(db)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <Database size={14} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">{db.title}</span>
                  </span>
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* エントリー一覧 */}
      {view === "entry-list" && selectedDb && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => { setView("db-list"); setSelectedDb(null); }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-semibold text-gray-900">{selectedDb.title}</h2>
            <a
              href={selectedDb.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 ml-auto"
            >
              <ExternalLink size={13} />
            </a>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-6">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">エントリーを取得中...</span>
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">エントリーがありません。</p>
          ) : (
            <div className="space-y-2 max-h-[32rem] overflow-y-auto">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleEntrySelect(entry)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText size={14} className="text-gray-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 font-medium truncate">{entry.title}</p>
                      {entry.snippet && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{entry.snippet}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* コンテンツプレビュー */}
      {view === "content" && selectedEntry && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => { setView("entry-list"); setSelectedEntry(null); }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-semibold text-gray-900 truncate">{selectedEntry.title}</h2>
            <a
              href={selectedEntry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 ml-auto shrink-0"
            >
              <ExternalLink size={13} />
            </a>
          </div>

          {selectedEntry.content ? (
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed max-h-72 overflow-y-auto bg-gray-50 p-4 rounded-lg mb-5">
              {selectedEntry.content}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 bg-gray-50 p-4 rounded-lg mb-5">
              （プロパティの内容が空です）
            </p>
          )}

          <p className="text-xs text-gray-500 mb-3 font-medium">このエントリをAIツールの元ネタとして使う：</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {destinations.map((dest) => (
              <button
                key={dest.href}
                onClick={() => sendToTool(dest.href, selectedEntry)}
                className={`px-4 py-2.5 ${dest.color} text-white text-sm font-medium rounded-lg transition-colors cursor-pointer text-left`}
              >
                {dest.label} →
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

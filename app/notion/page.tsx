"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Database,
  FileText,
  Loader2,
  ExternalLink,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ScrollText,
} from "lucide-react";
import { getNotionToken } from "@/lib/clientKeys";
import { useKeys } from "@/components/KeysProvider";

interface NotionDatabase {
  id: string;
  title: string;
  url: string;
}

interface NotionPageItem {
  id: string;
  title: string;
  url: string;
}

interface PropertyItem {
  name: string;
  type: string;
  value: string;
}

interface NotionEntry {
  id: string;
  title: string;
  snippet: string;
  properties: PropertyItem[];
  url: string;
  createdAt: string;
}

type View = "db-list" | "entry-list" | "page-list" | "content";
type Tab = "databases" | "pages";

const destinations = [
  { label: "ブログ記事生成に使う", href: "/writing/blog", color: "bg-blue-600 hover:bg-blue-700" },
  { label: "SNS投稿の作成に使う", href: "/sns/create", color: "bg-pink-600 hover:bg-pink-700" },
  { label: "要約に使う", href: "/writing/summary", color: "bg-purple-600 hover:bg-purple-700" },
  { label: "リライトに使う", href: "/writing/rewrite", color: "bg-orange-600 hover:bg-orange-700" },
  { label: "メール作成に使う", href: "/writing/email", color: "bg-green-600 hover:bg-green-700" },
];

export default function NotionPage() {
  const router = useRouter();
  const { notionTokenSet } = useKeys();
  const [activeTab, setActiveTab] = useState<Tab>("databases");
  const [view, setView] = useState<View>("db-list");
  const [contentSource, setContentSource] = useState<"db" | "page">("db");

  // DB state
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [selectedDb, setSelectedDb] = useState<NotionDatabase | null>(null);
  const [entries, setEntries] = useState<NotionEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<NotionEntry | null>(null);

  // Pages state
  const [pages, setPages] = useState<NotionPageItem[]>([]);

  // Loading / error
  const [loading, setLoading] = useState(false);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoRetrying, setAutoRetrying] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // コンテンツ選択 state
  const [selectedProps, setSelectedProps] = useState<Set<string>>(new Set());
  const [bodyContent, setBodyContent] = useState<string>("");
  const [bodyLoading, setBodyLoading] = useState(false);
  const [includeBody, setIncludeBody] = useState(false);
  const [childPages, setChildPages] = useState<Array<{ id: string; title: string }>>([]);
  const [bodyExpanded, setBodyExpanded] = useState(false);

  const getToken = useCallback(() => {
    const token = getNotionToken();
    if (!token) {
      setError("Notion APIトークンが設定されていません。設定ページで入力してください。");
      return null;
    }
    return token;
  }, []); // setError（useState setter）とgetNotionToken（import関数）は常に安定した参照

  // DB：5秒後サイレント再取得（Notion API反映待ち対応）
  const silentRefetch = useCallback(async () => {
    const token = getNotionToken();
    if (!token) return;
    setAutoRetrying(true);
    try {
      const res = await fetch("/api/notion/databases", { headers: { "X-Notion-Token": token } });
      const data = await res.json();
      if (res.ok && data.databases) setDatabases(data.databases);
    } catch {}
    finally { setAutoRetrying(false); }
  }, []);

  const fetchDatabases = useCallback(async () => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError("");
    setDatabases([]);
    setAutoRetrying(false);
    try {
      const res = await fetch("/api/notion/databases", { headers: { "X-Notion-Token": token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "データベースの取得に失敗しました");
      setDatabases(data.databases);
      retryTimerRef.current = setTimeout(silentRefetch, 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [silentRefetch, getToken]);

  // ページ一覧取得
  const fetchPages = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setPagesLoading(true);
    setError("");
    setPages([]);
    try {
      const res = await fetch("/api/notion/pages", { headers: { "X-Notion-Token": token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ページの取得に失敗しました");
      setPages(data.pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setPagesLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchDatabases();
    return () => { if (retryTimerRef.current) clearTimeout(retryTimerRef.current); };
  }, [fetchDatabases]);

  // Notionトークンが削除されたとき（リセット時など）に表示をクリア
  // useRefで前回値を記憶し、true→falseの変化時のみ動作させる（初回マウント時の誤発火防止）
  const prevNotionTokenSet = useRef(notionTokenSet);
  useEffect(() => {
    if (prevNotionTokenSet.current && !notionTokenSet) {
      setDatabases([]);
      setPages([]);
      setSelectedDb(null);
      setEntries([]);
      setSelectedEntry(null);
      setView("db-list");
      setActiveTab("databases");
      setError("");
    }
    prevNotionTokenSet.current = notionTokenSet;
  }, [notionTokenSet]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setError("");
    if (tab === "databases") {
      setView("db-list");
      if (databases.length === 0) fetchDatabases();
    } else {
      setView("page-list");
      if (pages.length === 0) fetchPages();
    }
  };

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

  const fetchBody = async (pageId: string, token: string) => {
    setBodyLoading(true);
    setBodyContent("");
    setIncludeBody(false);
    setChildPages([]);
    try {
      const res = await fetch(`/api/notion/content?pageId=${pageId}`, {
        headers: { "X-Notion-Token": token },
      });
      const data = await res.json();
      if (res.ok) {
        if (data.content) {
          setBodyContent(data.content);
          setIncludeBody(true);
        }
        if (data.childPages?.length > 0) {
          setChildPages(data.childPages);
        }
      }
    } catch {}
    finally { setBodyLoading(false); }
  };

  const handleEntrySelect = (entry: NotionEntry) => {
    setBodyExpanded(false);
    setSelectedEntry(entry);
    setContentSource("db");
    setView("content");
    setSelectedProps(new Set(entry.properties.map((p) => p.name)));
    const token = getNotionToken();
    if (token) fetchBody(entry.id, token);
  };

  const handlePageSelect = (page: NotionPageItem) => {
    setBodyExpanded(false);
    setSelectedEntry({
      id: page.id,
      title: page.title,
      snippet: "",
      properties: [],
      url: page.url,
      createdAt: "",
    });
    setContentSource("page");
    setView("content");
    setSelectedProps(new Set());
    const token = getNotionToken();
    if (token) fetchBody(page.id, token);
  };

  const handleContentBack = () => {
    setSelectedEntry(null);
    setView(contentSource === "page" ? "page-list" : "entry-list");
  };

  const handleChildPageSelect = (child: { id: string; title: string }) => {
    setBodyExpanded(false);
    const token = getNotionToken();
    if (!token) return;
    setSelectedEntry({
      id: child.id,
      title: child.title,
      snippet: "",
      properties: [],
      url: "",
      createdAt: "",
    });
    setSelectedProps(new Set());
    fetchBody(child.id, token);
  };

  const toggleProp = (name: string) => {
    setSelectedProps((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const compileContent = (entry: NotionEntry): string => {
    const parts: string[] = [`【タイトル】${entry.title}`];
    for (const prop of entry.properties) {
      if (selectedProps.has(prop.name)) {
        parts.push(`【${prop.name}】\n${prop.value}`);
      }
    }
    if (includeBody && bodyContent) {
      parts.push(`【本文】\n${bodyContent}`);
    }
    return parts.join("\n\n");
  };

  const sendToTool = (href: string) => {
    if (!selectedEntry) return;
    sessionStorage.setItem("notion_content", compileContent(selectedEntry));
    router.push(href);
  };

  return (
    <div className={`p-4 md:p-8 ${view === "content" ? "max-w-5xl" : "max-w-3xl"}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notion連携</h1>
        <p className="text-gray-500 mt-1">
          DBのエントリやページをAIツールの元ネタとして使用します
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
          <p>{error}</p>
          {error.includes("設定") && (
            <Link href="/settings" className="underline mt-1 inline-block">設定ページへ →</Link>
          )}
        </div>
      )}

      {/* タブ（一覧表示時のみ） */}
      {(view === "db-list" || view === "page-list") && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleTabChange("databases")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
              activeTab === "databases"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            <Database size={14} />
            データベース
          </button>
          <button
            onClick={() => handleTabChange("pages")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
              activeTab === "pages"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
            }`}
          >
            <FileText size={14} />
            ページ
          </button>
        </div>
      )}

      {/* DB一覧 */}
      {view === "db-list" && (
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-indigo-700 text-sm flex items-center gap-1.5">
              <Database size={14} />
              データベース一覧
            </h2>
            <div className="flex items-center gap-2">
              {autoRetrying && <span className="text-xs text-gray-400">再確認中...</span>}
              <button
                onClick={fetchDatabases}
                disabled={loading}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer disabled:text-gray-300"
              >
                <RefreshCw size={14} className={loading || autoRetrying ? "animate-spin" : ""} />
                更新
              </button>
            </div>
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
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left cursor-pointer group"
                >
                  <span className="flex items-center gap-3">
                    <Database size={14} className="text-indigo-400 shrink-0" />
                    <span className="text-sm text-gray-700 font-medium group-hover:text-indigo-700">{db.title}</span>
                  </span>
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ページ一覧 */}
      {view === "page-list" && (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 lg:min-w-135">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-emerald-700 text-sm flex items-center gap-1.5">
              <FileText size={14} />
              ページ一覧
            </h2>
            <button
              onClick={fetchPages}
              disabled={pagesLoading}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer disabled:text-gray-300"
            >
              <RefreshCw size={14} className={pagesLoading ? "animate-spin" : ""} />
              更新
            </button>
          </div>

          {pagesLoading ? (
            <div className="flex items-center gap-2 text-gray-400 py-6">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">取得中...</span>
            </div>
          ) : pages.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">
              アクセス可能なページが見つかりません。Notionインテグレーションをページに接続してください。
            </p>
          ) : (
            <div className="space-y-2 max-h-[32rem] overflow-y-auto">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handlePageSelect(page)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left cursor-pointer group"
                >
                  <span className="flex items-center gap-3">
                    <FileText size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-sm text-gray-700 font-medium group-hover:text-emerald-700">{page.title}</span>
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

      {/* コンテンツ選択 */}
      {view === "content" && selectedEntry && (
        <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
        <div className={`flex-1 min-w-0 lg:min-w-135 bg-white rounded-xl shadow-sm p-6 border ${
          contentSource === "page" ? "border-emerald-100" : "border-indigo-100"
        }`}>
          <div className="flex items-center gap-2 mb-5">
            <button
              onClick={handleContentBack}
              className="p-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer shrink-0"
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

          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            含めるコンテンツを選択
          </p>

          {/* プロパティ（DBエントリのみ） */}
          {selectedEntry.properties.length > 0 && (
            <div className="space-y-2 mb-4">
              {selectedEntry.properties.map((prop) => (
                <label
                  key={prop.name}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedProps.has(prop.name)}
                    onChange={() => toggleProp(prop.name)}
                    className="mt-0.5 shrink-0 accent-indigo-600"
                  />
                  <div className="min-w-0">
                    <span className="text-xs text-gray-400">{prop.name}</span>
                    <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">{prop.value}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* ページ本文 */}
          <div className="mb-5">
            {bodyLoading ? (
              <div className="flex items-center gap-2 text-gray-400 py-2 px-3">
                <Loader2 size={13} className="animate-spin" />
                <span className="text-sm">ページ本文を取得中...</span>
              </div>
            ) : bodyContent ? (
              <>
                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBody}
                    onChange={() => setIncludeBody((v) => !v)}
                    className="mt-0.5 shrink-0 accent-indigo-600"
                  />
                  <div className="min-w-0">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <ScrollText size={11} />
                      ページ本文
                    </span>
                    <p className={`text-sm text-gray-700 mt-0.5 ${bodyExpanded ? "" : "line-clamp-3"}`}>{bodyContent}</p>
                  </div>
                </label>
                <button
                  className="lg:hidden w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  onClick={() => setBodyExpanded((v) => !v)}
                >
                  {bodyExpanded ? (
                    <><span>閉じる</span><ChevronUp size={14} /></>
                  ) : (
                    <><span>内容を確認する</span><ChevronDown size={14} /></>
                  )}
                </button>
              </>
            ) : (
              <p className="text-xs text-gray-400 px-1">（ページ本文はありません）</p>
            )}
          </div>

          {/* サブページ */}
          {childPages.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                このページ内のサブページ
              </p>
              <div className="space-y-1.5">
                {childPages.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleChildPageSelect(child)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left cursor-pointer group"
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={13} className="text-emerald-500 shrink-0" />
                      <span className="text-sm text-gray-700 group-hover:text-emerald-700">{child.title}</span>
                    </span>
                    <ChevronRight size={13} className="text-gray-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500 mb-3 font-medium">このコンテンツをAIツールの元ネタとして使う：</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {destinations.map((dest) => (
                <button
                  key={dest.href}
                  onClick={() => sendToTool(dest.href)}
                  disabled={selectedProps.size === 0 && !includeBody}
                  className={`px-4 py-2.5 ${dest.color} text-white text-sm font-medium rounded-lg transition-colors cursor-pointer text-left disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {dest.label} →
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右：プレビューパネル */}
        <div className="hidden lg:block w-80 shrink-0 lg:min-w-135 sticky top-4">
          <div className={`bg-gray-50 rounded-xl border p-5 ${
            contentSource === "page" ? "border-emerald-100" : "border-indigo-100"
          }`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">プレビュー</p>
            {bodyLoading && selectedEntry.properties.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-sm">読み込み中...</span>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-xs text-gray-600 font-sans leading-relaxed max-h-[70vh] overflow-y-auto">
                {compileContent(selectedEntry) || "（コンテンツが選択されていません）"}
              </pre>
            )}
          </div>
        </div>

      </div>
      )}
    </div>
  );
}

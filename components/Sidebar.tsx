"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Mail,
  AlignLeft,
  RefreshCw,
  Share2,
  BookOpen,
  Database,
  Settings,
  ChevronDown,
  ChevronRight,
  PenLine,
  Menu,
  X,
} from "lucide-react";
import { APP_VERSION } from "@/lib/version";

const navigation = [
  {
    name: "ダッシュボード",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "ライティングツール",
    icon: PenLine,
    children: [
      { name: "ブログ記事生成", href: "/writing/blog", icon: FileText },
      { name: "メール作成", href: "/writing/email", icon: Mail },
      { name: "要約", href: "/writing/summary", icon: AlignLeft },
      { name: "リライト", href: "/writing/rewrite", icon: RefreshCw },
    ],
  },
  {
    name: "SNS投稿",
    icon: Share2,
    children: [
      { name: "コンテンツ作成", href: "/sns/create", icon: Share2 },
      { name: "ライブラリ", href: "/sns/library", icon: BookOpen },
    ],
  },
  {
    name: "Notion連携",
    href: "/notion",
    icon: Database,
  },
  {
    name: "設定",
    href: "/settings",
    icon: Settings,
  },
];

function NavContent({
  pathname,
  openSections,
  toggleSection,
  onLinkClick,
}: {
  pathname: string;
  openSections: string[];
  toggleSection: (name: string) => void;
  onLinkClick?: () => void;
}) {
  return (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {navigation.map((item) => {
        if (item.children) {
          const isOpen = openSections.includes(item.name);
          const isChildActive = item.children.some((c) => c.href === pathname);
          return (
            <div key={item.name}>
              <button
                onClick={() => toggleSection(item.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm cursor-pointer ${
                  isChildActive
                    ? "text-white"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span className="flex items-center gap-3">
                  <item.icon size={16} />
                  {item.name}
                </span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isOpen && (
                <div className="mt-1 ml-4 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onLinkClick}
                      className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                        pathname === child.href
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <child.icon size={14} />
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href!}
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
              pathname === item.href
                ? "bg-indigo-600 text-white"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <item.icon size={16} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<string[]>([
    "ライティングツール",
    "SNS投稿",
  ]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSection = (name: string) => {
    setOpenSections((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <>
      {/* ── デスクトップ用サイドバー ── */}
      <div className="hidden md:flex w-64 bg-slate-900 min-h-screen flex-col shrink-0">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-baseline gap-2">
            <h1 className="text-white font-bold text-lg">AI Writing</h1>
            <span className="text-slate-400 text-xs">v{APP_VERSION}</span>
          </div>
          <p className="text-slate-400 text-xs mt-1">AIライティングツール</p>
        </div>
        <NavContent
          pathname={pathname}
          openSections={openSections}
          toggleSection={toggleSection}
        />
      </div>

      {/* ── スマホ用トップバー ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 h-14 flex items-center px-4 gap-3 shadow-lg">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white p-1 cursor-pointer"
          aria-label="メニューを開く"
        >
          <Menu size={22} />
        </button>
        <span className="text-white font-bold text-base">AI Writing</span>
        <span className="text-slate-400 text-xs">v{APP_VERSION}</span>
      </div>

      {/* ── スマホ用ドロワー ── */}
      {mobileOpen && (
        <>
          {/* 背景オーバーレイ */}
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-50"
            onClick={() => setMobileOpen(false)}
          />
          {/* ドロワー本体 */}
          <div className="md:hidden fixed top-0 left-0 h-full w-72 bg-slate-900 z-50 flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-white font-bold text-lg">AI Writing</h1>
                  <span className="text-slate-400 text-xs">v{APP_VERSION}</span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">AIライティングツール</p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
                aria-label="メニューを閉じる"
              >
                <X size={20} />
              </button>
            </div>
            <NavContent
              pathname={pathname}
              openSections={openSections}
              toggleSection={toggleSection}
              onLinkClick={() => setMobileOpen(false)}
            />
          </div>
        </>
      )}
    </>
  );
}

import Link from "next/link";
import {
  FileText,
  Mail,
  AlignLeft,
  RefreshCw,
  Share2,
  BookOpen,
  Database,
  Settings,
} from "lucide-react";

const tools = [
  {
    title: "ブログ記事生成",
    description: "テーマを入力するだけで、見出し付きのブログ記事を自動生成します",
    href: "/writing/blog",
    icon: FileText,
    iconBg: "bg-blue-50 text-blue-600",
    category: "ライティング",
  },
  {
    title: "メール作成",
    description: "目的と宛先を入力するだけで、ビジネスメールの件名と本文を作成します",
    href: "/writing/email",
    icon: Mail,
    iconBg: "bg-green-50 text-green-600",
    category: "ライティング",
  },
  {
    title: "要約",
    description: "長い文章を、読みやすい形に要約します",
    href: "/writing/summary",
    icon: AlignLeft,
    iconBg: "bg-purple-50 text-purple-600",
    category: "ライティング",
  },
  {
    title: "リライト",
    description: "既存の文章を、指定したトーンや方向性に合わせて改善します",
    href: "/writing/rewrite",
    icon: RefreshCw,
    iconBg: "bg-orange-50 text-orange-600",
    category: "ライティング",
  },
  {
    title: "SNSコンテンツ作成",
    description: "トピックや記事を基に、X・Facebook・Wantedly向けの投稿文を生成します",
    href: "/sns/create",
    icon: Share2,
    iconBg: "bg-pink-50 text-pink-600",
    category: "SNS",
  },
  {
    title: "SNSライブラリ",
    description: "生成したSNSコンテンツを保存・管理します",
    href: "/sns/library",
    icon: BookOpen,
    iconBg: "bg-red-50 text-red-600",
    category: "SNS",
  },
  {
    title: "Notion連携",
    description: "NotionのページをAIのネタ元として取り込みます",
    href: "/notion",
    icon: Database,
    iconBg: "bg-gray-100 text-gray-600",
    category: "連携",
  },
  {
    title: "設定",
    description: "APIキーなどの設定を確認します",
    href: "/settings",
    icon: Settings,
    iconBg: "bg-slate-100 text-slate-600",
    category: "その他",
  },
];

export default function Dashboard() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-500 mt-1">使いたいツールを選んでください</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all group"
          >
            <div
              className={`w-10 h-10 rounded-lg ${tool.iconBg} flex items-center justify-center mb-4`}
            >
              <tool.icon size={20} />
            </div>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {tool.category}
            </span>
            <h2 className="text-base font-semibold text-gray-900 mt-1 group-hover:text-indigo-600 transition-colors">
              {tool.title}
            </h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

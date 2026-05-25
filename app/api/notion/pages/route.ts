import { Client } from "@notionhq/client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`notion-pages:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `リクエスト上限に達しました。${Math.ceil((rate.retryAfterSeconds ?? 3600) / 60)}分後に再試行してください。` },
        { status: 429 }
      );
    }

    // ユーザーが設定したNotionトークンをヘッダーから取得
    const token = request.headers.get("X-Notion-Token");
    if (!token || token.trim().length === 0) {
      return NextResponse.json(
        { error: "Notion APIトークンが設定されていません。設定ページで入力してください。" },
        { status: 401 }
      );
    }

    const notion = new Client({ auth: token });

    const response = await notion.search({
      filter: { value: "page", property: "object" },
      sort: { direction: "descending", timestamp: "last_edited_time" },
      page_size: 30,
    });

    // ワークスペース直下のページのみ表示（DB関連ページを完全に除外）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workspacePages = response.results.filter((page: any) =>
      page.parent?.type === "workspace"
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pages = workspacePages.map((page: any) => {
      let title = "無題";
      // child_page ブロックのタイトルを優先
      if (page.child_page?.title) {
        title = page.child_page.title;
      } else if (page.properties) {
        // プロパティ名ではなくtypeで探す
        for (const prop of Object.values<any>(page.properties)) {
          if (prop.type === "title" && prop.title?.length > 0) {
            title = prop.title.map((t: { plain_text: string }) => t.plain_text).join("");
            break;
          }
        }
      }
      return { id: page.id, title, url: page.url };
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("[notion/pages] error:", (error as Error)?.message ?? "unknown");
    return NextResponse.json(
      { error: "Notionページの取得に失敗しました。トークンが正しいか確認してください。" },
      { status: 500 }
    );
  }
}

import { Client } from "@notionhq/client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`notion-databases:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `リクエスト上限に達しました。${Math.ceil((rate.retryAfterSeconds ?? 3600) / 60)}分後に再試行してください。` },
        { status: 429 }
      );
    }

    const token = request.headers.get("X-Notion-Token");
    if (!token || token.trim().length === 0) {
      return NextResponse.json(
        { error: "Notion APIトークンが設定されていません。設定ページで入力してください。" },
        { status: 401 }
      );
    }

    const notion = new Client({ auth: token });

    const response = await notion.search({
      filter: { value: "data_source", property: "object" },
      sort: { direction: "descending", timestamp: "last_edited_time" },
      page_size: 30,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const databases = response.results.map((db: any) => {
      const titleArr = db.title ?? [];
      const title = titleArr.map((t: { plain_text: string }) => t.plain_text).join("") || "無題のデータベース";
      return { id: db.id, title, url: db.url };
    });

    return NextResponse.json({ databases });
  } catch (error) {
    console.error("[notion/databases] error:", (error as Error)?.message ?? "unknown");
    return NextResponse.json(
      { error: "データベースの取得に失敗しました。トークンが正しいか確認してください。" },
      { status: 500 }
    );
  }
}

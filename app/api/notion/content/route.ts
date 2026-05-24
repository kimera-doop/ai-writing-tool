import { Client } from "@notionhq/client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const VALID_PAGE_ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractText(block: any): string {
  const type = block?.type;
  if (!type) return "";
  const content = block[type];
  if (!content?.rich_text) return "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return content.rich_text.map((t: any) => t.plain_text).join("");
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`notion-content:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
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

    const pageId = request.nextUrl.searchParams.get("pageId") ?? "";
    if (!VALID_PAGE_ID.test(pageId)) {
      return NextResponse.json({ error: "ページIDの形式が正しくありません。" }, { status: 400 });
    }

    const notion = new Client({ auth: token });

    const blocksResponse = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    const content = blocksResponse.results
      .map(extractText)
      .filter(Boolean)
      .join("\n");

    return NextResponse.json({ content });
  } catch (error) {
    console.error("[notion/content] error:", (error as Error)?.message ?? "unknown");
    return NextResponse.json(
      { error: "コンテンツの取得に失敗しました。しばらく待ってから再試行してください。" },
      { status: 500 }
    );
  }
}

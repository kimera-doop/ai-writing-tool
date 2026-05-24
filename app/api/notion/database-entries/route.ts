import { Client } from "@notionhq/client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const VALID_ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

// このDBでは使わないプロパティ名
const EXCLUDED_PROPS = ["プロジェクト"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTitle(properties: any): string {
  for (const prop of Object.values<any>(properties)) {
    if (prop.type === "title" && prop.title?.length > 0) {
      return prop.title.map((t: { plain_text: string }) => t.plain_text).join("");
    }
  }
  return "無題";
}

// プロパティ全体を「元ネタ」として使えるテキストに整形
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractContent(properties: any): string {
  const lines: string[] = [];
  for (const [key, prop] of Object.entries<any>(properties)) {
    if (EXCLUDED_PROPS.includes(key)) continue;
    if (prop.type === "title") continue; // タイトルは別途取得済み

    if (prop.type === "rich_text") {
      const text = prop.rich_text?.map((t: { plain_text: string }) => t.plain_text).join("").trim();
      if (text) lines.push(`【${key}】\n${text}`);
    } else if (prop.type === "multi_select") {
      if (prop.multi_select?.length > 0) {
        const values = prop.multi_select.map((s: { name: string }) => s.name).join("、");
        lines.push(`【${key}】${values}`);
      }
    } else if (prop.type === "date") {
      if (prop.date?.start) {
        lines.push(`【${key}】${prop.date.start}`);
      }
    }
  }
  return lines.join("\n\n");
}

// リスト表示用の短いスニペット
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSnippet(properties: any): string {
  for (const [key, prop] of Object.entries<any>(properties)) {
    if (EXCLUDED_PROPS.includes(key)) continue;
    if (prop.type === "rich_text" && prop.rich_text?.length > 0) {
      const text = prop.rich_text.map((t: { plain_text: string }) => t.plain_text).join("").trim();
      if (text) return `${key}：${text.slice(0, 60)}`;
    }
  }
  return "";
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`notion-db-entries:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `リクエスト上限に達しました。${Math.ceil((rate.retryAfterSeconds ?? 3600) / 60)}分後に再試行してください。` },
        { status: 429 }
      );
    }

    const token = request.headers.get("X-Notion-Token");
    if (!token || token.trim().length === 0) {
      return NextResponse.json(
        { error: "Notion APIトークンが設定されていません。" },
        { status: 401 }
      );
    }

    const databaseId = request.nextUrl.searchParams.get("databaseId") ?? "";
    if (!VALID_ID.test(databaseId)) {
      return NextResponse.json({ error: "データベースIDの形式が正しくありません。" }, { status: 400 });
    }

    const notion = new Client({ auth: token });

    const response = await notion.dataSources.query({
      data_source_id: databaseId,
      page_size: 50,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries = response.results.map((page: any) => ({
      id: page.id,
      title: extractTitle(page.properties ?? {}),
      snippet: extractSnippet(page.properties ?? {}),
      content: extractContent(page.properties ?? {}),
      url: page.url,
      createdAt: page.created_time,
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("[notion/database-entries] error:", (error as Error)?.message ?? "unknown");
    return NextResponse.json(
      { error: "エントリーの取得に失敗しました。しばらく待ってから再試行してください。" },
      { status: 500 }
    );
  }
}

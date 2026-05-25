import { Client } from "@notionhq/client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const VALID_PAGE_ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const MAX_DEPTH = 4;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function blockToText(block: any): string {
  const type = block?.type;
  if (!type) return "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rich = (content: any): string =>
    content?.rich_text?.map((t: { plain_text: string }) => t.plain_text).join("") ?? "";

  switch (type) {
    case "paragraph":           return rich(block.paragraph);
    case "heading_1":           return `# ${rich(block.heading_1)}`;
    case "heading_2":           return `## ${rich(block.heading_2)}`;
    case "heading_3":           return `### ${rich(block.heading_3)}`;
    case "bulleted_list_item":  return `- ${rich(block.bulleted_list_item)}`;
    case "numbered_list_item":  return `1. ${rich(block.numbered_list_item)}`;
    case "to_do":               return `${block.to_do?.checked ? "✓" : "☐"} ${rich(block.to_do)}`;
    case "quote":               return `> ${rich(block.quote)}`;
    case "code":                return `\`\`\`\n${rich(block.code)}\n\`\`\``;
    case "callout":             return rich(block.callout);
    case "toggle":              return rich(block.toggle);
    case "divider":             return "---";
    // column_list / column は自身にテキストを持たない（子ブロックで処理）
    case "column_list":
    case "column":              return "";
    default:                    return rich(block[type]);
  }
}

// 再帰でテキストとサブページを取得
async function extractContent(
  notion: Client,
  blockId: string,
  depth: number
): Promise<{ text: string; childPages: Array<{ id: string; title: string }> }> {
  if (depth > MAX_DEPTH) return { text: "", childPages: [] };

  const response = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 100,
  });

  const texts: string[] = [];
  const childPages: Array<{ id: string; title: string }> = [];

  for (const block of response.results as any[]) {
    // child_page はサブページとして収集（テキストには含めない）
    if (block.type === "child_page") {
      childPages.push({
        id: block.id,
        title: block.child_page?.title || "無題",
      });
      continue;
    }

    // ブロック自身のテキストを取得
    const text = blockToText(block);
    if (text) texts.push(text);

    // 子ブロックを持つ場合は再帰取得
    if (block.has_children) {
      const result = await extractContent(notion, block.id, depth + 1);
      if (result.text) texts.push(result.text);
      childPages.push(...result.childPages);
    }
  }

  return { text: texts.join("\n"), childPages };
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
    const { text: content, childPages } = await extractContent(notion, pageId, 0);

    return NextResponse.json({ content, childPages });
  } catch (error) {
    console.error("[notion/content] error:", (error as Error)?.message ?? "unknown");
    return NextResponse.json(
      { error: "コンテンツの取得に失敗しました。しばらく待ってから再試行してください。" },
      { status: 500 }
    );
  }
}

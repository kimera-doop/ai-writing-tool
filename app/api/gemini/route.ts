import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_PROMPT_LENGTH = 8000;

export async function POST(request: NextRequest) {
  try {
    // レート制限
    const ip = getClientIp(request);
    const rate = checkRateLimit(ip, RATE_LIMIT, RATE_WINDOW_MS);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `リクエスト上限に達しました。${Math.ceil((rate.retryAfterSeconds ?? 3600) / 60)}分後に再試行してください。`,
        },
        { status: 429 }
      );
    }

    // ユーザーが設定したAPIキーをヘッダーから取得
    const apiKey = request.headers.get("X-Gemini-Key");
    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: "APIキーが設定されていません。設定ページでGemini APIキーを入力してください。" },
        { status: 401 }
      );
    }

    // 入力の取得・検証
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
    }

    const prompt =
      body && typeof body === "object" && "prompt" in body
        ? (body as { prompt: unknown }).prompt
        : undefined;

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "プロンプトが入力されていません。" }, { status: 400 });
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: "入力テキストが長すぎます。短くしてから再試行してください。" },
        { status: 400 }
      );
    }

    // ユーザーのキーでGemini API呼び出し（キーはログに残さない）
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error) {
    // APIキーが無効な場合など、詳細はサーバーログのみ（クライアントには返さない）
    console.error("[gemini] error:", (error as Error)?.message ?? "unknown");

    // APIキーが無効かどうかを判別してわかりやすいメッセージを返す
    const msg = (error as Error)?.message ?? "";
    if (msg.includes("API_KEY_INVALID") || msg.includes("401")) {
      return NextResponse.json(
        { error: "APIキーが無効です。設定ページで正しいGemini APIキーを入力してください。" },
        { status: 401 }
      );
    }

    if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429") || msg.toLowerCase().includes("quota")) {
      return NextResponse.json(
        { error: "APIの利用制限に達しました。少し時間をおいてから再試行してください。" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "生成中にエラーが発生しました。しばらく待ってから再試行してください。" },
      { status: 500 }
    );
  }
}

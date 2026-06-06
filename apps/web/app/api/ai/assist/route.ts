import { NextResponse } from "next/server";
import { generateDebateAssist, type AssistantTool } from "@tweetbattle402/ai";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    tool: AssistantTool;
    topic: string;
    position?: string;
    opponentPoint?: string;
  };
  return NextResponse.json({
    text: generateDebateAssist(body),
    mode: process.env.OPENAI_API_KEY ? "llm-ready" : "deterministic-mock",
    payment: "x402-roadmap",
  });
}

import { NextResponse } from "next/server";
import {
  generateDebateAssistWithOpenAI,
  type AssistantTool,
} from "@tweetbattle402/ai";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    tool: AssistantTool;
    topic: string;
    position?: string;
    opponentPoint?: string;
  };
  const result = await generateDebateAssistWithOpenAI(body);
  return NextResponse.json({
    ...result,
    payment: "x402-roadmap",
  });
}

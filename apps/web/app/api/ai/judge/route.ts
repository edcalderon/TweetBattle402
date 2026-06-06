import { NextResponse } from "next/server";
import { mockJudge, type JudgeInput } from "@tweetbattle402/ai";

export async function POST(request: Request) {
  const input = (await request.json()) as JudgeInput;
  return NextResponse.json({
    ...mockJudge(input),
    mode: process.env.OPENAI_API_KEY ? "llm-ready" : "deterministic-mock",
  });
}

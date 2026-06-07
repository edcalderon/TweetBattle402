import { NextResponse } from "next/server";
import { judgeBattleWithOpenAI, type JudgeInput } from "@tweetbattle402/ai";

export async function POST(request: Request) {
  const input = (await request.json()) as JudgeInput;
  const result = await judgeBattleWithOpenAI(input);
  return NextResponse.json(result);
}

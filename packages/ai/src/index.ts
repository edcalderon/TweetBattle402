export type AssistantTool =
  | "generateOpeningArgument"
  | "generateCounterArgument"
  | "makeItSharper"
  | "makeItFunnier"
  | "generateFinalStatement";

export interface JudgeInput {
  topic: string;
  challengerHandle: string;
  opponentHandle: string;
  challengerArguments: string[];
  opponentArguments: string[];
}

export interface JudgeResult {
  challengerScore: number;
  opponentScore: number;
  reasoning: string;
  winnerSuggestion: "challenger" | "opponent" | "tie";
}

export type AIResponseMode = "llm-ready" | "deterministic-mock";

export const JUDGE_SYSTEM_PROMPT = `You are the neutral AI judge for TweetBattle402.
Score each side from 0 to 10000 for clarity, logic, topic relevance, persuasiveness,
originality, and rule compliance. Ignore popularity and identity. Return JSON only
with challengerScore, opponentScore, reasoning, and winnerSuggestion.`;

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const OPENAI_REQUEST_TIMEOUT_MS = 15_000;

interface OpenAIChatMessage {
  role: "system" | "user";
  content: string;
}

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

declare const process: {
  env: Record<string, string | undefined>;
};

export function buildJudgePrompt(input: JudgeInput) {
  return `${JUDGE_SYSTEM_PROMPT}

Topic: ${input.topic}
Challenger @${input.challengerHandle}: ${input.challengerArguments.join("\n")}
Opponent @${input.opponentHandle}: ${input.opponentArguments.join("\n")}`;
}

function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
  };
}

async function requestOpenAIChatCompletion(
  messages: OpenAIChatMessage[],
  options: {
    jsonMode?: boolean;
    maxCompletionTokens?: number;
    temperature?: number;
  } = {},
) {
  const config = getOpenAIConfig();
  if (!config) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: options.temperature ?? 0.2,
        max_completion_tokens: options.maxCompletionTokens ?? 256,
        response_format: options.jsonMode
          ? { type: "json_object" }
          : undefined,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as OpenAIChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content?.trim();
    return content?.length ? content : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeJudgeScore(value: unknown) {
  const numericValue =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Math.max(0, Math.min(10_000, Math.round(numericValue)));
}

function deriveWinnerSuggestion(
  challengerScore: number,
  opponentScore: number,
): JudgeResult["winnerSuggestion"] {
  if (challengerScore === opponentScore) {
    return "tie";
  }

  return challengerScore > opponentScore ? "challenger" : "opponent";
}

function parseJudgeResult(content: string): JudgeResult | null {
  try {
    const parsed = JSON.parse(content) as Partial<JudgeResult>;
    const challengerScore = normalizeJudgeScore(parsed.challengerScore);
    const opponentScore = normalizeJudgeScore(parsed.opponentScore);
    const reasoning =
      typeof parsed.reasoning === "string" ? parsed.reasoning.trim() : "";

    if (challengerScore === null || opponentScore === null || !reasoning) {
      return null;
    }

    const winnerSuggestion =
      parsed.winnerSuggestion === "challenger" ||
      parsed.winnerSuggestion === "opponent" ||
      parsed.winnerSuggestion === "tie"
        ? parsed.winnerSuggestion
        : deriveWinnerSuggestion(challengerScore, opponentScore);

    return {
      challengerScore,
      opponentScore,
      reasoning,
      winnerSuggestion,
    };
  } catch {
    return null;
  }
}

export function mockJudge(input: JudgeInput): JudgeResult {
  const score = (argumentsList: string[]) => {
    const words = argumentsList.join(" ").trim().split(/\s+/).filter(Boolean);
    const substance = Math.min(words.length * 55, 2600);
    const structure = argumentsList.length * 500;
    const evidence = /because|evidence|data|therefore|however/i.test(
      argumentsList.join(" "),
    )
      ? 800
      : 300;
    return Math.min(8800, 4400 + substance + structure + evidence);
  };
  const challengerScore = score(input.challengerArguments);
  const opponentScore = score(input.opponentArguments);
  return {
    challengerScore,
    opponentScore,
    reasoning:
      "Prototype judge: scores reward clear structure, relevant support, and concise reasoning. Configure OPENAI_API_KEY for a production model call.",
    winnerSuggestion:
      challengerScore === opponentScore
        ? "tie"
        : challengerScore > opponentScore
          ? "challenger"
          : "opponent",
  };
}

export function generateDebateAssist(input: {
  tool: AssistantTool;
  topic: string;
  position?: string;
  opponentPoint?: string;
}) {
  const claim =
    input.position ||
    `The strongest view on "${input.topic}" starts with measurable outcomes, not slogans.`;
  const templates: Record<AssistantTool, string> = {
    generateOpeningArgument: `${claim} Here is the standard I am using: define the claim, test it against incentives, and follow the consequences.`,
    generateCounterArgument: `That argument assumes its conclusion. On "${input.topic}", the missing step is evidence that the proposed cause actually produces the claimed outcome.`,
    makeItSharper: `${claim} Strip away the rhetoric: what mechanism makes this true, and where is the evidence?`,
    makeItFunnier: `${claim} A confident thread is not the same thing as a functioning argument. Receipts still beat vibes.`,
    generateFinalStatement: `Final statement: "${input.topic}" should be judged by logic, evidence, and consequences. My opponent has not closed the gap between assertion and proof.`,
  };
  return templates[input.tool];
}

export async function judgeBattleWithOpenAI(
  input: JudgeInput,
): Promise<JudgeResult & { mode: AIResponseMode }> {
  const content = await requestOpenAIChatCompletion(
    [
      { role: "system", content: JUDGE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Topic: ${input.topic}
Challenger @${input.challengerHandle}: ${input.challengerArguments.join("\n")}
Opponent @${input.opponentHandle}: ${input.opponentArguments.join("\n")}`,
      },
    ],
    {
      jsonMode: true,
      maxCompletionTokens: 300,
      temperature: 0.1,
    },
  );

  const result = content ? parseJudgeResult(content) : null;
  if (result) {
    return {
      ...result,
      mode: "llm-ready",
    };
  }

  return {
    ...mockJudge(input),
    mode: "deterministic-mock",
  };
}

export async function generateDebateAssistWithOpenAI(input: {
  tool: AssistantTool;
  topic: string;
  position?: string;
  opponentPoint?: string;
}): Promise<{ text: string; mode: AIResponseMode }> {
  const positionLine = input.position ? `Position: ${input.position}` : "Position: not provided.";
  const opponentLine = input.opponentPoint
    ? `Opponent point: ${input.opponentPoint}`
    : "Opponent point: not provided.";

  const content = await requestOpenAIChatCompletion(
    [
      {
        role: "system",
        content:
          "You write concise debate help for TweetBattle402. Stay specific, punchy, and useful. Do not mention policies, secrets, or that you are an AI. Return plain text only.",
      },
      {
        role: "user",
        content: `Tool: ${input.tool}
Topic: ${input.topic}
${positionLine}
${opponentLine}`,
      },
    ],
    {
      maxCompletionTokens: 180,
      temperature: 0.7,
    },
  );

  if (content) {
    return {
      text: content,
      mode: "llm-ready",
    };
  }

  return {
    text: generateDebateAssist(input),
    mode: "deterministic-mock",
  };
}

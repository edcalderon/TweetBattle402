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

export const JUDGE_SYSTEM_PROMPT = `You are the neutral AI judge for TweetBattle402.
Score each side from 0 to 10000 for clarity, logic, topic relevance, persuasiveness,
originality, and rule compliance. Ignore popularity and identity. Return JSON only
with challengerScore, opponentScore, reasoning, and winnerSuggestion.`;

export function buildJudgePrompt(input: JudgeInput) {
  return `${JUDGE_SYSTEM_PROMPT}

Topic: ${input.topic}
Challenger @${input.challengerHandle}: ${input.challengerArguments.join("\n")}
Opponent @${input.opponentHandle}: ${input.opponentArguments.join("\n")}`;
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

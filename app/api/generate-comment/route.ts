import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ToneType = "polite" | "normal" | "praise" | "gentle" | "sparta";

// 👇 単価（gpt-5-mini）
const INPUT_PRICE = 0.25 / 1_000_000;
const OUTPUT_PRICE = 2.0 / 1_000_000;

// 👇 コスト計算
function calculateCost(inputTokens: number, outputTokens: number) {
  const usd =
    inputTokens * INPUT_PRICE + outputTokens * OUTPUT_PRICE;

  const yen = usd * 150; // 仮レート

  return {
    usd,
    yen,
  };
}

function getToneInstruction(tone: ToneType) {
  switch (tone) {
    case "polite":
      return "丁寧で落ち着いた文体";
    case "praise":
      return "褒めを強めに";
    case "gentle":
      return "やさしく配慮ある文体";
    case "sparta":
      return "厳しめで引き締まった文体";
    default:
      return "自然でバランス良く";
  }
}

function buildPrompt(data: any, tone: ToneType) {
  return `
塾講師として保護者向けコメントを作成してください。

条件:
- 80〜140字
- コミルにそのまま貼れる
- 冒頭に「今回は（科目名）の（単元名）について、問題演習と解説を行いました。」を自然に含める
- 前向きな一言で締める
- 丁寧で自然
- 褒めすぎない
- 体言止めを絶対に用いない
- 生徒名はコメント内に含めない
- ネガティブな表現を避ける
- 理解度が「苦手」や「普通」の場合でも、前向きな表現を用いる
- 次回授業ではこうする、といった表現は用いない

文体:
${getToneInstruction(tone)}

情報:
科目: ${data.subject}
単元: ${data.unit}
理解度: ${data.understanding}
授業態度: ${data.attitude}
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body.mode;
    const tone = body.tone || "normal";

    if (mode === "single") {
      const data = body.data;

      const response = await client.responses.create({
        model: "gpt-5-mini",
        input: buildPrompt(data, tone),
      });

      const inputTokens = response.usage?.input_tokens ?? 0;
      const outputTokens = response.usage?.output_tokens ?? 0;

      const cost = calculateCost(inputTokens, outputTokens);

      return NextResponse.json({
        comment: response.output_text,
        usage: {
          inputTokens,
          outputTokens,
          costUsd: cost.usd,
          costYen: cost.yen,
        },
      });
    }

    if (mode === "csv") {
      const lines = body.csvText.split("\n").slice(1);

      const results = [];

      for (const line of lines) {
        if (!line.trim()) continue;

        const [name, subject, unit, understanding, attitude] =
          line.split(",");

        const response = await client.responses.create({
          model: "gpt-5-mini",
          input: buildPrompt(
            { subject, unit, understanding, attitude },
            tone
          ),
        });

        const inputTokens = response.usage?.input_tokens ?? 0;
        const outputTokens = response.usage?.output_tokens ?? 0;

        const cost = calculateCost(inputTokens, outputTokens);

        results.push({
          name,
          subject,
          unit,
          comment: response.output_text,
          usage: {
            costUsd: cost.usd,
            costYen: cost.yen,
          },
        });
      }

      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: "mode不正" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "エラー発生" }, { status: 500 });
  }
}
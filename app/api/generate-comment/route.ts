import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ToneType = "polite" | "spalta" | "normal" | "praise" | "gentle";

function getToneInstruction(tone: ToneType) {
  switch (tone) {
    case "polite":
      return `
文体は丁寧で落ち着いた雰囲気にする。
保護者向けの面談記録・指導報告として自然な文章にする。
過度にくだけすぎない。
`;
    case "spalta":
      return `
文体は丁寧で落ち着いた雰囲気にする。
克服すべき課題を中心に生徒の背筋が伸びるような指導コメントにする。
優しさは残すこと。
`;

    case "praise":
      return `
文体は明るめで、良い点をしっかり拾う。
ただし褒めすぎて不自然にはしない。
前向きな読後感にする。
`;

    case "gentle":
      return `
文体はやさしく、配慮のある表現にする。
苦戦している内容があっても、きつく書かず、今後への期待が持てる表現にする。
`;

    case "normal":
    default:
      return `
文体は自然でバランスのよい指導コメントにする。
褒める点と課題を不自然なく両立させる。
`;
  }
}

function buildPromptForSingle(data: {
  name?: string;
  subject: string;
  unit: string;
  understanding: string;
  attitude: string;
  tone: ToneType;
}) {
  return `
あなたは塾講師向けのコメント作成アシスタントです。
以下の情報をもとに、Comiruなどで保護者に送るための授業コメントを日本語で1本作成してください。

条件:
- 2〜4文程度
- 自然で読みやすい日本語
- 科目名と単元名を「今回は(科目名)の(単元名)の演習と解説を行いました」のフォーマットに入れる
- 理解度と授業中の様子を反映する
- 最後は前向きに締める
- 名前は入れない
- 不自然に大げさな表現は避ける
- 箇条書き、体現止め禁止
- 引用符不要
- コメントの最後は「これからも頑張っていきましょう！」でしめる
文体条件:
${getToneInstruction(data.tone)}

入力情報:
生徒名: ${data.name || ""}
科目: ${data.subject}
単元: ${data.unit}
理解度: ${data.understanding}
授業の様子: ${data.attitude}
`;
}

function parseCsv(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSVはヘッダー行を含めて2行以上必要や。");
  }

  const header = lines[0].split(",").map((s) => s.trim());
  const requiredHeaders = ["name", "subject", "unit", "understanding", "attitude"];

  for (const h of requiredHeaders) {
    if (!header.includes(h)) {
      throw new Error(`CSVヘッダーに ${h} が必要や。`);
    }
  }

  const headerIndex = Object.fromEntries(header.map((h, i) => [h, i]));

  return lines.slice(1).map((line, idx) => {
    const cols = line.split(",").map((s) => s.trim());

    return {
      rowNumber: idx + 2,
      name: cols[headerIndex["name"]] || "",
      subject: cols[headerIndex["subject"]] || "",
      unit: cols[headerIndex["unit"]] || "",
      understanding: cols[headerIndex["understanding"]] || "",
      attitude: cols[headerIndex["attitude"]] || "",
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body.mode as "single" | "csv";

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY が設定されていない。" },
        { status: 500 }
      );
    }

    if (mode === "single") {
      const data = body.data;
      const tone = (body.tone || "normal") as ToneType;

      if (!data?.subject || !data?.unit || !data?.understanding || !data?.attitude) {
        return NextResponse.json(
          { error: "必要項目が足りていない。" },
          { status: 400 }
        );
      }

      const prompt = buildPromptForSingle({
        name: data.name || "",
        subject: data.subject,
        unit: data.unit,
        understanding: data.understanding,
        attitude: data.attitude,
        tone,
      });

      const response = await client.responses.create({
        model: "gpt-5-mini",
        input: prompt,
      });

      const comment = response.output_text?.trim();

      if (!comment) {
        throw new Error("コメント生成結果が空やった。");
      }

      return NextResponse.json({ comment });
    }

    if (mode === "csv") {
      const tone = (body.tone || "normal") as ToneType;
      const csvText = body.csvText as string;

      if (!csvText) {
        return NextResponse.json(
          { error: "CSVテキストが空や。" },
          { status: 400 }
        );
      }

      const rows = parseCsv(csvText);

      const results = [];

      for (const row of rows) {
        if (!row.subject || !row.unit || !row.understanding || !row.attitude) {
          results.push({
            name: row.name,
            subject: row.subject,
            unit: row.unit,
            comment: `【${row.rowNumber}行目】必要項目が不足しているため生成できませんでした。`,
          });
          continue;
        }

        const prompt = buildPromptForSingle({
          name: row.name,
          subject: row.subject,
          unit: row.unit,
          understanding: row.understanding,
          attitude: row.attitude,
          tone,
        });

        try {
          const response = await client.responses.create({
            model: "gpt-5-mini",
            input: prompt,
          });

          const comment =
            response.output_text?.trim() ||
            `【${row.rowNumber}行目】コメント生成に失敗しました。`;

          results.push({
            name: row.name,
            subject: row.subject,
            unit: row.unit,
            comment,
          });
        } catch {
          results.push({
            name: row.name,
            subject: row.subject,
            unit: row.unit,
            comment: `【${row.rowNumber}行目】APIエラーで生成できませんでした。`,
          });
        }
      }

      return NextResponse.json({ results });
    }

    return NextResponse.json(
      { error: "mode が不正や。" },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "不明なエラーが発生した。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
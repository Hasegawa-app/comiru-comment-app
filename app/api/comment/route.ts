import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { subject, unit, understanding, attitude } = await req.json();

    if (!subject || !unit) {
      return Response.json(
        { error: "科目と単元は必須" },
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
あなたは学習塾の先生のコメント作成アシスタントです。
以下の情報をもとに、保護者・生徒向けの自然なコメントを日本語で1つ作成してください。

条件:
- 80〜140字
- コミルにそのまま貼れる
- 冒頭に「今回は（科目名）の（単元名）について、問題演習と解説を行いました。」を自然に含める
- 前向きな一言で締める
- 丁寧で自然
- 褒めすぎない
- 体言止めを絶対に用いない
- 生徒名はコメント内に含めない

入力:
科目名: ${subject}
単元名: ${unit}
理解度: ${understanding || "普通"}
授業の様子: ${attitude || "特になし"}
`;

    const response = await client.responses.create({
      model: "gpt-5",
      input: prompt,
    });

    return Response.json({
      comment: response.output_text,
    });
  } catch (error) {
    console.error("single comment error:", error);

    if (error instanceof Error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json(
      { error: "生成失敗" },
      { status: 500 }
    );
  }
}
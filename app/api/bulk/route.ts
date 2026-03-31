import OpenAI from "openai";

type Student = {
  name: string;
  subject: string;
  unit: string;
  understanding: string;
  attitude: string;
};

export async function POST(req: Request) {
  try {
    const { students } = await req.json();

    if (!students || !Array.isArray(students) || students.length === 0) {
      return Response.json(
        { error: "students が空" },
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const results = [];

    for (const student of students as Student[]) {
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
生徒名: ${student.name}
科目名: ${student.subject}
単元名: ${student.unit}
理解度: ${student.understanding || "普通"}
授業の様子: ${student.attitude || "特になし"}
`;

      const response = await client.responses.create({
        model: "gpt-5",
        input: prompt,
      });

      results.push({
        name: student.name,
        comment: response.output_text,
      });
    }

    return Response.json({ results });
  } catch (error) {
    console.error("bulk comment error:", error);

    if (error instanceof Error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json(
      { error: "一括生成失敗" },
      { status: 500 }
    );
  }
}
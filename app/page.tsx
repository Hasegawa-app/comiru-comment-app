"use client";

import React, { useState } from "react";

type ToneType = "polite" | "normal" | "praise" | "gentle" | "sparta";

type SingleResult = {
  comment: string;
};

type CsvResult = {
  name: string;
  subject: string;
  unit: string;
  comment: string;
};

export default function Page() {
  const [mode, setMode] = useState<"single" | "csv">("single");
  const [usage, setUsage] = useState<any>(null);

  // 手入力
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");
  const [understanding, setUnderstanding] = useState("");
  const [attitude, setAttitude] = useState("");
  const [tone, setTone] = useState<ToneType>("normal");
  const [singleResult, setSingleResult] = useState("");

  // CSV
  const [csvText, setCsvText] = useState(
    "name,subject,unit,understanding,attitude\n山田太郎,英語,関係代名詞,やや苦戦,集中して取り組んでいた"
  );
  const [csvResults, setCsvResults] = useState<CsvResult[]>([]);

  // 共通
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerateSingle() {
    setError("");
    setSingleResult("");

    if (!subject || !unit || !understanding || !attitude) {
      setError("科目・単元・理解度・授業の様子を入力してな。");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/generate-comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "single",
          tone,
          data: {
            name,
            subject,
            unit,
            understanding,
            attitude,
          },
        }),
      });

      const data: SingleResult & { error?: string; usage?: any } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "コメント生成に失敗した。");
      }

      setSingleResult(data.comment);
      setUsage(data.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生した。");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateCsv() {
    setError("");
    setCsvResults([]);

    if (!csvText.trim()) {
      setError("CSVテキストを入力してな。");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/generate-comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "csv",
          tone,
          csvText,
        }),
      });

      const data: { results?: CsvResult[]; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "CSVコメント生成に失敗した。");
      }

      setCsvResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生した。");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("コピーしたで。");
    } catch {
      alert("コピーに失敗した。");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "32px 16px",
        color: "#111",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            marginBottom: "8px",
            color: "#111",
          }}
        >
          コミルコメント生成アプリ
        </h1>

        <p style={{ marginBottom: "20px", color: "#444" }}>
          手入力でもCSV一括でもコメントを生成できる版や。
        </p>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setMode("single")}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: mode === "single" ? "2px solid #2563eb" : "1px solid #ccc",
              background: mode === "single" ? "#dbeafe" : "#fff",
              cursor: "pointer",
              color: "#111",
              fontWeight: 600,
            }}
          >
            手入力モード
          </button>

          <button
            onClick={() => setMode("csv")}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: mode === "csv" ? "2px solid #2563eb" : "1px solid #ccc",
              background: mode === "csv" ? "#dbeafe" : "#fff",
              cursor: "pointer",
              color: "#111",
              fontWeight: 600,
            }}
          >
            CSV一括モード
          </button>
        </div>

        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            border: "1px solid #ddd",
            borderRadius: "12px",
            background: "#fafafa",
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: 700,
              marginBottom: "8px",
              color: "#111",
            }}
          >
            コメントの雰囲気
          </label>

          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as ToneType)}
            style={{
              width: "100%",
              maxWidth: "320px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              color: "#111",
              background: "#fff",
            }}
          >
            <option value="polite">ていねい</option>
            <option value="normal">ふつう</option>
            <option value="praise">ほめ強め</option>
            <option value="gentle">やさしめ</option>
            <option value="sparta">スパルタ</option>
          </select>
        </div>

        {mode === "single" && (
          <section>
            <div
              style={{
                display: "grid",
                gap: "14px",
                marginBottom: "20px",
              }}
            >
              <InputField label="生徒名（任意）" value={name} onChange={setName} />
              <InputField label="科目" value={subject} onChange={setSubject} />
              <InputField label="単元" value={unit} onChange={setUnit} />
              <InputField
                label="理解度"
                value={understanding}
                onChange={setUnderstanding}
              />
              <InputField
                label="授業の様子"
                value={attitude}
                onChange={setAttitude}
              />
            </div>

            <button
              onClick={handleGenerateSingle}
              disabled={loading}
              style={{
                padding: "12px 18px",
                borderRadius: "10px",
                border: "none",
                background: loading ? "#93c5fd" : "#2563eb",
                color: "#fff",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                marginBottom: "20px",
              }}
            >
              {loading ? "生成中..." : "コメントを生成"}
            </button>

            {singleResult && (
              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "16px",
                  background: "#f9fafb",
                }}
              >
                <h2
                  style={{
                    marginBottom: "10px",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#111",
                  }}
                >
                  生成結果
                  
                </h2>
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.8,
                    color: "#111",
                    marginBottom: "12px",
                  }}
                >
                  {singleResult}
                </p>
                {usage && (
                  <div style={{ marginTop: "10px", color: "#555" }}>
                    <p>入力トークン: {usage.inputTokens}</p>
                    <p>出力トークン: {usage.outputTokens}</p>
                    <p>コスト: ${usage.costUsd.toFixed(6)}</p>
                    <p>（約 {Math.round(usage.costYen)} 円）</p>
                    <button
                      onClick={() => copyToClipboard(singleResult)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        background: "#fff",
                        color: "#111",
                        cursor: "pointer",
                      }}
                    >
                      コピー
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {mode === "csv" && (
          <section>
            <label
              style={{
                display: "block",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#111",
              }}
            >
              CSV形式テキスト
            </label>

            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={10}
              className="text-black"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid #ccc",
                marginBottom: "16px",
                color: "#111",
                background: "#fff",
                resize: "vertical",
              }}
            />

            <button
              onClick={handleGenerateCsv}
              disabled={loading}
              style={{
                padding: "12px 18px",
                borderRadius: "10px",
                border: "none",
                background: loading ? "#93c5fd" : "#2563eb",
                color: "#fff",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                marginBottom: "20px",
              }}
            >
              {loading ? "生成中..." : "CSV一括でコメント生成"}
            </button>

            {csvResults.length > 0 && (
              <div style={{ display: "grid", gap: "14px" }}>
                {csvResults.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "12px",
                      padding: "16px",
                      background: "#f9fafb",
                    }}
                  >
                    <h3
                      style={{
                        marginBottom: "8px",
                        fontSize: "17px",
                        fontWeight: 700,
                        color: "#111",
                      }}
                    >
                      {item.name || `生徒${index + 1}`}
                    </h3>

                    <p style={{ marginBottom: "4px", color: "#444" }}>
                      <strong>科目:</strong> {item.subject}
                    </p>
                    <p style={{ marginBottom: "10px", color: "#444" }}>
                      <strong>単元:</strong> {item.unit}
                    </p>

                    <p
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.8,
                        color: "#111",
                        marginBottom: "12px",
                      }}
                    >
                      {item.comment}
                    </p>

                    <button
                      onClick={() => copyToClipboard(item.comment)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        background: "#fff",
                        color: "#111",
                        cursor: "pointer",
                      }}
                    >
                      コピー
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {error && (
          <p
            style={{
              marginTop: "18px",
              color: "#dc2626",
              fontWeight: 700,
            }}
          >
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontWeight: 700,
          marginBottom: "8px",
          color: "#111",
        }}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-black"
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          color: "#111",
          background: "#fff",
        }}
      />
    </div>
  );
}
"use client";

import React, { useEffect, useState } from "react";

type ToneType = "polite" | "normal" | "praise" | "gentle" | "sparta";

type UsageType = {
  inputTokens?: number;
  outputTokens?: number;
  totalCostUsd?: number;
  totalCostJpy?: number;
  costUsd?: number;
  costYen?: number;
};

type SingleResultResponse = {
  comment: string;
  usage?: UsageType;
  error?: string;
};

type CsvResult = {
  name: string;
  subject: string;
  unit: string;
  comment: string;
  usage?: UsageType;
};

type CsvResponse = {
  results?: CsvResult[];
  error?: string;
};

type LogItem = {
  id: string;
  date: string;
  mode: "single" | "csv";
  name: string;
  subject: string;
  unit: string;
  understanding: string;
  attitude: string;
  tone: string;
  comment: string;
  costJpy: number;
};

const LOG_STORAGE_KEY = "commentLogs";

export default function Page() {
  const [mode, setMode] = useState<"single" | "csv">("single");
  const [usage, setUsage] = useState<UsageType | null>(null);

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

  // ログ
  const [logs, setLogs] = useState<LogItem[]>([]);

  // 共通
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOG_STORAGE_KEY);
      if (saved) {
        setLogs(JSON.parse(saved));
      }
    } catch {
      // 何もしない
    }
  }, []);

  function persistLogs(nextLogs: LogItem[]) {
    setLogs(nextLogs);
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(nextLogs));
  }

  function prependLogs(items: LogItem[]) {
    setLogs((prevLogs) => {
      const nextLogs = [...items, ...prevLogs];
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(nextLogs));
      return nextLogs;
    });
  }

  function deleteLog(id: string) {
    setLogs((prevLogs) => {
      const nextLogs = prevLogs.filter((log) => log.id !== id);
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(nextLogs));
      return nextLogs;
    });
  }

  function clearLogs() {
    persistLogs([]);
  }

  function getUsd(u?: UsageType | null) {
    return u?.totalCostUsd ?? u?.costUsd ?? 0;
  }

  function getJpy(u?: UsageType | null) {
    return u?.totalCostJpy ?? u?.costYen ?? 0;
  }

  async function handleGenerateSingle() {
    setError("");
    setSingleResult("");
    setUsage(null);

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

      const data: SingleResultResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "コメント生成に失敗した。");
      }

      const comment = data.comment || "";
      const responseUsage = data.usage || null;
      const costJpy = getJpy(responseUsage);

      setSingleResult(comment);
      setUsage(responseUsage);

      prependLogs([
        {
          id: crypto.randomUUID(),
          date: new Date().toLocaleString(),
          mode: "single",
          name: name || "",
          subject,
          unit,
          understanding,
          attitude,
          tone,
          comment,
          costJpy,
        },
      ]);
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

      const data: CsvResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "CSVコメント生成に失敗した。");
      }

      const results = data.results || [];
      setCsvResults(results);

      const now = new Date().toLocaleString();

      const newLogs: LogItem[] = results.map((item, index) => ({
        id: crypto.randomUUID(),
        date: now,
        mode: "csv",
        name: item.name || `生徒${index + 1}`,
        subject: item.subject || "",
        unit: item.unit || "",
        understanding: "",
        attitude: "",
        tone,
        comment: item.comment || "",
        costJpy: getJpy(item.usage),
      }));

      if (newLogs.length > 0) {
        prependLogs(newLogs);
      }
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
                  <div style={{ marginTop: "10px", color: "#555", marginBottom: "12px" }}>
                    <p>入力トークン: {usage.inputTokens ?? 0}</p>
                    <p>出力トークン: {usage.outputTokens ?? 0}</p>
                    <p>コスト: ${getUsd(usage).toFixed(6)}</p>
                    <p>（約 {getJpy(usage).toFixed(2)} 円）</p>
                  </div>
                )}

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

                    {item.usage && (
                      <div style={{ marginTop: "10px", color: "#555", marginBottom: "12px" }}>
                        <p>コスト: ${getUsd(item.usage).toFixed(6)}</p>
                        <p>（約 {getJpy(item.usage).toFixed(2)} 円）</p>
                      </div>
                    )}

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

        <section style={{ marginTop: "40px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#111",
                margin: 0,
              }}
            >
              履歴
            </h2>

            {logs.length > 0 && (
              <button
                onClick={clearLogs}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  background: "#fff",
                  color: "#111",
                  cursor: "pointer",
                }}
              >
                履歴を全削除
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <p style={{ color: "#666" }}>履歴はまだありません。</p>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    padding: "12px",
                    background: "#fafafa",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                    {log.date} / {log.mode === "single" ? "手入力" : "CSV"}
                  </div>

                  <div style={{ fontWeight: 700, color: "#111", marginBottom: "6px" }}>
                    {log.name || "（名前なし）"} ｜ {log.subject} / {log.unit}
                  </div>

                  <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>
                    理解度: {log.understanding || "—"} ／ 授業の様子: {log.attitude || "—"} ／
                    トーン: {log.tone}
                  </div>

                  <p
                    style={{
                      margin: "6px 0 10px 0",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.7,
                      color: "#111",
                    }}
                  >
                    {log.comment}
                  </p>

                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                    約 {log.costJpy.toFixed(2)} 円
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => copyToClipboard(log.comment)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        background: "#fff",
                        color: "#111",
                        cursor: "pointer",
                      }}
                    >
                      コピー
                    </button>

                    <button
                      onClick={() => deleteLog(log.id)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        background: "#fff",
                        color: "#111",
                        cursor: "pointer",
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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
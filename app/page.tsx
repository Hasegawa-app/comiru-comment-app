"use client";

import { useState } from "react";

export default function Page() {
  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");
  const [understanding, setUnderstanding] = useState("普通");
  const [attitude, setAttitude] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult("");
    setCopied(false);

    try {
      const res = await fetch("/api/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          unit,
          understanding,
          attitude,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "コメント生成に失敗した");
      }

      setResult(data.comment || "");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("不明なエラーが起きた");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerBox}>
          <h1 style={styles.title}>コミルコメント生成</h1>
          <p style={styles.subtitle}>
            授業内容を入れると、コミルに貼れるコメントを生成する
          </p>
        </div>

        <div style={styles.card}>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>科目</label>
              <input
                style={styles.input}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="例：英語"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>単元</label>
              <input
                style={styles.input}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="例：関係代名詞"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>理解度</label>
              <select
                style={styles.input}
                value={understanding}
                onChange={(e) => setUnderstanding(e.target.value)}
              >
                <option value="よくできた">よくできた</option>
                <option value="普通">普通</option>
                <option value="やや苦戦">やや苦戦</option>
                <option value="苦戦">苦戦</option>
              </select>
            </div>

            <div style={styles.fieldFull}>
              <label style={styles.label}>授業の様子・補足</label>
              <textarea
                style={styles.textarea}
                value={attitude}
                onChange={(e) => setAttitude(e.target.value)}
                placeholder="例：問題演習に集中して取り組めていた。計算ミスが少し見られた。"
              />
            </div>
          </div>

          <button
            style={{
              ...styles.button,
              ...(loading || !subject || !unit ? styles.buttonDisabled : {}),
            }}
            onClick={handleGenerate}
            disabled={loading || !subject || !unit}
          >
            {loading ? "生成中..." : "コメントを生成"}
          </button>

          {loading && <p style={styles.loadingText}>AIがコメントを作成中...</p>}

          {error && <div style={styles.errorBox}>{error}</div>}
        </div>

        <div style={styles.resultCard}>
          <div style={styles.resultHeader}>
            <h2 style={styles.resultTitle}>生成結果</h2>
            <button
              style={{
                ...styles.copyButton,
                ...(!result ? styles.copyButtonDisabled : {}),
              }}
              onClick={handleCopy}
              disabled={!result}
            >
              {copied ? "コピー済み" : "コピー"}
            </button>
          </div>

          {result ? (
            <p style={styles.resultText}>{result}</p>
          ) : (
            <p style={styles.placeholderText}>
              ここに生成されたコメントが表示される
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, rgb(244, 247, 255) 0%, rgb(250, 251, 255) 100%)",
    padding: "32px 16px",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: "880px",
    margin: "0 auto",
  },
  headerBox: {
    marginBottom: "20px",
  },
  title: {
    fontSize: "32px",
    fontWeight: 800,
    margin: 0,
    color: "#1f2a44",
  },
  subtitle: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#5f6b85",
    fontSize: "15px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(31, 42, 68, 0.08)",
    border: "1px solid #e7ebf3",
    marginBottom: "20px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
  },
  fieldFull: {
    display: "flex",
    flexDirection: "column",
    gridColumn: "1 / -1",
  },
  label: {
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 700,
    color: "#33415c",
  },
  input: {
    height: "44px",
    borderRadius: "12px",
    border: "1px solid #cfd7e6",
    padding: "0 14px",
    fontSize: "15px",
    outline: "none",
    backgroundColor: "#fbfcff",
    boxSizing: "border-box",
  },
  textarea: {
    minHeight: "120px",
    borderRadius: "12px",
    border: "1px solid #cfd7e6",
    padding: "14px",
    fontSize: "15px",
    outline: "none",
    resize: "vertical",
    backgroundColor: "#fbfcff",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  button: {
    marginTop: "20px",
    width: "100%",
    height: "48px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#3b82f6",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "0.2s",
  },
  buttonDisabled: {
    backgroundColor: "#9dbcf5",
    cursor: "not-allowed",
  },
  loadingText: {
    marginTop: "12px",
    color: "#4b5b7a",
    fontSize: "14px",
  },
  errorBox: {
    marginTop: "16px",
    backgroundColor: "#fff1f2",
    color: "#b42318",
    border: "1px solid #fecdd3",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
  },
  resultCard: {
    backgroundColor: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(31, 42, 68, 0.08)",
    border: "1px solid #e7ebf3",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },
  resultTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 800,
    color: "#1f2a44",
  },
  copyButton: {
    height: "38px",
    padding: "0 14px",
    borderRadius: "10px",
    border: "1px solid #cfd7e6",
    backgroundColor: "#f8fafc",
    color: "#33415c",
    fontWeight: 700,
    cursor: "pointer",
  },
  copyButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  resultText: {
    margin: 0,
    whiteSpace: "pre-wrap",
    lineHeight: 1.9,
    fontSize: "15px",
    color: "#24324a",
  },
  placeholderText: {
    margin: 0,
    color: "#8a94a6",
    fontSize: "15px",
  },
};
import { useState } from "react";
import axios from "axios";
import "./App.css";

interface ExtractionResult {
  success: boolean;
  type: string;
  data?: Record<string, string | null>;
  summary?: string;
  rawText?: string;
  fullText?: string;
  message?: string;
}

const TYPE_LABELS: Record<string, string> = {
  invoice: "Invoice",
  bank_statement: "Bank Statement",
  generic_document: "Generic Document",
};

const TYPE_COLORS: Record<string, string> = {
  invoice: "#2563eb",
  bank_statement: "#16a34a",
  generic_document: "#7c3aed",
};

const FIELD_LABELS: Record<string, string> = {
  invoiceNumber: "Invoice Number",
  total: "Total Amount",
  date: "Invoice Date",
  orderNumber: "Order Number",
  seller: "Seller",
  accountNumber: "Account Number",
  balance: "Balance",
  bankName: "Bank Name",
};

function ResultCard({ result }: { result: ExtractionResult }) {
  const color = TYPE_COLORS[result.type] || "#6b7280";
  const label = TYPE_LABELS[result.type] || result.type;

  const fields = result.data
    ? Object.entries(result.data).filter(([k, v]) => k !== "type" && v !== null)
    : [];

  return (
    <div className="result-card">
      <div className="result-header">
        <span className="type-badge" style={{ background: color }}>
          {label}
        </span>
        <span className="result-title">Extraction Result</span>
      </div>

      {result.summary && (
        <div className="summary-box">
          <p className="summary-label">Summary</p>
          <p className="summary-text">{result.summary}</p>
        </div>
      )}

      {fields.length > 0 && (
        <div className="fields-section">
          <p className="fields-label">Extracted Fields</p>
          <div className="fields-grid">
            {fields.map(([key, value]) => (
              <div className="field-row" key={key}>
                <span className="field-key">{FIELD_LABELS[key] || key}</span>
                <span className="field-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.type === "generic_document" && result.fullText && (
        <div className="fields-section">
          <p className="fields-label">Document Text</p>
          <p className="raw-text">{result.fullText.substring(0, 600)}…</p>
        </div>
      )}
    </div>
  );
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:3000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2 className="title">📄 Smart Report Extractor</h2>
        <p className="subtitle">Upload a PDF to extract structured data and get an AI summary</p>

        <div className="upload-row">
          <label className="file-label">
            <input
              type="file"
              accept="application/pdf"
              className="file-input"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setResult(null);
                setError("");
              }}
            />
            {file ? file.name : "Choose PDF"}
          </label>

          <button onClick={handleUpload} disabled={loading} className="upload-btn">
            {loading ? "Processing…" : "Upload PDF"}
          </button>
        </div>

        {error && <p className="error-msg">{error}</p>}
      </div>

      {result && <ResultCard result={result} />}
    </div>
  );
}

export default App;

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
  generic_document: "Generic Document",
};

const TYPE_COLORS: Record<string, string> = {
  invoice: "#4f46e5",
  generic_document: "#7c3aed",
};

const TYPE_ICONS: Record<string, string> = {
  invoice: "🧾",
  generic_document: "📄",
};

const FIELD_LABELS: Record<string, string> = {
  invoiceNumber: "Invoice Number",
  total: "Total Amount",
  date: "Invoice Date",
  orderNumber: "Order Number",
  seller: "Seller",
};

function CloudIcon() {
  return (
    <svg
      className="cloud-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

function ResultCard({ result }: { result: ExtractionResult }) {
  const [showFullText, setShowFullText] = useState(false);
  const color = TYPE_COLORS[result.type] || "#6b7280";
  const label = TYPE_LABELS[result.type] || result.type;
  const icon = TYPE_ICONS[result.type] || "📄";

  const fields = result.data
    ? Object.entries(result.data).filter(([k, v]) => k !== "type" && v !== null)
    : [];

  return (
    <div
      className="result-card"
      style={{ "--accent-color": color } as React.CSSProperties}
    >
      <div className="result-header">
        <div className="result-header-left">
          <span className="type-badge" style={{ background: color }}>
            <span>{icon}</span>
            {label}
          </span>
          <span className="result-title">Extraction Complete</span>
        </div>
        <span className="success-chip">✓ Success</span>
      </div>

      {result.summary && (
        <div className="summary-box">
          <p className="section-label">AI Summary</p>
          <p className="summary-text">{result.summary}</p>
        </div>
      )}

      {fields.length > 0 && (
        <div className="fields-section">
          <p className="section-label">Extracted Fields</p>
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
          <p className="section-label">Document Preview</p>
          <p className="raw-text">
            {showFullText ? result.fullText : result.fullText.substring(0, 600)}
            {!showFullText && result.fullText.length > 600 && "…"}
          </p>
          {result.fullText.length > 600 && (
            <button
              className="view-more-btn"
              onClick={() => setShowFullText((v) => !v)}
            >
              {showFullText ? "Show less ↑" : "View full text ↓"}
            </button>
          )}
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
      setError("Please select a PDF file first");
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
      if (!res.data.success) {
        setError(res.data.message || "Could not process this file.");
      } else {
        setResult(res.data);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Upload failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="page">
      <header className="app-header">
        <div className="header-icon-wrap">
          <span className="header-icon">📄</span>
        </div>
        <h1 className="app-title">Smart Report Extractor</h1>
        <p className="app-tagline">
          Upload a PDF and get AI-powered structured data extraction in seconds
        </p>
      </header>

      <div className="card">
        <label className="upload-zone" data-active={!!file}>
          <input
            type="file"
            accept="application/pdf"
            className="file-input"
            onChange={(e) => {
              const selected = e.target.files?.[0] || null;
              if (selected && selected.size > 50 * 1024 * 1024) {
                setError(
                  "File exceeds the 50 MB limit. Please compress or use a smaller PDF.",
                );
                setFile(null);
                e.target.value = "";
                return;
              }
              setFile(selected);
              setResult(null);
              setError("");
            }}
          />
          <CloudIcon />
          {file ? (
            <div className="upload-zone-content">
              <span className="upload-filename">{file.name}</span>
              <span className="upload-meta">
                {formatFileSize(file.size)} · Click to change
              </span>
            </div>
          ) : (
            <div className="upload-zone-content">
              <span className="upload-cta">Click to choose a PDF</span>
              <span className="upload-hint">PDF only, max 50 MB</span>
            </div>
          )}
        </label>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="upload-btn"
        >
          {loading ? (
            <>
              <Spinner />
              Analyzing document…
            </>
          ) : (
            <>
              Extract Data
              <span className="btn-arrow">→</span>
            </>
          )}
        </button>

        {error && (
          <div className="error-msg">
            <span className="error-icon">⚠</span>
            {error}
          </div>
        )}
      </div>

      {result && <ResultCard result={result} />}
    </div>
  );
}

export default App;

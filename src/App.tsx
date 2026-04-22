import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
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
      const res = await axios.post(
        "http://localhost:3000/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h2>?? Smart Report Extractor</h2>
      <p>Upload a PDF to extract structured data and get an AI summary</p>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ marginBottom: "10px" }}
      />

      <br />

      <button
        onClick={handleUpload}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: loading ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Uploading..." : "Upload PDF"}
      </button>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>? Extraction Result:</h3>

          <div
            style={{
              background: "#f4f4f4",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              maxHeight: "500px",
              overflowY: "auto",
            }}
          >
            <pre style={{ margin: 0, fontSize: "12px" }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

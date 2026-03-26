"use client";
import { useState, useEffect, useRef } from "react";

interface Step {
  label: string;
  status: "done" | "running" | "error";
  ts: string;
}

interface ScrapeProgressProps {
  jobId: string;
  onComplete?: () => void;
}

export default function ScrapeProgress({ jobId, onComplete }: ScrapeProgressProps) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [status, setStatus] = useState("connecting");
  const [pagesDone, setPagesDone] = useState(0);
  const [pagesTotal, setPagesTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const doneCalledRef = useRef(false);

  useEffect(() => {
    if (!jobId) return;

    const es = new EventSource(`/api/knowledge/scrape/stream?jobId=${jobId}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.error) {
          setError(data.error);
          setStatus("error");
          es.close();
          return;
        }

        setStatus(data.status || "running");
        setPagesDone(data.pages_done || 0);
        setPagesTotal(data.pages_total || 0);
        if (data.steps) setSteps(data.steps);

        if (data.status === "done" || data.status === "error") {
          es.close();
          if (data.status === "done" && !doneCalledRef.current) {
            doneCalledRef.current = true;
            setTimeout(() => onComplete?.(), 2000);
          }
        }
      } catch { }
    };

    es.onerror = () => {
      setError("Connection lost. Scraping continues in the background.");
      es.close();
    };

    return () => { es.close(); };
  }, [jobId, onComplete]);

  const pct = pagesTotal > 0 ? Math.round((pagesDone / pagesTotal) * 100) : 0;
  const isDone = status === "done";
  const isError = status === "error";

  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "16px",
      padding: "20px",
      margin: "16px 0",
      maxWidth: "500px",
      width: "100%",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        {!isDone && !isError && (
          <div style={{
            width: "20px", height: "20px", border: "2px solid #818cf8",
            borderTopColor: "transparent", borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
        )}
        {isDone && <span style={{ fontSize: "20px" }}>✅</span>}
        {isError && <span style={{ fontSize: "20px" }}>❌</span>}
        <span style={{
          fontWeight: 600, fontSize: "15px",
          color: isDone ? "#4ade80" : isError ? "#f87171" : "#e2e8f0",
        }}>
          {isDone ? "Import complete!" : isError ? "Import failed" : "Importing website content..."}
        </span>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "20px", textAlign: "center", flexShrink: 0 }}>
              {step.status === "done" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {step.status === "running" && (
                <div style={{
                  width: "14px", height: "14px", border: "2px solid #818cf8",
                  borderTopColor: "transparent", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite", margin: "0 auto",
                }} />
              )}
              {step.status === "error" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>
            <span style={{
              fontSize: "13px",
              color: step.status === "done" ? "#94a3b8" : step.status === "error" ? "#f87171" : "#e2e8f0",
            }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {pagesTotal > 0 && (
        <div>
          <div style={{
            height: "6px", borderRadius: "3px",
            background: "rgba(255,255,255,0.1)", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: "3px",
              background: isDone ? "#4ade80" : "linear-gradient(90deg, #6366f1, #818cf8)",
              width: `${pct}%`,
              transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: "12px", color: "#64748b", marginTop: "6px",
          }}>
            <span>{pagesDone}/{pagesTotal} pages</span>
            <span>{pct}%</span>
          </div>
        </div>
      )}

      {error && (
        <div style={{ fontSize: "12px", color: "#f87171", marginTop: "8px" }}>
          {error}
        </div>
      )}

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

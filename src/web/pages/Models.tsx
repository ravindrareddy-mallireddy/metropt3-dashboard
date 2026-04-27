import { useEffect, useState } from "react";
import { fetchModelMetrics } from "../lib/api";

interface ModelMetric {
  name: string;
  accuracy: number;
  f1: number;
  precision: number;
  recall: number;
  roc_auc: number;
  color: string;
}

export default function Models() {
  const [models, setModels] = useState<ModelMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModelMetrics()
      .then((d) => { setModels(d.models); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <p style={{ color: "#6b7280" }}>Loading…</p>;
  if (error)   return <p style={{ color: "#dc2626" }}>Error: {error}</p>;

  const metrics = ["accuracy", "f1", "precision", "recall", "roc_auc"] as const;
  const labels: Record<string, string> = {
    accuracy: "Accuracy", f1: "F1 Score",
    precision: "Precision", recall: "Recall", roc_auc: "ROC AUC",
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Model Performance</h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 28 }}>
        Evaluation metrics from test set. All four models were trained on the MetroPT-3 dataset.
      </p>

      {/* Metrics table */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 32 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={th}>Model</th>
              {metrics.map((m) => <th key={m} style={th}>{labels[m]}</th>)}
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <tr key={model.name} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: model.color, display: "inline-block" }} />
                    {model.name}
                  </div>
                </td>
                {metrics.map((m) => (
                  <td key={m} style={td}>{(model[m] * 100).toFixed(2)}%</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar chart comparison — F1 */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>F1 Score Comparison</h2>
        {models.map((m) => (
          <div key={m.name} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: "#374151" }}>{m.name}</span>
              <span style={{ fontWeight: 600 }}>{(m.f1 * 100).toFixed(2)}%</span>
            </div>
            <div style={{ background: "#f3f4f6", borderRadius: 4, height: 10, overflow: "hidden" }}>
              <div style={{
                width: `${m.f1 * 100}%`, height: "100%",
                background: m.color, borderRadius: 4,
                transition: "width 0.6s ease",
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* ROC AUC bar chart */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>ROC AUC Comparison</h2>
        {models.map((m) => (
          <div key={m.name} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: "#374151" }}>{m.name}</span>
              <span style={{ fontWeight: 600 }}>{(m.roc_auc * 100).toFixed(2)}%</span>
            </div>
            <div style={{ background: "#f3f4f6", borderRadius: 4, height: 10, overflow: "hidden" }}>
              <div style={{
                width: `${m.roc_auc * 100}%`, height: "100%",
                background: m.color, borderRadius: 4,
                transition: "width 0.6s ease",
              }} />
            </div>
          </div>
        ))}
      </div>

      <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 16 }}>
        RF and XGB are used for live prediction. LSTM and Transformer metrics are from offline evaluation only.
      </p>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left", padding: "11px 16px",
  fontWeight: 600, fontSize: 13, color: "#6b7280",
  borderBottom: "1px solid #e5e7eb",
};
const td: React.CSSProperties = {
  padding: "11px 16px", color: "#111827",
};

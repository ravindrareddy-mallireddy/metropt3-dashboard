import { useEffect, useState } from "react";
import { fetchSample, fetchPredict } from "../lib/api";

const FIELDS = [
  { key: "TP2",          label: "TP2 (bar)",           min: -1,  max: 12,  step: 0.01 },
  { key: "TP3",          label: "TP3 (bar)",           min: -1,  max: 12,  step: 0.01 },
  { key: "H1",           label: "H1 (bar)",            min: -1,  max: 12,  step: 0.01 },
  { key: "DV_pressure",  label: "DV Pressure (bar)",   min: -1,  max: 5,   step: 0.01 },
  { key: "Reservoirs",   label: "Reservoirs (bar)",    min: -1,  max: 12,  step: 0.01 },
  { key: "Oil_temperature", label: "Oil Temp (°C)",    min: 0,   max: 100, step: 0.1  },
  { key: "Motor_current",   label: "Motor Current (A)",min: 0,   max: 10,  step: 0.01 },
  { key: "COMP",            label: "Compressor",       min: 0,   max: 1,   step: 1    },
  { key: "DV_eletric",      label: "DV Electric",      min: 0,   max: 1,   step: 1    },
  { key: "Towers",          label: "Towers",           min: 0,   max: 1,   step: 1    },
  { key: "MPG",             label: "MPG",              min: 0,   max: 1,   step: 1    },
  { key: "LPS",             label: "LPS",              min: 0,   max: 1,   step: 1    },
  { key: "Pressure_switch", label: "Pressure Switch",  min: 0,   max: 1,   step: 1    },
  { key: "Oil_level",       label: "Oil Level",        min: 0,   max: 1,   step: 1    },
  { key: "Caudal_impulses", label: "Caudal Impulses",  min: 0,   max: 5,   step: 1    },
];

interface Result {
  rf:  { probability: number; prediction: number; risk_pct: number; threshold: number };
  xgb: { probability: number; prediction: number; risk_pct: number; threshold: number };
  ensemble: { probability: number; risk_pct: number; prediction: number };
}

export default function Predict() {
  const [values, setValues] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSample().then((d) => setValues(d.values));
  }, []);

  async function run() {
    setLoading(true);
    try {
      const res = await fetchPredict(values);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    const d = await fetchSample();
    setValues(d.values);
    setResult(null);
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Prediction</h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 28 }}>
        Adjust sensor readings below and click Run to get model predictions.
      </p>

      {/* Sensor inputs */}
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 24,
        marginBottom: 24,
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Sensor Inputs</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px 32px" }}>
          {FIELDS.map(({ key, label, min, max, step }) => (
            <div key={key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <label style={{ fontSize: 13, color: "#374151" }}>{label}</label>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#2563eb" }}>
                  {values[key] !== undefined ? values[key].toFixed(step < 1 ? 2 : 0) : "—"}
                </span>
              </div>
              <input
                type="range"
                min={min} max={max} step={step}
                value={values[key] ?? 0}
                onChange={(e) => setValues((v) => ({ ...v, [key]: parseFloat(e.target.value) }))}
                style={{ width: "100%", accentColor: "#2563eb" }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button
            onClick={run}
            disabled={loading}
            style={{
              background: "#2563eb", color: "#fff", border: "none",
              padding: "9px 24px", borderRadius: 7, fontWeight: 600,
              fontSize: 14, cursor: "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Running…" : "Run Prediction"}
          </button>
          <button
            onClick={reset}
            style={{
              background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb",
              padding: "9px 20px", borderRadius: 7, fontSize: 14, cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: 24,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Results</h2>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={th}>Model</th>
                <th style={th}>Failure Probability</th>
                <th style={th}>Threshold Used</th>
                <th style={th}>Class</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Random Forest", d: result.rf  },
                { name: "XGBoost",       d: result.xgb },
              ].map(({ name, d }) => (
                <tr key={name} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={td}>{name}</td>
                  <td style={td}>{(d.probability * 100).toFixed(1)}%</td>
                  <td style={td}>{(d.threshold * 100).toFixed(1)}%</td>
                  <td style={td}>
                    <span style={{
                      padding: "2px 10px", borderRadius: 5, fontSize: 12, fontWeight: 600,
                      background: d.prediction === 1 ? "#fef2f2" : "#f0fdf4",
                      color: d.prediction === 1 ? "#dc2626" : "#16a34a",
                    }}>
                      {d.prediction === 1 ? "Failure" : "Normal"}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ background: "#f9fafb", fontWeight: 600 }}>
                <td style={td}>Ensemble (avg)</td>
                <td style={td}>{(result.ensemble.probability * 100).toFixed(1)}%</td>
                <td style={td}>50.0%</td>
                <td style={td}>
                  <span style={{
                    padding: "2px 10px", borderRadius: 5, fontSize: 12, fontWeight: 600,
                    background: result.ensemble.prediction === 1 ? "#fef2f2" : "#f0fdf4",
                    color: result.ensemble.prediction === 1 ? "#dc2626" : "#16a34a",
                  }}>
                    {result.ensemble.prediction === 1 ? "Failure" : "Normal"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 14 }}>
            Ensemble = average of RF and XGB probabilities. Classified as Failure if probability &gt; 50%.
          </p>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left", padding: "10px 14px",
  fontWeight: 600, fontSize: 13, color: "#6b7280",
  borderBottom: "1px solid #e5e7eb",
};
const td: React.CSSProperties = {
  padding: "11px 14px", color: "#111827",
};

import { useEffect, useState } from "react";
import { fetchFeatureImportance } from "../lib/api";

interface Bar { feature: string; importance: number; }
interface Data {
  rf: Bar[];
  xgb: Bar[];
  warnings?: string[];
}

export default function Features() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeatureImportance()
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <p style={{ color: "#6b7280" }}>Loading…</p>;
  if (error)   return <p style={{ color: "#dc2626" }}>Error: {error}</p>;
  if (!data)   return null;

  const hasXgbData = data.xgb.length > 0;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Feature Importance</h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 28 }}>
        Top 10 features ranked by contribution to failure prediction.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: hasXgbData ? "1fr 1fr" : "1fr", gap: 24 }}>
        <Chart title="Random Forest" data={data.rf} color="#2563eb" />
        {hasXgbData && (
          <Chart
            title="XGBoost"
            data={data.xgb}
            color="#d97706"
          />
        )}
      </div>

      <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 20 }}>
        {hasXgbData
          ? "RF importance = mean decrease in impurity. XGB importance = gain."
          : "RF importance = mean decrease in impurity."}
      </p>
    </div>
  );
}

function Chart({
  title,
  data,
  color,
}: {
  title: string;
  data: Bar[];
  color: string;
}) {
  const max = Math.max(...data.map((d) => d.importance));
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 24 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>{title}</h2>
      {data.map((item, i) => (
        <div key={item.feature} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
            <span style={{ color: "#374151" }}>{i + 1}. {item.feature}</span>
            <span style={{ fontWeight: 600 }}>{(item.importance * 100).toFixed(2)}%</span>
          </div>
          <div style={{ background: "#f3f4f6", borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{
              width: `${(item.importance / max) * 100}%`,
              height: "100%", background: color, borderRadius: 4,
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

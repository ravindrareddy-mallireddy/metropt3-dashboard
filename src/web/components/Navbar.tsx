import { Link, useLocation } from "wouter";

const links = [
  { path: "/predict", label: "Predict" },
  { path: "/models",  label: "Models"  },
  { path: "/features",label: "Features"},
];

export default function Navbar() {
  const [loc] = useLocation();
  const active = (p: string) => loc === p || (loc === "/" && p === "/predict");

  return (
    <nav style={{
      background: "#fff",
      borderBottom: "1px solid #e5e7eb",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      gap: 32,
      height: 56,
    }}>
      <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>
        MetroPT-3
      </span>
      <div style={{ display: "flex", gap: 4 }}>
        {links.map(({ path, label }) => (
          <Link key={path} href={path}>
            <span style={{
              padding: "6px 14px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: active(path) ? 600 : 400,
              background: active(path) ? "#eff6ff" : "transparent",
              color: active(path) ? "#2563eb" : "#6b7280",
            }}>
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

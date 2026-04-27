const BASE = '/api';

export async function fetchSample() {
  const r = await fetch(`${BASE}/sample`);
  return r.json();
}

export async function fetchPredict(values: Record<string, number>) {
  const r = await fetch(`${BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values)
  });
  return r.json();
}

export async function fetchFeatureImportance() {
  const r = await fetch(`${BASE}/feature-importance`);
  return r.json();
}

export async function fetchModelMetrics() {
  const r = await fetch(`${BASE}/model-metrics`);
  return r.json();
}

export async function fetchHealth() {
  try {
    const r = await fetch(`${BASE}/health`);
    return r.json();
  } catch {
    return null;
  }
}

import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono().basePath('api');

app.use(cors({ origin: '*' }));

// Forward all /api/* requests to the Flask backend on port 5050
app.all('/*', async (c) => {
  const url = new URL(c.req.url);
  const flaskUrl = `http://127.0.0.1:5050/api${url.pathname.replace('/api', '')}${url.search}`;

  const init: RequestInit = {
    method: c.req.method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    init.body = await c.req.text();
  }

  try {
    const res = await fetch(flaskUrl, init);
    const data = await res.json();
    return c.json(data, res.status as any);
  } catch (e: any) {
    return c.json({ error: 'Flask API unreachable', detail: e.message }, 502);
  }
});

export default app;

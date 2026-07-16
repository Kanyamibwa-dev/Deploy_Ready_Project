const test = require('node:test');
const assert = require('node:assert');
const app = require('../server');

// Helper: start the app on a random free port and return {server, baseUrl}
function startServer() {
  const server = app.listen(0);
  const port = server.address().port;
  return { server, baseUrl: `http://localhost:${port}` };
}

test('GET /health returns status ok', async () => {
  const { server, baseUrl } = startServer();
  try {
    const res = await fetch(`${baseUrl}/health`);
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'ok');
  } finally {
    server.close();
  }
});

test('GET /metrics returns uptime and memory usage', async () => {
  const { server, baseUrl } = startServer();
  try {
    const res = await fetch(`${baseUrl}/metrics`);
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof body.uptime, 'number');
    assert.ok(body.memoryUsage && typeof body.memoryUsage === 'object');
  } finally {
    server.close();
  }
});

test('POST /data echoes the JSON body back', async () => {
  const { server, baseUrl } = startServer();
  try {
    const payload = { hello: 'world', n: 42 };
    const res = await fetch(`${baseUrl}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(body, payload);
  } finally {
    server.close();
  }
});

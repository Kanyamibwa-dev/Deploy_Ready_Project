const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// GET /health -> simple liveness check used by monitoring and the deploy pipeline
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /metrics -> basic process metrics
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

// POST /data -> echoes back whatever JSON body was sent
app.post('/data', (req, res) => {
  res.json(req.body);
});

// Only start listening when this file is run directly (not when required by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;

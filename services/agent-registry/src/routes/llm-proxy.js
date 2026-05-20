const express = require('express');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const router = express.Router();

function getProxyUrl() {
  return process.env.SAP_AI_PROXY_URL;
}

function proxyRequest(req, res, targetPath) {
  const baseUrl = getProxyUrl();
  if (!baseUrl) {
    return res.status(503).json({
      error: { code: 'PROXY_NOT_CONFIGURED', message: 'SAP_AI_PROXY_URL environment variable not set' }
    });
  }

  const url = new URL(targetPath, baseUrl);
  const transport = url.protocol === 'https:' ? https : http;

  const headers = {
    'Content-Type': 'application/json'
  };
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  }
  if (req.headers.accept) {
    headers['Accept'] = req.headers.accept;
  }

  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method: req.method,
    headers: headers
  };

  const proxyReq = transport.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode);

    Object.keys(proxyRes.headers).forEach((key) => {
      res.setHeader(key, proxyRes.headers[key]);
    });

    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[llm-proxy] Proxy error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: { code: 'PROXY_ERROR', message: 'Failed to reach LLM service: ' + err.message }
      });
    }
  });

  if (req.method === 'POST' || req.method === 'PUT') {
    const body = JSON.stringify(req.body);
    proxyReq.setHeader('Content-Length', Buffer.byteLength(body));
    proxyReq.write(body);
  }

  proxyReq.end();
}

router.post('/chat/completions', (req, res) => {
  proxyRequest(req, res, '/v1/chat/completions');
});

router.get('/models', (req, res) => {
  proxyRequest(req, res, '/v1/models');
});

module.exports = router;

/**
 * AI Factory - Agent Registry Service
 * REST API for managing AI agents
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const agentRoutes = require('./routes/agents');
const toolRoutes = require('./routes/tools');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'agent-registry',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/tools', toolRoutes);

// API Info
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'AI Factory Agent Registry API',
    version: '1.0.0',
    endpoints: {
      agents: {
        list: 'GET /api/v1/agents',
        get: 'GET /api/v1/agents/:id',
        create: 'POST /api/v1/agents',
        update: 'PUT /api/v1/agents/:id',
        delete: 'DELETE /api/v1/agents/:id',
        search: 'GET /api/v1/agents/search'
      },
      tools: {
        list: 'GET /api/v1/tools',
        get: 'GET /api/v1/tools/:id',
        create: 'POST /api/v1/tools',
        update: 'PUT /api/v1/tools/:id',
        delete: 'DELETE /api/v1/tools/:id'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           AI Factory - Agent Registry Service              ║
╠═══════════════════════════════════════════════════════════╣
║  Status:    Running                                        ║
║  Port:      ${PORT}                                            ║
║  API:       http://localhost:${PORT}/api/v1                    ║
║  Health:    http://localhost:${PORT}/health                    ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
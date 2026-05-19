/**
 * Agent Routes
 * CRUD operations for AI agents
 */

const express = require('express');
const router = express.Router();
const agentService = require('../services/agentService');

/**
 * GET /api/v1/agents
 * List all agents with optional filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const { framework, status, search, tags, limit = 50, offset = 0 } = req.query;
    
    const filters = {
      framework,
      status,
      search,
      tags: tags ? tags.split(',') : undefined
    };
    
    const result = await agentService.listAgents(filters, { limit: parseInt(limit), offset: parseInt(offset) });
    
    res.json({
      data: result.agents,
      pagination: {
        total: result.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.total > parseInt(offset) + result.agents.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/agents/search
 * Search agents by query
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q, framework, status, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        error: {
          code: 'MISSING_QUERY',
          message: 'Search query (q) is required'
        }
      });
    }
    
    const results = await agentService.searchAgents(q, { framework, status, limit: parseInt(limit) });
    
    res.json({
      data: results,
      query: q,
      count: results.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/agents/:id
 * Get a single agent by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const agent = await agentService.getAgent(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        error: {
          code: 'AGENT_NOT_FOUND',
          message: `Agent with ID '${req.params.id}' not found`
        }
      });
    }
    
    res.json({ data: agent });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/agents
 * Create a new agent
 */
router.post('/', async (req, res, next) => {
  try {
    const agentData = req.body;
    
    // Validate required fields
    if (!agentData.name) {
      return res.status(400).json({
        error: {
          code: 'MISSING_NAME',
          message: 'Agent name is required'
        }
      });
    }
    
    if (!agentData.systemPrompt) {
      return res.status(400).json({
        error: {
          code: 'MISSING_SYSTEM_PROMPT',
          message: 'System prompt is required'
        }
      });
    }
    
    const result = await agentService.createAgent(agentData);
    
    if (!result.valid) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Agent validation failed',
          details: result.errors
        }
      });
    }
    
    res.status(201).json({
      data: result.agent,
      message: 'Agent created successfully'
    });
  } catch (error) {
    if (error.code === 'AGENT_EXISTS') {
      return res.status(409).json({
        error: {
          code: 'AGENT_EXISTS',
          message: error.message
        }
      });
    }
    next(error);
  }
});

/**
 * PUT /api/v1/agents/:id
 * Update an existing agent
 */
router.put('/:id', async (req, res, next) => {
  try {
    const agentData = req.body;
    
    const result = await agentService.updateAgent(req.params.id, agentData);
    
    if (!result.found) {
      return res.status(404).json({
        error: {
          code: 'AGENT_NOT_FOUND',
          message: `Agent with ID '${req.params.id}' not found`
        }
      });
    }
    
    if (!result.valid) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Agent validation failed',
          details: result.errors
        }
      });
    }
    
    res.json({
      data: result.agent,
      message: 'Agent updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/agents/:id
 * Partially update an agent
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const updates = req.body;
    
    const result = await agentService.patchAgent(req.params.id, updates);
    
    if (!result.found) {
      return res.status(404).json({
        error: {
          code: 'AGENT_NOT_FOUND',
          message: `Agent with ID '${req.params.id}' not found`
        }
      });
    }
    
    res.json({
      data: result.agent,
      message: 'Agent updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/agents/:id
 * Delete an agent
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await agentService.deleteAgent(req.params.id);
    
    if (!result.found) {
      return res.status(404).json({
        error: {
          code: 'AGENT_NOT_FOUND',
          message: `Agent with ID '${req.params.id}' not found`
        }
      });
    }
    
    res.json({
      message: 'Agent deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/agents/:id/duplicate
 * Duplicate an agent
 */
router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const { newId, newName } = req.body;
    
    const result = await agentService.duplicateAgent(req.params.id, newId, newName);
    
    if (!result.found) {
      return res.status(404).json({
        error: {
          code: 'AGENT_NOT_FOUND',
          message: `Agent with ID '${req.params.id}' not found`
        }
      });
    }
    
    res.status(201).json({
      data: result.agent,
      message: 'Agent duplicated successfully'
    });
  } catch (error) {
    if (error.code === 'AGENT_EXISTS') {
      return res.status(409).json({
        error: {
          code: 'AGENT_EXISTS',
          message: error.message
        }
      });
    }
    next(error);
  }
});

module.exports = router;
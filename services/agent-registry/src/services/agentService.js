/**
 * Agent Service
 * Business logic for agent CRUD operations
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Data file path
const DATA_FILE = path.join(__dirname, '../data/agents.json');

// Load agent schema (local copy for standalone deployment)
const agentSchema = require('../schema/agent.schema.json');

// Initialize AJV validator
const ajv = new Ajv({ allErrors: true, strict: false, useDefaults: true });
addFormats(ajv);
const validateAgentSchema = ajv.compile(agentSchema);

/**
 * Load agents from JSON file
 */
function loadAgents() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      // Create empty data file if it doesn't exist
      saveAgents([]);
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading agents:', error);
    return [];
  }
}

/**
 * Save agents to JSON file
 */
function saveAgents(agents) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(agents, null, 2));
  } catch (error) {
    console.error('Error saving agents:', error);
    throw error;
  }
}

/**
 * Generate agent ID from name
 */
function generateAgentId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

/**
 * Apply default values to agent
 */
function applyDefaults(agent) {
  const now = new Date().toISOString();
  
  return {
    framework: 'default',
    model: 'claude-4-sonnet',
    maxSteps: 30,
    timeout: 30000,
    version: '1.0.0',
    status: 'draft',
    capabilities: {
      streaming: true,
      humanInLoop: false,
      memory: false,
      codeExecution: false,
      fileAccess: false,
      webBrowsing: false,
      ...agent.capabilities
    },
    modelConfig: {
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1,
      ...agent.modelConfig
    },
    guardrails: {
      inputFilter: true,
      outputFilter: true,
      contentPolicy: 'moderate',
      ...agent.guardrails
    },
    tools: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
      tags: [],
      ...agent.metadata
    },
    ...agent
  };
}

/**
 * Validate agent against schema
 */
function validateAgent(agent) {
  const valid = validateAgentSchema(agent);
  
  if (!valid) {
    return {
      valid: false,
      errors: validateAgentSchema.errors.map(err => ({
        path: err.instancePath || '/',
        message: err.message,
        keyword: err.keyword
      }))
    };
  }
  
  return { valid: true, errors: null };
}

/**
 * List agents with filtering and pagination
 */
async function listAgents(filters = {}, pagination = {}) {
  const agents = loadAgents();
  let filtered = [...agents];
  
  // Apply filters
  if (filters.framework) {
    filtered = filtered.filter(a => a.framework === filters.framework);
  }
  
  if (filters.status) {
    filtered = filtered.filter(a => a.status === filters.status);
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(a => 
      a.name.toLowerCase().includes(searchLower) ||
      (a.description && a.description.toLowerCase().includes(searchLower))
    );
  }
  
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(a => 
      a.metadata?.tags?.some(tag => filters.tags.includes(tag))
    );
  }
  
  // Sort by updatedAt descending
  filtered.sort((a, b) => 
    new Date(b.metadata?.updatedAt || 0) - new Date(a.metadata?.updatedAt || 0)
  );
  
  // Apply pagination
  const { limit = 50, offset = 0 } = pagination;
  const paginated = filtered.slice(offset, offset + limit);
  
  return {
    agents: paginated,
    total: filtered.length
  };
}

/**
 * Search agents by query
 */
async function searchAgents(query, options = {}) {
  const agents = loadAgents();
  const queryLower = query.toLowerCase();
  
  let results = agents.filter(a => 
    a.name.toLowerCase().includes(queryLower) ||
    a.id.toLowerCase().includes(queryLower) ||
    (a.description && a.description.toLowerCase().includes(queryLower)) ||
    (a.systemPrompt && a.systemPrompt.toLowerCase().includes(queryLower)) ||
    (a.metadata?.tags?.some(tag => tag.toLowerCase().includes(queryLower)))
  );
  
  // Apply additional filters
  if (options.framework) {
    results = results.filter(a => a.framework === options.framework);
  }
  
  if (options.status) {
    results = results.filter(a => a.status === options.status);
  }
  
  // Limit results
  const limit = options.limit || 20;
  return results.slice(0, limit);
}

/**
 * Get a single agent by ID
 */
async function getAgent(id) {
  const agents = loadAgents();
  return agents.find(a => a.id === id) || null;
}

/**
 * Create a new agent
 */
async function createAgent(agentData) {
  const agents = loadAgents();
  
  // Generate ID if not provided
  if (!agentData.id) {
    agentData.id = generateAgentId(agentData.name);
  }
  
  // Check if agent already exists
  if (agents.find(a => a.id === agentData.id)) {
    const error = new Error(`Agent with ID '${agentData.id}' already exists`);
    error.code = 'AGENT_EXISTS';
    throw error;
  }
  
  // Apply defaults
  const agent = applyDefaults(agentData);
  
  // Validate
  const validation = validateAgent(agent);
  if (!validation.valid) {
    return { valid: false, errors: validation.errors, agent: null };
  }
  
  // Save
  agents.push(agent);
  saveAgents(agents);
  
  return { valid: true, errors: null, agent };
}

/**
 * Update an existing agent
 */
async function updateAgent(id, agentData) {
  const agents = loadAgents();
  const index = agents.findIndex(a => a.id === id);
  
  if (index === -1) {
    return { found: false, valid: false, errors: null, agent: null };
  }
  
  // Merge with existing agent
  const existingAgent = agents[index];
  const updatedAgent = {
    ...existingAgent,
    ...agentData,
    id, // Ensure ID doesn't change
    metadata: {
      ...existingAgent.metadata,
      ...agentData.metadata,
      updatedAt: new Date().toISOString()
    }
  };
  
  // Validate
  const validation = validateAgent(updatedAgent);
  if (!validation.valid) {
    return { found: true, valid: false, errors: validation.errors, agent: null };
  }
  
  // Save
  agents[index] = updatedAgent;
  saveAgents(agents);
  
  return { found: true, valid: true, errors: null, agent: updatedAgent };
}

/**
 * Partially update an agent
 */
async function patchAgent(id, updates) {
  const agents = loadAgents();
  const index = agents.findIndex(a => a.id === id);
  
  if (index === -1) {
    return { found: false, agent: null };
  }
  
  // Deep merge updates
  const existingAgent = agents[index];
  const patchedAgent = deepMerge(existingAgent, {
    ...updates,
    metadata: {
      ...existingAgent.metadata,
      ...updates.metadata,
      updatedAt: new Date().toISOString()
    }
  });
  
  // Ensure ID doesn't change
  patchedAgent.id = id;
  
  // Save
  agents[index] = patchedAgent;
  saveAgents(agents);
  
  return { found: true, agent: patchedAgent };
}

/**
 * Delete an agent
 */
async function deleteAgent(id) {
  const agents = loadAgents();
  const index = agents.findIndex(a => a.id === id);
  
  if (index === -1) {
    return { found: false };
  }
  
  agents.splice(index, 1);
  saveAgents(agents);
  
  return { found: true };
}

/**
 * Duplicate an agent
 */
async function duplicateAgent(sourceId, newId, newName) {
  const agents = loadAgents();
  const sourceAgent = agents.find(a => a.id === sourceId);
  
  if (!sourceAgent) {
    return { found: false, agent: null };
  }
  
  // Generate new ID if not provided
  const duplicateId = newId || `${sourceId}-copy-${Date.now()}`;
  const duplicateName = newName || `${sourceAgent.name} (Copy)`;
  
  // Check if new ID already exists
  if (agents.find(a => a.id === duplicateId)) {
    const error = new Error(`Agent with ID '${duplicateId}' already exists`);
    error.code = 'AGENT_EXISTS';
    throw error;
  }
  
  // Create duplicate
  const now = new Date().toISOString();
  const duplicateAgent = {
    ...JSON.parse(JSON.stringify(sourceAgent)), // Deep clone
    id: duplicateId,
    name: duplicateName,
    status: 'draft',
    version: '1.0.0',
    metadata: {
      ...sourceAgent.metadata,
      createdAt: now,
      updatedAt: now,
      tags: [...(sourceAgent.metadata?.tags || [])]
    }
  };
  
  // Save
  agents.push(duplicateAgent);
  saveAgents(agents);
  
  return { found: true, agent: duplicateAgent };
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null
      ) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

module.exports = {
  listAgents,
  searchAgents,
  getAgent,
  createAgent,
  updateAgent,
  patchAgent,
  deleteAgent,
  duplicateAgent,
  validateAgent,
  generateAgentId
};
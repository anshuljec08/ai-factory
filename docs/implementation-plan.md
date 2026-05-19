# AI Factory - Implementation Plan

> Detailed 20-week implementation plan for building the AI Factory platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Foundation (Weeks 1-4)](#phase-1-foundation-weeks-1-4)
3. [Phase 2: Framework Expansion (Weeks 5-8)](#phase-2-framework-expansion-weeks-5-8)
4. [Phase 3: UI Integrations (Weeks 9-12)](#phase-3-ui-integrations-weeks-9-12)
5. [Phase 4: Operations (Weeks 13-16)](#phase-4-operations-weeks-13-16)
6. [Phase 5: Polish & Deploy (Weeks 17-20)](#phase-5-polish--deploy-weeks-17-20)
7. [Summary](#summary)
8. [Risk Mitigation](#risk-mitigation)
9. [Resource Requirements](#resource-requirements)

---

## Overview

### Timeline Summary

| Phase | Duration | Focus Area |
|-------|----------|------------|
| Phase 1 | Weeks 1-4 | Foundation - Project structure, schemas, core apps |
| Phase 2 | Weeks 5-8 | Framework Expansion - LangGraph, MAF, Execution Engine |
| Phase 3 | Weeks 9-12 | UI Integrations - Joule, Open WebUI, API Gateway |
| Phase 4 | Weeks 13-16 | Operations - A2A, Scheduler, Dashboard, Monitoring |
| Phase 5 | Weeks 17-20 | Polish & Deploy - Testing, Documentation, BTP |

### Key Milestones

```
Week 4  ──► MVP: Agent Designer + MCP Builder + Custom UI
Week 8  ──► Multi-Framework: LangGraph + MAF support
Week 12 ──► Multi-UI: Joule + Open WebUI integration
Week 16 ──► Full Platform: A2A + Scheduler + Dashboard
Week 20 ──► Production: BTP deployment + v1.0.0 release
```

---

## Phase 1: Foundation (Weeks 1-4)

### Goals
- Establish project structure and coding standards
- Define shared schemas for agents and tools
- Build core applications (Agent Designer, MCP Builder, Custom UI)
- Create Agent Registry service
- Set up Fiori Launchpad

---

### Week 1: Project Setup & Schema Design

#### Day 1-2: Project Structure

**Tasks:**
- [ ] Create `AI_Factory/` root folder structure
- [ ] Set up monorepo configuration
- [ ] Configure ESLint, Prettier, TypeScript
- [ ] Create shared utilities folder
- [ ] Set up Git repository with branching strategy

**Deliverables:**
```
AI_Factory/
├── apps/                    # All 14 applications
│   ├── 01-agent-designer/
│   ├── 02-mcp-builder/
│   ├── 03-langgraph-builder/
│   ├── 04-maf-builder/
│   ├── 05-custom-ui/
│   ├── 06-joule-connector/
│   ├── 07-openwebui-connector/
│   ├── 08-a2a-designer-langgraph/
│   ├── 09-a2a-designer-crewai/
│   ├── 10-a2a-designer-maf/
│   ├── 11-scheduler/
│   ├── 12-dashboard/
│   ├── 13-logs-monitor/
│   └── 14-tool-manager/
├── services/                # Backend services
│   ├── agent-registry/
│   ├── execution-engine/
│   ├── a2a-orchestrator/
│   └── metrics-collector/
├── shared/                  # Shared libraries
│   ├── agent-schema/
│   ├── api-contracts/
│   └── common-utils/
├── launchpad/               # Fiori Launchpad
├── infrastructure/          # Deployment configs
└── docs/                    # Documentation
```

#### Day 3-4: Agent Schema Definition

**Tasks:**
- [ ] Define agent schema (JSON Schema)
- [ ] Define tool schema
- [ ] Define authentication schema
- [ ] Create schema validation utilities
- [ ] Write schema documentation

**Agent Schema (`shared/agent-schema/agent.schema.json`):**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "name", "framework", "systemPrompt", "model"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$",
      "description": "Unique agent identifier"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "Human-readable agent name"
    },
    "description": {
      "type": "string",
      "maxLength": 500,
      "description": "Agent description"
    },
    "framework": {
      "type": "string",
      "enum": ["mcp", "langgraph", "maf", "crewai"],
      "description": "AI framework to use"
    },
    "systemPrompt": {
      "type": "string",
      "minLength": 1,
      "description": "System prompt for the agent"
    },
    "model": {
      "type": "string",
      "description": "LLM model identifier"
    },
    "tools": {
      "type": "array",
      "items": { "$ref": "#/definitions/tool" },
      "description": "Tools available to the agent"
    },
    "maxSteps": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 30,
      "description": "Maximum execution steps"
    },
    "timeout": {
      "type": "integer",
      "minimum": 1000,
      "maximum": 300000,
      "default": 30000,
      "description": "Execution timeout in milliseconds"
    },
    "capabilities": {
      "type": "object",
      "properties": {
        "streaming": { "type": "boolean", "default": true },
        "humanInLoop": { "type": "boolean", "default": false },
        "memory": { "type": "boolean", "default": false },
        "codeExecution": { "type": "boolean", "default": false }
      }
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "Semantic version"
    },
    "metadata": {
      "type": "object",
      "properties": {
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" },
        "createdBy": { "type": "string" },
        "tags": { "type": "array", "items": { "type": "string" } }
      }
    }
  },
  "definitions": {
    "tool": {
      "type": "object",
      "required": ["name", "type"],
      "properties": {
        "name": { "type": "string" },
        "type": { 
          "type": "string",
          "enum": ["mcp", "rag", "graphrag", "memory", "api", "database", "code", "file", "web", "browser", "agent", "guardrails", "custom"]
        },
        "config": { "type": "object" }
      }
    }
  }
}
```

#### Day 5: Tool Schema Definition

**Tool Schema (`shared/agent-schema/tool.schema.json`):**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "name", "type"],
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "description": { "type": "string" },
    "type": {
      "type": "string",
      "enum": ["mcp", "rag", "graphrag", "memory", "api", "database", "code", "file", "web", "browser", "agent", "guardrails", "custom"]
    },
    "config": {
      "oneOf": [
        { "$ref": "#/definitions/mcpConfig" },
        { "$ref": "#/definitions/ragConfig" },
        { "$ref": "#/definitions/apiConfig" },
        { "$ref": "#/definitions/databaseConfig" }
      ]
    }
  },
  "definitions": {
    "mcpConfig": {
      "type": "object",
      "properties": {
        "serverUrl": { "type": "string", "format": "uri" },
        "tools": { "type": "array", "items": { "type": "string" } }
      }
    },
    "ragConfig": {
      "type": "object",
      "properties": {
        "vectorStore": { "type": "string" },
        "embeddingModel": { "type": "string" },
        "chunkSize": { "type": "integer" },
        "chunkOverlap": { "type": "integer" },
        "topK": { "type": "integer" }
      }
    },
    "apiConfig": {
      "type": "object",
      "properties": {
        "baseUrl": { "type": "string", "format": "uri" },
        "method": { "type": "string", "enum": ["GET", "POST", "PUT", "DELETE"] },
        "headers": { "type": "object" },
        "authentication": { "type": "string", "enum": ["none", "basic", "bearer", "oauth2"] }
      }
    },
    "databaseConfig": {
      "type": "object",
      "properties": {
        "type": { "type": "string", "enum": ["hana", "postgresql", "mysql", "sqlite"] },
        "connectionString": { "type": "string" },
        "schema": { "type": "string" }
      }
    }
  }
}
```

---

### Week 2: Agent Designer App

#### Day 1-2: UI5 App Scaffold

**Tasks:**
- [ ] Create UI5 application structure
- [ ] Set up routing configuration
- [ ] Create base views and controllers
- [ ] Configure i18n for internationalization
- [ ] Set up model bindings

**App Structure (`apps/01-agent-designer/`):**
```
01-agent-designer/
├── webapp/
│   ├── Component.js
│   ├── manifest.json
│   ├── index.html
│   ├── controller/
│   │   ├── App.controller.js
│   │   ├── AgentList.controller.js
│   │   ├── AgentDetail.controller.js
│   │   └── AgentCreate.controller.js
│   ├── view/
│   │   ├── App.view.xml
│   │   ├── AgentList.view.xml
│   │   ├── AgentDetail.view.xml
│   │   └── AgentCreate.view.xml
│   ├── model/
│   │   └── models.js
│   ├── css/
│   │   └── style.css
│   └── i18n/
│       └── i18n.properties
└── ui5.yaml
```

#### Day 3-4: Agent List View

**Tasks:**
- [ ] Implement agent list table
- [ ] Add search functionality
- [ ] Add filter by framework
- [ ] Add filter by status
- [ ] Implement pagination
- [ ] Add create/delete actions

**Agent List Features:**
| Feature | Description |
|---------|-------------|
| Search | Search by name, description |
| Filter | Filter by framework (MCP, LangGraph, MAF) |
| Sort | Sort by name, created date, updated date |
| Pagination | 20 items per page |
| Actions | Create, Edit, Delete, Duplicate |

#### Day 5: Agent Detail View

**Tasks:**
- [ ] Implement agent detail form
- [ ] Add system prompt editor with syntax highlighting
- [ ] Add tool selection multi-select
- [ ] Add model selection dropdown
- [ ] Add framework selection
- [ ] Add capabilities toggles
- [ ] Add JSON preview panel

**Agent Detail Sections:**
1. **Basic Info** - Name, description, tags
2. **Framework** - MCP, LangGraph, MAF selection
3. **Model** - Model selection, temperature, max tokens
4. **System Prompt** - Rich text editor with variables
5. **Tools** - Multi-select from Tool Registry
6. **Capabilities** - Streaming, human-in-loop, memory
7. **Advanced** - Max steps, timeout, retry config
8. **Preview** - JSON preview of agent definition

---

### Week 3: MCP Builder & Custom UI

#### Day 1-2: Port MCP Builder from AI_Chatbot_Standalone

**Tasks:**
- [ ] Copy and refactor `McpClient.js`
- [ ] Copy and refactor `ToolSchemaAdapter.js`
- [ ] Create MCP Builder UI
- [ ] Implement MCP server configuration
- [ ] Add tool discovery from MCP servers
- [ ] Add tool testing interface

**Files to Port:**
| Source | Destination | Changes |
|--------|-------------|---------|
| `AI_Chatbot_Standalone/webapp/service/McpClient.js` | `apps/02-mcp-builder/webapp/service/McpClient.js` | Refactor for modularity |
| `AI_Chatbot_Standalone/webapp/service/ToolSchemaAdapter.js` | `shared/common-utils/ToolSchemaAdapter.js` | Move to shared |

**MCP Builder Features:**
- MCP server URL configuration
- Tool discovery and listing
- Tool schema visualization
- Tool testing with sample inputs
- Tool selection for agents

#### Day 3-4: Port Custom UI from AI_Chatbot_Standalone

**Tasks:**
- [ ] Copy and refactor `LlmClient.js`
- [ ] Copy and refactor `ChatService.js`
- [ ] Copy and refactor `ConversationManager.js`
- [ ] Copy and refactor `HistoryManager.js`
- [ ] Create Custom UI application
- [ ] Implement chat interface
- [ ] Add agent selection

**Files to Port:**
| Source | Destination |
|--------|-------------|
| `AI_Chatbot_Standalone/webapp/service/LlmClient.js` | `apps/05-custom-ui/webapp/service/LlmClient.js` |
| `AI_Chatbot_Standalone/webapp/service/ChatService.js` | `apps/05-custom-ui/webapp/service/ChatService.js` |
| `AI_Chatbot_Standalone/webapp/service/ConversationManager.js` | `apps/05-custom-ui/webapp/service/ConversationManager.js` |
| `AI_Chatbot_Standalone/webapp/service/HistoryManager.js` | `apps/05-custom-ui/webapp/service/HistoryManager.js` |
| `AI_Chatbot_Standalone/webapp/view/MainView.view.xml` | `apps/05-custom-ui/webapp/view/Chat.view.xml` |
| `AI_Chatbot_Standalone/webapp/controller/MainView.controller.js` | `apps/05-custom-ui/webapp/controller/Chat.controller.js` |

#### Day 5: Integration with Agent Registry

**Tasks:**
- [ ] Connect Custom UI to Agent Registry
- [ ] Implement agent selection dropdown
- [ ] Load agent configuration dynamically
- [ ] Test end-to-end flow

---

### Week 4: Agent Registry Service & Launchpad

#### Day 1-2: Agent Registry Service

**Tasks:**
- [ ] Create Node.js/Express service
- [ ] Set up PostgreSQL database
- [ ] Implement CRUD endpoints
- [ ] Add schema validation
- [ ] Add versioning support
- [ ] Write unit tests

**Service Structure (`services/agent-registry/`):**
```
agent-registry/
├── src/
│   ├── index.js
│   ├── routes/
│   │   └── agents.js
│   ├── controllers/
│   │   └── agentController.js
│   ├── services/
│   │   └── agentService.js
│   ├── models/
│   │   └── Agent.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   └── utils/
│       └── schemaValidator.js
├── test/
│   └── agents.test.js
├── package.json
└── Dockerfile
```

#### Day 3-4: REST API Implementation

**API Endpoints:**
```
GET    /api/v1/agents                    - List all agents
GET    /api/v1/agents/:id                - Get agent by ID
POST   /api/v1/agents                    - Create agent
PUT    /api/v1/agents/:id                - Update agent
DELETE /api/v1/agents/:id                - Delete agent
GET    /api/v1/agents/:id/versions       - Get version history
POST   /api/v1/agents/:id/versions/:ver  - Rollback to version
GET    /api/v1/agents/search             - Search agents
```

**Database Schema:**
```sql
CREATE TABLE agents (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    framework VARCHAR(20) NOT NULL,
    system_prompt TEXT NOT NULL,
    model VARCHAR(100) NOT NULL,
    tools JSONB,
    max_steps INTEGER DEFAULT 30,
    timeout INTEGER DEFAULT 30000,
    capabilities JSONB,
    version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    tags TEXT[]
);

CREATE TABLE agent_versions (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(100) REFERENCES agents(id),
    version VARCHAR(20) NOT NULL,
    config JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    change_notes TEXT
);
```

#### Day 5: Fiori Launchpad

**Tasks:**
- [ ] Create Launchpad configuration
- [ ] Define tiles for all applications
- [ ] Configure navigation targets
- [ ] Set up role-based visibility
- [ ] Test tile navigation

**Launchpad Configuration (`launchpad/tiles.json`):**
```json
{
  "groups": [
    {
      "id": "create-build",
      "title": "Create & Build",
      "tiles": [
        {
          "id": "agent-designer",
          "title": "Agent Designer",
          "subtitle": "Create & configure agents",
          "icon": "sap-icon://create",
          "targetURL": "#AgentDesigner-display"
        },
        {
          "id": "mcp-builder",
          "title": "MCP Builder",
          "subtitle": "JavaScript framework",
          "icon": "sap-icon://wrench",
          "targetURL": "#MCPBuilder-display"
        },
        {
          "id": "tool-manager",
          "title": "Tool Manager",
          "subtitle": "Manage tools & RAG",
          "icon": "sap-icon://tools-opportunity",
          "targetURL": "#ToolManager-display"
        }
      ]
    },
    {
      "id": "run-interact",
      "title": "Run & Interact",
      "tiles": [
        {
          "id": "custom-ui",
          "title": "Custom Chat UI",
          "subtitle": "Chat with agents",
          "icon": "sap-icon://discussion",
          "targetURL": "#CustomUI-display"
        }
      ]
    }
  ]
}
```

---

## Phase 2: Framework Expansion (Weeks 5-8)

### Goals
- Add LangGraph framework support
- Add MAF (Microsoft Agent Framework) support
- Create unified Execution Engine
- Enable framework switching in UI

---

### Week 5: LangGraph Builder

#### Day 1-2: LangGraph Builder UI

**Tasks:**
- [ ] Create UI5 application for LangGraph Builder
- [ ] Implement graph visualization component
- [ ] Add node palette (Agent, Tool, Conditional, Human)
- [ ] Implement drag-and-drop node placement
- [ ] Add edge connection interface

**LangGraph Builder Features:**
| Feature | Description |
|---------|-------------|
| Graph Canvas | Visual canvas for building graphs |
| Node Palette | Draggable nodes (Agent, Tool, Conditional, Human, End) |
| Edge Editor | Connect nodes with conditional routing |
| State Schema | Define state structure for the graph |
| Checkpoints | Configure checkpoint persistence |
| Preview | Preview graph execution flow |

#### Day 3-4: Graph Visualization

**Tasks:**
- [ ] Integrate graph visualization library (e.g., vis.js, cytoscape.js)
- [ ] Implement node rendering
- [ ] Implement edge rendering with labels
- [ ] Add zoom and pan controls
- [ ] Add node selection and editing
- [ ] Add edge selection and editing

**Node Types:**
```javascript
const nodeTypes = {
  agent: {
    icon: "sap-icon://person-placeholder",
    color: "#0070f3",
    inputs: ["message"],
    outputs: ["response"]
  },
  tool: {
    icon: "sap-icon://wrench",
    color: "#10b981",
    inputs: ["input"],
    outputs: ["result"]
  },
  conditional: {
    icon: "sap-icon://decision",
    color: "#f59e0b",
    inputs: ["condition"],
    outputs: ["true", "false"]
  },
  human: {
    icon: "sap-icon://employee",
    color: "#8b5cf6",
    inputs: ["request"],
    outputs: ["approval", "rejection"]
  },
  end: {
    icon: "sap-icon://stop",
    color: "#ef4444",
    inputs: ["final"],
    outputs: []
  }
};
```

#### Day 5: State Management Configuration

**Tasks:**
- [ ] Implement state schema editor
- [ ] Add state variable definition
- [ ] Add state initialization
- [ ] Add state persistence configuration

**State Schema Example:**
```json
{
  "stateSchema": {
    "messages": {
      "type": "array",
      "items": { "type": "object" },
      "reducer": "append"
    },
    "currentAgent": {
      "type": "string",
      "default": "supervisor"
    },
    "taskComplete": {
      "type": "boolean",
      "default": false
    }
  }
}
```

---

### Week 6: LangGraph Backend Service

#### Day 1-2: Python FastAPI Service

**Tasks:**
- [ ] Create Python FastAPI project
- [ ] Set up LangGraph dependencies
- [ ] Implement graph builder from config
- [ ] Create execution endpoint
- [ ] Add streaming support

**Service Structure (`services/execution-engine/langgraph/`):**
```
langgraph/
├── app/
│   ├── main.py
│   ├── routes/
│   │   └── execute.py
│   ├── services/
│   │   ├── graph_builder.py
│   │   └── graph_executor.py
│   ├── models/
│   │   └── schemas.py
│   └── utils/
│       └── streaming.py
├── tests/
│   └── test_execute.py
├── requirements.txt
└── Dockerfile
```

#### Day 3-4: Graph Execution

**Tasks:**
- [ ] Implement graph construction from JSON config
- [ ] Implement node execution
- [ ] Implement edge routing
- [ ] Add conditional routing logic
- [ ] Add human-in-the-loop support

**Graph Builder (`services/execution-engine/langgraph/app/services/graph_builder.py`):**
```python
from langgraph.graph import StateGraph, END
from typing import Dict, Any

class GraphBuilder:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.graph = StateGraph(self._build_state_schema())
    
    def _build_state_schema(self):
        # Build state schema from config
        pass
    
    def _add_nodes(self):
        for node in self.config["nodes"]:
            if node["type"] == "agent":
                self.graph.add_node(node["id"], self._create_agent_node(node))
            elif node["type"] == "tool":
                self.graph.add_node(node["id"], self._create_tool_node(node))
            elif node["type"] == "conditional":
                self.graph.add_conditional_edges(
                    node["id"],
                    self._create_condition(node),
                    node["routes"]
                )
    
    def _add_edges(self):
        for edge in self.config["edges"]:
            self.graph.add_edge(edge["from"], edge["to"])
    
    def build(self):
        self._add_nodes()
        self._add_edges()
        self.graph.set_entry_point(self.config["entryPoint"])
        return self.graph.compile()
```

#### Day 5: Streaming Support

**Tasks:**
- [ ] Implement Server-Sent Events (SSE)
- [ ] Add token-by-token streaming
- [ ] Add step-by-step streaming
- [ ] Add progress events

**Streaming Endpoint:**
```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio

@app.post("/execute/stream")
async def execute_stream(request: ExecuteRequest):
    async def generate():
        graph = GraphBuilder(request.agent_config).build()
        async for event in graph.astream({"messages": [request.message]}):
            yield f"data: {json.dumps(event)}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

---

### Week 7: MAF Builder

#### Day 1-2: MAF Builder UI

**Tasks:**
- [ ] Create UI5 application for MAF Builder
- [ ] Implement agent team configuration
- [ ] Add handoff rules editor
- [ ] Add termination conditions
- [ ] Add memory configuration

**MAF Builder Features:**
| Feature | Description |
|---------|-------------|
| Team Builder | Configure agent teams |
| Handoff Rules | Define agent handoff conditions |
| Termination | Set termination conditions |
| Memory | Configure memory providers |
| Guardrails | Add safety guardrails |

#### Day 3-4: MAF Configuration

**Tasks:**
- [ ] Implement agent team definition
- [ ] Implement handoff configuration
- [ ] Implement termination conditions
- [ ] Implement memory configuration
- [ ] Implement guardrails configuration

**MAF Configuration Schema:**
```json
{
  "team": {
    "name": "Production Team",
    "agents": [
      {
        "id": "supervisor",
        "role": "supervisor",
        "systemPrompt": "You are a supervisor...",
        "handoffTo": ["worker1", "worker2"]
      },
      {
        "id": "worker1",
        "role": "worker",
        "systemPrompt": "You are a production worker...",
        "tools": ["get_production_orders"]
      }
    ]
  },
  "termination": {
    "type": "maxTurns",
    "value": 10
  },
  "memory": {
    "provider": "mem0",
    "config": {
      "userId": "{{userId}}"
    }
  },
  "guardrails": {
    "inputFilter": true,
    "outputFilter": true,
    "contentPolicy": "strict"
  }
}
```

#### Day 5: MAF-Specific Features

**Tasks:**
- [ ] Implement handoff visualization
- [ ] Add team hierarchy view
- [ ] Add conversation flow preview
- [ ] Add guardrails testing

---

### Week 8: Execution Engine Service

#### Day 1-2: Unified Execution Engine

**Tasks:**
- [ ] Create unified execution engine service
- [ ] Implement framework router
- [ ] Add MCP runtime integration
- [ ] Add LangGraph runtime integration
- [ ] Add MAF runtime integration

**Execution Engine Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                    EXECUTION ENGINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Framework Router                     │   │
│  │                                                       │   │
│  │   Request → Detect Framework → Route to Runtime      │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│           ┌───────────────┼───────────────┐                 │
│           ▼               ▼               ▼                 │
│     ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│     │   MCP    │   │LangGraph │   │   MAF    │            │
│     │ Runtime  │   │ Runtime  │   │ Runtime  │            │
│     │  (JS)    │   │ (Python) │   │ (Python) │            │
│     └──────────┘   └──────────┘   └──────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Day 3-4: Framework Routing

**Tasks:**
- [ ] Implement framework detection from agent config
- [ ] Implement routing logic
- [ ] Add fallback handling
- [ ] Add error handling
- [ ] Add logging

**Framework Router:**
```javascript
class FrameworkRouter {
  constructor() {
    this.runtimes = {
      mcp: new MCPRuntime(),
      langgraph: new LangGraphRuntime(),
      maf: new MAFRuntime()
    };
  }
  
  async execute(agentConfig, message, context) {
    const framework = agentConfig.framework;
    const runtime = this.runtimes[framework];
    
    if (!runtime) {
      throw new Error(`Unknown framework: ${framework}`);
    }
    
    return runtime.execute(agentConfig, message, context);
  }
}
```

#### Day 5: Framework Switching in UI

**Tasks:**
- [ ] Add framework selector in Custom UI
- [ ] Update agent loading to include framework
- [ ] Test switching between frameworks
- [ ] Add framework-specific UI hints

---

## Phase 3: UI Integrations (Weeks 9-12)

### Goals
- Integrate with SAP Joule via A2A protocol
- Integrate with Open WebUI via OpenAI-compatible API
- Create unified API Gateway
- Add streaming support across all UIs

---

### Week 9: Joule Connector

#### Day 1-2: Joule Connector App

**Tasks:**
- [ ] Create Joule Connector application
- [ ] Implement A2A protocol adapter
- [ ] Generate Agent Cards for all agents
- [ ] Implement task invocation endpoint
- [ ] Add streaming response support

**A2A Agent Card Generation:**
```json
{
  "name": "Production Assistant",
  "description": "AI assistant for production operations",
  "url": "https://ai-factory.cfapps.../a2a",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false
  },
  "skills": [
    {
      "id": "get-production-orders",
      "name": "Get Production Orders",
      "description": "Retrieve production orders with optional filters"
    },
    {
      "id": "analyze-alerts",
      "name": "Analyze Alerts",
      "description": "Analyze and summarize production alerts"
    }
  ]
}
```

#### Day 3-4: A2A Protocol Implementation

**Tasks:**
- [ ] Implement `/a2a/agents` endpoint (list agents)
- [ ] Implement `/a2a/agents/{id}` endpoint (get agent card)
- [ ] Implement `/a2a/tasks` endpoint (invoke task)
- [ ] Implement `/a2a/tasks/stream` endpoint (streaming)
- [ ] Add authentication for Joule

**A2A Endpoints:**
```
GET  /a2a/agents           - List available agents as Agent Cards
GET  /a2a/agents/{id}      - Get specific agent card
POST /a2a/tasks            - Invoke agent task
POST /a2a/tasks/stream     - Invoke with streaming
GET  /a2a/tasks/{id}       - Get task status
```

#### Day 5: Joule Integration Testing

**Tasks:**
- [ ] Test agent discovery from Joule
- [ ] Test task invocation from Joule
- [ ] Test streaming responses
- [ ] Document integration steps

---

### Week 10: Open WebUI Connector

#### Day 1-2: Open WebUI Connector App

**Tasks:**
- [ ] Create Open WebUI Connector application
- [ ] Implement OpenAI-compatible API
- [ ] Map agents to models
- [ ] Implement chat completions endpoint
- [ ] Add streaming support

**OpenAI-Compatible Endpoints:**
```
GET  /v1/models              - List agents as models
POST /v1/chat/completions    - Chat with agent
```

#### Day 3-4: OpenAI API Implementation

**Tasks:**
- [ ] Implement `/v1/models` endpoint
- [ ] Implement `/v1/chat/completions` endpoint
- [ ] Add streaming support (SSE)
- [ ] Map OpenAI request format to internal format
- [ ] Map internal response to OpenAI format

**Models Endpoint Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "production-agent",
      "object": "model",
      "created": 1699000000,
      "owned_by": "ai-factory",
      "permission": [],
      "root": "production-agent",
      "parent": null
    },
    {
      "id": "sales-agent",
      "object": "model",
      "created": 1699000000,
      "owned_by": "ai-factory"
    }
  ]
}
```

**Chat Completions Request/Response:**
```json
// Request
{
  "model": "production-agent",
  "messages": [
    { "role": "user", "content": "Show production orders with issues" }
  ],
  "stream": true
}

// Response (streaming)
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"delta":{"content":"Here"},"index":0}]}
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"delta":{"content":" are"},"index":0}]}
data: [DONE]
```

#### Day 5: Open WebUI Integration Testing

**Tasks:**
- [ ] Configure Open WebUI to use AI Factory
- [ ] Test model listing
- [ ] Test chat completions
- [ ] Test streaming
- [ ] Document integration steps

---

### Week 11: Unified API Layer

#### Day 1-2: API Gateway

**Tasks:**
- [ ] Create API Gateway service
- [ ] Implement request routing
- [ ] Add request/response logging
- [ ] Add request validation
- [ ] Add error handling

**API Gateway Routes:**
```javascript
const routes = {
  '/execute/*': 'execution-engine',
  '/v1/chat/completions': 'openai-adapter',
  '/v1/models': 'agent-registry',
  '/a2a/*': 'a2a-orchestrator',
  '/agents/*': 'agent-registry',
  '/tools/*': 'tool-registry',
  '/metrics/*': 'metrics-collector'
};
```

#### Day 3-4: Authentication (XSUAA/OAuth2)

**Tasks:**
- [ ] Integrate XSUAA for authentication
- [ ] Implement JWT validation
- [ ] Add role-based access control
- [ ] Implement API key authentication for services
- [ ] Add token refresh handling

**XSUAA Configuration (`xs-security.json`):**
```json
{
  "xsappname": "ai-factory",
  "tenant-mode": "dedicated",
  "scopes": [
    { "name": "$XSAPPNAME.admin", "description": "Admin access" },
    { "name": "$XSAPPNAME.developer", "description": "Developer access" },
    { "name": "$XSAPPNAME.user", "description": "User access" },
    { "name": "$XSAPPNAME.viewer", "description": "Viewer access" }
  ],
  "role-templates": [
    {
      "name": "Admin",
      "scope-references": ["$XSAPPNAME.admin"]
    },
    {
      "name": "Developer",
      "scope-references": ["$XSAPPNAME.developer"]
    },
    {
      "name": "User",
      "scope-references": ["$XSAPPNAME.user"]
    },
    {
      "name": "Viewer",
      "scope-references": ["$XSAPPNAME.viewer"]
    }
  ]
}
```

#### Day 5: Rate Limiting

**Tasks:**
- [ ] Implement rate limiting middleware
- [ ] Configure limits per user/role
- [ ] Add rate limit headers
- [ ] Implement quota tracking
- [ ] Add rate limit exceeded handling

**Rate Limiting Configuration:**
```javascript
const rateLimits = {
  admin: { rpm: 1000, rpd: 100000 },
  developer: { rpm: 500, rpd: 50000 },
  user: { rpm: 100, rpd: 10000 },
  viewer: { rpm: 50, rpd: 5000 }
};
```

---

### Week 12: Streaming Support

#### Day 1-2: SSE Implementation

**Tasks:**
- [ ] Implement Server-Sent Events (SSE) infrastructure
- [ ] Add connection management
- [ ] Add heartbeat/keepalive
- [ ] Add reconnection handling
- [ ] Add error handling

**SSE Utility:**
```javascript
class SSEManager {
  constructor() {
    this.connections = new Map();
  }
  
  createStream(res, requestId) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const stream = {
      send: (event, data) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      },
      close: () => {
        res.end();
        this.connections.delete(requestId);
      }
    };
    
    this.connections.set(requestId, stream);
    return stream;
  }
}
```

#### Day 3-4: Streaming Across All UIs

**Tasks:**
- [ ] Add streaming to Custom UI
- [ ] Add streaming to Joule Connector
- [ ] Add streaming to Open WebUI Connector
- [ ] Test streaming performance
- [ ] Add streaming progress indicators

**Streaming Events:**
```javascript
const streamEvents = {
  'message.start': { type: 'message.start', messageId: 'msg-123' },
  'message.delta': { type: 'message.delta', content: 'partial text' },
  'message.complete': { type: 'message.complete', content: 'full text' },
  'tool.start': { type: 'tool.start', toolName: 'get_orders' },
  'tool.complete': { type: 'tool.complete', result: {} },
  'error': { type: 'error', error: { code: 'ERR_001', message: '...' } }
};
```

#### Day 5: Performance Testing

**Tasks:**
- [ ] Load test streaming endpoints
- [ ] Measure latency (time to first token)
- [ ] Measure throughput (tokens per second)
- [ ] Test concurrent connections
- [ ] Optimize bottlenecks

**Performance Targets:**
| Metric | Target |
|--------|--------|
| Time to first token | < 500ms |
| Streaming latency | < 100ms between chunks |
| Concurrent streams | 100+ |
| Memory per stream | < 10MB |

---

## Phase 4: Operations (Weeks 13-16)

### Goals
- Build A2A Flow Designer for multi-agent workflows
- Create A2A Orchestrator service
- Implement Scheduler for automated agent runs
- Build Dashboard for analytics
- Create Logs & Monitor for observability

---

### Week 13: A2A Flow Designer

#### Day 1-2: A2A Designer UI (LangGraph)

**Tasks:**
- [ ] Create A2A Designer application
- [ ] Implement workflow canvas
- [ ] Add agent node palette
- [ ] Implement connection editor
- [ ] Add workflow configuration panel

**A2A Designer Features:**
| Feature | Description |
|---------|-------------|
| Workflow Canvas | Visual canvas for multi-agent workflows |
| Agent Nodes | Drag agents from registry onto canvas |
| Connections | Define agent-to-agent communication |
| Routing | Conditional routing between agents |
| Parallel | Parallel agent execution |
| Aggregation | Combine results from multiple agents |

#### Day 3-4: Flow Visualization

**Tasks:**
- [ ] Implement workflow visualization
- [ ] Add agent node rendering
- [ ] Add connection rendering
- [ ] Add execution flow animation
- [ ] Add status indicators

**Workflow Configuration:**
```json
{
  "id": "production-workflow",
  "name": "Production Analysis Workflow",
  "agents": [
    {
      "id": "supervisor",
      "agentId": "supervisor-agent",
      "position": { "x": 100, "y": 100 }
    },
    {
      "id": "analyst",
      "agentId": "production-analyst",
      "position": { "x": 300, "y": 100 }
    },
    {
      "id": "reporter",
      "agentId": "report-generator",
      "position": { "x": 500, "y": 100 }
    }
  ],
  "connections": [
    { "from": "supervisor", "to": "analyst", "condition": "needsAnalysis" },
    { "from": "analyst", "to": "reporter", "condition": "analysisComplete" },
    { "from": "reporter", "to": "END", "condition": "reportGenerated" }
  ],
  "entryPoint": "supervisor"
}
```

#### Day 5: Agent Selection

**Tasks:**
- [ ] Implement agent browser
- [ ] Add agent search and filter
- [ ] Add agent preview
- [ ] Implement drag-and-drop from browser to canvas

---

### Week 14: A2A Orchestrator Service

#### Day 1-2: A2A Orchestrator

**Tasks:**
- [ ] Create A2A Orchestrator service
- [ ] Implement workflow storage
- [ ] Implement workflow execution
- [ ] Add agent communication
- [ ] Add state management

**Service Structure (`services/a2a-orchestrator/`):**
```
a2a-orchestrator/
├── src/
│   ├── index.js
│   ├── routes/
│   │   ├── flows.js
│   │   └── a2a.js
│   ├── services/
│   │   ├── flowService.js
│   │   ├── orchestrator.js
│   │   └── agentCommunicator.js
│   ├── models/
│   │   └── Flow.js
│   └── utils/
│       └── stateManager.js
├── test/
│   └── orchestrator.test.js
├── package.json
└── Dockerfile
```

#### Day 3-4: Flow Execution

**Tasks:**
- [ ] Implement flow execution engine
- [ ] Add agent invocation
- [ ] Add result aggregation
- [ ] Add conditional routing
- [ ] Add parallel execution

**Orchestrator:**
```javascript
class A2AOrchestrator {
  async executeFlow(flowConfig, input) {
    const state = { messages: [input], results: {} };
    let currentNode = flowConfig.entryPoint;
    
    while (currentNode !== 'END') {
      const node = flowConfig.agents.find(a => a.id === currentNode);
      const result = await this.invokeAgent(node.agentId, state);
      state.results[currentNode] = result;
      
      currentNode = this.getNextNode(flowConfig, currentNode, state);
    }
    
    return state;
  }
  
  async invokeAgent(agentId, state) {
    // Call Execution Engine with agent ID and state
  }
  
  getNextNode(flowConfig, currentNode, state) {
    // Evaluate conditions and return next node
  }
}
```

#### Day 5: A2A Protocol Support

**Tasks:**
- [ ] Implement agent discovery
- [ ] Implement task invocation
- [ ] Add streaming support
- [ ] Add error handling

---

### Week 15: Scheduler & Dashboard

#### Day 1-2: Scheduler App

**Tasks:**
- [ ] Create Scheduler application
- [ ] Implement schedule list view
- [ ] Implement schedule creation
- [ ] Add cron expression builder
- [ ] Add schedule history

**Scheduler Features:**
| Feature | Description |
|---------|-------------|
| Cron Schedules | Define schedules using cron expressions |
| One-time | Schedule one-time agent runs |
| Recurring | Daily, weekly, monthly schedules |
| History | View past executions |
| Notifications | Email/webhook on completion |

**Schedule Configuration:**
```json
{
  "id": "daily-report",
  "name": "Daily Production Report",
  "agentId": "report-generator",
  "schedule": {
    "type": "cron",
    "expression": "0 8 * * *",
    "timezone": "UTC"
  },
  "input": {
    "message": "Generate daily production report"
  },
  "notifications": {
    "onSuccess": ["email:admin@example.com"],
    "onFailure": ["webhook:https://..."]
  }
}
```

#### Day 3-4: Scheduler Backend

**Tasks:**
- [ ] Implement schedule storage
- [ ] Implement cron job runner
- [ ] Add job queue (Redis/Bull)
- [ ] Add execution tracking
- [ ] Add notification service

#### Day 5: Dashboard App

**Tasks:**
- [ ] Create Dashboard application
- [ ] Implement metrics overview
- [ ] Add agent usage charts
- [ ] Add token consumption charts
- [ ] Add error rate charts

**Dashboard Metrics:**
| Metric | Visualization |
|--------|---------------|
| Total Executions | Counter |
| Token Usage | Line chart (over time) |
| Response Time | Histogram |
| Error Rate | Gauge |
| Top Agents | Bar chart |
| Cost | Line chart (over time) |

---

### Week 16: Logs & Monitor + Metrics Collector

#### Day 1-2: Logs & Monitor App

**Tasks:**
- [ ] Create Logs & Monitor application
- [ ] Implement log viewer
- [ ] Add log search and filter
- [ ] Add log level filtering
- [ ] Add trace viewer

**Logs & Monitor Features:**
| Feature | Description |
|---------|-------------|
| Log Viewer | Real-time log streaming |
| Search | Full-text search across logs |
| Filter | Filter by level, service, agent |
| Trace | View request traces |
| Alerts | Configure alert rules |

#### Day 3-4: Metrics Collector Service

**Tasks:**
- [ ] Create Metrics Collector service
- [ ] Implement metrics ingestion
- [ ] Add metrics aggregation
- [ ] Add metrics storage (time-series DB)
- [ ] Add metrics query API

**Metrics Collector API:**
```
POST /metrics              - Record metrics
GET  /metrics/agents/{id}  - Get agent metrics
GET  /metrics/summary      - Get summary
GET  /metrics/query        - Query metrics
```

**Metrics Schema:**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "agentId": "production-agent",
  "executionId": "exec-123",
  "metrics": {
    "tokenUsage": { "input": 1500, "output": 500 },
    "duration": 2500,
    "toolCalls": 3,
    "success": true
  }
}
```

#### Day 5: Log Aggregation

**Tasks:**
- [ ] Set up Elasticsearch
- [ ] Implement log shipping
- [ ] Add log parsing
- [ ] Add log retention policies
- [ ] Test log search performance

---

## Phase 5: Polish & Deploy (Weeks 17-20)

### Goals
- Comprehensive testing (unit, integration, E2E)
- Complete documentation
- BTP deployment
- Performance optimization
- Security audit

---

### Week 17: End-to-End Testing

#### Day 1-2: Unit Tests

**Tasks:**
- [ ] Write unit tests for all services
- [ ] Write unit tests for all controllers
- [ ] Write unit tests for utilities
- [ ] Achieve 80% code coverage
- [ ] Set up CI/CD for tests

**Test Structure:**
```
services/agent-registry/
├── src/
└── test/
    ├── unit/
    │   ├── agentService.test.js
    │   ├── agentController.test.js
    │   └── schemaValidator.test.js
    ├── integration/
    │   └── agents.test.js
    └── e2e/
        └── agentFlow.test.js
```

#### Day 3-4: Integration Tests

**Tasks:**
- [ ] Write API integration tests
- [ ] Test service-to-service communication
- [ ] Test database operations
- [ ] Test authentication flow
- [ ] Achieve 70% integration coverage

#### Day 5: E2E Tests

**Tasks:**
- [ ] Set up Playwright/Cypress
- [ ] Write E2E tests for critical paths
- [ ] Test agent creation flow
- [ ] Test agent execution flow
- [ ] Test multi-agent workflow

**Critical E2E Paths:**
1. Create agent → Execute agent → View results
2. Create workflow → Execute workflow → View results
3. Schedule agent → Wait for execution → View history
4. Login → Access dashboard → View metrics

---

### Week 18: Documentation

#### Day 1-2: User Documentation

**Tasks:**
- [ ] Write Getting Started guide
- [ ] Write Agent Designer tutorial
- [ ] Write Custom UI user manual
- [ ] Write FAQ
- [ ] Create video tutorials

**User Documentation Structure:**
```
docs/user-guide/
├── getting-started.md
├── agent-designer.md
├── custom-ui.md
├── scheduler.md
├── dashboard.md
└── faq.md
```

#### Day 3-4: Developer Documentation

**Tasks:**
- [ ] Write API reference
- [ ] Write SDK guide
- [ ] Write plugin development guide
- [ ] Write custom tool development guide
- [ ] Write framework integration guide

**Developer Documentation Structure:**
```
docs/developer-guide/
├── api-reference/
│   ├── agent-registry.md
│   ├── execution-engine.md
│   └── a2a-orchestrator.md
├── sdk/
│   ├── javascript.md
│   └── python.md
├── plugins/
│   ├── framework-plugin.md
│   ├── ui-plugin.md
│   └── tool-plugin.md
└── examples/
    ├── custom-agent.md
    └── custom-tool.md
```

#### Day 5: Operations Documentation

**Tasks:**
- [ ] Write deployment guide
- [ ] Write monitoring guide
- [ ] Write backup/recovery guide
- [ ] Write security hardening guide
- [ ] Write troubleshooting guide

---

### Week 19: BTP Deployment

#### Day 1-2: MTA Configuration

**Tasks:**
- [ ] Create `mta.yaml` descriptor
- [ ] Configure all modules
- [ ] Configure resources (XSUAA, PostgreSQL, Redis)
- [ ] Configure destinations
- [ ] Test local build

**MTA Descriptor (`mta.yaml`):**
```yaml
_schema-version: "3.1"
ID: ai-factory
version: 1.0.0

modules:
  - name: ai-factory-agent-registry
    type: nodejs
    path: services/agent-registry
    requires:
      - name: ai-factory-db
      - name: ai-factory-xsuaa
    provides:
      - name: agent-registry-api
        properties:
          url: ${default-url}

  - name: ai-factory-execution-engine
    type: python
    path: services/execution-engine
    requires:
      - name: ai-factory-xsuaa
      - name: agent-registry-api

  - name: ai-factory-ui
    type: html5
    path: apps/05-custom-ui
    requires:
      - name: ai-factory-xsuaa
      - name: agent-registry-api

resources:
  - name: ai-factory-db
    type: org.cloudfoundry.managed-service
    parameters:
      service: postgresql-db
      service-plan: standard

  - name: ai-factory-xsuaa
    type: org.cloudfoundry.managed-service
    parameters:
      service: xsuaa
      service-plan: application
      config:
        xsappname: ai-factory
        tenant-mode: dedicated
```

#### Day 3-4: XSUAA Configuration

**Tasks:**
- [ ] Create `xs-security.json`
- [ ] Define scopes and roles
- [ ] Configure role collections
- [ ] Test authentication locally
- [ ] Test authorization

#### Day 5: BTP Deployment

**Tasks:**
- [ ] Build MTA archive
- [ ] Deploy to BTP
- [ ] Configure destinations
- [ ] Test deployed application
- [ ] Set up monitoring

**Deployment Commands:**
```bash
# Build MTA archive
mbt build

# Deploy to BTP
cf deploy mta_archives/ai-factory_1.0.0.mtar

# Check deployment status
cf apps
cf services
```

---

### Week 20: Performance & Security

#### Day 1-2: Performance Optimization

**Tasks:**
- [ ] Profile application performance
- [ ] Optimize database queries
- [ ] Add caching (Redis)
- [ ] Optimize streaming
- [ ] Load test with 100+ concurrent users

**Performance Targets:**
| Metric | Target | Actual |
|--------|--------|--------|
| API response time (p95) | < 200ms | TBD |
| Streaming latency | < 100ms | TBD |
| Concurrent users | 100+ | TBD |
| Memory usage | < 512MB per service | TBD |

#### Day 3-4: Security Audit

**Tasks:**
- [ ] Run vulnerability scan (npm audit, safety)
- [ ] Review authentication implementation
- [ ] Review authorization implementation
- [ ] Review data encryption
- [ ] Review API security
- [ ] Fix identified vulnerabilities

**Security Checklist:**
- [ ] All endpoints require authentication
- [ ] Role-based access control implemented
- [ ] Secrets stored in BTP Credential Store
- [ ] Data encrypted at rest and in transit
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented
- [ ] CORS configured correctly
- [ ] Security headers set

#### Day 5: Final Release

**Tasks:**
- [ ] Create release notes
- [ ] Tag v1.0.0 release
- [ ] Deploy to production
- [ ] Announce release
- [ ] Plan v1.1.0 features

**Release Checklist:**
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Security audit passed
- [ ] Performance targets met
- [ ] Stakeholder sign-off

---

## Summary

### Phase Deliverables

| Phase | Key Deliverables | Success Criteria |
|-------|------------------|------------------|
| **Phase 1** | Agent Designer, MCP Builder, Custom UI, Agent Registry, Launchpad | MVP functional, agents can be created and executed |
| **Phase 2** | LangGraph Builder, MAF Builder, Execution Engine | Multi-framework support, framework switching works |
| **Phase 3** | Joule Connector, Open WebUI Connector, API Gateway | External UIs can connect, streaming works |
| **Phase 4** | A2A Designer, A2A Orchestrator, Scheduler, Dashboard, Logs | Multi-agent workflows, scheduling, monitoring |
| **Phase 5** | Testing, Documentation, BTP Deployment | Production-ready, documented, deployed |

### Total Effort

| Category | Estimated Hours |
|----------|-----------------|
| Development | 640 hours (16 weeks × 40 hours) |
| Testing | 80 hours (2 weeks × 40 hours) |
| Documentation | 40 hours (1 week × 40 hours) |
| Deployment | 40 hours (1 week × 40 hours) |
| **Total** | **800 hours (20 weeks)** |

---

## Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LangGraph integration complexity | Medium | High | Start early, allocate buffer time |
| Streaming performance issues | Medium | Medium | Load test early, optimize iteratively |
| BTP deployment issues | Low | High | Test deployment in staging first |
| Security vulnerabilities | Medium | High | Regular security scans, code reviews |

### Schedule Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep | High | High | Strict change control, MVP focus |
| Resource unavailability | Medium | Medium | Cross-training, documentation |
| External dependencies | Medium | Medium | Early integration, fallback plans |

---

## Resource Requirements

### Team

**This is a single-person project** - You (the developer) working with AI assistance (Cline/Claude).

| Role | Who | Responsibilities |
|------|-----|------------------|
| Developer | You | All development, testing, deployment |
| AI Assistant | Cline/Claude | Code generation, architecture, debugging, documentation |

### Working Model

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT WORKFLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   YOU (Developer)              AI ASSISTANT (Cline)         │
│   ┌──────────────┐            ┌──────────────┐             │
│   │ • Planning   │◄──────────►│ • Code Gen   │             │
│   │ • Decisions  │            │ • Debugging  │             │
│   │ • Testing    │            │ • Docs       │             │
│   │ • Deployment │            │ • Refactoring│             │
│   └──────────────┘            └──────────────┘             │
│                                                              │
│   Workflow:                                                  │
│   1. You describe what to build                             │
│   2. AI generates code/docs                                 │
│   3. You review and test                                    │
│   4. AI fixes issues                                        │
│   5. You deploy                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Adjusted Timeline

Since this is a single-person project with AI assistance, the timeline is adjusted:

| Phase | Original | Adjusted | Notes |
|-------|----------|----------|-------|
| Phase 1 | 4 weeks | 2-3 weeks | AI accelerates coding |
| Phase 2 | 4 weeks | 2-3 weeks | Parallel development possible |
| Phase 3 | 4 weeks | 2 weeks | Reuse existing patterns |
| Phase 4 | 4 weeks | 2-3 weeks | Some features can be simplified |
| Phase 5 | 4 weeks | 1-2 weeks | AI helps with docs/testing |
| **Total** | **20 weeks** | **9-13 weeks** | **~50% faster with AI** |

### Prioritization Strategy

**MVP First Approach** - Build the minimum viable product, then iterate:

**MVP (Weeks 1-4):**
1. Agent Designer (basic CRUD)
2. Custom UI (port from AI_Chatbot_Standalone)
3. Agent Registry (simple JSON storage initially)
4. MCP runtime only (skip LangGraph/MAF initially)

**Iteration 1 (Weeks 5-7):**
1. Add LangGraph support
2. Add Execution Engine
3. Improve Agent Designer

**Iteration 2 (Weeks 8-10):**
1. Add Open WebUI Connector
2. Add Dashboard (basic metrics)
3. Add Scheduler (simple cron)

**Iteration 3 (Weeks 11-13):**
1. Add A2A support
2. Add MAF support
3. Polish and deploy

### Infrastructure

| Resource | Purpose | Cost Estimate |
|----------|---------|---------------|
| BTP Cloud Foundry | Application hosting | $500/month |
| PostgreSQL | Database | $100/month |
| Redis | Caching, queues | $50/month |
| Elasticsearch | Logging | $100/month |
| SAP AI Core | LLM provider | Usage-based |

---

## Next Steps

1. **Review and approve** this implementation plan
2. **Allocate resources** for Phase 1
3. **Set up project infrastructure** (Git, CI/CD, BTP)
4. **Begin Week 1** tasks

---

*Last Updated: January 2024*
*Version: 1.0*
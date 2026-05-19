# AI Factory - Development Context

## Project Overview

AI Factory is a comprehensive platform for designing, deploying, and managing AI agents on SAP BTP. It provides a unified interface for creating agents using multiple frameworks (Default, LangGraph, MAF, CrewAI) with tools, guardrails, and memory capabilities.

## Current Status: Week 2 - Custom UI Added ✅

### What's Been Built

#### 1. Project Structure (Updated - Organized by App)
```
AI_Factory/
├── apps/
│   ├── ai-factory/              # ✅ Single unified app with all features
│   │   └── webapp/
│   │       ├── Component.js
│   │       ├── manifest.json
│   │       ├── index.html
│   │       ├── view/
│   │       │   ├── App.view.xml          # Shell with side navigation
│   │       │   ├── Home.view.xml         # Launchpad tiles
│   │       │   │
│   │       │   ├── agent/                # 01 - Agent Designer
│   │       │   │   ├── AgentList.view.xml
│   │       │   │   ├── AgentDetail.view.xml
│   │       │   │   └── AgentCreate.view.xml
│   │       │   │
│   │       │   ├── mcp/                  # 02 - MCP Builder
│   │       │   │   └── McpBuilder.view.xml
│   │       │   │
│   │       │   ├── chat/                 # 05 - Custom UI ✅ NEW
│   │       │   │   └── Chat.view.xml
│   │       │   │
│   │       │   ├── tools/                # 14 - Tool Manager
│   │       │   │   └── ToolManager.view.xml
│   │       │   │
│   │       │   ├── dashboard/            # 12 - Dashboard
│   │       │   │   └── Dashboard.view.xml
│   │       │   │
│   │       │   └── logs/                 # 13 - Logs & Monitor
│   │       │       └── Logs.view.xml
│   │       │
│   │       └── controller/
│   │           ├── BaseController.js
│   │           ├── App.controller.js
│   │           ├── Home.controller.js
│   │           │
│   │           ├── agent/
│   │           │   ├── AgentList.controller.js
│   │           │   ├── AgentDetail.controller.js
│   │           │   └── AgentCreate.controller.js
│   │           │
│   │           ├── mcp/
│   │           │   └── McpBuilder.controller.js
│   │           │
│   │           ├── chat/                 # ✅ NEW
│   │           │   └── Chat.controller.js
│   │           │
│   │           ├── tools/
│   │           │   └── ToolManager.controller.js
│   │           │
│   │           ├── dashboard/
│   │           │   └── Dashboard.controller.js
│   │           │
│   │           └── logs/
│   │               └── Logs.controller.js
│   │
│   └── 01-agent-designer/       # (Legacy - can be removed)
├── launchpad/                   # (Legacy - replaced by ai-factory Home)
├── services/
│   └── agent-registry/          # REST API for agent CRUD
├── shared/
│   └── agent-schema/            # JSON schemas & validators
├── approuter/                   # BTP App Router
├── mta.yaml                     # Multi-target application config
└── docs/                        # Architecture documentation
```

#### 2. Single App Routes

| Route | View | Description |
|-------|------|-------------|
| `/` or `home` | Home | Launchpad with tiles |
| `agentList` | agent/AgentList | List all agents |
| `agentDetail/{agentId}` | agent/AgentDetail | Edit agent |
| `agentCreate` | agent/AgentCreate | Create new agent |
| `chat` | chat/Chat | Custom UI - Chat with agents ✅ NEW |
| `mcpBuilder` | mcp/McpBuilder | Build MCP servers |
| `toolManager` | tools/ToolManager | Manage tools |
| `dashboard` | dashboard/Dashboard | Metrics & monitoring |
| `logs` | logs/Logs | View logs |

#### 3. Local Development
```bash
# Start Agent Registry API (port 3001)
cd AI_Factory/services/agent-registry && npm install && node src/index.js &

# Start AI Factory App (port 8080)
cd AI_Factory/apps/ai-factory && npm install && npx ui5 serve --port 8080 &
```

#### 4. Key Files

| Component | Key Files |
|-----------|-----------|
| **Unified App** | `apps/ai-factory/webapp/` |
| **Manifest** | `apps/ai-factory/webapp/manifest.json` |
| **Component** | `apps/ai-factory/webapp/Component.js` |
| **Shell View** | `apps/ai-factory/webapp/view/App.view.xml` |
| **Home View** | `apps/ai-factory/webapp/view/Home.view.xml` |
| **Agent Views** | `apps/ai-factory/webapp/view/agent/*.xml` |
| **Chat View** | `apps/ai-factory/webapp/view/chat/Chat.view.xml` ✅ NEW |
| **Agent Controllers** | `apps/ai-factory/webapp/controller/agent/*.js` |
| **Chat Controller** | `apps/ai-factory/webapp/controller/chat/Chat.controller.js` ✅ NEW |
| **Agent Schema** | `shared/agent-schema/agent.schema.json` |
| **Tool Schema** | `shared/agent-schema/tool.schema.json` |
| **API Routes** | `services/agent-registry/src/routes/agents.js` |
| **Sample Agents** | `services/agent-registry/src/data/agents.json` |

#### 5. Agent Schema Structure
```json
{
  "id": "my-agent",
  "name": "My Agent",
  "framework": "default",  // default, langgraph, maf, crewai
  "systemPrompt": "You are...",
  "model": "claude-4-sonnet",
  "modelConfig": { "temperature": 0.7, "maxTokens": 4096 },
  "tools": [{ "name": "tool-name", "type": "mcp", "enabled": true }],
  "capabilities": { "streaming": true, "memory": false },
  "guardrails": { "inputFilter": true, "contentPolicy": "moderate" },
  "status": "active"
}
```

#### 6. Framework Options
| Key | Display Name |
|-----|--------------|
| `default` | Default Agent |
| `langgraph` | LangGraph |
| `maf` | MAF (Microsoft Agent Framework) |
| `crewai` | CrewAI |

#### 7. Tool Types
`mcp`, `rag`, `graphrag`, `memory`, `api`, `database`, `code`, `file`, `web`, `browser`, `agent`, `guardrails`, `custom`

---

## Architecture Decisions

### 1. Single App Architecture with Organized Subfolders (IMPLEMENTED ✅)

**Decision**: Use a **Single App with Internal Routes** and **organized subfolders** for each functional area.

**Folder Structure**:
```
view/
├── App.view.xml
├── Home.view.xml
├── agent/           # Agent Designer views
├── mcp/             # MCP Builder views
├── chat/            # Custom UI views
├── tools/           # Tool Manager views
├── dashboard/       # Dashboard views
└── logs/            # Logs & Monitor views

controller/
├── App.controller.js
├── BaseController.js
├── Home.controller.js
├── agent/           # Agent Designer controllers
├── mcp/             # MCP Builder controllers
├── chat/            # Custom UI controllers
├── tools/           # Tool Manager controllers
├── dashboard/       # Dashboard controllers
└── logs/            # Logs & Monitor controllers
```

**Benefits**:
- Single deployment to HTML5 repo
- Shared code/components across all views
- Unified navigation experience (sap.tnt.SideNavigation)
- Smaller total bundle size
- Simpler approuter config (just one route)
- Easier maintenance
- **Organized by functional area** for better code organization

**Navigation Pattern**:
- Uses `sap.tnt.ToolPage` with `sap.tnt.SideNavigation`
- Side navigation with icons for each section
- Collapsible navigation for more screen space
- Consistent header across all views

### 2. Framework Naming
- Changed from "mcp" to "default" for the standard agent framework
- "mcp" remains as a tool type (Model Context Protocol)

### 3. UI5 Configuration
- Using `fiori-tools-servestatic` middleware for local development
- Configured in `ui5.yaml` to serve webapp folder as root
- Using SAPUI5 1.120.0 with sap.tnt library for navigation

### 4. API Design
- RESTful API at `/api/v1/agents` and `/api/v1/tools`
- JSON responses with `{ success, data, error }` structure
- Health endpoint at `/health`

### 5. Deployment
- MTA-based deployment to Cloud Foundry
- App Router for authentication and routing
- Single HTML5 app deployment (ai-factory-ui)

---

## Week 2 Progress

### Day 8 (Day 1) - Completed ✅
- [x] Reorganized folder structure with subfolders for each app
- [x] Created Chat view and controller
- [x] Updated manifest.json with new routes
- [x] Updated App.view.xml navigation
- [x] Deleted old flat files
- [x] Updated documentation

### Day 9 (Day 2) - TODO
- [ ] Port services from AI_Chatbot_Standalone:
  - [ ] LlmClient.js
  - [ ] ChatService.js
  - [ ] ConversationManager.js
  - [ ] HistoryManager.js
  - [ ] McpClient.js
  - [ ] ToolSchemaAdapter.js

### Day 10 (Day 3) - TODO
- [ ] Implement agent selection in Chat view
- [ ] Connect Chat to Agent Registry API
- [ ] Load agent configuration on selection

---

## Next Steps

### Priority 1: Complete Chat Functionality (Week 2)
- [ ] Port services from AI_Chatbot_Standalone
- [ ] Implement agent selection
- [ ] Connect to LLM via SAP AI Proxy
- [ ] Add streaming support

### Priority 2: Complete Placeholder Views
- [ ] Implement MCP Builder functionality
- [ ] Implement Tool Manager functionality
- [ ] Implement Dashboard with metrics
- [ ] Implement Logs & Monitor view

### Priority 3: Agent Registry Enhancements
- [ ] Add HANA Cloud persistence (replace JSON file)
- [ ] Implement agent versioning
- [ ] Add agent import/export functionality
- [ ] Add agent duplication feature

### Priority 4: Execution Engine
- [ ] Create execution engine service
- [ ] Implement Default Agent executor
- [ ] Add streaming support
- [ ] Implement tool calling

---

## Useful Commands

```bash
# Start local development
cd AI_Factory/services/agent-registry && node src/index.js &
cd AI_Factory/apps/ai-factory && npx ui5 serve --port 8080 &

# Deploy to BTP
cd AI_Factory && mbt build && cf deploy mta_archives/ai-factory_1.0.0.mtar

# Test API
curl http://localhost:3001/api/v1/agents | jq
curl http://localhost:3001/health

# Stop all services
pkill -f "ui5 serve"
pkill -f "node src/index.js"

# Validate agent schema
cd shared/agent-schema && npm run validate:samples
```

---

## Documentation

- `ARCHITECTURE.md` - High-level architecture with all sections:
  - Security & Authorization
  - API Documentation
  - Error Handling
  - Logging Strategy
  - Deployment Guide
  - Configuration Management
  - Versioning Strategy
  - Documentation Plan
- `docs/implementation-plan.md` - 20-week implementation plan
- `docs/phase1-tasklist.md` - Detailed Week 1-2 tasks
- `docs/applications.md` - All planned applications
- `docs/services.md` - Backend services
- `docs/interfaces.md` - API contracts
- `shared/agent-schema/README.md` - Schema documentation
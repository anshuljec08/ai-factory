# AI Factory - Phase 1: Foundation
## Day-by-Day Task List (Single App Architecture)

> **Duration:** 2-3 weeks (adjusted for single-person + AI)
> **Goal:** MVP with Agent Designer, Custom UI, MCP Builder, Agent Registry
> **Architecture:** Single unified `ai-factory` app with side navigation

---

## Overview

### Architecture Decision: Single App vs Multiple Apps

**We chose Single App Architecture** for Phase 1:

```
apps/
├── ai-factory/                    # ✅ Single unified app (ACTIVE)
│   └── webapp/
│       ├── view/
│       │   ├── Home.view.xml
│       │   ├── agent/             # Agent Designer
│       │   │   ├── AgentList.view.xml
│       │   │   ├── AgentDetail.view.xml
│       │   │   └── AgentCreate.view.xml
│       │   ├── Chat.view.xml      # Custom UI
│       │   ├── McpBuilder.view.xml
│       │   ├── ToolManager.view.xml
│       │   ├── Dashboard.view.xml
│       │   └── Logs.view.xml
│       ├── controller/
│       │   └── ... (matching controllers)
│       └── service/
│           └── ... (shared services)
├── 01-agent-designer/             # Legacy placeholder
├── 02-mcp-builder/                # Legacy placeholder
└── ...                            # Other placeholders
```

**Benefits:**
- ✅ Simpler deployment (one MTA module)
- ✅ Shared navigation and state
- ✅ Consistent UI/UX with ToolPage layout
- ✅ Easier maintenance
- ✅ Single approuter configuration

### Phase 1 Deliverables
1. ✅ Project structure and schemas
2. ✅ Agent Designer (CRUD in ai-factory app)
3. ⏳ Custom UI (Chat view in ai-factory app)
4. ⏳ MCP Builder (view in ai-factory app)
5. ✅ Agent Registry service (JSON file storage)
6. ✅ Side navigation with all tiles

### Working Hours
- **Daily:** ~4-6 hours of focused work
- **AI Assistance:** Cline handles code generation, you handle review/testing

---

## Week 1: Project Setup & Core Apps ✅ COMPLETE

### Day 1: Project Structure ✅
**Focus:** Create the foundation

| # | Task | Status |
|---|------|--------|
| 1.1 | Create `AI_Factory/` folder structure | ✅ |
| 1.2 | Create `apps/` folder with placeholders | ✅ |
| 1.3 | Create `services/` folder structure | ✅ |
| 1.4 | Create `shared/` folder structure | ✅ |
| 1.5 | Create root `package.json` for monorepo | ✅ |
| 1.6 | Create `.gitignore` | ✅ |
| 1.7 | Create `mta.yaml` for BTP deployment | ✅ |

---

### Day 2: Agent Schema Definition ✅
**Focus:** Define the core data structures

| # | Task | Status |
|---|------|--------|
| 2.1 | Create `agent.schema.json` | ✅ |
| 2.2 | Create `tool.schema.json` | ✅ |
| 2.3 | Create schema validation utility | ✅ |
| 2.4 | Create sample agent JSON files | ✅ |
| 2.5 | Document schema in README | ✅ |

---

### Day 3: Agent Registry Service ✅
**Focus:** Create a simple file-based agent storage

| # | Task | Status |
|---|------|--------|
| 3.1 | Create `services/agent-registry/` structure | ✅ |
| 3.2 | Create `package.json` with Express | ✅ |
| 3.3 | Create `index.js` with Express server | ✅ |
| 3.4 | Implement `GET /agents` endpoint | ✅ |
| 3.5 | Implement `GET /agents/:id` endpoint | ✅ |
| 3.6 | Implement `POST /agents` endpoint | ✅ |
| 3.7 | Implement `PUT /agents/:id` endpoint | ✅ |
| 3.8 | Implement `DELETE /agents/:id` endpoint | ✅ |
| 3.9 | Create `agents.json` data file | ✅ |

---

### Day 4-5: AI Factory App - Setup & Agent Designer ✅
**Focus:** Create the unified UI5 application with Agent Designer

| # | Task | Status |
|---|------|--------|
| 4.1 | Create `apps/ai-factory/` structure | ✅ |
| 4.2 | Create `manifest.json` with routing | ✅ |
| 4.3 | Create `Component.js` | ✅ |
| 4.4 | Create `App.view.xml` with ToolPage layout | ✅ |
| 4.5 | Create `App.controller.js` with navigation | ✅ |
| 4.6 | Create `Home.view.xml` with tiles | ✅ |
| 4.7 | Create `agent/AgentList.view.xml` | ✅ |
| 4.8 | Create `agent/AgentList.controller.js` | ✅ |
| 4.9 | Create `agent/AgentDetail.view.xml` (full) | ✅ |
| 4.10 | Create `agent/AgentDetail.controller.js` | ✅ |
| 4.11 | Create `agent/AgentCreate.view.xml` | ✅ |
| 4.12 | Create `agent/AgentCreate.controller.js` | ✅ |

**Agent Detail Sections (all implemented):**
- ✅ Basic Information (ID, Name, Description, Framework, Model, Status)
- ✅ System Prompt (large text area with character count)
- ✅ Model Configuration (Temperature, Max Tokens, Top P, Max Steps, Timeout)
- ✅ Capabilities (6 toggle switches)
- ✅ Tools (list with add/remove)
- ✅ Guardrails (Input/Output filters, Content Policy)
- ✅ Metadata (Created, Updated, Category, Icon, Tags)

---

### Day 6-7: Placeholder Views & Deployment Config ✅
**Focus:** Create placeholder views and deployment configuration

| # | Task | Status |
|---|------|--------|
| 6.1 | Create `McpBuilder.view.xml` (placeholder) | ✅ |
| 6.2 | Create `ToolManager.view.xml` (placeholder) | ✅ |
| 6.3 | Create `Dashboard.view.xml` (placeholder) | ✅ |
| 6.4 | Create `Logs.view.xml` (placeholder) | ✅ |
| 6.5 | Create `BaseController.js` | ✅ |
| 6.6 | Update `mta.yaml` for deployment | ✅ |
| 6.7 | Create `approuter/xs-app.json` | ✅ |
| 6.8 | Create deployment scripts | ✅ |

---

## Week 2: Custom UI & MCP Builder

### Day 8: Add Custom UI (Chat) to ai-factory
**Focus:** Port chat interface from AI_Chatbot_Standalone

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 8.1 | Create `view/Chat.view.xml` | AI | 30 min | ☐ |
| 8.2 | Create `controller/Chat.controller.js` | AI | 30 min | ☐ |
| 8.3 | Add route in `manifest.json` | AI | 5 min | ☐ |
| 8.4 | Add navigation item in side menu | AI | 5 min | ☐ |
| 8.5 | Test chat view loads | You | 15 min | ☐ |

**Files to Port:**
| Source | Destination |
|--------|-------------|
| `AI_Chatbot_Standalone/webapp/view/MainView.view.xml` | `apps/ai-factory/webapp/view/Chat.view.xml` |
| `AI_Chatbot_Standalone/webapp/controller/MainView.controller.js` | `apps/ai-factory/webapp/controller/Chat.controller.js` |

---

### Day 9: Port Services from AI_Chatbot_Standalone
**Focus:** Copy and adapt service layer

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 9.1 | Copy `LlmClient.js` to ai-factory | AI | 10 min | ☐ |
| 9.2 | Copy `ChatService.js` to ai-factory | AI | 10 min | ☐ |
| 9.3 | Copy `ConversationManager.js` to ai-factory | AI | 10 min | ☐ |
| 9.4 | Copy `HistoryManager.js` to ai-factory | AI | 10 min | ☐ |
| 9.5 | Copy `McpClient.js` to ai-factory | AI | 10 min | ☐ |
| 9.6 | Copy `ToolSchemaAdapter.js` to ai-factory | AI | 10 min | ☐ |
| 9.7 | Update imports in Chat.controller.js | AI | 15 min | ☐ |
| 9.8 | Test chat functionality | You | 30 min | ☐ |

**Service Files:**
```
apps/ai-factory/webapp/service/
├── LlmClient.js
├── ChatService.js
├── ConversationManager.js
├── HistoryManager.js
├── McpClient.js
└── ToolSchemaAdapter.js
```

---

### Day 10: Custom UI - Agent Selection
**Focus:** Add agent selection from registry

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 10.1 | Add Agent selector dropdown to Chat view | AI | 20 min | ☐ |
| 10.2 | Fetch agents from Agent Registry API | AI | 15 min | ☐ |
| 10.3 | Load agent config on selection | AI | 20 min | ☐ |
| 10.4 | Update system prompt from agent | AI | 10 min | ☐ |
| 10.5 | Update tools from agent config | AI | 15 min | ☐ |
| 10.6 | Test agent switching | You | 30 min | ☐ |

**Deliverable:** Chat UI with agent selection
- Dropdown shows all agents from registry
- Selecting agent loads its configuration
- Chat uses selected agent's prompt and tools

---

### Day 11: MCP Builder - Full Implementation
**Focus:** Implement MCP Builder view

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 11.1 | Update `McpBuilder.view.xml` with full UI | AI | 30 min | ☐ |
| 11.2 | Update `McpBuilder.controller.js` | AI | 30 min | ☐ |
| 11.3 | Add MCP Server URL input | AI | 10 min | ☐ |
| 11.4 | Add Connect button | AI | 10 min | ☐ |
| 11.5 | Implement tool discovery | AI | 30 min | ☐ |
| 11.6 | Display discovered tools in list | AI | 20 min | ☐ |
| 11.7 | Show tool schema details | AI | 20 min | ☐ |
| 11.8 | Test with real MCP server | You | 30 min | ☐ |

**Deliverable:** MCP Builder with tool discovery
- Enter MCP server URL
- Connect and discover tools
- View tool schemas
- Test tools with sample inputs

---

### Day 12: Tool Manager - Full Implementation
**Focus:** Implement Tool Manager view

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 12.1 | Update `ToolManager.view.xml` with full UI | AI | 30 min | ☐ |
| 12.2 | Update `ToolManager.controller.js` | AI | 30 min | ☐ |
| 12.3 | Add tool CRUD operations | AI | 30 min | ☐ |
| 12.4 | Add tool type selection | AI | 15 min | ☐ |
| 12.5 | Add tool configuration forms | AI | 30 min | ☐ |
| 12.6 | Test tool management | You | 30 min | ☐ |

---

### Day 13-14: Integration & Testing
**Focus:** Connect everything and test end-to-end

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 13.1 | Start Agent Registry service | You | 5 min | ☐ |
| 13.2 | Start ai-factory app | You | 5 min | ☐ |
| 13.3 | Test all navigation items | You | 15 min | ☐ |
| 13.4 | Test Agent Designer CRUD | You | 20 min | ☐ |
| 13.5 | Test Custom UI with agent selection | You | 20 min | ☐ |
| 13.6 | Test MCP Builder tool discovery | You | 20 min | ☐ |
| 13.7 | Fix any integration issues | AI | 30 min | ☐ |
| 13.8 | Build and deploy to BTP | You | 30 min | ☐ |

**End-to-End Test Flow:**
1. Open AI Factory app
2. Navigate to Agent Designer
3. Create new agent with MCP tools
4. Navigate to Custom UI (Chat)
5. Select the created agent
6. Chat with the agent
7. Verify tools are called

---

## Week 3 (Optional): Polish & Enhancements

### Day 15-17: Enhancements
| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 15.1 | Add agent versioning | AI | 2 hrs | ☐ |
| 15.2 | Add agent duplication | AI | 1 hr | ☐ |
| 15.3 | Add agent export/import | AI | 2 hrs | ☐ |
| 15.4 | Add conversation history | AI | 2 hrs | ☐ |
| 15.5 | Add streaming indicators | AI | 1 hr | ☐ |
| 15.6 | Improve error messages | AI | 1 hr | ☐ |
| 15.7 | Add loading states | AI | 1 hr | ☐ |
| 15.8 | Mobile responsiveness | AI | 2 hrs | ☐ |

### Day 18-19: Documentation
| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 18.1 | Update README | AI | 1 hr | ☐ |
| 18.2 | Write API documentation | AI | 1 hr | ☐ |
| 18.3 | Write setup guide | AI | 1 hr | ☐ |
| 18.4 | Create architecture diagram | AI | 1 hr | ☐ |

### Day 20: Phase 1 Complete
| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 20.1 | Final testing | You | 2 hrs | ☐ |
| 20.2 | Git commit and tag v0.1.0 | You | 15 min | ☐ |
| 20.3 | Plan Phase 2 priorities | You | 1 hr | ☐ |

---

## Quick Reference

### Commands

**Start Agent Registry:**
```bash
cd AI_Factory/services/agent-registry
npm install
npm start
# Runs on http://localhost:3001
```

**Start AI Factory App:**
```bash
cd AI_Factory/apps/ai-factory
npm install
npm start
# Runs on http://localhost:8080
```

**Build MTA:**
```bash
cd AI_Factory
mbt build
```

**Deploy to BTP:**
```bash
cf deploy mta_archives/ai-factory_*.mtar
```

### API Quick Reference

```bash
# List agents
curl http://localhost:3001/api/v1/agents

# Get agent
curl http://localhost:3001/api/v1/agents/production-agent

# Create agent
curl -X POST http://localhost:3001/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Agent","framework":"default","systemPrompt":"You are a test agent"}'

# Update agent
curl -X PUT http://localhost:3001/api/v1/agents/test-agent \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Test Agent"}'

# Delete agent
curl -X DELETE http://localhost:3001/api/v1/agents/test-agent
```

---

## Progress Tracker

### Week 1 ✅ COMPLETE
- [x] Day 1: Project Structure ✅
- [x] Day 2: Agent Schema ✅
- [x] Day 3: Agent Registry Service ✅
- [x] Day 4-5: AI Factory App + Agent Designer ✅
- [x] Day 6-7: Placeholder Views + Deployment Config ✅

### Week 2 ⏳ IN PROGRESS
- [x] Day 8: Custom UI (Chat) Setup ✅
- [ ] Day 9: Port Services
- [ ] Day 10: Agent Selection
- [ ] Day 11: MCP Builder
- [ ] Day 12: Tool Manager
- [ ] Day 13-14: Integration & Testing

### Week 3 (Optional)
- [ ] Day 15-17: Enhancements
- [ ] Day 18-19: Documentation
- [ ] Day 20: Phase 1 Complete

---

## Success Criteria

Phase 1 is complete when:
- [x] Can create/edit/delete agents via Agent Designer
- [ ] Can chat with agents via Custom UI
- [ ] Can discover MCP tools via MCP Builder
- [x] Side navigation shows all sections
- [x] All views connect to Agent Registry
- [ ] Basic documentation exists

---

## App Structure (Single App Architecture)

```
apps/ai-factory/
├── webapp/
│   ├── Component.js
│   ├── manifest.json
│   ├── index.html
│   ├── controller/
│   │   ├── App.controller.js
│   │   ├── BaseController.js
│   │   ├── Home.controller.js
│   │   ├── Chat.controller.js          # Week 2
│   │   ├── McpBuilder.controller.js
│   │   ├── ToolManager.controller.js
│   │   ├── Dashboard.controller.js
│   │   ├── Logs.controller.js
│   │   └── agent/
│   │       ├── AgentList.controller.js
│   │       ├── AgentDetail.controller.js
│   │       └── AgentCreate.controller.js
│   ├── view/
│   │   ├── App.view.xml
│   │   ├── Home.view.xml
│   │   ├── Chat.view.xml               # Week 2
│   │   ├── McpBuilder.view.xml
│   │   ├── ToolManager.view.xml
│   │   ├── Dashboard.view.xml
│   │   ├── Logs.view.xml
│   │   └── agent/
│   │       ├── AgentList.view.xml
│   │       ├── AgentDetail.view.xml
│   │       └── AgentCreate.view.xml
│   ├── service/                        # Week 2
│   │   ├── LlmClient.js
│   │   ├── ChatService.js
│   │   ├── ConversationManager.js
│   │   ├── HistoryManager.js
│   │   ├── McpClient.js
│   │   └── ToolSchemaAdapter.js
│   ├── model/
│   │   └── tiles.json
│   ├── css/
│   │   └── style.css
│   └── i18n/
│       └── i18n.properties
├── package.json
└── ui5.yaml
```

---

*Ready to continue? Let's start Week 2!*
# AI Factory - Phase 1: Foundation
## Day-by-Day Task List

> **Duration:** 2-3 weeks (adjusted for single-person + AI)
> **Goal:** MVP with Agent Designer, Custom UI, MCP Builder, Agent Registry

---

## Overview

### Phase 1 Deliverables
1. ✅ Project structure and schemas
2. ✅ Agent Designer app (basic CRUD)
3. ✅ Custom UI (ported from AI_Chatbot_Standalone)
4. ✅ MCP Builder (ported from AI_Chatbot_Standalone)
5. ✅ Agent Registry service (JSON file storage initially)
6. ✅ Fiori Launchpad with tiles

### Working Hours
- **Daily:** ~4-6 hours of focused work
- **AI Assistance:** Cline handles code generation, you handle review/testing

---

## Week 1: Project Setup & Core Apps

### 🚀 NEW: Weekly Deployment Pattern

**Every week ends with a Deployment Day:**
- Build MTA archive
- Deploy to BTP (dev space)
- Verify all components work
- Add new tiles to launchpad

This ensures you can test the full deployment every week!

---

### Day 1: Project Structure
**Focus:** Create the foundation

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 1.1 | Create `AI_Factory/` folder structure | AI | 15 min | ☐ |
| 1.2 | Create `apps/` folder with 14 app placeholders | AI | 10 min | ☐ |
| 1.3 | Create `services/` folder with 4 service placeholders | AI | 10 min | ☐ |
| 1.4 | Create `shared/` folder structure | AI | 10 min | ☐ |
| 1.5 | Create `launchpad/` folder | AI | 5 min | ☐ |
| 1.6 | Create root `package.json` for monorepo | AI | 10 min | ☐ |
| 1.7 | Create `.gitignore` | AI | 5 min | ☐ |
| 1.8 | Initialize Git repository | You | 5 min | ☐ |
| 1.9 | Review and test folder structure | You | 15 min | ☐ |

**Deliverable:** Complete project structure
```
AI_Factory/
├── apps/
│   ├── 01-agent-designer/
│   ├── 02-mcp-builder/
│   ├── 05-custom-ui/
│   └── ... (placeholders)
├── services/
│   ├── agent-registry/
│   └── ... (placeholders)
├── shared/
│   ├── agent-schema/
│   ├── api-contracts/
│   └── common-utils/
├── launchpad/
├── docs/
├── package.json
└── .gitignore
```

---

### Day 2: Agent Schema Definition
**Focus:** Define the core data structures

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 2.1 | Create `agent.schema.json` | AI | 30 min | ☐ |
| 2.2 | Create `tool.schema.json` | AI | 20 min | ☐ |
| 2.3 | Create schema validation utility | AI | 20 min | ☐ |
| 2.4 | Create sample agent JSON files | AI | 15 min | ☐ |
| 2.5 | Test schema validation | You | 20 min | ☐ |
| 2.6 | Document schema in README | AI | 15 min | ☐ |

**Deliverable:** `shared/agent-schema/`
```
shared/agent-schema/
├── agent.schema.json
├── tool.schema.json
├── validator.js
├── samples/
│   ├── production-agent.json
│   └── sales-agent.json
└── README.md
```

**Agent Schema Fields:**
```json
{
  "id": "production-agent",
  "name": "Production Assistant",
  "description": "AI assistant for production operations",
  "framework": "mcp",
  "systemPrompt": "You are a Production Operations Assistant...",
  "model": "claude-4-sonnet",
  "tools": [...],
  "maxSteps": 30,
  "timeout": 30000,
  "capabilities": {
    "streaming": true,
    "humanInLoop": false
  },
  "version": "1.0.0"
}
```

---

### Day 3: Agent Registry Service (Simple)
**Focus:** Create a simple file-based agent storage

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 3.1 | Create `services/agent-registry/` structure | AI | 10 min | ☐ |
| 3.2 | Create `package.json` with Express | AI | 10 min | ☐ |
| 3.3 | Create `index.js` with Express server | AI | 15 min | ☐ |
| 3.4 | Implement `GET /agents` endpoint | AI | 15 min | ☐ |
| 3.5 | Implement `GET /agents/:id` endpoint | AI | 10 min | ☐ |
| 3.6 | Implement `POST /agents` endpoint | AI | 15 min | ☐ |
| 3.7 | Implement `PUT /agents/:id` endpoint | AI | 15 min | ☐ |
| 3.8 | Implement `DELETE /agents/:id` endpoint | AI | 10 min | ☐ |
| 3.9 | Create `agents.json` data file | AI | 10 min | ☐ |
| 3.10 | Test all endpoints with curl/Postman | You | 30 min | ☐ |

**Deliverable:** `services/agent-registry/`
```
services/agent-registry/
├── src/
│   ├── index.js
│   ├── routes/
│   │   └── agents.js
│   └── data/
│       └── agents.json
├── package.json
└── README.md
```

**API Endpoints:**
```
GET    /api/v1/agents           - List all agents
GET    /api/v1/agents/:id       - Get agent by ID
POST   /api/v1/agents           - Create agent
PUT    /api/v1/agents/:id       - Update agent
DELETE /api/v1/agents/:id       - Delete agent
```

---

### Day 4: Agent Designer App - Setup
**Focus:** Create the UI5 application scaffold

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 4.1 | Create `apps/01-agent-designer/` structure | AI | 15 min | ☐ |
| 4.2 | Create `manifest.json` | AI | 15 min | ☐ |
| 4.3 | Create `Component.js` | AI | 10 min | ☐ |
| 4.4 | Create `index.html` | AI | 10 min | ☐ |
| 4.5 | Create `App.view.xml` (shell) | AI | 10 min | ☐ |
| 4.6 | Create `App.controller.js` | AI | 10 min | ☐ |
| 4.7 | Create routing configuration | AI | 15 min | ☐ |
| 4.8 | Create `ui5.yaml` | AI | 10 min | ☐ |
| 4.9 | Test app loads in browser | You | 20 min | ☐ |

**Deliverable:** `apps/01-agent-designer/`
```
apps/01-agent-designer/
├── webapp/
│   ├── Component.js
│   ├── manifest.json
│   ├── index.html
│   ├── controller/
│   │   └── App.controller.js
│   ├── view/
│   │   └── App.view.xml
│   ├── css/
│   │   └── style.css
│   └── i18n/
│       └── i18n.properties
└── ui5.yaml
```

---

### Day 5: Agent Designer - List View
**Focus:** Build the agent list page

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 5.1 | Create `AgentList.view.xml` | AI | 20 min | ☐ |
| 5.2 | Create `AgentList.controller.js` | AI | 20 min | ☐ |
| 5.3 | Add Table with columns (Name, Framework, Status) | AI | 15 min | ☐ |
| 5.4 | Add Search field | AI | 10 min | ☐ |
| 5.5 | Add Filter by framework | AI | 15 min | ☐ |
| 5.6 | Add Create button | AI | 10 min | ☐ |
| 5.7 | Connect to Agent Registry API | AI | 20 min | ☐ |
| 5.8 | Test list loads agents | You | 20 min | ☐ |

**Deliverable:** Working agent list page
- Shows all agents from registry
- Search by name
- Filter by framework
- Create button (navigates to create page)

---

### Day 6: Agent Designer - Detail/Edit View
**Focus:** Build the agent detail/edit page

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 6.1 | Create `AgentDetail.view.xml` | AI | 30 min | ☐ |
| 6.2 | Create `AgentDetail.controller.js` | AI | 30 min | ☐ |
| 6.3 | Add Basic Info section (name, description) | AI | 15 min | ☐ |
| 6.4 | Add Framework selector | AI | 10 min | ☐ |
| 6.5 | Add Model selector | AI | 10 min | ☐ |
| 6.6 | Add System Prompt textarea | AI | 15 min | ☐ |
| 6.7 | Add Tools multi-select (placeholder) | AI | 15 min | ☐ |
| 6.8 | Add Save/Cancel buttons | AI | 10 min | ☐ |
| 6.9 | Implement save to Agent Registry | AI | 20 min | ☐ |
| 6.10 | Test create/edit flow | You | 30 min | ☐ |

**Deliverable:** Working agent detail page
- View agent details
- Edit all fields
- Save changes to registry

---

### Day 7: 🚀 Launchpad & Weekly Deployment (Week 1)
**Focus:** Create launchpad and deploy to BTP

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 7.1 | Create `launchpad/webapp/` structure | AI | 10 min | ☐ |
| 7.2 | Create `launchpad/webapp/index.html` | AI | 20 min | ☐ |
| 7.3 | Create `launchpad/webapp/manifest.json` | AI | 15 min | ☐ |
| 7.4 | Create `launchpad/webapp/Component.js` | AI | 15 min | ☐ |
| 7.5 | Add Agent Designer tile | AI | 10 min | ☐ |
| 7.6 | Create weekly deployment scripts | AI | 20 min | ☐ |
| 7.7 | Update `mta.yaml` for full deployment | AI | 15 min | ☐ |
| 7.8 | Build MTA archive (`mbt build`) | You | 10 min | ☐ |
| 7.9 | Deploy to BTP (`cf deploy`) | You | 15 min | ☐ |
| 7.10 | Verify tiles in Fiori Launchpad | You | 20 min | ☐ |

**Deliverable:** Week 1 Deployment
- Launchpad with Agent Designer tile
- Full MTA deployed to BTP
- Accessible via approuter URL

**Weekly Deployment Checklist:**
```
□ All local tests passing
□ MTA build successful
□ Deploy to BTP successful
□ API health check passing
□ UI accessible via approuter
□ Tiles visible in launchpad
□ Navigation working
□ Commit and push to GitHub
```

---

## Week 2: Custom UI & MCP Builder

### Day 8: Port Custom UI - Setup
**Focus:** Copy and adapt from AI_Chatbot_Standalone

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 8.1 | Create `apps/05-custom-ui/` structure | AI | 10 min | ☐ |
| 8.2 | Copy `manifest.json` and adapt | AI | 15 min | ☐ |
| 8.3 | Copy `Component.js` and adapt | AI | 10 min | ☐ |
| 8.4 | Copy `index.html` | AI | 5 min | ☐ |
| 8.5 | Copy `MainView.view.xml` → `Chat.view.xml` | AI | 15 min | ☐ |
| 8.6 | Copy `MainView.controller.js` → `Chat.controller.js` | AI | 15 min | ☐ |
| 8.7 | Copy `style.css` | AI | 5 min | ☐ |
| 8.8 | Create `ui5.yaml` | AI | 10 min | ☐ |
| 8.9 | Test app loads | You | 20 min | ☐ |

**Files to Port:**
| Source | Destination |
|--------|-------------|
| `AI_Chatbot_Standalone/webapp/view/MainView.view.xml` | `apps/05-custom-ui/webapp/view/Chat.view.xml` |
| `AI_Chatbot_Standalone/webapp/controller/MainView.controller.js` | `apps/05-custom-ui/webapp/controller/Chat.controller.js` |
| `AI_Chatbot_Standalone/webapp/css/style.css` | `apps/05-custom-ui/webapp/css/style.css` |

---

### Day 9: Port Custom UI - Services
**Focus:** Port the service layer

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 9.1 | Copy `LlmClient.js` | AI | 15 min | ☐ |
| 9.2 | Copy `ChatService.js` | AI | 15 min | ☐ |
| 9.3 | Copy `ConversationManager.js` | AI | 15 min | ☐ |
| 9.4 | Copy `HistoryManager.js` | AI | 15 min | ☐ |
| 9.5 | Copy `McpClient.js` | AI | 15 min | ☐ |
| 9.6 | Copy `ToolSchemaAdapter.js` to shared | AI | 15 min | ☐ |
| 9.7 | Update imports in all files | AI | 20 min | ☐ |
| 9.8 | Test chat functionality | You | 30 min | ☐ |

**Files to Port:**
| Source | Destination |
|--------|-------------|
| `AI_Chatbot_Standalone/webapp/service/LlmClient.js` | `apps/05-custom-ui/webapp/service/LlmClient.js` |
| `AI_Chatbot_Standalone/webapp/service/ChatService.js` | `apps/05-custom-ui/webapp/service/ChatService.js` |
| `AI_Chatbot_Standalone/webapp/service/ConversationManager.js` | `apps/05-custom-ui/webapp/service/ConversationManager.js` |
| `AI_Chatbot_Standalone/webapp/service/HistoryManager.js` | `apps/05-custom-ui/webapp/service/HistoryManager.js` |
| `AI_Chatbot_Standalone/webapp/service/McpClient.js` | `apps/05-custom-ui/webapp/service/McpClient.js` |
| `AI_Chatbot_Standalone/webapp/service/ToolSchemaAdapter.js` | `shared/common-utils/ToolSchemaAdapter.js` |

---

### Day 10: Custom UI - Agent Selection
**Focus:** Add agent selection from registry

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 10.1 | Add Agent selector dropdown | AI | 20 min | ☐ |
| 10.2 | Fetch agents from Agent Registry | AI | 20 min | ☐ |
| 10.3 | Load agent config on selection | AI | 20 min | ☐ |
| 10.4 | Update system prompt from agent | AI | 15 min | ☐ |
| 10.5 | Update tools from agent config | AI | 15 min | ☐ |
| 10.6 | Persist selected agent in session | AI | 15 min | ☐ |
| 10.7 | Test agent switching | You | 30 min | ☐ |

**Deliverable:** Custom UI with agent selection
- Dropdown shows all agents from registry
- Selecting agent loads its configuration
- Chat uses selected agent's prompt and tools

---

### Day 11: MCP Builder - Setup
**Focus:** Create MCP Builder app

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 11.1 | Create `apps/02-mcp-builder/` structure | AI | 10 min | ☐ |
| 11.2 | Create `manifest.json` | AI | 15 min | ☐ |
| 11.3 | Create `Component.js` | AI | 10 min | ☐ |
| 11.4 | Create `index.html` | AI | 5 min | ☐ |
| 11.5 | Create `ServerList.view.xml` | AI | 20 min | ☐ |
| 11.6 | Create `ServerList.controller.js` | AI | 20 min | ☐ |
| 11.7 | Create `ui5.yaml` | AI | 10 min | ☐ |
| 11.8 | Test app loads | You | 15 min | ☐ |

**Deliverable:** `apps/02-mcp-builder/`
```
apps/02-mcp-builder/
├── webapp/
│   ├── Component.js
│   ├── manifest.json
│   ├── index.html
│   ├── controller/
│   │   ├── App.controller.js
│   │   └── ServerList.controller.js
│   ├── view/
│   │   ├── App.view.xml
│   │   └── ServerList.view.xml
│   ├── service/
│   │   └── McpClient.js
│   └── css/
│       └── style.css
└── ui5.yaml
```

---

### Day 12: MCP Builder - Tool Discovery
**Focus:** Implement MCP server connection and tool discovery

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 12.1 | Add MCP Server URL input | AI | 15 min | ☐ |
| 12.2 | Add Connect button | AI | 10 min | ☐ |
| 12.3 | Implement tool discovery from MCP server | AI | 30 min | ☐ |
| 12.4 | Display discovered tools in list | AI | 20 min | ☐ |
| 12.5 | Show tool schema details | AI | 20 min | ☐ |
| 12.6 | Add tool testing interface | AI | 30 min | ☐ |
| 12.7 | Test with real MCP server | You | 30 min | ☐ |

**Deliverable:** MCP Builder with tool discovery
- Enter MCP server URL
- Connect and discover tools
- View tool schemas
- Test tools with sample inputs

---

### Day 13: Fiori Launchpad
**Focus:** Create the application shell

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 13.1 | Create `launchpad/` structure | AI | 10 min | ☐ |
| 13.2 | Create `index.html` with FLP shell | AI | 30 min | ☐ |
| 13.3 | Create `tiles.json` configuration | AI | 20 min | ☐ |
| 13.4 | Add Agent Designer tile | AI | 10 min | ☐ |
| 13.5 | Add Custom UI tile | AI | 10 min | ☐ |
| 13.6 | Add MCP Builder tile | AI | 10 min | ☐ |
| 13.7 | Configure navigation targets | AI | 20 min | ☐ |
| 13.8 | Test tile navigation | You | 30 min | ☐ |

**Deliverable:** `launchpad/`
```
launchpad/
├── webapp/
│   ├── index.html
│   ├── Component.js
│   ├── manifest.json
│   └── tiles.json
└── ui5.yaml
```

**Tiles:**
| Tile | Icon | Target |
|------|------|--------|
| Agent Designer | sap-icon://create | #AgentDesigner-display |
| Custom Chat UI | sap-icon://discussion | #CustomUI-display |
| MCP Builder | sap-icon://wrench | #MCPBuilder-display |

---

### Day 14: Integration & Testing
**Focus:** Connect everything and test end-to-end

| # | Task | AI/You | Time | Status |
|---|------|--------|------|--------|
| 14.1 | Start Agent Registry service | You | 5 min | ☐ |
| 14.2 | Start all UI5 apps | You | 10 min | ☐ |
| 14.3 | Test Launchpad navigation | You | 15 min | ☐ |
| 14.4 | Test Agent Designer CRUD | You | 20 min | ☐ |
| 14.5 | Test Custom UI with agent selection | You | 20 min | ☐ |
| 14.6 | Test MCP Builder tool discovery | You | 20 min | ☐ |
| 14.7 | Fix any integration issues | AI | 30 min | ☐ |
| 14.8 | Document setup instructions | AI | 20 min | ☐ |

**End-to-End Test Flow:**
1. Open Launchpad
2. Click Agent Designer tile
3. Create new agent with MCP tools
4. Go back to Launchpad
5. Click Custom UI tile
6. Select the created agent
7. Chat with the agent
8. Verify tools are called

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
| 18.1 | Write README for each app | AI | 2 hrs | ☐ |
| 18.2 | Write API documentation | AI | 1 hr | ☐ |
| 18.3 | Write setup guide | AI | 1 hr | ☐ |
| 18.4 | Create architecture diagram | AI | 1 hr | ☐ |
| 18.5 | Record demo video | You | 1 hr | ☐ |

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

**Start Agent Designer:**
```bash
cd AI_Factory/apps/01-agent-designer
npm install
npm start
# Runs on http://localhost:8080
```

**Start Custom UI:**
```bash
cd AI_Factory/apps/05-custom-ui
npm install
npm start
# Runs on http://localhost:8081
```

**Start MCP Builder:**
```bash
cd AI_Factory/apps/02-mcp-builder
npm install
npm start
# Runs on http://localhost:8082
```

**Start Launchpad:**
```bash
cd AI_Factory/launchpad
npm install
npm start
# Runs on http://localhost:8000
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
  -d '{"id":"test-agent","name":"Test","framework":"mcp",...}'

# Update agent
curl -X PUT http://localhost:3001/api/v1/agents/test-agent \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Test",...}'

# Delete agent
curl -X DELETE http://localhost:3001/api/v1/agents/test-agent
```

---

## Progress Tracker

### Week 1
- [x] Day 1: Project Structure ✅
- [x] Day 2: Agent Schema ✅
- [x] Day 3: Agent Registry Service ✅
- [x] Day 4: Agent Designer Setup ✅
- [x] Day 5: Agent Designer List View ✅
- [x] Day 6: Agent Designer Detail View + BTP Config ✅
- [ ] Day 7: 🚀 Launchpad & Weekly Deployment (Week 1)

### Week 2
- [ ] Day 8: Custom UI Setup
- [ ] Day 9: Custom UI Services
- [ ] Day 10: Custom UI Agent Selection
- [ ] Day 11: MCP Builder Setup
- [ ] Day 12: MCP Builder Tool Discovery
- [ ] Day 13: Add Custom UI & MCP Builder tiles
- [ ] Day 14: 🚀 Weekly Deployment (Week 2)

### Week 3 (Optional)
- [ ] Day 15-17: Enhancements
- [ ] Day 18-19: Documentation
- [ ] Day 20: Phase 1 Complete
- [ ] Day 21: 🚀 Final Deployment (Week 3)

---

## Success Criteria

Phase 1 is complete when:
- [ ] Can create/edit/delete agents via Agent Designer
- [ ] Can chat with agents via Custom UI
- [ ] Can discover MCP tools via MCP Builder
- [ ] Launchpad shows all tiles and navigation works
- [ ] All apps connect to Agent Registry
- [ ] Basic documentation exists

---

*Ready to start? Let's begin with Day 1!*
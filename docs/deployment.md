# AI Factory - Deployment Model

> Documentation for deployment architecture, implementation phases, and technology stack.

---

## Table of Contents

1. [Deployment Model](#deployment-model)
2. [Implementation Phases](#implementation-phases)
3. [Technology Stack](#technology-stack)
4. [Fiori Launchpad](#fiori-launchpad)

---

## Deployment Model

### Key Principle: Single Deployment, Multiple Agents

**You do NOT need to deploy each agent separately.** Instead, deploy the Execution Engine once, and agents are loaded dynamically from the Agent Registry at runtime.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SINGLE DEPLOYMENT MODEL                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                    EXECUTION ENGINE (Deploy Once)                            │    │
│  │                                                                               │    │
│  │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                       │    │
│  │   │ LangGraph   │   │ MAF         │   │ MCP         │                       │    │
│  │   │ Runtime     │   │ Runtime     │   │ Runtime     │                       │    │
│  │   └─────────────┘   └─────────────┘   └─────────────┘                       │    │
│  │                                                                               │    │
│  │   Loads agent definitions from Agent Registry at runtime                     │    │
│  │                                                                               │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                      ▲                                               │
│                                      │                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                    AGENT REGISTRY (Database)                                 │    │
│  │                                                                               │    │
│  │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    │    │
│  │   │ Production  │   │ HANA        │   │ Sales       │   │ Custom      │    │    │
│  │   │ Agent       │   │ Agent       │   │ Agent       │   │ Agent       │    │    │
│  │   │ (config)    │   │ (config)    │   │ (config)    │   │ (config)    │    │    │
│  │   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘    │    │
│  │                                                                               │    │
│  │   Stores: System prompts, tool configs, model settings, framework type       │    │
│  │                                                                               │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ✅ Deploy Execution Engine ONCE                                                    │
│  ✅ Add/modify agents via Agent Designer (no redeployment)                          │
│  ✅ Change prompts, tools, settings anytime                                         │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### What Gets Deployed vs What's Configurable

| Component | Deployed? | Configurable at Runtime? |
|-----------|-----------|--------------------------|
| **Execution Engine** | ✅ Yes (once) | ❌ No |
| **LangGraph Runtime** | ✅ Yes (part of engine) | ❌ No |
| **MAF Runtime** | ✅ Yes (part of engine) | ❌ No |
| **Agent Definitions** | ❌ No | ✅ Yes |
| **System Prompts** | ❌ No | ✅ Yes |
| **Tool Configurations** | ❌ No | ✅ Yes |
| **Model Selection** | ❌ No | ✅ Yes |
| **Max Steps, Timeouts** | ❌ No | ✅ Yes |

### Framework-Specific Deployment

| Framework | Where Agent Logic Runs | Deployment Required |
|-----------|------------------------|---------------------|
| **MCP** | Browser (JavaScript) | ❌ None (UI only) |
| **LangGraph** | Execution Engine (Python) | ✅ Execution Engine |
| **MAF** | Execution Engine (Python/.NET) | ✅ Execution Engine |

### Changing an Agent (No Redeployment)

**To modify an agent:**
1. Open Agent Designer
2. Edit system prompt, tools, or settings
3. Click Save
4. Done! Next request uses new configuration.

**No redeployment needed for:**
- Changing system prompts
- Adding/removing tools
- Switching models
- Adjusting max steps or timeouts
- Enabling/disabling capabilities

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
- [ ] Create project structure
- [ ] Define shared agent schema (JSON Schema)
- [ ] Implement Agent Designer (basic CRUD)
- [ ] Implement MCP Builder (port from AI_Chatbot_Standalone)
- [ ] Implement Custom UI (port from AI_Chatbot_Standalone)
- [ ] Create Agent Registry service
- [ ] Create Fiori Launchpad with tiles

### Phase 2: Framework Expansion (Weeks 5-8)
- [ ] Implement LangGraph Builder
- [ ] Create LangGraph backend service
- [ ] Implement MAF Builder
- [ ] Create MAF backend service
- [ ] Add framework switching in Custom UI
- [ ] Implement Execution Engine service

### Phase 3: UI Integrations (Weeks 9-12)
- [ ] Implement Joule Connector
- [ ] Implement Open WebUI Connector
- [ ] Create unified API layer
- [ ] Add streaming support across all UIs

### Phase 4: Operations (Weeks 13-16)
- [ ] Implement A2A Flow Designer
- [ ] Implement A2A Orchestrator service
- [ ] Implement Scheduler
- [ ] Implement Dashboard
- [ ] Implement Logs & Monitor
- [ ] Implement Metrics Collector service

### Phase 5: Polish & Deploy (Weeks 17-20)
- [ ] End-to-end testing
- [ ] Documentation
- [ ] BTP deployment
- [ ] Performance optimization
- [ ] Security audit

---

## Technology Stack

### Frontend
- **UI5/Fiori** - All web applications
- **SAP Fiori Launchpad** - Application shell

### Backend
- **Node.js** - MCP Builder, Scheduler
- **Python (FastAPI)** - LangGraph Builder, MAF Builder
- **Express.js** - API Gateway

### AI/ML
- **SAP AI Core** - LLM provider
- **SAP AI Proxy** - API translation
- **LangChain/LangGraph** - Python agent framework
- **Microsoft Agent Framework** - Enterprise agents

### Infrastructure
- **SAP BTP Cloud Foundry** - Primary deployment
- **Docker** - Containerization
- **Kubernetes** - Optional orchestration

### Data
- **PostgreSQL** - Agent registry, metrics
- **Redis** - Caching, job queues
- **Elasticsearch** - Logs

### Protocols
- **MCP** - Model Context Protocol
- **A2A** - Agent-to-Agent Protocol
- **OpenAI API** - LLM interface

---

## Fiori Launchpad

### Tile Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              🏭 AI FACTORY                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  CREATE & BUILD                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │ 📋          │  │ 🔧          │  │ 🔧          │  │ 🔧          │               │
│  │ Agent       │  │ MCP         │  │ LangGraph   │  │ MAF         │               │
│  │ Designer    │  │ Builder     │  │ Builder     │  │ Builder     │               │
│  │             │  │             │  │             │  │             │               │
│  │ 12 Agents   │  │ 8 Active    │  │ 3 Active    │  │ 1 Active    │               │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘               │
│                                                                                      │
│  RUN & INTERACT                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                                │
│  │ 🖥️          │  │ 🖥️          │  │ 🖥️          │                                │
│  │ Custom      │  │ Joule       │  │ Open        │                                │
│  │ Chat UI     │  │ Connector   │  │ WebUI       │                                │
│  │             │  │             │  │             │                                │
│  │ Launch      │  │ Configure   │  │ Launch      │                                │
│  └─────────────┘  └─────────────┘  └─────────────┘                                │
│                                                                                      │
│  MANAGE & MONITOR                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │ ⚙️          │  │ ⚙️          │  │ 📊          │  │ 📝          │               │
│  │ A2A Flow    │  │ Scheduler   │  │ Dashboard   │  │ Logs &      │               │
│  │ Designer    │  │             │  │             │  │ Monitor     │               │
│  │             │  │             │  │             │  │             │               │
│  │ 2 Flows     │  │ 5 Jobs      │  │ View        │  │ View        │               │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘               │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Tile Configuration

```json
{
  "tiles": [
    {
      "id": "agent-designer",
      "title": "Agent Designer",
      "subtitle": "Create & configure agents",
      "icon": "sap-icon://create",
      "info": "12 Agents",
      "infoState": "Neutral",
      "targetURL": "#AgentDesigner-display"
    },
    {
      "id": "mcp-builder",
      "title": "MCP Builder",
      "subtitle": "JavaScript framework",
      "icon": "sap-icon://wrench",
      "info": "8 Active",
      "infoState": "Success",
      "targetURL": "#MCPBuilder-display"
    },
    {
      "id": "langgraph-builder",
      "title": "LangGraph Builder",
      "subtitle": "Python framework",
      "icon": "sap-icon://wrench",
      "info": "3 Active",
      "infoState": "Success",
      "targetURL": "#LangGraphBuilder-display"
    },
    {
      "id": "maf-builder",
      "title": "MAF Builder",
      "subtitle": "Microsoft framework",
      "icon": "sap-icon://wrench",
      "info": "1 Active",
      "infoState": "Success",
      "targetURL": "#MAFBuilder-display"
    },
    {
      "id": "custom-ui",
      "title": "Custom Chat UI",
      "subtitle": "Chat with agents",
      "icon": "sap-icon://discussion",
      "info": "Launch",
      "infoState": "Neutral",
      "targetURL": "#CustomUI-display"
    },
    {
      "id": "joule-connector",
      "title": "Joule Connector",
      "subtitle": "SAP Joule integration",
      "icon": "sap-icon://connected",
      "info": "Configure",
      "infoState": "Neutral",
      "targetURL": "#JouleConnector-display"
    },
    {
      "id": "openwebui-connector",
      "title": "Open WebUI",
      "subtitle": "Open WebUI integration",
      "icon": "sap-icon://world",
      "info": "Launch",
      "infoState": "Neutral",
      "targetURL": "#OpenWebUI-display"
    },
    {
      "id": "a2a-designer",
      "title": "A2A Flow Designer",
      "subtitle": "Multi-agent workflows",
      "icon": "sap-icon://workflow-tasks",
      "info": "2 Flows",
      "infoState": "Neutral",
      "targetURL": "#A2ADesigner-display"
    },
    {
      "id": "scheduler",
      "title": "Scheduler",
      "subtitle": "Schedule agent runs",
      "icon": "sap-icon://calendar",
      "info": "5 Jobs",
      "infoState": "Success",
      "targetURL": "#Scheduler-display"
    },
    {
      "id": "dashboard",
      "title": "Dashboard",
      "subtitle": "Analytics & metrics",
      "icon": "sap-icon://business-objects-experience",
      "info": "View",
      "infoState": "Neutral",
      "targetURL": "#Dashboard-display"
    },
    {
      "id": "logs-monitor",
      "title": "Logs & Monitor",
      "subtitle": "Logging & monitoring",
      "icon": "sap-icon://monitor-payments",
      "info": "View",
      "infoState": "Neutral",
      "targetURL": "#LogsMonitor-display"
    },
    {
      "id": "tool-manager",
      "title": "Tool Manager",
      "subtitle": "Manage tools & RAG",
      "icon": "sap-icon://tools-opportunity",
      "info": "15 Tools",
      "infoState": "Neutral",
      "targetURL": "#ToolManager-display"
    }
  ]
}
```

---

## Project Structure

```
AI_Factory/
├── README.md                           # Platform overview
├── ARCHITECTURE.md                     # Main architecture (links to docs/)
├── docker-compose.yml                  # Local development setup
├── mta.yaml                            # BTP deployment descriptor
│
├── docs/                               # Detailed documentation
│   ├── applications.md                 # All 14 applications
│   ├── services.md                     # Backend services
│   ├── deployment.md                   # This file
│   ├── ui-integration.md               # UI options
│   ├── a2a-orchestration.md            # A2A architecture
│   ├── design-principles.md            # Design patterns
│   ├── scalability.md                  # Plugin architecture
│   ├── tool-management.md              # Tool types & RAG
│   ├── protocols-standards.md          # AI protocols
│   └── interfaces.md                   # Interface definitions
│
├── shared/                             # Shared libraries & types
│   ├── agent-schema/                   # Agent definition schema (JSON Schema)
│   │   ├── agent.schema.json           # Main agent schema
│   │   ├── tool.schema.json            # Tool definition schema
│   │   └── auth.schema.json            # Authentication schema
│   ├── api-contracts/                  # OpenAPI specs for all services
│   │   ├── agent-registry.yaml         # Agent registry API
│   │   ├── execution-engine.yaml       # Execution engine API
│   │   └── a2a-protocol.yaml           # A2A protocol spec
│   └── common-utils/                   # Shared utilities
│       ├── js/                         # JavaScript utilities
│       └── python/                     # Python utilities
│
├── apps/                               # All applications
│   ├── 01-agent-designer/              # 📋 Agent Creation App
│   ├── 02-mcp-builder/                 # 🔧 MCP Framework Builder
│   ├── 03-langgraph-builder/           # 🔧 LangGraph Framework Builder
│   ├── 04-maf-builder/                 # 🔧 MAF Framework Builder
│   ├── 05-custom-ui/                   # 🖥️ Custom Chat UI (UI5)
│   ├── 06-joule-connector/             # 🖥️ Joule Integration
│   ├── 07-openwebui-connector/         # 🖥️ Open WebUI Integration
│   ├── 08-a2a-designer-langgraph/      # ⚙️ A2A Flow Designer (LangGraph)
│   ├── 09-a2a-designer-crewai/         # ⚙️ A2A Flow Designer (CrewAI)
│   ├── 10-a2a-designer-maf/            # ⚙️ A2A Flow Designer (MAF)
│   ├── 11-scheduler/                   # ⚙️ Agent Scheduler
│   ├── 12-dashboard/                   # ⚙️ Analytics Dashboard
│   ├── 13-logs-monitor/                # ⚙️ Logs & Monitoring
│   └── 14-tool-manager/                # 🔧 Tool Management
│
├── services/                           # Backend services
│   ├── agent-registry/                 # Central agent registry service
│   ├── execution-engine/               # Agent execution service
│   ├── a2a-orchestrator/               # A2A protocol orchestrator
│   └── metrics-collector/              # Metrics & logging service
│
├── launchpad/                          # SAP Fiori Launchpad config
│   ├── webapp/
│   └── tiles.json                      # Tile definitions
│
└── infrastructure/                     # Deployment configs
    ├── kubernetes/
    ├── cloud-foundry/
    └── terraform/
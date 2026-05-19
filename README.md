# 🏭 AI Factory

> A unified platform for creating, building, running, and managing AI agents across multiple frameworks and UIs.

---

## Quick Overview

AI Factory is a comprehensive platform that enables you to:

| Action | Description | Applications |
|--------|-------------|--------------|
| **Create** | Define agents visually (framework-agnostic) | Agent Designer |
| **Build** | Implement agents with your preferred framework | MCP, LangGraph, MAF Builders |
| **Run** | Interact with agents through multiple UIs | Custom UI, Joule, Open WebUI |
| **Manage** | Schedule, monitor, and orchestrate agents | A2A Designer, Scheduler, Dashboard, Logs |

---

## Platform Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              🏭 AI FACTORY PLATFORM                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  📋 CREATION        🔧 FRAMEWORKS         🖥️ UIs              ⚙️ OPERATIONS         │
│  ─────────────      ─────────────         ─────               ─────────────         │
│  Agent Designer     MCP Builder           Custom UI           A2A Designer          │
│                     LangGraph Builder     Joule Connector     Scheduler             │
│                     MAF Builder           Open WebUI          Dashboard             │
│                                                               Logs & Monitor        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Applications

### Create & Build

| App | Description | Tech Stack |
|-----|-------------|------------|
| **Agent Designer** | Visual agent configuration (framework-agnostic) | UI5 |
| **MCP Builder** | Build agents with MCP framework | UI5 + Node.js |
| **LangGraph Builder** | Build agents with LangGraph | UI5 + Python |
| **MAF Builder** | Build agents with Microsoft Agent Framework | UI5 + Python/.NET |

### Run & Interact

| App | Description | Tech Stack |
|-----|-------------|------------|
| **Custom UI** | Full-featured chat interface | UI5 |
| **Joule Connector** | SAP Joule integration | Joule SDK |
| **Open WebUI Connector** | Open WebUI integration | Docker + Python |

### Manage & Monitor

| App | Description | Tech Stack |
|-----|-------------|------------|
| **A2A Designer** | Agent-to-Agent flow designer | UI5 |
| **Scheduler** | Schedule agent executions | UI5 + Node.js |
| **Dashboard** | Analytics and metrics | UI5 |
| **Logs & Monitor** | Centralized logging | UI5 + ELK |

---

## Project Structure

```
AI_Factory/
├── README.md                    # This file
├── ARCHITECTURE.md              # Detailed architecture documentation
├── shared/                      # Shared schemas and utilities
├── apps/                        # All 11 applications
│   ├── 01-agent-designer/
│   ├── 02-mcp-builder/
│   ├── 03-langgraph-builder/
│   ├── 04-maf-builder/
│   ├── 05-custom-ui/
│   ├── 06-joule-connector/
│   ├── 07-openwebui-connector/
│   ├── 08-a2a-designer/
│   ├── 09-scheduler/
│   ├── 10-dashboard/
│   └── 11-logs-monitor/
├── services/                    # Backend services
├── launchpad/                   # Fiori Launchpad
└── infrastructure/              # Deployment configs
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- SAP BTP account (for deployment)
- SAP AI Core access

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd AI_Factory

# Install dependencies
npm install

# Start development server
npm run dev
```

### Deployment

```bash
# Build all applications
npm run build

# Deploy to BTP
mbt build && cf deploy mta_archives/ai-factory_1.0.0.mtar
```

---

## Documentation

- [Architecture](./ARCHITECTURE.md) - Detailed platform architecture
- [Agent Schema](./shared/agent-schema/) - Agent definition schema
- [API Contracts](./shared/api-contracts/) - OpenAPI specifications

---

## Roadmap

### Phase 1: Foundation ✅
- Project structure
- Agent Designer (basic)
- MCP Builder
- Custom UI

### Phase 2: Framework Expansion 🚧
- LangGraph Builder
- MAF Builder
- Execution Engine

### Phase 3: UI Integrations 📋
- Joule Connector
- Open WebUI Connector

### Phase 4: Operations 📋
- A2A Designer
- Scheduler
- Dashboard
- Logs & Monitor

---

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

---

## License

SAP Internal Use Only

---

*Last Updated: May 2026*
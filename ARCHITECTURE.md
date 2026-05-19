# AI Factory - Architecture Overview

> A comprehensive platform for building, deploying, and managing AI agents using multiple frameworks.

---

## 🎯 Vision

AI Factory is a **unified platform** that enables:
- Building agents with **multiple AI frameworks** (MCP, LangGraph, MAF, CrewAI)
- Running agents through **multiple UIs** (Custom UI5, Open WebUI, Joule, Chainlit, LobeChat)
- Orchestrating **multi-agent workflows** (A2A Protocol)
- Managing **tools centrally** (MCP, RAG, API, Database, etc.)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Applications](./docs/applications.md) | All 14 applications (Agent Designer, Builders, UIs, etc.) |
| [Services](./docs/services.md) | Backend services (Registry, Execution Engine, A2A Orchestrator) |
| [Deployment](./docs/deployment.md) | Deployment model, phases, technology stack, Fiori Launchpad |
| [UI Integration](./docs/ui-integration.md) | 5 UI options (Custom UI5, Open WebUI, Chainlit, Joule, LobeChat) |
| [A2A Orchestration](./docs/a2a-orchestration.md) | Agent-to-Agent workflows (LangGraph, CrewAI, MAF) |
| [Design Principles](./docs/design-principles.md) | Schema-first design, structured prompts, hooks |
| [Tool Management](./docs/tool-management.md) | 13 tool types, RAG configuration, Tool Manager |
| [Scalability](./docs/scalability.md) | Plugin architecture, registries, extensibility |
| [Interfaces](./docs/interfaces.md) | All interface definitions (FrameworkRuntime, UIAdapter, etc.) |
| [Implementation Plan](./docs/implementation-plan.md) | Detailed 20-week implementation plan with tasks |

### Additional Sections (in this document)

| Section | Description |
|---------|-------------|
| [Security & Authorization](#-security--authorization) | XSUAA, OAuth2, roles, permissions, API security |
| [API Documentation](#-api-documentation) | OpenAPI specs, endpoints, examples |
| [Error Handling](#️-error-handling) | Error codes, retry logic, fallback strategies |
| [Logging Strategy](#-logging-strategy) | Log levels, formats, retention policies |
| [Deployment Guide](#-deployment-guide) | BTP, Docker, Kubernetes deployment |
| [Configuration Management](#️-configuration-management) | Environment variables, secrets, feature flags |
| [Versioning Strategy](#-versioning-strategy) | API versioning, agent versioning, compatibility |
| [Documentation Plan](#-documentation-plan) | User docs, developer docs, API docs, ADRs |

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              AI FACTORY PLATFORM                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  UI LAYER (5 Options)                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │Custom UI5│  │Open WebUI│  │ Chainlit │  │  Joule   │  │ LobeChat │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │             │             │             │             │                     │
│       └─────────────┴─────────────┴─────────────┴─────────────┘                     │
│                                   │                                                  │
│                                   ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         API GATEWAY                                          │   │
│  │   /execute  │  /v1/chat/completions  │  /a2a/tasks  │  /agents              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                   │                                                  │
│                                   ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                      EXECUTION ENGINE                                        │   │
│  │   ┌─────────┐   ┌───────────┐   ┌─────────┐   ┌─────────┐                  │   │
│  │   │   MCP   │   │ LangGraph │   │   MAF   │   │ CrewAI  │                  │   │
│  │   │ Runtime │   │  Runtime  │   │ Runtime │   │ Runtime │                  │   │
│  │   └─────────┘   └───────────┘   └─────────┘   └─────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                   │                                                  │
│       ┌───────────────────────────┼───────────────────────────┐                    │
│       ▼                           ▼                           ▼                    │
│  ┌──────────┐              ┌──────────┐              ┌──────────┐                  │
│  │ SAP AI   │              │   Tool   │              │  Agent   │                  │
│  │  Proxy   │              │ Registry │              │ Registry │                  │
│  │  (LLMs)  │              │  (MCP+)  │              │ (Config) │                  │
│  └──────────┘              └──────────┘              └──────────┘                  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Applications (14 Apps)

| Category | Apps |
|----------|------|
| **Create & Build** | Agent Designer, MCP Builder, LangGraph Builder, MAF Builder, Tool Manager |
| **Run & Interact** | Custom UI, Joule Connector, Open WebUI Connector |
| **Orchestrate** | A2A Designer (LangGraph), A2A Designer (CrewAI), A2A Designer (MAF) |
| **Manage & Monitor** | Scheduler, Dashboard, Logs & Monitor |

→ See [Applications](./docs/applications.md) for details.

---

## 🔧 Tool Types (13 Types)

| Type | Description |
|------|-------------|
| MCP | Tools from MCP servers |
| RAG | Document search with configurable chunking, embedding, retrieval |
| GraphRAG | Knowledge graph queries |
| Memory | Long-term memory (Mem0, Zep) |
| API | REST/GraphQL API calls |
| Database | Direct DB queries (HANA, PostgreSQL) |
| Code | Code execution (Python, JavaScript) |
| File | File operations |
| Web | Web scraping |
| Browser | Browser automation (Playwright) |
| Agent | Call other agents (A2A) |
| Guardrails | Content validation |
| Custom | User-defined tools |

→ See [Tool Management](./docs/tool-management.md) for details.

---

## 🔌 Key Interfaces

| Interface | Purpose |
|-----------|---------|
| `FrameworkRuntime` | Add new AI frameworks |
| `UIAdapter` | Add new UI frameworks |
| `ToolProvider` | Add new tool protocols |
| `LLMProvider` | Add new LLM providers |
| `MemoryProvider` | Add memory backends |
| `GuardrailsProvider` | Add safety providers |

→ See [Interfaces](./docs/interfaces.md) for details.

---

## 🚀 Key Principles

1. **Single Deployment, Multiple Agents** - Deploy Execution Engine once, configure agents at runtime
2. **Framework Agnostic** - Same agent definition works across MCP, LangGraph, MAF
3. **UI Agnostic** - Same backend serves Custom UI, Open WebUI, Joule
4. **Plugin Architecture** - Easy to add new frameworks, UIs, tools
5. **Schema-First Design** - Predictable I/O with JSON Schema validation

→ See [Design Principles](./docs/design-principles.md) for details.

---

## 🔐 Security & Authorization

### Authentication
- **XSUAA** - SAP Authorization and Trust Management Service
- **OAuth2** - Token-based authentication for all APIs
- **JWT Tokens** - Stateless authentication with configurable expiry

### Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| `Admin` | Full platform access | Create/Edit/Delete agents, tools, users |
| `Developer` | Build and test agents | Create/Edit agents, tools; Execute agents |
| `User` | Run agents | Execute agents, view results |
| `Viewer` | Read-only access | View agents, dashboards, logs |

### Permission Matrix

| Resource | Admin | Developer | User | Viewer |
|----------|-------|-----------|------|--------|
| Agents | CRUD | CRUD | R/Execute | R |
| Tools | CRUD | CRUD | R | R |
| A2A Flows | CRUD | CRUD | Execute | R |
| Logs | CRUD | R | R (own) | R |
| Metrics | CRUD | R | R (own) | R |
| Users | CRUD | - | - | - |

### API Security
- All endpoints require valid JWT token
- Rate limiting: 100 requests/minute per user
- API keys for service-to-service communication
- Secrets stored in BTP Credential Store

---

## 📖 API Documentation

### OpenAPI Specifications

| Service | Spec Location | Description |
|---------|---------------|-------------|
| Agent Registry | `shared/api-contracts/agent-registry.yaml` | Agent CRUD operations |
| Execution Engine | `shared/api-contracts/execution-engine.yaml` | Agent execution |
| A2A Orchestrator | `shared/api-contracts/a2a-protocol.yaml` | Multi-agent workflows |
| Metrics Collector | `shared/api-contracts/metrics.yaml` | Metrics & logging |

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/agents` | GET/POST | List/Create agents |
| `/agents/{id}` | GET/PUT/DELETE | Agent operations |
| `/execute` | POST | Execute agent |
| `/execute/stream` | POST | Execute with streaming |
| `/v1/chat/completions` | POST | OpenAI-compatible endpoint |
| `/a2a/tasks` | POST | A2A task invocation |

### Example Request
```bash
curl -X POST https://ai-factory.cfapps.../execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "production-agent",
    "message": "Show production orders with issues",
    "stream": true
  }'
```

→ See [Services](./docs/services.md) for detailed API documentation.

---

## ⚠️ Error Handling

### Error Code Categories

| Code Range | Category | Description |
|------------|----------|-------------|
| `400-499` | Client Errors | Invalid request, authentication, authorization |
| `500-599` | Server Errors | Internal errors, service unavailable |
| `1000-1999` | Agent Errors | Agent execution failures |
| `2000-2999` | Tool Errors | Tool call failures |
| `3000-3999` | LLM Errors | Model API failures |

### Standard Error Response
```json
{
  "error": {
    "code": "AGENT_EXECUTION_FAILED",
    "message": "Agent execution failed after 3 retries",
    "details": {
      "agentId": "production-agent",
      "step": 5,
      "toolName": "get_production_orders",
      "originalError": "Connection timeout"
    },
    "traceId": "abc-123-def-456"
  }
}
```

### Retry Logic
- **Exponential Backoff**: 1s → 2s → 4s → 8s (max 3 retries)
- **Circuit Breaker**: Opens after 5 consecutive failures, half-open after 30s
- **Timeout**: 30s default, configurable per agent

### Fallback Strategies
1. **Graceful Degradation** - Return partial results if some tools fail
2. **Default Response** - Configurable fallback message
3. **Alternative Agent** - Route to backup agent if primary fails

---

## 📝 Logging Strategy

### Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `DEBUG` | Detailed debugging | Tool input/output, LLM prompts |
| `INFO` | Normal operations | Agent started, execution completed |
| `WARN` | Potential issues | Retry attempted, slow response |
| `ERROR` | Failures | Tool failed, agent timeout |
| `FATAL` | Critical failures | Service crash, database unavailable |

### Log Format (Structured JSON)
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "service": "execution-engine",
  "traceId": "abc-123-def-456",
  "spanId": "span-789",
  "agentId": "production-agent",
  "userId": "user@example.com",
  "message": "Agent execution completed",
  "duration": 2500,
  "tokenUsage": {
    "input": 1500,
    "output": 500
  }
}
```

### Retention Policy

| Log Type | Retention | Storage |
|----------|-----------|---------|
| Debug | 7 days | Elasticsearch |
| Info/Warn | 30 days | Elasticsearch |
| Error/Fatal | 90 days | Elasticsearch + Archive |
| Audit | 1 year | Compliance Archive |
| Metrics | 1 year | Time-series DB |

### Correlation
- **Trace ID** - Unique ID for entire request flow
- **Span ID** - Unique ID for each service hop
- **Correlation ID** - Links related operations (e.g., A2A flows)

---

## 🚢 Deployment Guide

### SAP BTP Cloud Foundry

```bash
# Login to BTP
cf login -a https://api.cf.eu10.hana.ondemand.com

# Deploy all services
cf push -f manifest.yml

# Or deploy individually
cf push ai-factory-execution-engine
cf push ai-factory-agent-registry
cf push ai-factory-a2a-orchestrator
```

### Docker

```bash
# Build images
docker build -t ai-factory/execution-engine ./services/execution-engine
docker build -t ai-factory/agent-registry ./services/agent-registry

# Run with docker-compose
docker-compose up -d
```

### Kubernetes/Kyma

```bash
# Apply configurations
kubectl apply -f infrastructure/kubernetes/namespace.yaml
kubectl apply -f infrastructure/kubernetes/configmaps.yaml
kubectl apply -f infrastructure/kubernetes/secrets.yaml
kubectl apply -f infrastructure/kubernetes/deployments.yaml
kubectl apply -f infrastructure/kubernetes/services.yaml

# Or use Helm
helm install ai-factory ./infrastructure/helm/ai-factory
```

### Environment-Specific Configs

| Environment | Config File | Description |
|-------------|-------------|-------------|
| Development | `.env.development` | Local development |
| Staging | `.env.staging` | Pre-production testing |
| Production | `.env.production` | Production deployment |

→ See [Deployment](./docs/deployment.md) for detailed deployment documentation.

---

## ⚙️ Configuration Management

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_PROXY_URL` | SAP AI Proxy endpoint | Required |
| `AGENT_REGISTRY_URL` | Agent Registry service URL | Required |
| `LOG_LEVEL` | Logging level | `INFO` |
| `MAX_EXECUTION_TIME` | Max agent execution time (ms) | `30000` |
| `RATE_LIMIT_RPM` | Rate limit (requests/minute) | `100` |
| `ENABLE_STREAMING` | Enable SSE streaming | `true` |

### Secrets Management

| Secret | Storage | Description |
|--------|---------|-------------|
| `XSUAA_CREDENTIALS` | BTP Credential Store | OAuth2 client credentials |
| `AI_CORE_API_KEY` | BTP Credential Store | SAP AI Core API key |
| `DATABASE_URL` | BTP Credential Store | Database connection string |
| `ENCRYPTION_KEY` | BTP Credential Store | Data encryption key |

### Feature Flags

| Flag | Description | Default |
|------|-------------|---------|
| `ENABLE_A2A` | Enable A2A orchestration | `true` |
| `ENABLE_STREAMING` | Enable response streaming | `true` |
| `ENABLE_HUMAN_IN_LOOP` | Enable human approval steps | `false` |
| `ENABLE_COST_TRACKING` | Track token costs | `true` |
| `ENABLE_DEBUG_MODE` | Verbose logging | `false` |

### Runtime Configuration
- Agent configurations stored in Agent Registry (database)
- Tool configurations stored in Tool Registry
- Changes take effect immediately (no restart required)

---

## 🔢 Versioning Strategy

### API Versioning

| Approach | Format | Example |
|----------|--------|---------|
| URL Path | `/v{major}/resource` | `/v1/agents`, `/v2/agents` |
| Header | `API-Version: {version}` | `API-Version: 2024-01-15` |

**Current Version**: `v1`

### Agent Definition Versioning

```json
{
  "id": "production-agent",
  "version": "2.1.0",
  "versionHistory": [
    { "version": "2.1.0", "date": "2024-01-15", "changes": "Added new tool" },
    { "version": "2.0.0", "date": "2024-01-01", "changes": "Breaking: New prompt format" },
    { "version": "1.0.0", "date": "2023-12-01", "changes": "Initial release" }
  ]
}
```

### Semantic Versioning Rules

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Breaking changes | Major (X.0.0) | Remove tool, change schema |
| New features | Minor (0.X.0) | Add tool, new capability |
| Bug fixes | Patch (0.0.X) | Fix prompt, update config |

### Backward Compatibility
- **API**: Support N-1 versions (current + previous)
- **Agents**: All versions stored, rollback supported
- **Deprecation**: 6-month notice before removal

---

## 📚 Documentation Plan

### Documentation Types

| Type | Audience | Location |
|------|----------|----------|
| **User Docs** | End users | `docs/user-guide/` |
| **Developer Docs** | Developers | `docs/developer-guide/` |
| **API Docs** | API consumers | `docs/api-reference/` |
| **Operations Docs** | DevOps/SRE | `docs/operations/` |
| **Architecture Docs** | Architects | `docs/architecture/` |

### User Documentation
- Getting Started Guide
- Agent Usage Guide
- UI User Manual
- FAQ & Troubleshooting

### Developer Documentation
- SDK Reference
- Plugin Development Guide
- Custom Tool Development
- Framework Integration Guide

### API Documentation
- OpenAPI Specifications
- Authentication Guide
- Rate Limiting & Quotas
- Webhook Integration

### Operations Documentation
- Deployment Guide
- Monitoring & Alerting
- Backup & Recovery
- Security Hardening

### Architecture Decision Records (ADRs)
- `ADR-001`: Framework Selection (MCP, LangGraph, MAF)
- `ADR-002`: Single Deployment Model
- `ADR-003`: A2A Protocol Adoption
- `ADR-004`: UI Agnostic Design

---

## 📁 Project Structure

```
AI_Factory/
├── ARCHITECTURE.md              # This file (overview)
├── README.md                    # Getting started
├── IMPROVEMENTS.md              # Future improvements
│
├── docs/                        # Detailed documentation
│   ├── applications.md          # All 14 applications
│   ├── services.md              # Backend services
│   ├── deployment.md            # Deployment & tech stack
│   ├── ui-integration.md        # 5 UI options
│   ├── a2a-orchestration.md     # A2A workflows
│   ├── design-principles.md     # Design patterns
│   ├── tool-management.md       # Tool types & RAG
│   ├── scalability.md           # Plugin architecture
│   └── interfaces.md            # Interface definitions
│
├── shared/                      # Shared libraries
│   ├── interfaces/              # Standard interfaces
│   ├── registries/              # Dynamic registries
│   └── agent-schema/            # Agent definition schema
│
├── apps/                        # All 14 applications
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
│
├── services/                    # Backend services
│   ├── agent-registry/
│   ├── execution-engine/
│   ├── a2a-orchestrator/
│   └── metrics-collector/
│
└── launchpad/                   # Fiori Launchpad config
```

---

## 🎯 Next Steps

1. Review the [Applications](./docs/applications.md) documentation
2. Understand the [Deployment Model](./docs/deployment.md)
3. Explore [Tool Management](./docs/tool-management.md) for RAG configuration
4. Check [Interfaces](./docs/interfaces.md) for extensibility options
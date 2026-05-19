# AI Factory

A comprehensive platform for creating, managing, and deploying AI agents across multiple frameworks.

[![GitHub](https://img.shields.io/badge/GitHub-ai--factory-blue)](https://github.com/anshuljec08/ai-factory)

## 🚀 Overview

AI Factory provides a unified platform for:
- **Agent Design** - Visual UI for creating and configuring AI agents
- **Multi-Framework Support** - MCP, LangGraph, MAF, CrewAI
- **Tool Management** - Configure and manage agent tools
- **Deployment** - Deploy to SAP BTP, Docker, or Kubernetes

## 📁 Project Structure

```
AI_Factory/
├── apps/                          # UI Applications
│   └── 01-agent-designer/         # Agent Designer (UI5)
├── services/                      # Backend Services
│   └── agent-registry/            # Agent Registry API (Node.js)
├── shared/                        # Shared Libraries
│   └── agent-schema/              # JSON Schema definitions
├── approuter/                     # SAP BTP App Router
├── scripts/                       # Deployment scripts
├── docs/                          # Documentation
├── mta.yaml                       # MTA deployment descriptor
└── package.json                   # Root package.json
```

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+
- Cloud Foundry CLI (for BTP deployment)

### Local Development

```bash
# Clone the repository
git clone https://github.com/anshuljec08/ai-factory.git
cd ai-factory

# Install dependencies
npm install

# Start the Agent Registry API
cd services/agent-registry
npm install
npm start
# API runs on http://localhost:3001

# In another terminal, start the Agent Designer UI
cd apps/01-agent-designer
npm install
npm start
# UI runs on http://localhost:8080
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1` | API info |
| GET | `/api/v1/agents` | List all agents |
| GET | `/api/v1/agents/:id` | Get agent by ID |
| POST | `/api/v1/agents` | Create agent |
| PUT | `/api/v1/agents/:id` | Update agent |
| DELETE | `/api/v1/agents/:id` | Delete agent |
| GET | `/api/v1/tools` | List all tools |

## 🚢 Deployment

### Option 1: SAP BTP (Cloud Foundry)

```bash
# Login to Cloud Foundry
cf login -a https://api.cf.eu10.hana.ondemand.com

# Deploy API only
./scripts/deploy.sh api

# Deploy using MTA (full stack)
npm install -g mbt
mbt build
cf deploy mta_archives/ai-factory_1.0.0.mtar
```

### Option 2: Docker

```bash
# Build the Agent Registry image
cd services/agent-registry
docker build -t ai-factory-agent-registry .

# Run the container
docker run -p 8080:8080 ai-factory-agent-registry
```

### Option 3: Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📊 Agent Schema

Agents are defined using a JSON schema:

```json
{
  "id": "my-agent",
  "name": "My Agent",
  "description": "A helpful AI assistant",
  "framework": "mcp",
  "model": "claude-4-sonnet",
  "systemPrompt": "You are a helpful assistant...",
  "tools": [
    {
      "name": "search",
      "type": "mcp",
      "enabled": true
    }
  ],
  "capabilities": {
    "streaming": true,
    "memory": false
  }
}
```

See [shared/agent-schema/README.md](shared/agent-schema/README.md) for full schema documentation.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Factory Platform                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Agent     │  │    Chat     │  │   Admin     │  Apps   │
│  │  Designer   │  │  Interface  │  │   Console   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│  ───────┴────────────────┴────────────────┴───────────────  │
│                         App Router                          │
│  ─────────────────────────────────────────────────────────  │
│         │                │                │                 │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐         │
│  │   Agent     │  │   Agent     │  │    Tool     │ Services│
│  │  Registry   │  │   Runtime   │  │   Registry  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 📚 Documentation

- [Architecture](docs/design-principles.md)
- [Implementation Plan](docs/implementation-plan.md)
- [API Documentation](docs/interfaces.md)
- [Deployment Guide](docs/deployment.md)
- [Tool Management](docs/tool-management.md)

## 🔧 Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Code Style

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Contact

For questions or support, please open an issue on GitHub.
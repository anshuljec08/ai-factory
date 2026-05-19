# AI Factory - Tool Management

> Documentation for centralized tool management, tool types, and RAG configuration.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tool Types](#tool-types)
3. [Tool Definitions](#tool-definitions)
4. [RAG Tool Configuration](#rag-tool-configuration)
5. [RAG Plugin Architecture](#rag-plugin-architecture)
6. [Tool Manager App](#tool-manager-app)

---

## Architecture Overview

AI Factory uses a **centralized Tool Management** approach where all tools are created and configured in a dedicated Tool Manager app, and agents simply reference tools by ID.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    TOOL MANAGEMENT ARCHITECTURE                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    TOOL MANAGEMENT APP                                       │   │
│  │                    (Central Tool Registry)                                   │   │
│  │                                                                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │   │
│  │  │ MCP Tools   │  │ RAG Tools   │  │ API Tools   │  │ Code Tools  │        │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │   │
│  │                                                                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │   │
│  │  │ DB Tools    │  │ File Tools  │  │ Web Tools   │  │ Custom Tools│        │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │   │
│  │                                                                               │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    AGENT DESIGNER                                            │   │
│  │                    (Simple: just select tools)                               │   │
│  │                                                                               │   │
│  │  Agent: Production Assistant                                                 │   │
│  │                                                                               │   │
│  │  TOOLS (Select from Tool Registry)                                          │   │
│  │  ☑ search_production_docs (RAG)                                             │   │
│  │  ☑ get_production_orders (MCP)                                              │   │
│  │  ☑ query_hana (Database)                                                    │   │
│  │  ☐ send_email (API)                                                         │   │
│  │                                                                               │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tool Types

| Category | Description | Examples |
|----------|-------------|----------|
| **MCP Tools** | Tools from MCP servers | DMC tools, S4 tools, HANA tools |
| **RAG Tools** | Document search tools | search_docs, search_knowledge_base |
| **GraphRAG Tools** | Knowledge graph queries | query_knowledge_graph |
| **Memory Tools** | Long-term memory | remember, recall |
| **API Tools** | REST/GraphQL API calls | send_email, create_ticket, post_slack |
| **Database Tools** | Direct DB queries | query_hana, query_postgres |
| **Code Tools** | Code execution | run_python, run_javascript |
| **File Tools** | File operations | read_file, write_file, list_files |
| **Web Tools** | Web scraping/browsing | fetch_url, search_web |
| **Browser Tools** | Browser automation | browse_web, click, type |
| **Agent Tools** | Call other agents (A2A) | call_agent |
| **Guardrails Tools** | Content validation | validate_content |
| **Custom Tools** | User-defined tools | Any custom implementation |

---

## Tool Definitions

### 1. MCP Tools

```json
{
  "id": "tool-001",
  "name": "get_production_orders",
  "type": "mcp",
  "description": "Get production orders from DMC",
  "config": {
    "serverUrl": "https://dmc-mcp-server.cfapps.../mcp-proxy",
    "toolName": "get_production_orders"
  },
  "inputSchema": { ... },
  "outputSchema": { ... }
}
```

### 2. RAG Tools

```json
{
  "id": "tool-002",
  "name": "search_production_docs",
  "type": "rag",
  "description": "Search production documentation",
  "config": {
    "collection": "production-docs",
    "chunking": {
      "strategy": "semantic",
      "chunkSize": 500,
      "chunkOverlap": 50
    },
    "embedding": {
      "provider": "sap-ai-core",
      "model": "text-embedding-ada-002"
    },
    "vectorStore": {
      "provider": "hana-vector"
    },
    "retrieval": {
      "strategy": "hybrid",
      "topK": 5
    },
    "reranker": {
      "provider": "cohere",
      "model": "rerank-english-v2.0"
    }
  },
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "top_k": { "type": "integer", "default": 5 }
    }
  }
}
```

### 3. API Tools

```json
{
  "id": "tool-003",
  "name": "send_email",
  "type": "api",
  "description": "Send an email",
  "config": {
    "method": "POST",
    "url": "https://api.example.com/email/send",
    "headers": {
      "Authorization": "Bearer {{secrets.EMAIL_API_KEY}}"
    },
    "bodyTemplate": {
      "to": "{{to}}",
      "subject": "{{subject}}",
      "body": "{{body}}"
    }
  },
  "inputSchema": {
    "type": "object",
    "properties": {
      "to": { "type": "string" },
      "subject": { "type": "string" },
      "body": { "type": "string" }
    }
  }
}
```

### 4. Database Tools

```json
{
  "id": "tool-004",
  "name": "query_hana",
  "type": "database",
  "description": "Query HANA database",
  "config": {
    "connectionId": "hana-cloud-prod",
    "readOnly": true,
    "maxRows": 1000,
    "timeout": 30
  },
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "SQL query" }
    }
  }
}
```

### 5. Code Tools

```json
{
  "id": "tool-005",
  "name": "run_python",
  "type": "code",
  "description": "Execute Python code",
  "config": {
    "runtime": "python3.11",
    "timeout": 60,
    "memoryLimit": "256MB",
    "allowedModules": ["pandas", "numpy", "json"]
  },
  "inputSchema": {
    "type": "object",
    "properties": {
      "code": { "type": "string" },
      "inputs": { "type": "object" }
    }
  }
}
```

### 6. GraphRAG Tools

```json
{
  "id": "tool-010",
  "name": "query_knowledge_graph",
  "type": "graphrag",
  "description": "Query knowledge graph for related entities",
  "config": {
    "provider": "neo4j",
    "database": "production-knowledge",
    "maxDepth": 2
  },
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "entity_types": { "type": "array", "items": { "type": "string" } }
    }
  }
}
```

### 7. Memory Tools

```json
{
  "id": "tool-011",
  "name": "remember",
  "type": "memory",
  "description": "Store and retrieve long-term memories",
  "config": {
    "provider": "mem0",
    "scope": "user"
  },
  "inputSchema": {
    "type": "object",
    "properties": {
      "action": { "type": "string", "enum": ["store", "retrieve", "forget"] },
      "content": { "type": "string" },
      "query": { "type": "string" }
    }
  }
}
```

### 8. Browser Tools

```json
{
  "id": "tool-012",
  "name": "browse_web",
  "type": "browser",
  "description": "Browse and interact with web pages",
  "config": {
    "provider": "playwright",
    "headless": true,
    "timeout": 30,
    "allowedDomains": ["*.sap.com"]
  },
  "inputSchema": {
    "type": "object",
    "properties": {
      "action": { "type": "string", "enum": ["navigate", "click", "type", "extract", "screenshot"] },
      "url": { "type": "string" },
      "selector": { "type": "string" },
      "text": { "type": "string" }
    }
  }
}
```

### 9. Guardrails Tools

```json
{
  "id": "tool-013",
  "name": "validate_content",
  "type": "guardrails",
  "description": "Validate content for safety and compliance",
  "config": {
    "provider": "guardrails-ai",
    "checks": ["prompt_injection", "pii", "toxicity"]
  },
  "inputSchema": {
    "type": "object",
    "properties": {
      "content": { "type": "string" },
      "type": { "type": "string", "enum": ["input", "output"] }
    }
  }
}
```

---

## RAG Tool Configuration

### RAG Configuration UI

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    CREATE RAG TOOL                                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  BASIC INFO                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Name: [search_production_docs      ]                                         │   │
│  │ Description: [Search production documentation for relevant information]      │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  DOCUMENTS                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ 📄 production-manual-v2.pdf (156 chunks)                                     │   │
│  │ 📄 safety-procedures.docx (45 chunks)                                        │   │
│  │ 📄 machine-specs.pdf (89 chunks)                                             │   │
│  │ [+ Add Documents]                                                            │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  RAG CONFIGURATION                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ Chunking: [▼ Semantic]    Chunk Size: [500]    Overlap: [50]               │   │
│  │ Embedding: [▼ SAP AI Core]    Model: [▼ text-embedding-ada-002]            │   │
│  │ Vector Store: [▼ HANA Cloud Vector]                                         │   │
│  │ Retrieval: [▼ Hybrid]    Top K: [5]                                         │   │
│  │ Reranker: [▼ Cohere]                                                        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  [Test Tool]  [Save]                                                                │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## RAG Plugin Architecture

RAG components are pluggable via interfaces:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         RAG PLUGIN ARCHITECTURE                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Chunking Strategies:                                                               │
│  ┌──────┐ ┌────────┐ ┌────────┐ ┌─────────┐ ┌────────┐                            │
│  │Fixed │ │Semantic│ │Sentence│ │Recursive│ │ Custom │                            │
│  └──────┘ └────────┘ └────────┘ └─────────┘ └────────┘                            │
│                                                                                      │
│  Embedding Providers:                                                               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                           │
│  │SAP AI  │ │OpenAI  │ │Cohere  │ │ Local  │ │ Custom │                           │
│  │Core    │ │        │ │        │ │(Ollama)│ │        │                           │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘                           │
│                                                                                      │
│  Vector Stores:                                                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                           │
│  │HANA    │ │Pinecone│ │Weaviate│ │Chroma  │ │ Custom │                           │
│  │Vector  │ │        │ │        │ │        │ │        │                           │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘                           │
│                                                                                      │
│  Retrieval Strategies:                                                              │
│  ┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐                                    │
│  │Similarity│ │Hybrid  │ │MMR     │ │ Custom │                                    │
│  │Search    │ │(BM25+) │ │        │ │        │                                    │
│  └──────────┘ └────────┘ └────────┘ └────────┘                                    │
│                                                                                      │
│  Rerankers:                                                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                                      │
│  │Cohere  │ │Cross-  │ │LLM-    │ │ Custom │                                      │
│  │Rerank  │ │Encoder │ │based   │ │        │                                      │
│  └────────┘ └────────┘ └────────┘ └────────┘                                      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### RAG Interfaces

```python
# Chunking Strategy Interface
class ChunkingStrategy(ABC):
    def chunk(self, text: str, config: ChunkingConfig) -> List[Chunk]: pass
    def get_name(self) -> str: pass

# Embedding Provider Interface
class EmbeddingProvider(ABC):
    def embed(self, text: str) -> EmbeddingResult: pass
    def embed_batch(self, texts: List[str]) -> List[EmbeddingResult]: pass
    def get_dimensions(self) -> int: pass

# Vector Store Interface
class VectorStore(ABC):
    def upsert(self, records: List[VectorRecord], namespace: str = None): pass
    def search(self, vector, top_k, filter, namespace) -> List[SearchResult]: pass
    def delete(self, ids: List[str], namespace: str = None): pass

# Retrieval Strategy Interface
class RetrievalStrategy(ABC):
    def retrieve(self, query, vector_store, embedding_provider, config, filter) -> List[SearchResult]: pass

# Reranker Provider Interface
class RerankerProvider(ABC):
    def rerank(self, query: str, documents: List[SearchResult], top_k: int) -> List[RerankResult]: pass
```

---

## Tool Manager App

### UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              TOOL MANAGEMENT                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  [+ Create Tool]  [Import MCP Server]  [Import OpenAPI]                            │
│                                                                                      │
│  TOOL CATEGORIES                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ [All] [MCP] [RAG] [API] [Database] [Code] [File] [Web] [Agent] [Custom]    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  TOOLS                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                               │   │
│  │  MCP TOOLS                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │ 🔧 get_production_orders                                             │    │   │
│  │  │    Type: MCP │ Server: dmc-mcp-server │ Used by: 3 agents           │    │   │
│  │  │    [Edit] [Test] [Delete]                                            │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                               │   │
│  │  RAG TOOLS                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │ 📚 search_production_docs                                            │    │   │
│  │  │    Type: RAG │ Collection: production-docs │ 1,234 docs             │    │   │
│  │  │    Chunking: Semantic │ Embedding: SAP AI Core │ Store: HANA        │    │   │
│  │  │    [Edit] [Test] [Manage Docs] [Delete]                              │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                               │   │
│  │  API TOOLS                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │   │
│  │  │ 🌐 send_email                                                        │    │   │
│  │  │    Type: API │ Method: POST │ Endpoint: /api/email/send             │    │   │
│  │  │    [Edit] [Test] [Delete]                                            │    │   │
│  │  └─────────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                               │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Simplified Agent Definition

With Tool Management, agents simply reference tools by ID:

```json
{
  "id": "production-agent",
  "name": "Production Assistant",
  "framework": "langgraph",
  "model": "claude-4-sonnet",
  
  "systemPrompt": "You are a Production Assistant...",
  
  "tools": [
    "search_production_docs",    // RAG tool
    "get_production_orders",     // MCP tool
    "query_hana",                // Database tool
    "send_email"                 // API tool
  ]
}
```

---

## Tool Management Summary

| Concept | Description |
|---------|-------------|
| **Centralized Tools** | All tools managed in Tool Manager app |
| **13 Tool Types** | MCP, RAG, GraphRAG, Memory, API, Database, Code, File, Web, Browser, Agent, Guardrails, Custom |
| **RAG in Tools** | RAG config (chunking, embedding, etc.) is per-tool |
| **Simple Agents** | Agents just reference tool IDs |
| **Reusability** | Same tool can be used by multiple agents |
| **Pluggable RAG** | All RAG components are pluggable via interfaces |
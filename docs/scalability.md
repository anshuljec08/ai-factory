# AI Factory - Scalability Architecture

> Documentation for the plugin-based architecture enabling easy extension of AI frameworks, UIs, and tool providers.

---

## Table of Contents

1. [Plugin-Based Architecture](#plugin-based-architecture)
2. [Registry Pattern](#registry-pattern)
3. [How to Add New Frameworks/UIs](#how-to-add-new-frameworksuis)
4. [Supported & Future Extensions](#supported--future-extensions)

---

## Plugin-Based Architecture

AI Factory is designed to be **extensible** - easily adding new AI frameworks, UI frameworks, and tool providers without changing core code.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SCALABLE PLUGIN ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    INTERFACE LAYER (Contracts)                               │   │
│  │                                                                               │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │   │
│  │  │FrameworkRuntime │  │   UIAdapter     │  │  ToolProvider   │             │   │
│  │  │   Interface     │  │   Interface     │  │   Interface     │             │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    REGISTRY LAYER (Dynamic Loading)                          │   │
│  │                                                                               │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │   │
│  │  │RuntimeRegistry  │  │ AdapterRegistry │  │  ToolRegistry   │             │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    IMPLEMENTATION LAYER (Plugins)                            │   │
│  │                                                                               │   │
│  │  Framework Runtimes:                                                         │   │
│  │  ┌─────┐ ┌─────────┐ ┌─────┐ ┌──────┐ ┌────────┐ ┌────────┐              │   │
│  │  │ MCP │ │LangGraph│ │ MAF │ │CrewAI│ │ Atomic │ │ Future │              │   │
│  │  └─────┘ └─────────┘ └─────┘ └──────┘ └────────┘ └────────┘              │   │
│  │                                                                               │   │
│  │  UI Adapters:                                                                │   │
│  │  ┌──────┐ ┌────────┐ ┌─────┐ ┌────────┐ ┌──────┐ ┌────────┐              │   │
│  │  │Custom│ │ OpenAI │ │ A2A │ │Chainlit│ │Gradio│ │ Future │              │   │
│  │  └──────┘ └────────┘ └─────┘ └────────┘ └──────┘ └────────┘              │   │
│  │                                                                               │   │
│  │  Tool Providers:                                                             │   │
│  │  ┌─────┐ ┌───────┐ ┌─────────┐ ┌────────┐                                  │   │
│  │  │ MCP │ │OpenAPI│ │LangChain│ │ Future │                                  │   │
│  │  └─────┘ └───────┘ └─────────┘ └────────┘                                  │   │
│  │                                                                               │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Registry Pattern

> **Dual-Engine Note:** The registry pattern is shown in Python below. The Node.js engine (port 3003) implements the same concept via `framework-router.js` which routes to JS runtime classes. The Python engine (port 3004) uses the formal `RuntimeRegistry` pattern. Both engines follow the same `FrameworkRuntime` contract — see `interfaces.md` for both language variants.

### RuntimeRegistry

```python
# shared/registries/runtime_registry.py

from typing import Dict, Optional
from shared.interfaces.framework_runtime import FrameworkRuntime

class RuntimeRegistry:
    """
    Registry for framework runtimes.
    Allows dynamic registration and lookup of runtimes.
    """
    
    _runtimes: Dict[str, FrameworkRuntime] = {}
    
    @classmethod
    def register(cls, name: str, runtime: FrameworkRuntime) -> None:
        """Register a runtime"""
        cls._runtimes[name] = runtime
        print(f"Registered runtime: {name}")
    
    @classmethod
    def get(cls, name: str) -> Optional[FrameworkRuntime]:
        """Get a runtime by name"""
        return cls._runtimes.get(name)
    
    @classmethod
    def list_all(cls) -> Dict[str, FrameworkRuntime]:
        """List all registered runtimes"""
        return cls._runtimes.copy()
    
    @classmethod
    def unregister(cls, name: str) -> None:
        """Unregister a runtime"""
        if name in cls._runtimes:
            del cls._runtimes[name]

# Example usage in Execution Engine startup:
#
# from runtimes.langgraph_runtime import LangGraphRuntime
# from runtimes.maf_runtime import MAFRuntime
# from runtimes.mcp_runtime import MCPRuntime
#
# RuntimeRegistry.register("langgraph", LangGraphRuntime())
# RuntimeRegistry.register("maf", MAFRuntime())
# RuntimeRegistry.register("mcp", MCPRuntime())
```

### AdapterRegistry

```python
# shared/registries/adapter_registry.py

from typing import Dict, Optional
from shared.interfaces.ui_adapter import UIAdapter

class AdapterRegistry:
    """
    Registry for UI adapters.
    Allows dynamic registration and lookup of adapters.
    """
    
    _adapters: Dict[str, UIAdapter] = {}
    
    @classmethod
    def register(cls, name: str, adapter: UIAdapter) -> None:
        """Register an adapter"""
        cls._adapters[name] = adapter
        print(f"Registered adapter: {name}")
    
    @classmethod
    def get(cls, name: str) -> Optional[UIAdapter]:
        """Get an adapter by name"""
        return cls._adapters.get(name)
    
    @classmethod
    def list_all(cls) -> Dict[str, UIAdapter]:
        """List all registered adapters"""
        return cls._adapters.copy()

# Example usage in API Gateway startup:
#
# from adapters.openai_adapter import OpenAIAdapter
# from adapters.a2a_adapter import A2AAdapter
# from adapters.custom_adapter import CustomAdapter
#
# AdapterRegistry.register("openai", OpenAIAdapter())
# AdapterRegistry.register("a2a", A2AAdapter())
# AdapterRegistry.register("custom", CustomAdapter())
```

---

## How to Add New Frameworks/UIs

### Adding a New AI Framework

```python
# Example: Adding Atomic Agents framework

# 1. Create runtime implementation
# runtimes/atomic_runtime.py

from shared.interfaces.framework_runtime import (
    FrameworkRuntime, AgentDefinition, ExecutionInput, 
    ExecutionResult, ExecutionEvent, RuntimeCapabilities
)

class AtomicAgentsRuntime(FrameworkRuntime):
    """Runtime for Atomic Agents framework"""
    
    def initialize(self, config):
        # Initialize Atomic Agents
        pass
    
    def create_agent(self, definition: AgentDefinition):
        # Convert to Atomic Agents format
        from atomic_agents import Agent
        return Agent(
            system_prompt=definition.system_prompt,
            tools=self._convert_tools(definition.tools)
        )
    
    def execute(self, agent, input: ExecutionInput) -> ExecutionResult:
        # Execute using Atomic Agents
        result = agent.run(input.message)
        return ExecutionResult(
            response=result.response,
            tool_calls=result.tool_calls,
            metadata={}
        )
    
    async def stream(self, agent, input):
        # Stream using Atomic Agents
        async for chunk in agent.stream(input.message):
            yield ExecutionEvent(type="text", data=chunk)
    
    def get_capabilities(self) -> RuntimeCapabilities:
        return RuntimeCapabilities(
            streaming=True,
            tool_calling=True,
            human_in_loop=False,
            checkpointing=False,
            multi_agent=False
        )
    
    def validate_definition(self, definition):
        return []  # No errors

# 2. Register in startup
# services/execution-engine/startup.py

from runtimes.atomic_runtime import AtomicAgentsRuntime
RuntimeRegistry.register("atomic", AtomicAgentsRuntime())

# 3. Done! Agents with "framework": "atomic" will now work
```

### Adding a New UI Framework

```python
# Example: Adding Chainlit UI

# 1. Create adapter implementation
# adapters/chainlit_adapter.py

from shared.interfaces.ui_adapter import UIAdapter, UIFeatures

class ChainlitAdapter(UIAdapter):
    """Adapter for Chainlit UI"""
    
    def translate_request(self, request):
        # Chainlit sends messages in its own format
        return ExecutionInput(
            message=request["content"],
            conversation_id=request["thread_id"],
            context={},
            stream=True
        )
    
    def translate_response(self, result):
        # Convert to Chainlit format
        return {
            "content": result.response,
            "elements": self._convert_tool_calls(result.tool_calls)
        }
    
    def translate_stream_event(self, event):
        # Chainlit streaming format
        return {"token": event.data}
    
    def get_supported_features(self):
        return UIFeatures(
            streaming=True,
            tool_visibility=True,
            reasoning_steps=True,
            follow_up_suggestions=False,
            multi_agent_switching=True,
            file_upload=True,
            image_display=True
        )

# 2. Register in startup
AdapterRegistry.register("chainlit", ChainlitAdapter())

# 3. Done! Chainlit can now connect to AI Factory
```

---

## Supported & Future Extensions

### AI Frameworks

| Framework | Status | Engine | Effort to Add |
|-----------|--------|--------|---------------|
| MCP (default) | ✅ Phase 2 | Node.js only | - |
| LangGraph | ✅ Phase 2 | Node.js + Python | - |
| MAF (AutoGen) | ✅ Phase 2 | Node.js + Python | - |
| CrewAI | 🔜 Phase 3 | Python | ~3 days |
| Atomic Agents | 🔜 Planned | Python | ~2 days |
| Haystack | 🔜 Planned | Python | ~3 days |
| Semantic Kernel | 🔜 Planned | Node.js / .NET | ~3 days |
| LlamaIndex | 🔜 Planned | Python | ~2 days |
| Custom | ✅ Easy | Either engine | ~1 day |

### UI Frameworks

| UI | Status | Effort to Add |
|----|--------|---------------|
| Custom UI5 | ✅ Supported | - |
| Open WebUI | ✅ Supported | - |
| Joule (A2A) | ✅ Supported | - |
| Chainlit | 🔜 Planned | ~1 day |
| Gradio | 🔜 Planned | ~1 day |
| Streamlit | 🔜 Planned | ~1 day |
| React Chat | 🔜 Planned | ~2 days |
| Custom | ✅ Easy | ~1 day |

### Tool Protocols

| Protocol | Status | Effort to Add |
|----------|--------|---------------|
| MCP | ✅ Supported | - |
| OpenAPI | ⚠️ Partial | ~2 days |
| LangChain Tools | 🔜 Planned | ~2 days |
| Function Calling | ✅ Supported | - |
| Custom | ✅ Easy | ~1 day |

---

## Scalability Summary

| Extension Point | Interface | Registry | How to Add |
|-----------------|-----------|----------|------------|
| **AI Framework** | `FrameworkRuntime` | `RuntimeRegistry` | Implement interface, register |
| **UI Framework** | `UIAdapter` | `AdapterRegistry` | Implement interface, register |
| **Tool Protocol** | `ToolProvider` | `ToolRegistry` | Implement interface, register |

---

## Updated Project Structure

```
shared/
├── interfaces/                      # Standard interfaces (Python side)
│   ├── __init__.py
│   ├── framework_runtime.py         # FrameworkRuntime interface
│   ├── ui_adapter.py                # UIAdapter interface
│   └── tool_provider.py             # ToolProvider interface
│
├── registries/                      # Dynamic registries (Python side)
│   ├── __init__.py
│   ├── runtime_registry.py          # RuntimeRegistry
│   ├── adapter_registry.py          # AdapterRegistry
│   └── tool_registry.py             # ToolRegistry
│
├── agent-schema/                    # Agent definition schema
│   └── agent.schema.json
│
└── common-utils/                    # Shared utilities
    └── ...

services/
├── execution-engine/
│   ├── node/                        # Node.js engine (port 3003)
│   │   └── src/
│   │       ├── runtimes/            # JS runtime implementations
│   │       │   ├── mcp-runtime.js           # MCP agentic loop
│   │       │   ├── langgraph-runtime.js     # @langchain/langgraph
│   │       │   └── maf-runtime.js           # autogen-agentchat JS
│   │       └── services/
│   │           └── framework-router.js      # Routes by framework + runtime
│   │
│   └── python/                      # Python engine (port 3004)
│       └── app/
│           ├── runtimes/            # Python runtime implementations
│           │   ├── langgraph_runtime.py     # langgraph + langchain-core
│           │   └── maf_runtime.py           # autogen-agentchat + autogen-ext
│           └── services/
│               └── rag_service.py           # Vector search + embeddings
│
└── agent-registry/                  # Agent CRUD + Tool persistence (port 3001)
```

**Note:** The Node.js engine uses the same conceptual interface pattern as Python but expressed in JavaScript (see `interfaces.md` for both language variants).
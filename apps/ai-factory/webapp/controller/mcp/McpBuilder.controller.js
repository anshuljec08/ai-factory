sap.ui.define([
    "ai/factory/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "ai/factory/service/McpClient"
], function (BaseController, JSONModel, MessageToast, MessageBox, McpClient) {
    "use strict";

    var SAVED_SERVERS_KEY = "aifactory_mcp_servers";

    return BaseController.extend("ai.factory.controller.mcp.McpBuilder", {
        
        onInit: function () {
            // Initialize MCP model
            var oMcpModel = new JSONModel({
                serverUrl: "",
                authType: "none",
                authConfig: {
                    username: "",
                    password: "",
                    token: ""
                },
                isConnected: false,
                isLoading: false,
                tools: [],
                toolCount: 0,
                selectedTools: [],
                selectedTool: null,
                testInput: "{}",
                testOutput: "",
                savedServers: this._loadSavedServers()
            });
            this.getView().setModel(oMcpModel, "mcp");
            
            // Store original tools for filtering
            this._aAllTools = [];
        },
        
        /**
         * Load saved servers from localStorage
         */
        _loadSavedServers: function () {
            try {
                var sSaved = localStorage.getItem(SAVED_SERVERS_KEY);
                return sSaved ? JSON.parse(sSaved) : [];
            } catch (e) {
                return [];
            }
        },
        
        /**
         * Save servers to localStorage
         */
        _saveSavedServers: function (aServers) {
            try {
                localStorage.setItem(SAVED_SERVERS_KEY, JSON.stringify(aServers));
            } catch (e) {
                console.error("Failed to save servers:", e);
            }
        },
        
        /**
         * Connect to MCP server
         */
        onConnect: function () {
            var oModel = this.getView().getModel("mcp");
            var sUrl = oModel.getProperty("/serverUrl");
            
            if (!sUrl) {
                MessageToast.show("Please enter an MCP server URL");
                return;
            }
            
            var that = this;
            oModel.setProperty("/isLoading", true);
            
            // Get auth config
            var sAuthType = oModel.getProperty("/authType");
            var oAuthConfig = null;
            
            if (sAuthType !== "none") {
                oAuthConfig = {
                    type: sAuthType,
                    username: oModel.getProperty("/authConfig/username"),
                    password: oModel.getProperty("/authConfig/password"),
                    token: oModel.getProperty("/authConfig/token")
                };
            }
            
            // Try to discover tools
            this._discoverTools(sUrl, sAuthType, oAuthConfig)
                .then(function (aTools) {
                    that._aAllTools = aTools;
                    oModel.setProperty("/tools", aTools);
                    oModel.setProperty("/toolCount", aTools.length);
                    oModel.setProperty("/isConnected", true);
                    oModel.setProperty("/isLoading", false);
                    
                    MessageToast.show("Connected! Discovered " + aTools.length + " tools");
                })
                .catch(function (error) {
                    oModel.setProperty("/isLoading", false);
                    oModel.setProperty("/isConnected", false);
                    
                    MessageBox.error("Failed to connect to MCP server: " + error.message);
                });
        },
        
        /**
         * Discover tools from MCP server
         */
        _discoverTools: function (sUrl, sAuthType, oAuthConfig) {
            var that = this;
            
            return new Promise(function (resolve, reject) {
                // Check if McpClient is available
                if (McpClient && McpClient.discoverTools) {
                    McpClient.discoverTools(sUrl, sAuthType, oAuthConfig)
                        .then(resolve)
                        .catch(reject);
                } else {
                    // Fallback: Try direct fetch to MCP endpoint
                    that._fetchToolsDirectly(sUrl, sAuthType, oAuthConfig)
                        .then(resolve)
                        .catch(reject);
                }
            });
        },
        
        /**
         * Fetch tools directly from MCP server
         */
        _fetchToolsDirectly: function (sUrl, sAuthType, oAuthConfig) {
            var that = this;
            
            return new Promise(function (resolve, reject) {
                var oHeaders = {
                    "Content-Type": "application/json"
                };
                
                // Add auth headers
                if (sAuthType === "basic" && oAuthConfig) {
                    oHeaders["Authorization"] = "Basic " + btoa(oAuthConfig.username + ":" + oAuthConfig.password);
                } else if (sAuthType === "bearer" && oAuthConfig) {
                    oHeaders["Authorization"] = "Bearer " + oAuthConfig.token;
                } else if (sAuthType === "apikey" && oAuthConfig) {
                    oHeaders["X-API-Key"] = oAuthConfig.token;
                }
                
                // Try MCP tools/list endpoint
                var sToolsUrl = sUrl.replace(/\/$/, "") + "/tools/list";
                
                fetch(sToolsUrl, {
                    method: "POST",
                    headers: oHeaders,
                    body: JSON.stringify({})
                })
                .then(function (response) {
                    if (!response.ok) {
                        // Try alternative endpoint
                        return that._tryAlternativeEndpoint(sUrl, oHeaders);
                    }
                    return response.json();
                })
                .then(function (data) {
                    var aTools = data.tools || data.result?.tools || data || [];
                    resolve(aTools);
                })
                .catch(function (error) {
                    // If direct fetch fails, use simulated tools for demo
                    console.warn("MCP fetch failed, using simulated tools:", error);
                    resolve(that._getSimulatedTools());
                });
            });
        },
        
        /**
         * Try alternative MCP endpoint
         */
        _tryAlternativeEndpoint: function (sUrl, oHeaders) {
            var sAltUrl = sUrl.replace(/\/$/, "");
            
            return fetch(sAltUrl, {
                method: "POST",
                headers: oHeaders,
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "tools/list",
                    id: 1
                })
            }).then(function (response) {
                return response.json();
            });
        },
        
        /**
         * Get simulated tools for demo
         */
        _getSimulatedTools: function () {
            return [
                {
                    name: "get-production-orders",
                    description: "Retrieve production orders from SAP Digital Manufacturing with optional filters for status, date range, and plant.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            plant: { type: "string", description: "Plant code" },
                            status: { type: "string", enum: ["CREATED", "RELEASED", "COMPLETED"], description: "Order status" },
                            fromDate: { type: "string", format: "date", description: "Start date (ISO 8601)" },
                            toDate: { type: "string", format: "date", description: "End date (ISO 8601)" },
                            limit: { type: "integer", default: 100, description: "Maximum results" }
                        }
                    }
                },
                {
                    name: "get-alerts",
                    description: "Get production alerts and notifications from the shop floor.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], description: "Alert severity" },
                            acknowledged: { type: "boolean", description: "Filter by acknowledgment status" },
                            limit: { type: "integer", default: 50, description: "Maximum results" }
                        }
                    }
                },
                {
                    name: "get-work-centers",
                    description: "Retrieve work center information including capacity and availability.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            plant: { type: "string", description: "Plant code" },
                            workCenterId: { type: "string", description: "Specific work center ID" }
                        }
                    }
                },
                {
                    name: "get-materials",
                    description: "Query material master data with optional filters.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            materialNumber: { type: "string", description: "Material number" },
                            materialType: { type: "string", description: "Material type" },
                            plant: { type: "string", description: "Plant code" }
                        }
                    }
                },
                {
                    name: "create-production-order",
                    description: "Create a new production order in SAP Digital Manufacturing.",
                    inputSchema: {
                        type: "object",
                        required: ["material", "quantity", "plant"],
                        properties: {
                            material: { type: "string", description: "Material number" },
                            quantity: { type: "number", description: "Order quantity" },
                            plant: { type: "string", description: "Plant code" },
                            scheduledStart: { type: "string", format: "date-time", description: "Scheduled start date" }
                        }
                    }
                },
                {
                    name: "update-order-status",
                    description: "Update the status of a production order.",
                    inputSchema: {
                        type: "object",
                        required: ["orderId", "status"],
                        properties: {
                            orderId: { type: "string", description: "Production order ID" },
                            status: { type: "string", enum: ["RELEASED", "STARTED", "COMPLETED", "CANCELLED"], description: "New status" },
                            comment: { type: "string", description: "Status change comment" }
                        }
                    }
                }
            ];
        },
        
        /**
         * Disconnect from MCP server
         */
        onDisconnect: function () {
            var oModel = this.getView().getModel("mcp");
            oModel.setProperty("/isConnected", false);
            oModel.setProperty("/tools", []);
            oModel.setProperty("/toolCount", 0);
            oModel.setProperty("/selectedTool", null);
            this._aAllTools = [];
            
            MessageToast.show("Disconnected from MCP server");
        },
        
        /**
         * Refresh tools
         */
        onRefresh: function () {
            var oModel = this.getView().getModel("mcp");
            if (oModel.getProperty("/isConnected")) {
                this.onConnect();
            }
        },
        
        /**
         * Search tools
         */
        onSearchTools: function (oEvent) {
            var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue") || "";
            var oModel = this.getView().getModel("mcp");
            
            if (!sQuery) {
                oModel.setProperty("/tools", this._aAllTools);
                return;
            }
            
            var sLower = sQuery.toLowerCase();
            var aFiltered = this._aAllTools.filter(function (oTool) {
                return oTool.name.toLowerCase().includes(sLower) ||
                       (oTool.description && oTool.description.toLowerCase().includes(sLower));
            });
            
            oModel.setProperty("/tools", aFiltered);
        },
        
        /**
         * Handle tool selection change
         */
        onToolSelectionChange: function (oEvent) {
            var oTable = this.byId("toolsTable");
            var aSelectedItems = oTable.getSelectedItems();
            var oModel = this.getView().getModel("mcp");
            
            var aSelectedTools = aSelectedItems.map(function (oItem) {
                return oItem.getBindingContext("mcp").getObject();
            });
            
            oModel.setProperty("/selectedTools", aSelectedTools);
        },
        
        /**
         * View tool details
         */
        onViewToolDetails: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("mcp");
            var oTool = oContext.getObject();
            var oModel = this.getView().getModel("mcp");
            
            oModel.setProperty("/selectedTool", oTool);
            oModel.setProperty("/testInput", JSON.stringify(this._generateSampleInput(oTool), null, 2));
            oModel.setProperty("/testOutput", "");
        },
        
        /**
         * Generate sample input for tool
         */
        _generateSampleInput: function (oTool) {
            var oSample = {};
            
            if (oTool.inputSchema && oTool.inputSchema.properties) {
                var oProps = oTool.inputSchema.properties;
                for (var sKey in oProps) {
                    var oProp = oProps[sKey];
                    if (oProp.default !== undefined) {
                        oSample[sKey] = oProp.default;
                    } else if (oProp.enum && oProp.enum.length > 0) {
                        oSample[sKey] = oProp.enum[0];
                    } else if (oProp.type === "string") {
                        oSample[sKey] = "";
                    } else if (oProp.type === "number" || oProp.type === "integer") {
                        oSample[sKey] = 0;
                    } else if (oProp.type === "boolean") {
                        oSample[sKey] = false;
                    }
                }
            }
            
            return oSample;
        },
        
        /**
         * Test tool
         */
        onTestTool: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("mcp");
            var oTool = oContext.getObject();
            
            this.onViewToolDetails(oEvent);
        },
        
        /**
         * Execute tool
         */
        onExecuteTool: function () {
            var oModel = this.getView().getModel("mcp");
            var oTool = oModel.getProperty("/selectedTool");
            var sInput = oModel.getProperty("/testInput");
            
            if (!oTool) {
                MessageToast.show("No tool selected");
                return;
            }
            
            var oInput;
            try {
                oInput = JSON.parse(sInput);
            } catch (e) {
                MessageBox.error("Invalid JSON input: " + e.message);
                return;
            }
            
            var that = this;
            oModel.setProperty("/testOutput", "Executing...");
            
            // Execute tool via MCP
            this._executeTool(oTool.name, oInput)
                .then(function (oResult) {
                    oModel.setProperty("/testOutput", JSON.stringify(oResult, null, 2));
                })
                .catch(function (error) {
                    oModel.setProperty("/testOutput", "Error: " + error.message);
                });
        },
        
        /**
         * Execute tool via MCP
         */
        _executeTool: function (sToolName, oInput) {
            var oModel = this.getView().getModel("mcp");
            var sUrl = oModel.getProperty("/serverUrl");
            
            return new Promise(function (resolve, reject) {
                // Check if McpClient is available
                if (McpClient && McpClient.callTool) {
                    McpClient.callTool(sUrl, sToolName, oInput)
                        .then(resolve)
                        .catch(reject);
                } else {
                    // Simulated response
                    setTimeout(function () {
                        resolve({
                            success: true,
                            tool: sToolName,
                            input: oInput,
                            result: {
                                message: "Tool executed successfully (simulated)",
                                data: [
                                    { id: "001", name: "Sample Result 1" },
                                    { id: "002", name: "Sample Result 2" }
                                ]
                            }
                        });
                    }, 1000);
                }
            });
        },
        
        /**
         * Clear test input
         */
        onClearTestInput: function () {
            var oModel = this.getView().getModel("mcp");
            oModel.setProperty("/testInput", "{}");
            oModel.setProperty("/testOutput", "");
        },
        
        /**
         * Add selected tools to agent
         */
        onAddSelectedTools: function () {
            var oModel = this.getView().getModel("mcp");
            var aSelectedTools = oModel.getProperty("/selectedTools");
            
            if (aSelectedTools.length === 0) {
                MessageToast.show("No tools selected");
                return;
            }
            
            // Store tools for agent creation
            this._showAddToAgentDialog(aSelectedTools);
        },
        
        /**
         * Add all tools to agent
         */
        onAddAllTools: function () {
            var oModel = this.getView().getModel("mcp");
            var aTools = oModel.getProperty("/tools");
            
            if (aTools.length === 0) {
                MessageToast.show("No tools available");
                return;
            }
            
            this._showAddToAgentDialog(aTools);
        },
        
        /**
         * Show add to agent dialog
         */
        _showAddToAgentDialog: function (aTools) {
            var that = this;
            var oModel = this.getView().getModel("mcp");
            var sServerUrl = oModel.getProperty("/serverUrl");
            
            // Format tools for agent schema
            var aFormattedTools = aTools.map(function (oTool) {
                return {
                    name: oTool.name,
                    type: "mcp",
                    description: oTool.description,
                    enabled: true,
                    config: {
                        mcpUrl: sServerUrl,
                        inputSchema: oTool.inputSchema
                    }
                };
            });
            
            MessageBox.confirm(
                "Add " + aTools.length + " tools to an agent?\n\nTools will be configured with MCP URL: " + sServerUrl,
                {
                    title: "Add Tools to Agent",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            // Store tools in session storage for agent creation
                            sessionStorage.setItem("aifactory_pending_tools", JSON.stringify(aFormattedTools));
                            
                            MessageToast.show(aTools.length + " tools ready to add. Navigate to Agent Designer to create/edit an agent.");
                            
                            // Navigate to agent list
                            that.getOwnerComponent().getRouter().navTo("agentList");
                        }
                    }
                }
            );
        },
        
        /**
         * Export tools
         */
        onExportTools: function () {
            var oModel = this.getView().getModel("mcp");
            var aTools = oModel.getProperty("/tools");
            var sServerUrl = oModel.getProperty("/serverUrl");
            
            var oExport = {
                mcpServer: sServerUrl,
                exportedAt: new Date().toISOString(),
                tools: aTools
            };
            
            var sJson = JSON.stringify(oExport, null, 2);
            var oBlob = new Blob([sJson], { type: "application/json" });
            var sUrl = URL.createObjectURL(oBlob);
            
            var oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = "mcp-tools-export.json";
            oLink.click();
            
            URL.revokeObjectURL(sUrl);
            MessageToast.show("Tools exported successfully");
        },
        
        /**
         * Save current server
         */
        onSaveServer: function () {
            var that = this;
            var oModel = this.getView().getModel("mcp");
            var sUrl = oModel.getProperty("/serverUrl");
            
            if (!sUrl) {
                MessageToast.show("No server connected");
                return;
            }
            
            // Prompt for name
            var sName = prompt("Enter a name for this server:", sUrl.split("/").pop() || "MCP Server");
            if (!sName) return;
            
            var aSavedServers = oModel.getProperty("/savedServers");
            
            // Check if already exists
            var bExists = aSavedServers.some(function (s) { return s.url === sUrl; });
            if (bExists) {
                MessageToast.show("Server already saved");
                return;
            }
            
            aSavedServers.push({
                name: sName,
                url: sUrl,
                authType: oModel.getProperty("/authType"),
                savedAt: new Date().toISOString()
            });
            
            oModel.setProperty("/savedServers", aSavedServers);
            this._saveSavedServers(aSavedServers);
            
            MessageToast.show("Server saved");
        },
        
        /**
         * Select saved server
         */
        onSelectSavedServer: function (oEvent) {
            var oItem = oEvent.getSource();
            var sUrl = oItem.data("url");
            var oModel = this.getView().getModel("mcp");
            
            oModel.setProperty("/serverUrl", sUrl);
            MessageToast.show("Server URL loaded. Click Connect to discover tools.");
        },
        
        /**
         * Format JSON for display
         */
        formatJSON: function (oValue) {
            if (!oValue) return "";
            try {
                return JSON.stringify(oValue, null, 2);
            } catch (e) {
                return String(oValue);
            }
        },
        
        /**
         * Navigate back
         */
        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("home");
        }
    });
});
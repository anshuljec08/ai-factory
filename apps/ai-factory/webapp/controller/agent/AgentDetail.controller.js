sap.ui.define([
    "../BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (BaseController, JSONModel, MessageBox, MessageToast) {
    "use strict";

    var API_BASE_URL = "/api/v1";

    return BaseController.extend("ai.factory.controller.agent.AgentDetail", {
        onInit: function () {
            // View model for edit state and agent data
            var oViewModel = new JSONModel({
                editMode: false,
                isNew: false,
                busy: false,
                agent: {
                    id: "",
                    name: "",
                    description: "",
                    framework: "default",
                    model: "claude-4-sonnet",
                    status: "draft",
                    systemPrompt: "",
                    version: "1.0.0",
                    modelConfig: {
                        temperature: 0.7,
                        maxTokens: 4096,
                        topP: 1
                    },
                    capabilities: {
                        streaming: true,
                        humanInLoop: false,
                        memory: false,
                        codeExecution: false,
                        fileAccess: false,
                        webBrowsing: false
                    },
                    guardrails: {
                        inputFilter: true,
                        outputFilter: true,
                        contentPolicy: "moderate"
                    },
                    tools: [],
                    maxSteps: 30,
                    timeout: 30000,
                    metadata: {
                        createdAt: null,
                        updatedAt: null,
                        createdBy: "",
                        category: "",
                        icon: "sap-icon://robot",
                        tags: []
                    }
                }
            });
            this.getView().setModel(oViewModel);

            // Store original agent for cancel
            this._oOriginalAgent = null;

            // Attach route matched handler
            var oRouter = this.getRouter();
            oRouter.getRoute("agentDetail").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sAgentId = oEvent.getParameter("arguments").agentId;
            console.log("AgentDetail: Loading agent with ID:", sAgentId);
            this._loadAgent(sAgentId);
        },

        _loadAgent: function (sAgentId) {
            var that = this;
            var oModel = this.getView().getModel();

            oModel.setProperty("/busy", true);
            oModel.setProperty("/editMode", false);
            oModel.setProperty("/isNew", false);

            fetch(API_BASE_URL + "/agents/" + sAgentId)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("HTTP " + response.status);
                    }
                    return response.json();
                })
                .then(function (data) {
                    console.log("AgentDetail: API response:", data);
                    
                    // Handle different response formats
                    var agent = null;
                    
                    if (data.data && data.data.id) {
                        // Format: { data: {...} } - This is what our API returns
                        agent = data.data;
                    } else if (data.success && data.data) {
                        // Format: { success: true, data: {...} }
                        agent = data.data;
                    } else if (data.id) {
                        // Format: Direct agent object
                        agent = data;
                    } else if (data.error) {
                        throw new Error(data.error.message || data.error.code || "Failed to load agent");
                    }
                    
                    if (agent) {
                        console.log("AgentDetail: Loaded agent:", agent.name);
                        
                        // Ensure nested objects exist with defaults
                        agent.modelConfig = agent.modelConfig || { temperature: 0.7, maxTokens: 4096, topP: 1 };
                        agent.capabilities = agent.capabilities || { streaming: true, humanInLoop: false, memory: false, codeExecution: false, fileAccess: false, webBrowsing: false };
                        agent.guardrails = agent.guardrails || { inputFilter: true, outputFilter: true, contentPolicy: "moderate" };
                        agent.metadata = agent.metadata || { createdAt: null, updatedAt: null, createdBy: "", category: "", icon: "sap-icon://robot", tags: [] };
                        agent.tools = agent.tools || [];
                        agent.maxSteps = agent.maxSteps || 30;
                        agent.timeout = agent.timeout || 30000;
                        agent.version = agent.version || "1.0.0";
                        
                        oModel.setProperty("/agent", agent);
                        that._oOriginalAgent = JSON.parse(JSON.stringify(agent));
                        oModel.setProperty("/busy", false);
                    } else {
                        console.error("AgentDetail: Unexpected response format:", data);
                        throw new Error("Invalid response format - no agent data found");
                    }
                })
                .catch(function (error) {
                    console.error("AgentDetail: Error loading agent:", error);
                    oModel.setProperty("/busy", false);
                    MessageBox.error("Failed to load agent: " + error.message, {
                        title: "Error",
                        onClose: function () {
                            that.getRouter().navTo("agentList");
                        }
                    });
                });
        },

        /**
         * Format date for display
         */
        formatDate: function (sDate) {
            if (!sDate) return "";
            var oDate = new Date(sDate);
            return oDate.toLocaleDateString() + " " + oDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },

        /**
         * Format tags array to string
         */
        formatTags: function (aTags) {
            if (!aTags || !Array.isArray(aTags)) return "";
            return aTags.join(", ");
        },

        /**
         * Navigate back to list
         */
        onNavBack: function () {
            var oModel = this.getView().getModel();
            
            if (oModel.getProperty("/editMode")) {
                MessageBox.confirm("Discard unsaved changes?", {
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            this.getRouter().navTo("agentList");
                        }
                    }.bind(this)
                });
            } else {
                this.getRouter().navTo("agentList");
            }
        },

        /**
         * Enter edit mode
         */
        onEdit: function () {
            var oModel = this.getView().getModel();
            
            // Store original for cancel
            this._oOriginalAgent = JSON.parse(JSON.stringify(oModel.getProperty("/agent")));
            
            oModel.setProperty("/editMode", true);
        },

        /**
         * Cancel edit mode
         */
        onCancel: function () {
            var oModel = this.getView().getModel();
            
            // Restore original data
            if (this._oOriginalAgent) {
                oModel.setProperty("/agent", JSON.parse(JSON.stringify(this._oOriginalAgent)));
            }
            
            oModel.setProperty("/editMode", false);
        },

        /**
         * Save agent
         */
        onSave: function () {
            var that = this;
            var oModel = this.getView().getModel();
            var oAgentData = oModel.getProperty("/agent");

            // Validate required fields
            if (!oAgentData.name || !oAgentData.systemPrompt) {
                MessageBox.error("Please fill in all required fields (Name, System Prompt)");
                return;
            }

            oModel.setProperty("/busy", true);

            // Update metadata
            oAgentData.metadata = oAgentData.metadata || {};
            oAgentData.metadata.updatedAt = new Date().toISOString();

            fetch(API_BASE_URL + "/agents/" + oAgentData.id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oAgentData)
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("HTTP " + response.status);
                    }
                    return response.json();
                })
                .then(function (data) {
                    oModel.setProperty("/busy", false);
                    
                    // Handle different response formats
                    var updatedAgent = null;
                    if (data.data && data.data.id) {
                        updatedAgent = data.data;
                    } else if (data.id) {
                        updatedAgent = data;
                    } else if (!data.error) {
                        updatedAgent = oAgentData; // Use local data if API doesn't return updated agent
                    }
                    
                    if (updatedAgent) {
                        oModel.setProperty("/agent", updatedAgent);
                        that._oOriginalAgent = JSON.parse(JSON.stringify(updatedAgent));
                        oModel.setProperty("/editMode", false);
                        MessageToast.show("Agent saved successfully");
                    } else {
                        throw new Error(data.error?.message || "Failed to save agent");
                    }
                })
                .catch(function (error) {
                    oModel.setProperty("/busy", false);
                    MessageBox.error("Failed to save agent: " + error.message);
                });
        },

        /**
         * Delete agent
         */
        onDelete: function () {
            var that = this;
            var oModel = this.getView().getModel();
            var sAgentName = oModel.getProperty("/agent/name");
            var sAgentId = oModel.getProperty("/agent/id");

            MessageBox.warning("Are you sure you want to delete agent '" + sAgentName + "'? This action cannot be undone.", {
                title: "Confirm Delete",
                actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.CANCEL,
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.DELETE) {
                        that._deleteAgent(sAgentId);
                    }
                }
            });
        },

        _deleteAgent: function (sAgentId) {
            var that = this;
            var oModel = this.getView().getModel();

            oModel.setProperty("/busy", true);

            fetch(API_BASE_URL + "/agents/" + sAgentId, {
                method: "DELETE"
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("HTTP " + response.status);
                    }
                    return response.json();
                })
                .then(function (data) {
                    oModel.setProperty("/busy", false);
                    
                    if (!data.error) {
                        MessageToast.show("Agent deleted successfully");
                        that.getRouter().navTo("agentList");
                    } else {
                        throw new Error(data.error?.message || "Failed to delete agent");
                    }
                })
                .catch(function (error) {
                    oModel.setProperty("/busy", false);
                    MessageBox.error("Failed to delete agent: " + error.message);
                });
        },

        /**
         * Add a new tool
         */
        onAddTool: function () {
            var oModel = this.getView().getModel();
            var aTools = oModel.getProperty("/agent/tools") || [];
            
            // Add a new empty tool
            aTools.push({
                name: "new-tool",
                type: "mcp",
                description: "New tool",
                enabled: true,
                config: {}
            });
            
            oModel.setProperty("/agent/tools", aTools);
        },

        /**
         * Remove a tool
         */
        onRemoveTool: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext();
            var sPath = oContext.getPath();
            var iIndex = parseInt(sPath.split("/").pop(), 10);
            
            var oModel = this.getView().getModel();
            var aTools = oModel.getProperty("/agent/tools");
            
            aTools.splice(iIndex, 1);
            oModel.setProperty("/agent/tools", aTools);
        }
    });
});
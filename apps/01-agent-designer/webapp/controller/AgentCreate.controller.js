sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("ai.factory.agentdesigner.controller.AgentCreate", {
        onInit: function () {
            // Initialize new agent model with defaults
            this._resetAgentModel();

            // Attach route matched handler
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("agentCreate").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            // Reset the form when navigating to create
            this._resetAgentModel();
        },

        _resetAgentModel: function () {
            var oNewAgentModel = new JSONModel({
                id: "",
                name: "",
                description: "",
                framework: "default",
                model: "claude-4-sonnet",
                systemPrompt: "",
                maxSteps: 30,
                timeout: 30000,
                version: "1.0.0",
                status: "draft",
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
                metadata: {
                    category: "",
                    icon: "sap-icon://robot",
                    tags: []
                }
            });
            this.getView().setModel(oNewAgentModel, "newAgent");
        },

        /**
         * Generate ID from name
         */
        _generateId: function (sName) {
            return sName
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .substring(0, 100);
        },

        /**
         * Handle name change to auto-generate ID
         */
        onNameChange: function (oEvent) {
            var sName = oEvent.getParameter("value");
            var oModel = this.getView().getModel("newAgent");
            
            // Only auto-generate if ID is empty or was auto-generated
            var sCurrentId = oModel.getProperty("/id");
            var sExpectedId = this._generateId(oModel.getProperty("/name") || "");
            
            if (!sCurrentId || sCurrentId === sExpectedId || sCurrentId === "") {
                oModel.setProperty("/id", this._generateId(sName));
            }
        },

        /**
         * Navigate back to list
         */
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("agentList");
        },

        /**
         * Cancel creation
         */
        onCancel: function () {
            var oModel = this.getView().getModel("newAgent");
            var sName = oModel.getProperty("/name");
            
            if (sName) {
                MessageBox.confirm("Discard this new agent?", {
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            this.onNavBack();
                        }
                    }.bind(this)
                });
            } else {
                this.onNavBack();
            }
        },

        /**
         * Create the agent
         */
        onCreate: function () {
            var that = this;
            var oModel = this.getView().getModel("newAgent");
            var oAgentData = oModel.getData();

            // Validate required fields
            if (!oAgentData.name) {
                MessageBox.error("Please enter an agent name");
                this.byId("iconTabBar").setSelectedKey("basic");
                return;
            }

            if (!oAgentData.systemPrompt) {
                MessageBox.error("Please enter a system prompt");
                this.byId("iconTabBar").setSelectedKey("prompt");
                return;
            }

            // Generate ID if empty
            if (!oAgentData.id) {
                oAgentData.id = this._generateId(oAgentData.name);
            }

            // Add timestamps
            var now = new Date().toISOString();
            oAgentData.metadata.createdAt = now;
            oAgentData.metadata.updatedAt = now;

            // Show busy indicator
            sap.ui.core.BusyIndicator.show(0);

            this.getOwnerComponent().createAgent(oAgentData)
                .then(function (oCreatedAgent) {
                    sap.ui.core.BusyIndicator.hide();
                    MessageToast.show("Agent '" + oCreatedAgent.name + "' created successfully");
                    
                    // Refresh the list
                    that.getOwnerComponent().loadAgents();
                    
                    // Navigate to the new agent's detail page
                    that.getOwnerComponent().getRouter().navTo("agentDetail", {
                        agentId: oCreatedAgent.id
                    });
                })
                .catch(function (error) {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error("Failed to create agent: " + error.message);
                });
        }
    });
});
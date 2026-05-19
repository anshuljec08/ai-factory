sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("ai.factory.agentdesigner.controller.AgentDetail", {
        onInit: function () {
            // View model for edit state
            var oViewModel = new JSONModel({
                editMode: false,
                isNew: false,
                busy: false
            });
            this.getView().setModel(oViewModel, "viewModel");

            // Agent model
            var oAgentModel = new JSONModel({});
            this.getView().setModel(oAgentModel, "agent");

            // Store original agent for cancel
            this._oOriginalAgent = null;

            // Attach route matched handler
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("agentDetail").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sAgentId = oEvent.getParameter("arguments").agentId;
            this._loadAgent(sAgentId);
        },

        _loadAgent: function (sAgentId) {
            var that = this;
            var oViewModel = this.getView().getModel("viewModel");
            var oAgentModel = this.getView().getModel("agent");

            oViewModel.setProperty("/busy", true);
            oViewModel.setProperty("/editMode", false);
            oViewModel.setProperty("/isNew", false);

            this.getOwnerComponent().getAgent(sAgentId)
                .then(function (oAgent) {
                    oAgentModel.setData(oAgent);
                    that._oOriginalAgent = JSON.parse(JSON.stringify(oAgent));
                    oViewModel.setProperty("/busy", false);
                })
                .catch(function (error) {
                    oViewModel.setProperty("/busy", false);
                    MessageBox.error("Failed to load agent: " + error.message, {
                        onClose: function () {
                            that.onNavBack();
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
            var oViewModel = this.getView().getModel("viewModel");
            
            if (oViewModel.getProperty("/editMode")) {
                MessageBox.confirm("Discard unsaved changes?", {
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            this.getOwnerComponent().getRouter().navTo("agentList");
                        }
                    }.bind(this)
                });
            } else {
                this.getOwnerComponent().getRouter().navTo("agentList");
            }
        },

        /**
         * Enter edit mode
         */
        onEdit: function () {
            var oViewModel = this.getView().getModel("viewModel");
            var oAgentModel = this.getView().getModel("agent");
            
            // Store original for cancel
            this._oOriginalAgent = JSON.parse(JSON.stringify(oAgentModel.getData()));
            
            oViewModel.setProperty("/editMode", true);
        },

        /**
         * Cancel edit mode
         */
        onCancel: function () {
            var oViewModel = this.getView().getModel("viewModel");
            var oAgentModel = this.getView().getModel("agent");
            
            // Restore original data
            if (this._oOriginalAgent) {
                oAgentModel.setData(this._oOriginalAgent);
            }
            
            oViewModel.setProperty("/editMode", false);
        },

        /**
         * Save agent
         */
        onSave: function () {
            var that = this;
            var oViewModel = this.getView().getModel("viewModel");
            var oAgentModel = this.getView().getModel("agent");
            var oAgentData = oAgentModel.getData();

            // Validate required fields
            if (!oAgentData.name || !oAgentData.systemPrompt) {
                MessageBox.error("Please fill in all required fields (Name, System Prompt)");
                return;
            }

            oViewModel.setProperty("/busy", true);

            this.getOwnerComponent().updateAgent(oAgentData.id, oAgentData)
                .then(function (oUpdatedAgent) {
                    oAgentModel.setData(oUpdatedAgent);
                    that._oOriginalAgent = JSON.parse(JSON.stringify(oUpdatedAgent));
                    oViewModel.setProperty("/editMode", false);
                    oViewModel.setProperty("/busy", false);
                    MessageToast.show("Agent saved successfully");
                    
                    // Refresh the list
                    that.getOwnerComponent().loadAgents();
                })
                .catch(function (error) {
                    oViewModel.setProperty("/busy", false);
                    MessageBox.error("Failed to save agent: " + error.message);
                });
        },

        /**
         * Delete agent
         */
        onDelete: function () {
            var that = this;
            var oAgentModel = this.getView().getModel("agent");
            var sAgentName = oAgentModel.getProperty("/name");
            var sAgentId = oAgentModel.getProperty("/id");

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
            var oViewModel = this.getView().getModel("viewModel");

            oViewModel.setProperty("/busy", true);

            this.getOwnerComponent().deleteAgent(sAgentId)
                .then(function () {
                    oViewModel.setProperty("/busy", false);
                    MessageToast.show("Agent deleted successfully");
                    that.getOwnerComponent().loadAgents();
                    that.getOwnerComponent().getRouter().navTo("agentList");
                })
                .catch(function (error) {
                    oViewModel.setProperty("/busy", false);
                    MessageBox.error("Failed to delete agent: " + error.message);
                });
        },

        /**
         * Add a new tool
         */
        onAddTool: function () {
            var oAgentModel = this.getView().getModel("agent");
            var aTools = oAgentModel.getProperty("/tools") || [];
            
            // Add a new empty tool
            aTools.push({
                name: "new-tool",
                type: "mcp",
                description: "New tool",
                enabled: true,
                config: {}
            });
            
            oAgentModel.setProperty("/tools", aTools);
        },

        /**
         * Remove a tool
         */
        onRemoveTool: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext("agent");
            var sPath = oContext.getPath();
            var iIndex = parseInt(sPath.split("/").pop(), 10);
            
            var oAgentModel = this.getView().getModel("agent");
            var aTools = oAgentModel.getProperty("/tools");
            
            aTools.splice(iIndex, 1);
            oAgentModel.setProperty("/tools", aTools);
        }
    });
});
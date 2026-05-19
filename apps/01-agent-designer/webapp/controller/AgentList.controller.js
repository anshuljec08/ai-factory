sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, Filter, FilterOperator, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("ai.factory.agentdesigner.controller.AgentList", {
        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("agentList").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            // Load agents when route is matched
            this.getOwnerComponent().loadAgents();
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
         * Navigate to create agent page
         */
        onCreateAgent: function () {
            this.getOwnerComponent().getRouter().navTo("agentCreate");
        },

        /**
         * Refresh agent list
         */
        onRefresh: function () {
            this.getOwnerComponent().loadAgents()
                .then(function () {
                    MessageToast.show("Agents refreshed");
                })
                .catch(function (error) {
                    MessageBox.error("Failed to refresh agents: " + error.message);
                });
        },

        /**
         * Search agents
         */
        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue") || "";
            var oTable = this.byId("agentTable");
            var oBinding = oTable.getBinding("items");
            
            var aFilters = [];
            if (sQuery) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("name", FilterOperator.Contains, sQuery),
                        new Filter("description", FilterOperator.Contains, sQuery),
                        new Filter("id", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }
            
            oBinding.filter(aFilters);
        },

        /**
         * Filter change handler
         */
        onFilterChange: function () {
            var oTable = this.byId("agentTable");
            var oBinding = oTable.getBinding("items");
            
            var sFramework = this.byId("frameworkFilter").getSelectedKey();
            var sStatus = this.byId("statusFilter").getSelectedKey();
            
            var aFilters = [];
            if (sFramework) {
                aFilters.push(new Filter("framework", FilterOperator.EQ, sFramework));
            }
            if (sStatus) {
                aFilters.push(new Filter("status", FilterOperator.EQ, sStatus));
            }
            
            oBinding.filter(aFilters);
        },

        /**
         * Navigate to agent detail
         */
        onAgentPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext();
            var sAgentId = oContext.getProperty("id");
            
            this.getOwnerComponent().getRouter().navTo("agentDetail", {
                agentId: sAgentId
            });
        },

        /**
         * Agent selection change
         */
        onAgentSelect: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            if (oItem) {
                var oContext = oItem.getBindingContext();
                var sAgentId = oContext.getProperty("id");
                this.getOwnerComponent().getRouter().navTo("agentDetail", {
                    agentId: sAgentId
                });
            }
        },

        /**
         * Edit agent
         */
        onEditAgent: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext();
            var sAgentId = oContext.getProperty("id");
            
            this.getOwnerComponent().getRouter().navTo("agentDetail", {
                agentId: sAgentId
            });
        },

        /**
         * Duplicate agent
         */
        onDuplicateAgent: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext();
            var sAgentId = oContext.getProperty("id");
            var sAgentName = oContext.getProperty("name");
            var that = this;
            
            MessageBox.confirm("Duplicate agent '" + sAgentName + "'?", {
                title: "Confirm Duplicate",
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that._duplicateAgent(sAgentId);
                    }
                }
            });
        },

        _duplicateAgent: function (sAgentId) {
            var that = this;
            var sApiBaseUrl = this.getOwnerComponent().getApiBaseUrl();
            
            fetch(sApiBaseUrl + "/agents/" + sAgentId + "/duplicate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({})
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    if (data.error) {
                        throw new Error(data.error.message);
                    }
                    MessageToast.show("Agent duplicated successfully");
                    that.getOwnerComponent().loadAgents();
                })
                .catch(function (error) {
                    MessageBox.error("Failed to duplicate agent: " + error.message);
                });
        },

        /**
         * Delete agent
         */
        onDeleteAgent: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext();
            var sAgentId = oContext.getProperty("id");
            var sAgentName = oContext.getProperty("name");
            var that = this;
            
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
            
            this.getOwnerComponent().deleteAgent(sAgentId)
                .then(function () {
                    MessageToast.show("Agent deleted successfully");
                    that.getOwnerComponent().loadAgents();
                })
                .catch(function (error) {
                    MessageBox.error("Failed to delete agent: " + error.message);
                });
        },

        /**
         * Export agents
         */
        onExport: function () {
            var oModel = this.getOwnerComponent().getModel();
            var aAgents = oModel.getProperty("/agents");
            
            var sJson = JSON.stringify(aAgents, null, 2);
            var oBlob = new Blob([sJson], { type: "application/json" });
            var sUrl = URL.createObjectURL(oBlob);
            
            var oLink = document.createElement("a");
            oLink.href = sUrl;
            oLink.download = "agents-export.json";
            oLink.click();
            
            URL.revokeObjectURL(sUrl);
            MessageToast.show("Agents exported");
        }
    });
});
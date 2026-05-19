sap.ui.define([
    "../BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (BaseController, JSONModel, Filter, FilterOperator, MessageBox, MessageToast) {
    "use strict";

    var API_BASE_URL = "/api/v1";

    return BaseController.extend("ai.factory.controller.agent.AgentList", {
        onInit: function () {
            // Initialize model with filter options
            var oViewModel = new JSONModel({
                agents: [],
                frameworkFilters: [
                    { key: "", text: "All Frameworks" },
                    { key: "default", text: "Default Agent" },
                    { key: "langgraph", text: "LangGraph" },
                    { key: "maf", text: "MAF" },
                    { key: "crewai", text: "CrewAI" }
                ],
                statusFilters: [
                    { key: "", text: "All Status" },
                    { key: "active", text: "Active" },
                    { key: "inactive", text: "Inactive" },
                    { key: "draft", text: "Draft" }
                ]
            });
            this.getView().setModel(oViewModel);

            // Attach route matched handler
            var oRouter = this.getRouter();
            oRouter.getRoute("agentList").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._loadAgents();
        },

        _loadAgents: function () {
            var that = this;
            var oModel = this.getView().getModel();

            fetch(API_BASE_URL + "/agents")
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("HTTP " + response.status);
                    }
                    return response.json();
                })
                .then(function (data) {
                    // Handle different response formats
                    var agents = [];
                    if (data.data && Array.isArray(data.data)) {
                        // Format: { data: [...], pagination: {...} }
                        agents = data.data;
                    } else if (Array.isArray(data)) {
                        // Format: [...]
                        agents = data;
                    } else if (data.agents && Array.isArray(data.agents)) {
                        // Format: { agents: [...] }
                        agents = data.agents;
                    } else if (data.success === false || data.error) {
                        throw new Error(data.error?.message || "API returned error");
                    }
                    console.log("Loaded agents:", agents.length);
                    oModel.setProperty("/agents", agents);
                })
                .catch(function (error) {
                    console.error("Failed to load agents:", error);
                    MessageBox.error("Failed to load agents: " + error.message);
                });
        },

        formatDate: function (sDate) {
            if (!sDate) return "";
            var oDate = new Date(sDate);
            return oDate.toLocaleDateString() + " " + oDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },

        onCreateAgent: function () {
            this.getRouter().navTo("agentCreate");
        },

        onRefresh: function () {
            this._loadAgents();
            MessageToast.show("Agents refreshed");
        },

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

        onAgentPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext();
            var sAgentId = oContext.getProperty("id");
            
            this.getRouter().navTo("agentDetail", {
                agentId: sAgentId
            });
        },

        onAgentSelect: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            if (oItem) {
                var oContext = oItem.getBindingContext();
                var sAgentId = oContext.getProperty("id");
                this.getRouter().navTo("agentDetail", {
                    agentId: sAgentId
                });
            }
        },

        onEditAgent: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext();
            var sAgentId = oContext.getProperty("id");
            
            this.getRouter().navTo("agentDetail", {
                agentId: sAgentId
            });
        },

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
            
            fetch(API_BASE_URL + "/agents/" + sAgentId + "/duplicate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    if (data.error) {
                        throw new Error(data.error.message);
                    }
                    MessageToast.show("Agent duplicated successfully");
                    that._loadAgents();
                })
                .catch(function (error) {
                    MessageBox.error("Failed to duplicate agent: " + error.message);
                });
        },

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
            
            fetch(API_BASE_URL + "/agents/" + sAgentId, {
                method: "DELETE"
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    if (data.error) {
                        throw new Error(data.error.message);
                    }
                    MessageToast.show("Agent deleted successfully");
                    that._loadAgents();
                })
                .catch(function (error) {
                    MessageBox.error("Failed to delete agent: " + error.message);
                });
        },

        onExport: function () {
            var oModel = this.getView().getModel();
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
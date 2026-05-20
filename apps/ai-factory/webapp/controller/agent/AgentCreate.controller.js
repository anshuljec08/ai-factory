sap.ui.define([
    "../BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem",
    "ai/factory/util/Constants"
], function (BaseController, JSONModel, MessageBox, MessageToast, SelectDialog, StandardListItem, Constants) {
    "use strict";

    return BaseController.extend("ai.factory.controller.agent.AgentCreate", {
        onInit: function () {
            var oViewModel = new JSONModel({
                agent: {
                    id: "",
                    name: "",
                    description: "",
                    framework: "default",
                    model: "claude-4-sonnet",
                    status: "draft",
                    systemPrompt: "",
                    tools: [],
                    toolFilters: {},
                    capabilities: {
                        streaming: true,
                        memory: false
                    }
                },
                assignedToolDetails: []
            });
            this.getView().setModel(oViewModel);

            this._aRegistryTools = [];

            var oRouter = this.getRouter();
            oRouter.getRoute("agentCreate").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var oModel = this.getView().getModel();
            oModel.setProperty("/agent", {
                id: "",
                name: "",
                description: "",
                framework: "default",
                model: "claude-4-sonnet",
                status: "draft",
                systemPrompt: "",
                tools: [],
                toolFilters: {},
                capabilities: {
                    streaming: true,
                    memory: false
                }
            });
            oModel.setProperty("/assignedToolDetails", []);
            this._loadRegistryTools();
        },

        _loadRegistryTools: function () {
            var that = this;
            fetch(Constants.TOOLS_API_URL)
                .then(function (r) { return r.json(); })
                .then(function (oData) {
                    that._aRegistryTools = oData.data || [];
                })
                .catch(function () {
                    that._aRegistryTools = [];
                });
        },

        _buildAssignedToolDetails: function () {
            var oModel = this.getView().getModel();
            var aToolIds = oModel.getProperty("/agent/tools") || [];
            var aRegistry = this._aRegistryTools || [];

            var aDetails = aToolIds.map(function (sId) {
                var oTool = aRegistry.find(function (t) { return t.id === sId; });
                return {
                    id: sId,
                    name: oTool ? oTool.name : sId,
                    type: oTool ? oTool.type : "unknown"
                };
            });
            oModel.setProperty("/assignedToolDetails", aDetails);
        },

        onAddTool: function () {
            var that = this;
            var oModel = this.getView().getModel();
            var aCurrentTools = oModel.getProperty("/agent/tools") || [];

            var aAvailable = this._aRegistryTools.filter(function (t) {
                return aCurrentTools.indexOf(t.id) === -1 && t.enabled !== false;
            });

            var oSelectModel = new JSONModel({ available: aAvailable });

            var oDialog = new SelectDialog({
                title: "Add Tool from Registry",
                noDataText: "No tools available",
                items: {
                    path: "/available",
                    template: new StandardListItem({
                        title: "{name}",
                        description: "{id}",
                        info: "{type}"
                    })
                },
                confirm: function (oEvent) {
                    var oSelectedItem = oEvent.getParameter("selectedItem");
                    if (oSelectedItem) {
                        var sToolId = oSelectedItem.getDescription();
                        aCurrentTools.push(sToolId);
                        oModel.setProperty("/agent/tools", aCurrentTools);
                        that._buildAssignedToolDetails();
                    }
                }
            });

            oDialog.setModel(oSelectModel);
            oDialog.open();
        },

        onRemoveToolFromCreate: function (oEvent) {
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext();
            var sPath = oContext.getPath();
            var iIndex = parseInt(sPath.split("/").pop(), 10);

            var oModel = this.getView().getModel();
            var aTools = oModel.getProperty("/agent/tools") || [];
            aTools.splice(iIndex, 1);
            oModel.setProperty("/agent/tools", aTools);
            this._buildAssignedToolDetails();
        },

        onCreate: function () {
            var that = this;
            var oModel = this.getView().getModel();
            var oAgent = oModel.getProperty("/agent");

            if (!oAgent.id || !oAgent.name) {
                MessageBox.error("Please fill in all required fields (ID and Name)");
                return;
            }

            fetch(Constants.AGENTS_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(oAgent)
            })
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    if (data.success || data.data) {
                        MessageToast.show("Agent created successfully");
                        that.getRouter().navTo("agentList");
                    } else {
                        throw new Error(data.error?.message || "Failed to create agent");
                    }
                })
                .catch(function (error) {
                    MessageBox.error("Failed to create agent: " + error.message);
                });
        },

        onCancel: function () {
            this.getRouter().navTo("agentList");
        }
    });
});

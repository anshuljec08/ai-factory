sap.ui.define([
    "../BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (BaseController, JSONModel, MessageBox, MessageToast) {
    "use strict";

    var API_BASE_URL = "/api/v1";

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
                    capabilities: {
                        streaming: true,
                        memory: false
                    }
                }
            });
            this.getView().setModel(oViewModel);

            var oRouter = this.getRouter();
            oRouter.getRoute("agentCreate").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            // Reset form when navigating to create page
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
                capabilities: {
                    streaming: true,
                    memory: false
                }
            });
        },

        onCreate: function () {
            var that = this;
            var oModel = this.getView().getModel();
            var oAgent = oModel.getProperty("/agent");

            // Validate required fields
            if (!oAgent.id || !oAgent.name) {
                MessageBox.error("Please fill in all required fields (ID and Name)");
                return;
            }

            fetch(API_BASE_URL + "/agents", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oAgent)
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    if (data.success) {
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
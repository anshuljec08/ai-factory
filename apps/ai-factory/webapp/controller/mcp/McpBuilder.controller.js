sap.ui.define([
    "ai/factory/controller/BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("ai.factory.controller.mcp.McpBuilder", {
        onInit: function () {
            // Initialize MCP Builder model
            var oModel = new JSONModel({
                servers: [],
                selectedServer: null,
                tools: [],
                isConnecting: false
            });
            this.getView().setModel(oModel, "mcp");
        },

        onNavBack: function () {
            this.navTo("home");
        }
    });
});
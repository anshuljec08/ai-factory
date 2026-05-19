sap.ui.define([
    "ai/factory/controller/BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("ai.factory.controller.dashboard.Dashboard", {
        onInit: function () {
            // Initialize Dashboard model
            var oModel = new JSONModel({
                metrics: {
                    totalAgents: 0,
                    totalExecutions: 0,
                    totalTokens: 0,
                    avgResponseTime: 0
                },
                isLoading: false
            });
            this.getView().setModel(oModel, "dashboard");
        },

        onNavBack: function () {
            this.navTo("home");
        }
    });
});
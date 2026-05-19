sap.ui.define([
    "ai/factory/controller/BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("ai.factory.controller.tools.ToolManager", {
        onInit: function () {
            // Initialize Tool Manager model
            var oModel = new JSONModel({
                tools: [],
                selectedTool: null,
                isLoading: false
            });
            this.getView().setModel(oModel, "tools");
        },

        onNavBack: function () {
            this.navTo("home");
        }
    });
});
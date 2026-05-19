sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("ai.factory.agentdesigner.controller.App", {
        onInit: function () {
            // Apply content density mode
            this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
        }
    });
});
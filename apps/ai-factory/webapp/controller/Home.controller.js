sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("ai.factory.controller.Home", {
        
        _sApiUrl: "/api/v1",
        
        onInit: function () {
            // Initialize stats model
            var oStatsModel = new JSONModel({
                agentCount: 0,
                toolCount: 0,
                isLoading: true
            });
            this.getView().setModel(oStatsModel, "stats");
            
            // Load stats
            this._loadStats();
        },
        
        /**
         * Load statistics from API
         */
        _loadStats: function () {
            var that = this;
            var oStatsModel = this.getView().getModel("stats");
            
            // Fetch agent count
            fetch(this._sApiUrl + "/agents")
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Failed to load agents");
                    }
                    return response.json();
                })
                .then(function (oData) {
                    var iCount = 0;
                    if (oData && oData.data) {
                        iCount = oData.data.length;
                    } else if (oData && Array.isArray(oData)) {
                        iCount = oData.length;
                    } else if (oData && oData.pagination) {
                        iCount = oData.pagination.total;
                    }
                    oStatsModel.setProperty("/agentCount", iCount);
                    oStatsModel.setProperty("/isLoading", false);
                })
                .catch(function (error) {
                    console.error("Error loading agent stats:", error);
                    oStatsModel.setProperty("/agentCount", 0);
                    oStatsModel.setProperty("/isLoading", false);
                });
            
            // Fetch tool count (if available)
            fetch(this._sApiUrl + "/tools")
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Failed to load tools");
                    }
                    return response.json();
                })
                .then(function (oData) {
                    var iCount = 0;
                    if (oData && oData.data) {
                        iCount = oData.data.length;
                    } else if (oData && Array.isArray(oData)) {
                        iCount = oData.length;
                    }
                    oStatsModel.setProperty("/toolCount", iCount);
                })
                .catch(function (error) {
                    console.error("Error loading tool stats:", error);
                    oStatsModel.setProperty("/toolCount", 0);
                });
        },

        onTilePress: function (oEvent) {
            var oTile = oEvent.getSource();
            var sRoute = oTile.data("route");
            
            if (sRoute) {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo(sRoute);
            }
        }
    });
});
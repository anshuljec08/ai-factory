sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function(Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("ai.factory.launchpad.controller.Home", {
        
        // API URL - change this based on environment
        _apiUrl: "https://ai-factory-agent-registry-cheerful-oryx-hn.cfapps.eu10-004.hana.ondemand.com",
        
        // App URLs for local development
        _appUrls: {
            "agent-designer": "http://localhost:8080",
            "custom-ui": "http://localhost:8081",
            "mcp-builder": "http://localhost:8082",
            "dashboard": "http://localhost:8083"
        },

        onInit: function() {
            // Check API health on load
            this._checkApiHealth();
        },

        /**
         * Handle tile press - navigate to the target app
         */
        onTilePress: function(oEvent) {
            var oTile = oEvent.getSource();
            var sTarget = oTile.data("target");
            
            if (!sTarget) {
                MessageToast.show("Navigation target not configured");
                return;
            }
            
            // Get the URL for the target app
            var sUrl = this._appUrls[sTarget];
            
            if (sTarget === "agent-designer") {
                // Agent Designer is ready - navigate
                window.open(sUrl, "_blank");
                MessageToast.show("Opening Agent Designer...");
            } else {
                // Other apps coming soon
                MessageBox.information(
                    "This application is coming in Week 2.\n\n" +
                    "Target: " + sTarget + "\n" +
                    "URL: " + sUrl,
                    {
                        title: "Coming Soon"
                    }
                );
            }
        },

        /**
         * Handle quick link press
         */
        onQuickLinkPress: function(oEvent) {
            var sText = oEvent.getSource().getText();
            
            if (sText.indexOf("API") >= 0) {
                window.open(this._apiUrl + "/api/v1", "_blank");
            } else if (sText.indexOf("GitHub") >= 0) {
                window.open("https://github.com/anshuljec08/ai-factory", "_blank");
            } else {
                MessageToast.show("Link: " + sText);
            }
        },

        /**
         * Check API health and update status
         */
        onApiHealthCheck: function() {
            this._checkApiHealth();
            MessageToast.show("Checking API health...");
        },

        /**
         * Internal method to check API health
         */
        _checkApiHealth: function() {
            var that = this;
            var oStatusControl = this.byId("apiStatus");
            
            if (!oStatusControl) {
                return;
            }
            
            oStatusControl.setText("Checking...");
            oStatusControl.setState("None");
            
            // Make health check request
            fetch(this._apiUrl + "/health")
                .then(function(response) {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error("API not responding");
                })
                .then(function(data) {
                    oStatusControl.setText("Healthy (" + data.version + ")");
                    oStatusControl.setState("Success");
                })
                .catch(function(error) {
                    oStatusControl.setText("Unavailable");
                    oStatusControl.setState("Error");
                    console.error("API health check failed:", error);
                });
        }
    });
});
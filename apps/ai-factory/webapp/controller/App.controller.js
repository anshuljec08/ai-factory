sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("ai.factory.controller.App", {
        onInit: function () {
            // Get router and attach route matched handler
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.attachRouteMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            var oSideNavigation = this.byId("sideNavigation");
            
            // Map route names to navigation keys
            var mRouteToKey = {
                "home": "home",
                "agentList": "agentList",
                "agentDetail": "agentList",
                "agentCreate": "agentList",
                "mcpBuilder": "mcpBuilder",
                "toolManager": "toolManager",
                "dashboard": "dashboard",
                "logs": "logs"
            };
            
            var sKey = mRouteToKey[sRouteName] || "home";
            
            // Set selected item in navigation
            if (oSideNavigation) {
                var oNavList = oSideNavigation.getItem();
                if (oNavList) {
                    oNavList.setSelectedKey(sKey);
                }
            }
        },

        onSideNavButtonPress: function () {
            var oToolPage = this.byId("toolPage");
            var bSideExpanded = oToolPage.getSideExpanded();
            oToolPage.setSideExpanded(!bSideExpanded);
        },

        onNavItemSelect: function (oEvent) {
            var sKey = oEvent.getParameter("item").getKey();
            var oRouter = this.getOwnerComponent().getRouter();
            
            // Navigate to the selected route
            oRouter.navTo(sKey);
        }
    });
});
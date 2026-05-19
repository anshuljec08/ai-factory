sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function(UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("ai.factory.launchpad.Component", {
        metadata: {
            manifest: "json"
        },

        init: function() {
            // Call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // Set device model
            var oDeviceModel = new JSONModel({
                isDesktop: sap.ui.Device.system.desktop,
                isPhone: sap.ui.Device.system.phone,
                isTablet: sap.ui.Device.system.tablet
            });
            oDeviceModel.setDefaultBindingMode("OneWay");
            this.setModel(oDeviceModel, "device");
        },

        destroy: function() {
            UIComponent.prototype.destroy.apply(this, arguments);
        }
    });
});
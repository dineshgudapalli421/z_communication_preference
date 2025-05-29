sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/sap/lh/mr/zcommunicationpreference/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("com.sap.lh.mr.zcommunicationpreference.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // var oComponentData = this.getComponentData();
            // if (oComponentData && oComponentData.startupParameters) {
            //     var businessPartner = oComponentData.startupParameters.BusinessPartner?.[0];
            //     var contractAccount = oComponentData.startupParameters.ContractAccount?.[0];
            //     var oModel = new sap.ui.model.json.JSONModel({
            //         businessPartner: businessPartner,
            //         contractAccount: contractAccount
            //     });
            //     this.setModel(oModel, "startup");
            // }
            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
        }
    });
});
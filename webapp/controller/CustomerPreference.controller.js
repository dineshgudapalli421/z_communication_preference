sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    "sap/ui/model/json/JSONModel",
    'sap/m/MessageBox',
    "sap/ui/core/Fragment",
    "sap/ui/table/RowAction",
    "sap/ui/table/RowActionItem",
    "sap/ui/table/RowSettings",
], (Controller, ODataModel, Filter, FilterOperator, JSONModel, MessageBox, Fragment, RowAction, RowActionItem, RowSettings) => {
    "use strict";

    return Controller.extend("com.sap.lh.mr.zcommunicationpreference.controller.CustomerPreference", {
        onInit() { 
            const oView = this.getView();
            oView.setModel(new JSONModel({
                rowMode: "Fixed"
            }), "ui");
            const fnPress = this.handleActionPress.bind(this);
            this.modes = [
                {
                    key: "Navigation",
                    text: "Navigation",
                    handler: function () {
                        const oTemplate = new RowAction({
                            items: [
                                new RowActionItem({ icon: "sap-icon://edit", text: "Edit", press: fnPress })
                            ]
                        });
                        return [1, oTemplate];
                    }
                }
            ];
            this.getView().setModel(new JSONModel({ items: this.modes }), "modes");
        },
        onSearch: function () {
            const oView = this.getView();
            var aFilter = [];
            var businessPartner = this.getView().byId("idBP").getValue();
            var contractAccount = this.getView().byId("idCA").getValue();
            if (businessPartner === "") {
                return MessageBox.error("Business Partner is mandatory...");
            }
            aFilter.push(new Filter("AccountID", FilterOperator.EQ, businessPartner));
            if (contractAccount !== "") {
                aFilter.push(new Filter("EntitySet", FilterOperator.EQ, "ContractAccount"));
                aFilter.push(new Filter("AcEntityKey", FilterOperator.EQ, contractAccount));
            }
            var oModel = this.getOwnerComponent().getModel();

            var oJsonModel = new sap.ui.model.json.JSONModel();
            var oTable = this.getView().byId("tblCommunicationPreference");

            var oBusyDialog = new sap.m.BusyDialog({
                title: "Loading Data",
                text: "Please wait..."
            });
            oBusyDialog.open();
            oModel.read("/ZCommunicationPreferences", {
                filters: aFilter,
                success: function (response) {
                    oBusyDialog.close();
                    oJsonModel.setData(response.results);
                    oView.byId("tblCommunicationPreference").setModel(oJsonModel, "CustModel");
                    oTable.clearSelection(true);
                },
                error: (oError) => {
                    oBusyDialog.close();
                    console.error("Error:", oError);
                }
            });

            this.switchState("Navigation");

        },
        onCreateRecord: function () {
            if (!this.oDialog) {
                this.oDialog = Fragment.load({
                    name: "com.sap.lh.mr.zcommunicationpreference.fragment.createDialog",
                    id: "createDialog",
                    controller: this
                }).then((oDialog) => {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                });
            }
            this.oDialog.then((oDialog) => {
                oDialog.open();
            });
        },

        onCancelDialog: function () {
            this.oDialog.then().then((oDialog) => {
                oDialog.close();
                oDialog.destroy();
            });
            this.oDialog = null;
        },
        onSubmitDialog: function () {
            var oInpBP = sap.ui.getCore().byId("createDialog--idBp");
            var oInpobjeType = sap.ui.getCore().byId("createDialog--idObjectType");
            var bPartner = oInpBP.getValue();
            var objType = oInpobjeType.getSelectedItem().getText();
        },
        handleActionPress: function (oEvent) {
            const oRow = oEvent.getParameter("row");
            const oItem = oEvent.getParameter("item");
            var tb = this.getView().byId("tblCommunicationPreference");
            var rowid = tb.getSelectedIndices();
            if (rowid.length === 0) {
                return MessageBox.error("Please select a row.");
            }
            else if (rowid.length > 0) {
                let client = tb.getRows()[rowid].getCells()[0].getText();
                let bPartner = tb.getRows()[rowid].getCells()[1].getText();
                if (!this.oDialog) {
                    this.oDialog = Fragment.load({
                        name: "com.sap.lh.mr.zcommunicationpreference.fragment.editDialog",
                        id: "editDialog",
                        controller: this
                    }).then((oDialog) => {
                        this.getView().addDependent(oDialog);
                        return oDialog;
                    });
                }
                //this.getView().byId("iduBp").setValue(bPartner);
                this.oDialog.then((oDialog) => {
                    oDialog.open();
                });

            }

        },
        switchState: function (sKey) {
            const oTable = this.byId("tblCommunicationPreference");
            let iCount = 0;
            let oTemplate = oTable.getRowActionTemplate();
            if (oTemplate) {
                oTemplate.destroy();
                oTemplate = null;
            }

            const aRes = this.modes[0].handler();
            iCount = aRes[0];
            oTemplate = aRes[1];

            oTable.setRowActionTemplate(oTemplate);
            oTable.setRowActionCount(iCount);
        },
    });
});
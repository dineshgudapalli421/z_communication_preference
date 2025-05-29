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
    var oRouter, oController, oCommPrefModel, UIComponent;
    return Controller.extend("com.sap.lh.mr.zcommunicationpreference.controller.CustomerPreference", {
        onInit() {
            debugger;
            oController = this;
            UIComponent = oController.getOwnerComponent();
            oCommPrefModel = oController.getOwnerComponent().getModel();
            oRouter = UIComponent.getRouter();
            const oView = this.getView();
            oView.setModel(new JSONModel({
                rowMode: "Fixed"
            }), "ui");


            oRouter.getRoute("RouteCustomerPreference").attachPatternMatched(this._onRouteMatched, oController);
        },
        _onRouteMatched: function (oEvent) {
            debugger;
            var oComponentData = UIComponent.getComponentData();
            if (oComponentData && oComponentData.startupParameters) {
                var oParams = oComponentData.startupParameters;
                var businessPartner = oParams.BusinessPartner[0];
                var contractAccount = oParams.ContractAccount[0];
                oController.getView().byId("idBP").setValue(businessPartner);
                if (contractAccount) {
                    oController.getView().byId("idCA").setValue(contractAccount);
                }
                oController.getView().byId("application-Z_COM_PREFRENCE-change-component---CustomerPreference--filterbar-btnGo").firePress();
            }
        },
        onSearch: function () {
            const oView = this.getView();
            var oTable = this.getView().byId("tblCommunicationPreference");
            var oJsonModel = new sap.ui.model.json.JSONModel();

            var aFilter = [];
            const businessPartner = this.getView().byId("idBP").getValue();
            const contractAccount = this.getView().byId("idCA").getValue();
            const chkStatus = this.getView().byId("idStatus").getSelectedKey();
            if (businessPartner === "") {
                oJsonModel.setData({});
                oController.getView().byId("tblCommunicationPreference").setModel(oJsonModel, "CustModel");
                return MessageBox.error("Business Partner is mandatory...");
            }
            aFilter.push(new Filter("AccountID", FilterOperator.EQ, businessPartner));
            aFilter.push(new Filter("Status", FilterOperator.EQ, chkStatus));
            if (contractAccount !== "") {
                aFilter.push(new Filter("EntitySet", FilterOperator.EQ, "ContractAccount"));
                aFilter.push(new Filter("EntityKey", FilterOperator.EQ, contractAccount));
            }
            var oModel = this.getOwnerComponent().getModel();

            var oBusyDialog = new sap.m.BusyDialog({
                title: "Loading Data",
                text: "Please wait..."
            });
            oBusyDialog.open();
            oModel.read("/ZCommunicationPreferences", {
                filters: aFilter,
                success: function (response) {
                    oBusyDialog.close();
                    if (response.results.length > 0) {
                        oJsonModel.setData(response.results);
                        oView.byId("tblCommunicationPreference").setModel(oJsonModel, "CustModel");
                        oTable.clearSelection(true);
                    }
                    else if (response.results.length === 0) {
                        oJsonModel.setData({});
                        oView.byId("tblCommunicationPreference").setModel(oJsonModel);
                        return MessageBox.error("There are no records with selection.")
                    }
                },
                error: (oError) => {
                    oBusyDialog.close();
                    oJsonModel.setData({});
                    oView.byId("tblCommunicationPreference").setModel(oJsonModel);
                    var oResponseText = oError.responseText;
                    var sParsedResponse = JSON.parse(oResponseText);
                    const oMessage = sParsedResponse.error.message.value;
                    return MessageBox.error(oMessage);
                }
            });

            //this.switchState("Navigation");

        },
        onCreateRecord: async function () {
            var that = this;
            this.oCreateDialog ??= await this.loadFragment({
                name: "com.sap.lh.mr.zcommunicationpreference.fragment.createDialog"
            });
            this.oCreateDialog.open();

            let objComboBox = new sap.m.ComboBox();
            objComboBox = this.byId("cmbCorrespType");
            let oCorrespTypeModel = this.getView().getModel();
            oCorrespTypeModel.read("/CorrespondenceTypes?$select=CorrespondenceTypeID,Description", {
                success: function (response) {
                    if (response.results.length > 0) {
                        var objCorrespndType = [];
                        var uniqueData = that._removeDuplicates(response.results, "CorrespondenceTypeID");
                        for (var i = 0; i < uniqueData.length; i++) {
                            objCorrespndType.push({ "CorrespondenceTypeID": uniqueData[i] });
                        }
                        let odropdownModel = new sap.ui.model.json.JSONModel();
                        odropdownModel.setData(objCorrespndType, "CorrespondTypes");
                        objComboBox.setModel(odropdownModel);
                        objComboBox.bindAggregation("items", {
                            path: "/",
                            template: new sap.ui.core.Item({
                                key: "{CorrespondenceTypeID}",
                                text: "{CorrespondenceTypeID}"
                            })
                        });
                    }
                    else if (response.results.length === 0) {
                        return MessageBox.success("There are no Corresponed Types exists...");
                    }
                },
                error: (oError) => {
                    console.error("Error:", oError);
                }
            });
        },
        _removeDuplicates: function (data, key) {
            const uniqueData = data.reduce((acc, item) => {
                const value = item[key];
                if (!acc.includes(value)) {
                    acc.push(value);
                }
                return acc;
            }, []);
            return uniqueData;
        },
        onCancelEditDialog: function (oEvent) {
            this.oEditDialog.destroy();
            this.oEditDialog = undefined;
            //this.oEditDialog.close();
        },
        onCancelCreateDialog: function (oEvent) {
            this.oCreateDialog.destroy();
            this.oCreateDialog = undefined;
            //this.oCreateDialog.close();

        },
        onSubmitDialog: function (oEvent) {
            debugger;
            const oBpartner = this.byId("idBp").getValue();
            let objectType = this.byId("idObjectType").getSelectedKey() ? this.byId("idObjectType").getSelectedItem().getText() : '';
            const objectKey = this.byId("cmbobjKey").getSelectedKey() ? this.byId("cmbobjKey").getSelectedItem().getText() : '';
            const correspType = this.byId("cmbCorrespType").getSelectedKey() ? this.byId("cmbCorrespType").getSelectedItem().getText() : '';
            const correspRole = this.byId("idCorrespRole").getSelectedKey() ? this.byId("idCorrespRole").getSelectedItem().getText() : '';
            const deliveryChannel = this.byId("idDeliveryChannel").getSelectedKey() ? this.byId("idDeliveryChannel").getSelectedItem().getText() : '';
            // const deliveryAddress = this.byId("idDeliveryAddress").getValue();
            const status = this.byId("chkStatus").getSelected();
            if (!oBpartner) return MessageBox.error("Business Partner is mandatory...");
            if (!objectKey) return MessageBox.error("Object Key is mandatory...");
            if (!correspType) return MessageBox.error("Correspondence Type is mandatory...");
            if (correspRole === "ZPLS" && objectType === "ISUPARTNER") return MessageBox.error("Object Type should be Account...");
            if (objectType === "ISUACCOUNT") {
                objectType = "ContractAccount";
            }
            else {
                objectType = "Account";
            }

            let objRequest = {
                "AccountID": oBpartner,
                "EntitySet": objectType,
                "EntityKey": objectKey,
                "CorrespondenceTypeID": correspType,
                "CommunicationCategoryID": correspRole,
                "PortalID": "",
                "DeliveryChannelID": deliveryChannel,
                "DeliveryAddressLine": "001",
                // "DeliveryAddress": deliveryAddress,
                "Status": status,
                "Settings": ""
            };
            var oModel = this.getView().getModel();
            var sPath = "/ZCommunicationPreferences(AccountID='" + oBpartner + "')";
            oModel.update(sPath, objRequest, {
                method: "PATCH",
                success: function (response) {
                    oController.onCancelCreateDialog();
                    oController.getView().byId("application-Z_COM_PREFRENCE-change-component---CustomerPreference--filterbar-btnGo").firePress();
                    return MessageBox.success("Business Partner created successfully:", response);
                },
                error: function (error) {
                    return MessageBox.error("Error when create business partner:", error);
                }
            });
        },

        onUpdateDialog: function (oEvent) {
            debugger;
            const oBpartner = this.byId("iduBp").getValue();
            let objectType = this.byId("iduObjectType").getValue();
            const objectKey = this.byId("iduObjectKey").getValue();
            const correspType = this.byId("iduCorrespType").getValue();
            const correspRole = this.byId("iduCorrespRole").getValue();
            const deliveryChannel = this.byId("iduDeliveryChannel").getValue();
            const status = this.byId("chkUStatus").getSelected();

            if (objectType === "Business Partner") objectType = "Account";

            let objRequest = {
                "AccountID": oBpartner,
                "EntitySet": objectType,
                "EntityKey": objectKey,
                "CorrespondenceTypeID": correspType,
                "CommunicationCategoryID": correspRole,
                "PortalID": "",
                "DeliveryChannelID": deliveryChannel,
                "DeliveryAddressLine": "001",
                "Status": status,
                "Settings": ""
            };
            var oModel = this.getView().getModel();
            var sPath = "/ZCommunicationPreferences(AccountID='" + oBpartner + "')";
            oModel.update(sPath, objRequest, {
                method: "PATCH",
                success: function (data) {
                    debugger;
                    oController.onCancelEditDialog();
                    oController.getView().byId("application-Z_COM_PREFRENCE-change-component---CustomerPreference--filterbar-btnGo").firePress();
                    return MessageBox.success("Business Partner updated successfully:", data);
                },
                error: function (error) {
                    return MessageBox.error("Error updating business partner:", error);
                }
            });

        },

        onRowSelect: async function (oEvent) {
            var oTable = this.getView().byId("tblCommunicationPreference");
            var rowID = oEvent.getSource().getSelectedIndices();
            var objRow = oTable.getContextByIndex(rowID).getModel().getData()[rowID];
            var selectedData = {
                "AccountID": objRow.AccountID,
                "ObjectType": objRow.EntitySet,
                "ObjectKey": objRow.EntityKey,
                "CorreSpType": objRow.CorrespondenceTypeID,
                "CorreSpRole": objRow.CommunicationCategoryID,
                "DeliveryChannel": objRow.DeliveryChannelID,
                "DeliveryAddress": objRow.DeliveryAddress,
                "Status": objRow.Status
            };
            let oModel = new JSONModel();
            oModel.setData(selectedData, "BPModel");

            this.oDialog ??= await this.loadFragment({
                name: "com.sap.lh.mr.zcommunicationpreference.fragment.editDialog"
            });
            this.oDialog.open();
            this.oDialog.setModel(oModel);
        },

        handleActionPress: async function (oEvent) {
            var oTable = this.getView().byId("tblCommunicationPreference");
            var rowID = oTable.getSelectedIndices();
            if (rowID.length === 0) {
                return MessageBox.error("Please select a row.");
            }
            else if (rowID.length > 0) {
                var objRow = oTable.getContextByIndex(rowID).getModel().getData()[rowID];
                var selectedData = {
                    "AccountID": objRow.AccountID,
                    "ObjectType": objRow.EntitySet,
                    "ObjectKey": objRow.EntityKey,
                    "CorreSpType": objRow.CorrespondenceTypeID,
                    "CorreSpRole": objRow.CommunicationCategoryID,
                    "DeliveryChannel": objRow.DeliveryChannelID,
                    "DeliveryAddress": objRow.DeliveryAddress,
                    "Status": objRow.Status
                };
                let oModel = new JSONModel();
                oModel.setData(selectedData, "BPModel");

                this.oEditDialog ??= await this.loadFragment({
                    name: "com.sap.lh.mr.zcommunicationpreference.fragment.editDialog"
                });
                this.oEditDialog.open();
                this.oEditDialog.setModel(oModel);
            }

        },
        getBusinessPartner() {
            var oTable = this.getView().byId("tblCommunicationPreference");
            var aSelectedIndices = oTable.getSelectedIndices();
            var aSelectedRows = aSelectedIndices.map(iIndex => oTable.getContextByIndex(iIndex).getObject());
            var bpartner = aSelectedRows[0]?.AccountID;
            return bpartner;
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

        onBPChange: function (oEvent) {
            const oBusinessPartner = oEvent.getSource().getValue();
            if (!oBusinessPartner) {
                return MessageBox.error("Business Partner is Mandatory...");
            }
            const objType = this.byId("idObjectType").getSelectedItem().getText();
            if (objType === "ISUACCOUNT") {
                let oComboBox = new sap.m.ComboBox();
                oComboBox = this.byId("cmbobjKey");
                let oContractModel = this.getView().getModel();
                oContractModel.read("/Accounts(AccountID='" + oBusinessPartner + "')/ContractAccounts", {
                    success: function (response) {
                        if (response.results.length > 0) {
                            var odropdownModel = new sap.ui.model.json.JSONModel();
                            odropdownModel.setData(response.results, "ContractAccounts");
                            oComboBox.setModel(odropdownModel);
                            oComboBox.bindAggregation("items", {
                                path: "/",
                                template: new sap.ui.core.Item({
                                    key: "{ContractAccountID}",
                                    text: "{ContractAccountID}"
                                })
                            });
                        }
                        else if (response.results.length === 0) {
                            return MessageBox.success("There are no contract accounts with this business partner...");
                        }
                    },
                    error: (oError) => {
                        console.error("Error:", oError);
                    }
                });

            }
            else if (objType === "ISUPARTNER") {
                let oComboBox = new sap.m.ComboBox();
                oComboBox = this.byId("cmbobjKey");
                let oPartnerModel = new sap.ui.model.json.JSONModel();
                oPartnerModel.setData([{ "BusinessPartner": oBusinessPartner }], "BusinessPartners");
                oComboBox.setModel(oPartnerModel);
                oComboBox.bindAggregation("items", {
                    path: "/",
                    template: new sap.ui.core.Item({
                        key: "{BusinessPartner}",
                        text: "{BusinessPartner}"
                    })
                });
            }

        },
        onObjectTypeChange: function (oEvent) {
            const objType = oEvent.getSource().getSelectedItem().getText();
            const oBusinessPartner = this.byId("idBp").getValue();
            if (!oBusinessPartner) {
                return MessageBox.error("Please enter business partner...")
            }
            if (objType === "ISUACCOUNT") {
                let oComboBox = new sap.m.ComboBox();
                oComboBox = this.byId("cmbobjKey");
                let oContractModel = this.getView().getModel();
                oContractModel.read("/Accounts(AccountID='" + oBusinessPartner + "')/ContractAccounts", {
                    success: function (response) {
                        if (response.results.length > 0) {
                            var odropdownModel = new sap.ui.model.json.JSONModel();
                            odropdownModel.setData(response.results, "ContractAccounts");
                            oComboBox.setModel(odropdownModel);
                            oComboBox.bindAggregation("items", {
                                path: "/",
                                template: new sap.ui.core.Item({
                                    key: "{ContractAccountID}",
                                    text: "{ContractAccountID}"
                                })
                            });
                        }
                        else if (response.results.length === 0) {
                            return MessageBox.success("There are no contract accounts with this business partner...");
                        }
                    },
                    error: (oError) => {
                        console.error("Error:", oError);
                    }
                });

            }
            else if (objType === "ISUPARTNER") {
                let oComboBox = new sap.m.ComboBox();
                oComboBox = this.byId("cmbobjKey");
                let oPartnerModel = new sap.ui.model.json.JSONModel();
                oPartnerModel.setData([{ "BusinessPartner": oBusinessPartner }], "BusinessPartners");
                oComboBox.setModel(oPartnerModel);
                oComboBox.bindAggregation("items", {
                    path: "/",
                    template: new sap.ui.core.Item({
                        key: "{BusinessPartner}",
                        text: "{BusinessPartner}"
                    })
                });
            }
        }
    });
});
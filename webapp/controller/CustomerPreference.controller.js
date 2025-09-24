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
    "sap/ui/core/format/DateFormat"
], (Controller, ODataModel, Filter, FilterOperator, JSONModel, MessageBox, Fragment, RowAction, RowActionItem, RowSettings, DateFormat) => {
    "use strict";
    var oRouter, oController, oCommPrefModel, UIComponent, oCorrespTypeModel;
    return Controller.extend("com.sap.lh.mr.zcommunicationpreference.controller.CustomerPreference", {
        onInit() {
            oController = this;
            UIComponent = oController.getOwnerComponent();
            oCommPrefModel = oController.getOwnerComponent().getModel();
            oRouter = UIComponent.getRouter();
            const oView = this.getView();
            oView.setModel(new JSONModel({
                rowMode: "Fixed"
            }), "ui");
            if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getRenderer("fiori2")) {
                sap.ushell.Container.getRenderer("fiori2").setHeaderVisibility(false, true);
            }
            var user = sap.ushell.Container.getUser();
            var userId = user.getId(); //'TST_PR_CHNGE'
            //console.log(userId);
            oRouter.getRoute("RouteCustomerPreference").attachPatternMatched(this._onRouteMatched, oController);
            var oSelectionModel = new sap.ui.model.json.JSONModel({
                bCreateBtn: false,
                bEditBtn: false,
                bViewBtn: false
            });
            oController.getView().setModel(oSelectionModel, "SelectionModel");
            oController._fngetCorrespondenceModel();
            oController._fngetUserAuthorization(userId);
        },
        _fngetCorrespondenceModel: function () {
            oCommPrefModel.read("/CorrespondenceTypes?$select=CorrespondenceTypeID,Description", {
                success: function (response) {
                    if (response.results.length > 0) {
                        let track = {}
                        let results = response.results.reduce((op, inp) => {
                            if (!track[inp.CorrespondenceTypeID]) {
                                op.push(inp)
                                track[inp.CorrespondenceTypeID] = inp
                            }
                            return op
                        }, [])

                        oCorrespTypeModel = new sap.ui.model.json.JSONModel();
                        oCorrespTypeModel.setData([results], "CorrespondType");
                    }
                    else if (response.results.length === 0) {
                        return MessageBox.error("There are no Corresponed Types exists...");
                    }
                },
                error: (oError) => {
                    console.error("Error:", oError);
                }
            });
        },
        _fngetUserAuthorization: function (userId) {
            debugger;
            var oModel = oController.getView().getModel("SelectionModel");
            oCommPrefModel.callFunction("/GetAccessType", {
                method: "GET",
                urlParameters: {
                    UserID: userId //"TST_PR_DISP"
                },
                success: function (oData, response) {
                    debugger;
                    const accessType = oData.GetAccessType.AccessType;
                    var oCreate = oController.getView().byId("btnCreate");
                    var oEdit = oController.getView().byId("btnEdit");
                    var oView = oController.getView().byId("btnView");
                    if (accessType === "C") {
                        if (oCreate) oModel.setProperty("/bCreateBtn", true);
                        if (oEdit) oModel.setProperty("/bEditBtn", true);
                        if (oView) oModel.setProperty("/bViewBtn", false);
                    }
                    else if (accessType === "D") {
                        if (oCreate) oModel.setProperty("/bCreateBtn", false);
                        if (oEdit) oModel.setProperty("/bEditBtn", false);
                        if (oView) oModel.setProperty("/bViewBtn", true);
                    }
                    else if (accessType === "N") {
                        if (oCreate) oModel.setProperty("/bCreateBtn", false);
                        if (oEdit) oModel.setProperty("/bEditBtn", false);
                        if (oView) oModel.setProperty("/bViewBtn", false);
                    }
                },
                error: function (error) {

                    console.error("Error:", error);
                }
            });
            // oCommPrefModel.read("/GetAccessType?UserID='TST_PR_CHNGE'", {
            //     success: function (response) {
            //         debugger;
            //         if (response.results.length > 0) {
            //             debugger;

            //         }
            //         else if (response.results.length === 0) {
            //             return MessageBox.error("There are no Corresponed Types exists...");
            //         }
            //     },
            //     error: (oError) => {
            //         console.error("Error:", oError);
            //     }
            // });
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
                if (businessPartner) {
                    oController.getView().byId("application-Z_COM_PREFRENCE-change-component---CustomerPreference--filterbar-btnGo").firePress();
                }
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
                        var finalObject = [];
                        var aResults = response.results;
                        aResults.forEach(function (oCurrentObject) {
                            const oCorrTypeId = oCurrentObject.CorrespondenceTypeID;
                            let oCorrType = '';
                            if (oCorrTypeId === "*") {
                                oCorrType = 'ALL';
                            }
                            else {
                                oCorrType = oController._fngetCorreType('ID', oCorrTypeId);
                            }
                            let oDeliveryChannel = '';
                            if (oCurrentObject.DeliveryChannelID === 'EMAL') {
                                oDeliveryChannel = 'EMAIL';
                            } else if (oCurrentObject.DeliveryChannelID === 'LETT') {
                                oDeliveryChannel = 'LETTER';
                            } else {
                                oDeliveryChannel = oCurrentObject.DeliveryChannelID;
                            }
                            var internalObject = {
                                "AccountID": oCurrentObject.AccountID,
                                "EntitySet": oCurrentObject.EntitySet,
                                "EntityKey": oCurrentObject.EntityKey,
                                "CorrespondenceTypeID": oCurrentObject.CorrespondenceTypeID,
                                "CorrespondenceDesc": oCorrType,
                                "CommunicationCategoryID": oCurrentObject.CommunicationCategoryID,
                                "DeliveryChannelID": oCurrentObject.DeliveryChannelID,
                                "DeliveryChannel": oDeliveryChannel,
                                "Status": oCurrentObject.Status,
                                "ValidFrom": oCurrentObject.ValidFrom,//oController._fngetDateFormat(oCurrentObject.ValidFrom),
                                "ValidTo": oCurrentObject.ValidTo,//oController._fngetDateFormat(oCurrentObject.ValidTo),
                                "CreatedBy": oCurrentObject.CreatedBy,
                                "CreatedOn": oCurrentObject.CreatedOn,//oController._fngetDateFormat(oCurrentObject.CreatedOn),
                                "UpdatedOn": oCurrentObject.UpdatedOn,//oController._fngetDateFormat(oCurrentObject.UpdatedOn),
                                "UpdatedBy": oCurrentObject.UpdatedBy
                            };
                            finalObject.push(internalObject);
                        });
                        oJsonModel.setData(finalObject);
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
        _fngetDateFormat: function (strDate) {

            var oDateFormat = DateFormat.getInstance({
                UTC: false,
                pattern: "yyyy-MM-dd"
            });
            var formatDate = oDateFormat.format(new Date(strDate));
            return formatDate.toString();
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
                        debugger;
                        let track = {}
                        let results = response.results.reduce((op, inp) => {
                            if (!track[inp.CorrespondenceTypeID]) {
                                op.push(inp)
                                track[inp.CorrespondenceTypeID] = inp
                            }
                            return op
                        }, [])

                        let odropdownModel = new sap.ui.model.json.JSONModel();
                        odropdownModel.setData(results, "CorrespondTypes");
                        objComboBox.setModel(odropdownModel);
                        objComboBox.bindAggregation("items", {
                            path: "/",
                            template: new sap.ui.core.Item({
                                key: "{CorrespondenceTypeID}",
                                text: "{Description}"
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
        onCancelViewDialog: function (oEvent) {
            this.oViewDialog.destroy();
            this.oViewDialog = undefined;
        },
        onSubmitDialog: function (oEvent) {
            debugger;
            const oBpartner = this.byId("idBp").getValue();
            let objectType = this.byId("idObjectType").getSelectedKey() ? this.byId("idObjectType").getSelectedItem().getText() : '';
            const objectKey = this.byId("cmbobjKey").getSelectedKey() ? this.byId("cmbobjKey").getSelectedItem().getText() : '';
            const correspType = this.byId("cmbCorrespType").getSelectedKey() ? this.byId("cmbCorrespType").getSelectedKey() : '';
            const correspRole = this.byId("idCorrespRole").getSelectedKey() ? this.byId("idCorrespRole").getSelectedKey() : '';
            const deliveryChannel = this.byId("idDeliveryChannel").getSelectedKey() ? this.byId("idDeliveryChannel").getSelectedKey() : '';
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
            let correspRole = this.byId("iduCorrespRole").getValue();
            let deliveryChannel = this.byId("iduDeliveryChannel").getValue();
            const status = this.byId("chkUStatus").getSelected();
            const oCorrType = correspType === 'ALL' ? '*' : oController._fngetCorreType('Description', correspType);
            if (deliveryChannel === "EMAIL") {
                deliveryChannel = "EMAL";
            }
            else if (deliveryChannel === "LETTER") {
                deliveryChannel = "LETT";
            }
            if (objectType === "Business Partner") objectType = "Account";
            correspRole = correspRole === 'Business Contracts' ? 'COMM' : 'ZPLS';
            let objRequest = {
                "AccountID": oBpartner,
                "EntitySet": objectType,
                "EntityKey": objectKey,
                "CorrespondenceTypeID": oCorrType,
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

        _fngetCorreType: function (keyType, correType) {
            let oGetData = [];
            for (var i = 0; i < oCorrespTypeModel.getData("CorrespondType")[0].length; i++) {
                oGetData.push({ "CorrespID": oCorrespTypeModel.getData("CorrespondType")[0][i].CorrespondenceTypeID, "Description": oCorrespTypeModel.getData("CorrespondType")[0][i].Description });
            }
            var objData = oGetData.find(function (objData) {
                if (keyType === "ID") {
                    return objData.CorrespID === correType;
                }
                else if (keyType === "Description") {
                    return objData.Description === correType;
                }
            });

            let oCorrType = '';
            if (keyType === "ID" && objData !== undefined) {
                oCorrType = objData.Description;
            }
            else if (keyType === "Description" && objData !== undefined) {
                oCorrType = objData.CorrespID;
            }
            return oCorrType;
        },

        handleActionPress: async function (oEvent) {
            var oTable = this.getView().byId("tblCommunicationPreference");
            var rowID = oTable.getSelectedIndices();
            if (rowID.length === 0) {
                return MessageBox.error("Please select a row.");
            }
            else if (rowID.length > 0) {
                debugger;
                var objRow = oTable.getContextByIndex(rowID).getModel().getData()[rowID];
                const oCorrTypeId = objRow.CorrespondenceTypeID;
                const oCorrType = oCorrTypeId === '*' ? 'ALL' : oController._fngetCorreType('ID', oCorrTypeId);

                let oCorreSpRole = objRow.CommunicationCategoryID === 'COMM' ? 'Business Contracts' : 'Paperless Billing';

                var selectedData = {
                    "AccountID": objRow.AccountID,
                    "ObjectType": objRow.EntitySet,
                    "ObjectKey": objRow.EntityKey,
                    "CorreSpType": oCorrType,
                    "CorreSpRole": oCorreSpRole,
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
                // let objComboBox = new sap.m.ComboBox();
                // objComboBox = this.byId("iduCorrespType");
                // objComboBox.setModel(oCorrespTypeModel.getData("CorrespondType"));
                // objComboBox.bindAggregation("items", {
                //     path: "/",
                //     template: new sap.ui.core.Item({
                //         key: "{CorrespondenceTypeID}",
                //         text: "{Description}"
                //     })
                // });
                this.oEditDialog.setModel(oModel);
            }

        },
        onViewRecord: async function (oEvent) {
            var oTable = this.getView().byId("tblCommunicationPreference");
            var rowID = oTable.getSelectedIndices();
            if (rowID.length === 0) {
                return MessageBox.error("Please select a row.");
            }
            else if (rowID.length > 0) {
                var objRow = oTable.getContextByIndex(rowID).getModel().getData()[rowID];
                const oCorrTypeId = objRow.CorrespondenceTypeID;
                const oCorrType = oCorrTypeId === '*' ? 'ALL' : oController._fngetCorreType('ID', oCorrTypeId);
                let oCorreSpRole = objRow.CommunicationCategoryID === 'COMM' ? 'Business Contracts' : 'Paperless Billing';

                var selectedData = {
                    "AccountID": objRow.AccountID,
                    "ObjectType": objRow.EntitySet,
                    "ObjectKey": objRow.EntityKey,
                    "CorreSpType": oCorrType,
                    "CorreSpRole": oCorreSpRole,
                    "DeliveryChannel": objRow.DeliveryChannelID,
                    "DeliveryAddress": objRow.DeliveryAddress,
                    "Status": objRow.Status
                };
                let oModel = new JSONModel();
                oModel.setData(selectedData, "ViewModel");

                this.oViewDialog ??= await this.loadFragment({
                    name: "com.sap.lh.mr.zcommunicationpreference.fragment.viewDialog"
                });
                this.oViewDialog.open();
                this.oViewDialog.setModel(oModel);

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
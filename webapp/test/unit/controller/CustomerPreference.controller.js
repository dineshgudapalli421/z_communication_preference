/*global QUnit*/

sap.ui.define([
	"comsaplhmr/z_communication_preference/controller/CustomerPreference.controller"
], function (Controller) {
	"use strict";

	QUnit.module("CustomerPreference Controller");

	QUnit.test("I should test the CustomerPreference controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

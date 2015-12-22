/*
    permissionsFactory is used to:
       validate if the user has access to a permission
*/

'use strict';

angular
    .module('app')
    .factory('permissionsHelperFactory', function (authService) {
        var factory = {};
        
        //Permission
        factory.permission = function () {
            return {
                authorization: {allow: 'allow', deny:'deny'},
                securityContext: factory.securityContext,
                marRolesList: factory.marRolesList,
                displayModeDisabled: 'disable'
            };
        };

        //Verify if it has access to a permission
        factory.isAllowed = function (permission, securityContext, accessRoles) {

            // if accessRoles is not defined then look for it in the current user.
            if (accessRoles == null || !angular.isDefined(accessRoles)) {
                accessRoles = authService.model.identity.accessRoles;
            }
            if (angular.isDefined(accessRoles) && accessRoles != null && accessRoles.length > 0) {
                if (Enumerable.From(accessRoles).Where(function(i) { return i.securityContext == securityContext; }).Any()
                        && (Enumerable.From(accessRoles).Where(function(i) { return i.securityContext == securityContext; }).First().permissions.indexOf(permission) > -1)
                ) {
                    return true;
                }
            }
            return false;
        };

        //Verify if it has not access to a permission
        factory.isNotAllowed = function (permission, securityContext, accessRoles) {
            return !this.isAllowed(permission, securityContext, accessRoles);
        };

        //Security context
        factory.securityContext = {
            //administrator: "Lgi.Emr.ThickClient.Administrator.Permissions",
            //settingsManager: "Lgi.Infrastructure.SettingsManager.Permissions",
            mar: "Lgi.Emr.ThickClient.Mar.Permissions"
        };

        //MAR Roles
        factory.marRolesList = {
            AuthorizationManagement:"AuthorizationManagement",
            MAR_DA_AdHocPrescriptionAddDose:"MAR_DA_AdHocPrescriptionAddDose",
            MAR_DA_AdmAddDose:"MAR_DA_AdmAddDose",
            MAR_DA_AdministrationHistory:"MAR_DA_AdministrationHistory",
            MAR_DA_CancelAdministration:"MAR_DA_CancelAdministration",
            MAR_DA_FlowsheetAdd: "MAR_DA_FlowsheetAdd",
            MAR_DA_FlowsheetImport: "MAR_DA_FlowsheetImport",
            MAR_DA_FlowsheetDelete:"MAR_DA_FlowsheetDelete",
            MAR_DA_PrescriptionHistory:"MAR_DA_PrescriptionHistory",
            MAR_DA_R:"MAR_DA_R",
            MAR_DA_RConsultPrescription:"MAR_DA_RConsultPrescription",
            MAR_DA_REpisodeList:"MAR_DA_REpisodeList",
            MAR_DA_Report:"MAR_DA_Report",
            MAR_DA_RFilterInactPrescription:"MAR_DA_RFilterInactPrescription",
            MAR_DA_RNote:"MAR_DA_RNote",
            MAR_DA_RValidatePrescription:"MAR_DA_RValidatePrescription",
            MAR_DA_SaveAllAdministration:"MAR_DA_SaveAllAdministration",
            MAR_DA_SignAdHocPrescription:"MAR_DA_SignAdHocPrescription",
            MAR_DA_SignAdministration:"MAR_DA_SignAdministration",
            MAR_DA_UPrepCancelPrepAdmin: "MAR_DA_UPrepCancelPrepAdmin",
            MAR_DA_UAdHocPrescription:"MAR_DA_UAdHocPrescription",
            MAR_DA_UAdministerSelectedDrug:"MAR_DA_UAdministerSelectedDrug",
            MAR_DA_UAdministration:"MAR_DA_UAdministration",
            MAR_DA_UAssociatedData:"MAR_DA_UAssociatedData",
            MAR_DA_UAutoMedication:"MAR_DA_UAutoMedication",
            MAR_DA_UCreateAdHocPrescription:"MAR_DA_UCreateAdHocPrescription",
            MAR_DA_UDoubleSignature:"MAR_DA_UDoubleSignature",
            MAR_DA_UFlowsheet:"MAR_DA_UFlowsheet",
            MAR_DA_UFrequency:"MAR_DA_UFrequency",
            MAR_DA_UModifyHours:"MAR_DA_UModifyHours",
            MAR_DA_UNote:"MAR_DA_UNote",
            MAR_DA_UNotOwnerCanModify:"MAR_DA_UNotOwnerCanModify",
            MAR_DA_UNursingDirectives:"MAR_DA_UNursingDirectives",
            MAR_DA_UPatientMedication:"MAR_DA_UPatientMedication",
            MAR_DA_UPrescription:"MAR_DA_UPrescription",
            MAR_DA_UReactivatePrescription:"MAR_DA_UReactivatePrescription",
            MAR_DA_URemoveSuspPrescription:"MAR_DA_URemoveSuspPrescription",
            MAR_DA_UStopAdHocPrescription:"MAR_DA_UStopAdHocPrescription",
            MAR_DA_UStopPrescription:"MAR_DA_UStopPrescription",
            MAR_DA_USuspendPrescription:"MAR_DA_USuspendPrescription",
            MAR_DA_UValidateAll: "MAR_DA_UValidateAll",
            MAR_DA_VisitHistory: "MAR_DA_VisitHistory",
            MAR_DA_RxProcessStart: "MAR_DA_RxProcessStart",
            MAR_DA_RxProcessStop: "MAR_DA_RxProcessStop",
            MAR_DA_UProcessAll: "MAR_DA_UProcessAll",
            MAR_DA_UAdministrationPrepare: "MAR_DA_UAdministrationPrepare",
            MAR_DA_UAdministrationCancelPrep: "MAR_DA_UAdministrationCancelPrep",
            MAR_DA_UIndicatorDoseDblChk: "MAR_DA_UIndicatorDoseDblChk",
            MAR_DA_UDoseDblChk: "MAR_DA_UDoseDblChk",
            MAR_DA_UMarkInErrorDoseDblChk: "MAR_DA_UMarkInErrorDoseDblChk"
        };

        return factory;
    });

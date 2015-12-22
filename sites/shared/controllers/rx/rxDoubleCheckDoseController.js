//mx Search Management Controller
'use strict';
angular.module('app')
    .controller('rxDoubleCheckDoseController',
    [
         '$scope', '$modal', '$modalInstance', 'entrepriseServices', 'appSettingsFactory', 'locationService', 'authService', 'rxHelperFactory',
        function ($scope, $modal, $modalInstance, entrepriseServices, appSettingsFactory, locationService, authService, rxHelperFactory) {

            //Initialize
            initialize();

            $scope.onClose = function() {
                $modalInstance.dismiss('cancel');
            };
            $scope.onSubmit = function () {

                rxHelperFactory.setDoubleCheckDoseObject($scope.model.rx, $scope.model.dblCheckItem);
                rxHelperFactory.saveDoubleCheckDose($scope.model.rx).then(
                    function (scResult) {
                        if (angular.isDefined(scResult)) {
                            $scope.model.rx = new Lgi.Emr.Mar.Dto.rxDto(scResult);
                            $modalInstance.close($scope.model.rx);
                        }
                    },
                    function (errors) {
                        appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), errors, $scope.cultureManager.resources.translate('CLOSE'));
                    }
                );
            };
            $scope.onMarkInError = function() {
                var onCloseFunction = function () {
                    //refuse, go back to previous value
                };
                var onActionFunction = function() {
                    rxHelperFactory.cancelDoubleCheckDose($scope.model.rx.id).then(
                        function(scResult) {
                            if (angular.isDefined(scResult)) {
                                $scope.model.rx = new Lgi.Emr.Mar.Dto.rxDto(scResult);
                                $scope.model.dblCheckItem.signature1 = {};
                                $scope.model.dblCheckItem.signature2 = {};
                                $scope.model.dblCheckItem.signature1.user = new Lgi.Emr.Mar.Dto.userDto();
                                $scope.model.dblCheckItem.signature2.user = new Lgi.Emr.Mar.Dto.userDto();
                                $scope.tooltipSingBtn1 = $scope.cultureManager.resources.translate('DOSE_TO_BE_CHECK');
                                $scope.tooltipSingBtn2 = $scope.cultureManager.resources.translate('DOSE_TO_BE_CHECK');
                                defaultValuesFirstSignature();
                                $modalInstance.close($scope.model.rx);
                            }
                        },
                        function (errors) {
                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), errors, $scope.cultureManager.resources.translate('CLOSE'));
                        }
                    );
                };
                appSettingsFactory.displayConfirmation($scope.cultureManager.resources.translate('MARK_IN_ERROR'), $scope.cultureManager.resources.translate('MARK_IN_ERROR_CONFIRM'), $scope.cultureManager.resources.translate('YES'), $scope.cultureManager.resources.translate('NO'), null, onActionFunction, onCloseFunction);
            }

            //set verification date of item 1.
            $scope.setVerificationDate1 = function() {
                $scope.model.dblCheckItem.signature1.verificationDateTime = appSettingsFactory.localDateTime(new Date());
                $scope.tooltipSingBtn1 = $scope.cultureManager.resources.translate('DOSE_CHECKED');
                angular.element(document.querySelector('#submitBtn')).focus();

            }
            //set verification date of item 2.
            $scope.setVerificationDate2 = function () {
                if ($scope.model.dblCheckItem.signature2.user.username) {
                    $scope.model.dblCheckItem.signature2.verificationDateTime = appSettingsFactory.localDateTime(new Date());
                    $scope.tooltipSingBtn2 = $scope.cultureManager.resources.translate('DOSE_CHECKED');
                } else {
                    sign();
                }
                angular.element(document.querySelector('#submitBtn')).focus();
            }
            $scope.resetVerificationDate = function() {
                if (!$scope.model.dblCheckItem.signature1.dosageVerificationSelected) {
                    $scope.model.dblCheckItem.signature1.verificationDateTime = null;
                    $scope.tooltipSingBtn1 = $scope.cultureManager.resources.translate('DOSE_TO_BE_CHECK');
                }
            }
            function sign() {
                var scope = $scope.$new();
                scope.model.firstVerificator = $scope.model.dblCheckItem.signature1;
                scope.MAR_DA_Sign = $scope.permission.marRolesList.MAR_DA_UDoseDblChk;
                scope.messageAuthorization = $scope.cultureManager.resources.translate('NOT_AUTHORIZED_TO_DOUBLECHECK_DOSE');
                scope.signatureType = "DOUBLECHECK_DOSE";

                var modalInstance = $modal.open({
                    templateUrl: locationService.shared.views + "signature/signature.html",
                    controller: 'signatureController',
                    windowClass: 'modal-window-small',
                    scope: scope,
                    backdrop: 'static',
                    keyboard: false
                });
                modalInstance.result.then(function (userSigning) {
                    if (userSigning) {
                        $scope.model.dblCheckItem.signature2.user.username = userSigning.userName;
                        $scope.model.dblCheckItem.signature2.user.lastName = userSigning.lastName;
                        $scope.model.dblCheckItem.signature2.user.firstName = userSigning.firstName;
                        $scope.model.dblCheckItem.signature2.user.professionalTitle = (($scope.cultureManager.currentCulture.Culture.Code == 'en-Ca')) ? userSigning.profTitleShortDesc : userSigning.profTitleShortDescFr;
                        $scope.model.dblCheckItem.signature2.verificationDateTime = appSettingsFactory.localDateTime(new Date());
                        angular.element(document.querySelector('#submitBtn')).focus();
                    } 
                }, function () {  //cancel
                    $scope.model.dblCheckItem.signature2.user = new Lgi.Emr.Mar.Dto.userDto();
                    $scope.model.dblCheckItem.signature2.verificationDateTime = null;
                    $scope.model.dblCheckItem.signature2.dosageVerificationId = null;
                    angular.element(document.querySelector('#submitBtn')).focus();
                }); 
            }

            function initialize() {
                $scope.model.dblCheckItem = rxHelperFactory.getDoubleCheckDoseObject($scope.model.rx);
                $scope.form = {};
                $scope.tooltipSingBtn1 = $scope.cultureManager.resources.translate('DOSE_TO_BE_CHECK');
                $scope.tooltipSingBtn2 = $scope.cultureManager.resources.translate('DOSE_TO_BE_CHECK');
                if (angular.isUndefined($scope.model.dblCheckItem.signature1.user) || $scope.model.dblCheckItem.signature1.user == null) $scope.model.dblCheckItem.signature1.user = new Lgi.Emr.Mar.Dto.userDto();
                if (angular.isUndefined($scope.model.dblCheckItem.signature2.user) || $scope.model.dblCheckItem.signature2.user == null) $scope.model.dblCheckItem.signature2.user = new Lgi.Emr.Mar.Dto.userDto();
                if (!$scope.model.dblCheckItem.signature1.user.username) defaultValuesFirstSignature();
                if ($scope.model.dblCheckItem.signature1.user.username && !$scope.model.dblCheckItem.signature2.user.username) defaultValuesSecondSignature();
                $scope.model.dblCheckItem.signature1.originalValueVerificationDateTime = $scope.model.dblCheckItem.signature1.verificationDateTime;
                $scope.model.dblCheckItem.signature2.originalValueVerificationDateTime = $scope.model.dblCheckItem.signature2.verificationDateTime;
                $scope.cultureManager.resources.shared.load('rx-double-check-dose');
                entrepriseServices
                    .lookup
                    .set(appSettingsFactory.dataLookups.dosageVerification, "dosageVerificationList", $scope);
            }

            function defaultValuesFirstSignature() {
                $scope.model.dblCheckItem.signature1.user.id = authService.model.identity.user.userId;
                $scope.model.dblCheckItem.signature1.user.username = authService.model.identity.user.userName;
                $scope.model.dblCheckItem.signature1.user.lastName = authService.model.identity.user.lastName;
                $scope.model.dblCheckItem.signature1.user.firstName = authService.model.identity.user.firstName;
                $scope.model.dblCheckItem.signature1.user.professionalTitle = (($scope.cultureManager.currentCulture.Culture.Code == 'en-Ca')) ? authService.model.identity.user.profTitleShortDesc : authService.model.identity.user.profTitleShortDescFr;
            }

            function defaultValuesSecondSignature() {
                if ( authService.model.identity.user.userName != $scope.model.dblCheckItem.signature1.user.username) {
                    $scope.model.dblCheckItem.signature2.user.id = authService.model.identity.user.userId;
                    $scope.model.dblCheckItem.signature2.user.username = authService.model.identity.user.userName;
                    $scope.model.dblCheckItem.signature2.user.lastName = authService.model.identity.user.lastName;
                    $scope.model.dblCheckItem.signature2.user.firstName = authService.model.identity.user.firstName;
                    $scope.model.dblCheckItem.signature2.user.professionalTitle = (($scope.cultureManager.currentCulture.Culture.Code == 'en-Ca')) ? authService.model.identity.user.profTitleShortDesc : authService.model.identity.user.profTitleShortDescFr;
                }
            }
         }
    ]);
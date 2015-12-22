//Rx adhoc Sign Controller
'use strict';
angular.module('app')
    .controller('signatureController',
    [
         '$scope', '$modalInstance', 'appSettingsFactory', 'utlString', 'entrepriseServices', 'authService', 'permissionsHelperFactory',
         function ($scope, $modalInstance, appSettingsFactory, utlString, entrepriseServices, authService, permissionsHelperFactory) {

             //Initialize
             initialize();

             function initialize() {
                 $scope.cultureManager.resources.shared.load('sign');
                 
                 $scope.model.userSigning = {
                    username : "",
                    password : "",
                    remember : false,
                    domain : "telus-nosession"
                };

                 $scope.model.currentUser = false;
             }

             //Window - Clicked on cancel
             $scope.onClose = function () {
                 $modalInstance.dismiss('cancel');
             };
             //Window - Clicked on Ok
             $scope.onSubmit = function () {
                 //Validate window inputs - This code may be removed if the validation directive sets automatically the focus on the first errored field
                 if (utlString.isBlank($scope.model.userSigning.username)) {
                     angular.element(document.querySelector('#username')).focus();
                     return;
                 }

                 //FOR DOUBLE CHECK DOSE
                 if (angular.isDefined($scope.model.firstVerificator) && $scope.model.userSigning.username == $scope.model.firstVerificator.user.username && $scope.signatureType == "DOUBLECHECK_DOSE") {
                     appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('USER_DIFFERENT_CURRENT_USER_DOSE'), $scope.cultureManager.resources.translate('CLOSE'));
                     angular.element(document.querySelector('#username')).focus();
                     return;
                 }

                 if ($scope.model.userSigning.username == authService.model.identity.user.userName) {
                     if ($scope.signatureType == "ADMINISTRATION"){
                         if (angular.isUndefined($scope.model.preparedBy) || $scope.model.preparedBy == null) {
                             appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('USER_DIFFERENT_CURRENT_USER'), $scope.cultureManager.resources.translate('CLOSE'));
                             angular.element(document.querySelector('#username')).focus();
                             return;
                         }
                     }  else {
                         appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('USER_DIFFERENT_CURRENT_USER_PRESCRIPTION'), $scope.cultureManager.resources.translate('CLOSE'));
                         return;
                     }
                 }

                 if ((angular.isDefined($scope.model.administrationUser) && $scope.model.administrationUser != null) &&
                     ($scope.model.userSigning.username == $scope.model.administrationUser.username && $scope.signatureType == "ADMINISTRATION"
                       && (angular.isUndefined($scope.model.preparedBy) || $scope.model.preparedBy == null))) {
                     appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('USER_DIFFERENT_REALIZATION_USER'), $scope.cultureManager.resources.translate('CLOSE'));
                     angular.element(document.querySelector('#username')).focus();
                     return;
                 }

                 if ((angular.isDefined($scope.model.preparedBy) && $scope.model.preparedBy != null) &&
                     ($scope.model.userSigning.username == $scope.model.preparedBy.username && $scope.signatureType == "ADMINISTRATION")) {
                     appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate('USER_DIFFERENT_PREPARATION_USER'), $scope.cultureManager.resources.translate('CLOSE'));
                     angular.element(document.querySelector('#username')).focus();
                     return;
                 }


                 if (utlString.isBlank($scope.model.userSigning.password)) {
                     angular.element(document.querySelector('#password')).focus();
                     return;
                 }

                 entrepriseServices.authentication.login($scope.model.userSigning)
                 .then(
                         function (data) {
                             //console.log(JSON.stringify(data));
                             if (permissionsHelperFactory.isNotAllowed($scope.MAR_DA_Sign, permissionsHelperFactory.securityContext.mar, data.accessRoles)) {
                                 appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.messageAuthorization, $scope.cultureManager.resources.translate('CLOSE'));
                             } else {
                                 //DOUBLE CHECK DOSE OK
                                 if ($scope.signatureType == "DOUBLECHECK_DOSE") {
                                     $modalInstance.close(data.user);
                                 } else {
                                     //Sign administration
                                     $scope.model.signature = {};
                                     $scope.model.signature.userName = $scope.model.userSigning.username;
                                     $scope.model.signature.title = (($scope.cultureManager.currentCulture.Culture.Code == 'en-Ca')) ? data.user.profTitleShortDesc : data.user.profTitleShortDescFr;
                                     $scope.service.doubleCheck($scope.model)
                                    .then(
                                        function (itemUpdated) {
                                            $modalInstance.close(itemUpdated);
                                        },
                                        function (scError) {
                                            console.log("signatureController: " + JSON.stringify(scError.data.Errors));
                                            appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                                        }
                                    );
                                 }
                            } 
                         },
                         function (scError) {
                             console.log("signatureController: " + JSON.stringify(scError));
                             if (angular.isDefined(scError.Errors) && scError.Errors.length > 0 && angular.isDefined(scError.Errors[0].errorCode) && angular.isDefined(scError.Errors[0].errorCode))
                                 appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), $scope.cultureManager.resources.translate(scError.Errors[0].errorCode), $scope.cultureManager.resources.translate('CLOSE'));
                         }
                     );               
             };
         }
    ]);
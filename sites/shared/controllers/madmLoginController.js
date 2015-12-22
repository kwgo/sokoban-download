'use strict';
angular
    .module('lgi.infra.web.auth')
    .controller('madmLoginController',
    [
        '$scope', '$route', 'authService', '$http', 'notificationService', '$q', 'popupService',
        function ($scope, $route, authService, $http, notificationService, $q, popupService) {
            $scope.model = {
                username: "",
                password: "",
                remember: false,
                domain: null,
                additionalInfos: {
                    killDuplicate: false
                }
            };
            $scope.remember = authService.remember;
            $scope.domains = [];
            $scope.showDomains = false;
            $scope.selectedDomains = null;
            var errorTitle = "",
                errorMessage = "",
                duplicateTitle = "", 
                duplicateMessage = "",
                duplicateOk = "",
                duplicateCancel = "",
                maxRetryTitle = "",
                maxRetryMessage = "";

            $q.all({
                    resources: $scope.cultureManager.resources.shared.load('login'),
                    domains: authService.getDomains()
                })
                .then(function(response) {
                    errorTitle = $scope.cultureManager.resources.translate('LOGINERRORTITLE');
                    errorMessage = $scope.cultureManager.resources.translate('LOGINERRORMESSAGE');

                    duplicateTitle = $scope.cultureManager.resources.translate('LOGINDUPLICATETITLE');
                    duplicateMessage = $scope.cultureManager.resources.translate('LOGINDUPLICATEMESSAGE');
                    duplicateOk = $scope.cultureManager.resources.translate('LOGINDUPLICATEOK');
                    duplicateCancel = $scope.cultureManager.resources.translate('LOGINDUPLICATECANCEL');

                    maxRetryTitle = $scope.cultureManager.resources.translate('LOGINMAXRETRYTITLE');
                    maxRetryMessage = $scope.cultureManager.resources.translate('LOGINMAXRETRYMESSAGE');
                    
                    $scope.domains = response.domains;
                    $scope.showDomains = $scope.domains.length > 1;
                });
            
            var orginalModel = angular.copy($scope.model);
            $scope.data = null;

            function login() {
                notificationService.hide();
                authService
                    .login($scope.model)
                    .then(function (user) {
                        $scope.model.additionalInfos.killDuplicate = false;
                        authService.model.redirectToCulture = true;
                        $route.reload();
                    }, function (response) {
                        $scope.model.additionalInfos.killDuplicate = false;
                        if (response.HasErrors) {
                            var enumerable = Enumerable.From(response.Errors);
                            var error = enumerable.Where(function (e) { return e.errorCode == "MAX_LOGIN_RETRY_EXCEEDED"; }).FirstOrDefault();
                            if (error != null) {
                                popupService.confirm({
                                    title: maxRetryTitle,
                                    content: maxRetryMessage,
                                    actionBtnText: duplicateOk,
                                    cancelBtnShow: false,
                                    closeBtnShow: false,
                                    onAction: function () { },
                                    onClose: function () { },
                                    modal: true
                                });
                                return;
                            }
                            error = enumerable.Where(function (e) { return e.errorCode == "DUPLICATE_SESSION"; }).FirstOrDefault();
                            if (error != null) {
                                popupService.confirm({
                                    title: duplicateTitle,
                                    content: duplicateMessage,
                                    actionBtnText: duplicateOk,
                                    closeBtnText: duplicateCancel,
                                    cancelBtnShow: false,
                                    onAction: function() {
                                        $scope.model.additionalInfos.killDuplicate = true;
                                        login();
                                    },
                                    onClose: function () { },
                                    modal: true
                                });
                                return;
                            }
                            notificationService.error({
                                title: errorTitle,
                                message: errorMessage
                            });
                        }
                    });
            };

            $scope.submit = function () {
                if (!$scope.form.$invalid) {
                    login();
                }
            }

            $scope.reset = function () {
                $scope.user = angular.copy(orginalModel);
            }
        }
    ]);
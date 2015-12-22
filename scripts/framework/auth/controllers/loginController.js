'use strict';
angular
    .module('lgi.infra.web.auth')
    .controller('loginController',
    [
        '$scope', '$route', 'authService', '$http', 'notificationService', '$q',
        function ($scope, $route, authService, $http, notificationService, $q) {
            $scope.model = {
                username: "",
                password: "",
                remember: false,
                domain: null
            };
            $scope.remember = authService.remember;
            $scope.domains = [];
            $scope.showDomains = false;
            $scope.selectedDomains = null;
            var errorTitle = "", errorMessage = "";

            $q.all({
                    resources: $scope.cultureManager.resources.load(authService.authentication.i18n),
                    domains: authService.getDomains()
                })
                .then(function(response) {
                    errorTitle = $scope.cultureManager.resources.translate('LOGINERRORTITLE');
                    errorMessage = $scope.cultureManager.resources.translate('LOGINERRORMESSAGE');

                    $scope.domains = response.domains;
                    $scope.showDomains = $scope.domains.length > 1;
                });
            
            var orginalModel = angular.copy($scope.model);
            $scope.data = null;

            $scope.submit = function () {
                if (!$scope.form.$invalid) {
                    notificationService.hide();
                    authService
                        .login($scope.model)
                        .then(function (user) {
                            authService.model.redirectToCulture = true;
                            $route.reload();
                            console.log(user);
                        }, function(user) {
                            notificationService.error({
                                title: errorTitle,
                                message: errorMessage
                            });
                        });  
                }
            }
            $scope.reset = function () {
                $scope.user = angular.copy(orginalModel);
            }
        }
    ]);
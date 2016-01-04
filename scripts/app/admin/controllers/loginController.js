'use strict';
angular
    .module('boxman.admin')
    .controller('loginController',
    [
        '$scope', '$http', '$location', '$routeParams', 'actionService',
        function ($scope, $http, $location, $routeParams, actionService) {
            $scope.user = {
                username: "",
                password: "",
                passwordmd5: ""
            };
            $scope.model = {
                login: true,
                warning: null,
                error: null
            };
            
/*
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
  */          
            var orginalUser = angular.copy($scope.user);
            
            $scope.submit = function () {
                var url = '/boxman/api/admin/auth/login';
                
                console.log('submit..');
                console.log($scope.user.username);
              

                console.log($scope.user.password);
                $scope.user.passwordmd5 = md5($scope.user.password);
                $scope.user.password = '';
                console.log($scope.user.passwordmd5);

                actionService.http.post(
                    url,
                    $scope.user,
                    function(response) {
                        if(response.data.isSuccess) {
                            console.log(response.data.user);
                            actionService.setUser(response.data.user);
                            $location.path("/summary");
                        }
                    },
                    function(error) {
                        $scope.model.warning = error.statusText;
                    }
                );
            };
                /*
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
                }*/
            $scope.reset = function () {
                $scope.user = angular.copy(orginalUser);
                $scope.model.warning = null;
            };
        }
    ]);

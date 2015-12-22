'use strict';
angular
    .module('app')
    .controller('appController',
    [
        '$rootScope', '$scope', 'authService', 'popupService', 
        function ($rootScope, $scope, authService, popupService) {

            $scope.securityContext = "Lgi.Emr.ThickClient.Mar.Permissions";
            $scope.permissions = [
                'AuthorizationManagement'
            ];

            $scope.changeContext = function() {
                $scope.securityContext = $scope.securityContext != "bob" ? "bob" : "Lgi.Emr.ThickClient.Mar.Permissions";
            };

        }
    ]);
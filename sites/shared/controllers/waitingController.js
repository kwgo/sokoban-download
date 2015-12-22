'use strict';
angular
    .module('app')
    .controller('waitingController',
    [
        '$scope', '$location', 
        function ($scope, $location) {
            $scope.cultureManager.resources.shared.load("default");
        }
    ]);
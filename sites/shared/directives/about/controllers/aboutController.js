'use strict';
angular
    .module('app')
    .controller('aboutController',
    [
        '$rootScope', '$scope', '$location', '$modal', 'versionService',
        function($rootScope, $scope, $location, $modal, versionService) {
            $scope.cultureManager.resources.load('sites/shared/directives/about/i18n/about');
        }
    ]
);
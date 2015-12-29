'use strict';
angular
    .module('boxman.admin')
    .controller('recordController',
    [
        '$scope', '$http', '$location', '$routeParams', 'actionService',
        function ($scope, $http, $location, $routeParams, actionService) {
            //url: "http://www.jchip.com/boxman/api/admin/record/recordList",
            var url = '/boxman/api/admin/record/recordList';
            
            if(!$scope.orderby)
                $scope.orderby = "ORDER BY userdate DESC";
            if(!$scope.limit)
                $scope.limit = "LIMIT 50";

            $scope.list = function() {
                actionService.http(url).list(
                    $scope.orderby, $scope.limit,
                    function(data) {
                        $scope.data = data;
                    },
                    function(error) {
                        console.log(error);
                    }
                );
            };

            $scope.list();
        }
    ]);


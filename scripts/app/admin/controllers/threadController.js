'use strict';
angular
    .module('boxman.admin')
    .controller('threadController',
    [
        '$scope', '$http', '$location', '$routeParams', 'actionService',
        function ($scope, $http, $location, $routeParams, actionService) {
            //url: "http://www.jchip.com/boxman/api/admin/level/levelList",
            var url = '/boxman/api/admin/thread/threadList';
            
            if(!$scope.orderby)
                $scope.orderby = "ORDER BY lastdate DESC";
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


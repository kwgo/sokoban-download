'use strict';
angular
    .module('boxman.admin')
    .controller('summaryController',
    [
        '$scope', '$http', '$location', '$routeParams', 'actionService',
        function ($scope, $http, $location, $routeParams, actionService) {

            //url: "http://www.jchip.com/boxman/api/admin/summary/summaryList",
            var url = '/boxman/api/admin/summary/summaryList';
            $scope.list = function() {
                actionService.list(
                    url,
                    { orderby: $scope.orderby, limit: $scope.limit },
                    function(data) {
                        $scope.data = data;
                        $scope.item = data[0];
                    },
                    function(error) {
                        console.log(error);
                    }
                );
            };
            $scope.list();
        }
    ]);

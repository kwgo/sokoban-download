
﻿'use strict';

angular
    .module('boxman.admin')
    .factory('dataServiceA', ['$http', '$q', function ($http, $q) {
        //url: "http://www.jchip.com/boxman/api/admin/activity/list",
        var url = '/boxman/api/admin/activity/list';
        console.log("activity list .... " + "http://www.jchip.com/boxman/api/admin/activity/list");

        var defferer = $q.defer();
        $http({
            method: 'GET',
            url: url,
            headers: {
                'Accept': 'application/json; odata=verbose' 
            }
        })
        .success(function(data) {
            console.log("activity list success.... ");

            defferer.resolve(data);
        })
        .error(function(data) {
            defferer.reject(data);
        });
        return defferer.promise;
    }])
    .factory('activityService',
    [
        '$rootScope', '$http', 'dataServiceA',
        function($rootScope, $http, dataServiceA) {
            var svc = {};
            svc.list = function(orderby, limit, callback) {
                console.log("activity list .... ");
                dataServiceA.then(
                    function successCallback(response) {
                        // this callback will be called asynchronously
                        // when the response is available
                        if(response.isSuccess)
                            callback(response.records);
                    },
                    function errorCallback(response) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        console.log(response);
                    }
                );
            };
            return svc;
        }
    ])
    .controller('activeListController',
    [
        '$scope', '$http', '$location', '$routeParams', 'activityService',
        function ($scope, $http, $location, $routeParams, activityService) {
            
            if(!$scope.orderby)
                $scope.orderby = "ORDER BY userid DESC";
            if(!$scope.limit)
                $scope.limit = "LIMIT 50";

            $scope.list = function() {
                activityService.list(
                    $scope.orderby, $scope.limit,
                    function(data) {
                        console.log("activity list success....11 ");
                        $scope.data = data;
                    }
                );
            };
            $scope.list();
        }
    ]);


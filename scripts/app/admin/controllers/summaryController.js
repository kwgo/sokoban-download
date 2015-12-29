
﻿'use strict';

angular
    .module('boxman.admin')
    /*
    .factory('summaryService',
    [
        '$rootScope', '$http',
        function($rootScope, $http) {
            var svc = {};
            var item = {};
            
            svc.list = function() {
                //var url = '/boxman/api/admin/summary/list' + '?orderby='+orderby + '&limit='+limit;
                //url: "http://www.jchip.com/boxman/api/admin/summary/list",
                //url: '/boxman/api/admin/summary/list',
                var url = '/boxman/api/admin/summary/list';
                console.log(url);
                
                $http({
                    method: 'GET',
                    //url: "http://www.jchip.com/boxman/api/admin/summary/list",
                    //url: '/boxman/api/admin/summary/list',
                    url: url,
                    headers: {
                        'Accept': 'application/json; odata=verbose' 
                    }
                })
                .success(function(data) {
                    console.log(data);
                    console.log(data['isSucess']);
                    console.log("data.isSuccess----");
                    console.log(data.isSuccess);
                    console.log(data.summary);
                    console.log(data.summary.messagenumber);

                    if(data.isSuccess) {
                    console.log("----");
                        item = data.summary;
                        console.log(item);
                    console.log(item.messagenumber);
                   }
                    console.log("--888--");
                })
                .error(function(err) {
                    console.log(err);
                });
                //data = svc.data;
                    console.log("--AAAS888--");
                console.log("item="+item);
                console.log("itemo="+item.messagenumber);
                return item;
            };

            return svc;
        }
    ])
    */
    .factory('dataService', ['$http', '$q', function ($http, $q) {
        var url = '/boxman/api/admin/summary/list';
        var defferer = $q.defer();
        console.log(url);
//      $http.jsonp(url).success(function (data) {
//          defferer.resolve(data);
//      });
        $http({
            method: 'GET',
            //url: "http://www.jchip.com/boxman/api/admin/summary/list",
            //url: '/boxman/api/admin/summary/list',
            url: url,
            headers: {
                'Accept': 'application/json; odata=verbose' 
            }
        })
        .success(function(data) {
            console.log("summary  scuess");

            defferer.resolve(data);
        })
        .error(function(err) {
            console.log(err);
        });
        return defferer.promise;
    }])
    .controller('summaryController',
    [
//        '$scope', '$http', '$location', '$routeParams', 'summaryService', 'dataService',
//        function ($scope, $http, $location, $routeParams, summaryService, dataService) {
        '$scope', '$http', '$location', '$routeParams', 'dataService',
        function ($scope, $http, $location, $routeParams, dataService) {
            //$scope.item = summaryService.list();
           
//      dataService.then(function (data) {
//          $scope.item = data.summary;
//      });
//        dataService.then(
//            function successCallback(response) {
//                // this callback will be called asynchronously
//                // when the response is available
//                $scope.item = response.summary;
//            },
//            function errorCallback(response) {
//                // called asynchronously if an error occurs
//                // or server returns response with an error status.
//                console.log(response);
//            }
//        );
             

            $scope.listSummary = function() {
                dataService.then(
                    function successCallback(response) {
                        // this callback will be called asynchronously
                        // when the response is available
                        $scope.item = response.summary;
                    },
                    function errorCallback(response) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        console.log(response);
                    }
                );
            };
            $scope.listSummary();
        }
    ]);

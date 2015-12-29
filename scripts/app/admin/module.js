
﻿'use strict';

angular
    .module('boxman.admin', ['ngRoute','pascalprecht.translate'])
    .config(
    [
        '$locationProvider', '$routeProvider', '$translateProvider',
        function ($locationProvider, $routeProvider, $translateProvider) {
            $routeProvider
                .when("/summary", {templateUrl: "views/admin/summaryList.html", controller: "summaryController"})
                .when("/players", {templateUrl: "views/admin/playerList.html", controller: "playerListController"})
                .when("/players/add", {templateUrl: "views/admin/playerDetail.html", controller: "playerAddController"})
                .when("/players/:index", {templateUrl: "views/admin/playerDetail.html", controller: "playerEditController"})
                .when("/activity", {templateUrl: "views/admin/activityList.html", controller: "activityController"})
                .when("/record", {templateUrl: "views/admin/recordList.html", controller: "recordController"})
                .when("/level", {templateUrl: "views/admin/levelList.html", controller: "levelController"})
                .when("/pass", {templateUrl: "views/admin/passList.html", controller: "passController"})
                .when("/message", {templateUrl: "views/admin/messageList.html", controller: "messageController"})
                .when("/thread", {templateUrl: "views/admin/threadList.html", controller: "threadController"})
                .otherwise({redirectTo: "/summary"}
            );

//            $locationProvider.html5Mode(true);
//            $routeProvider.when(locationService.current.path + ":culture/:page*", { reloadOnSearch: true, caseInsensitiveMatch: true});
//            $routeProvider.when(locationService.current.path + ":culture", { reloadOnSearch: false, caseInsensitiveMatch: true});
//            $routeProvider.when(locationService.current.path, { reloadOnSearch: false, caseInsensitiveMatch: true });
//            if (locationService.root != "") {
//                $routeProvider.otherwise(locationService.current.path, { reloadOnSearch: false, caseInsensitiveMatch: true });
//            }
        }
    ])
    .factory('actionService',
    [
        '$rootScope', '$http',
        function($rootScope, $http) {
            var svc = {};
            var data = [];
            var url = "";
            
            svc.http = function(action) {
                url = action;
                console.log(url);
                return svc;
            }
            svc.list = function(orderby, limit, success, error) {
                console.log("http get list = " + url);
                $http({
                    method: 'GET',
                    url: url,
                    params: {
                        orderby: orderby,
                        limit: limit
                    },
                    headers: {
                        'Accept': 'application/json; odata=verbose' 
                    }
                })
                .success(function(response) {
                    console.log("success ---------");
                    console.log(response);
                    if(response.isSuccess) {
                        for(var i=0; i < response.records.length; i++) {
                            data[i] = response.records[i];
                        }
                        if(success)
                            success(data);
                    }
                })
                .error(function(response) {
                    console.log("error ---------");
                    console.log(response);
                    if(error)
                        error(response);
                });
                return data;
            };
            svc.load = function(index) {
                return data[index];
            };
            svc.add = function(user) {
                data.push(user);
            };
            svc.edit = function(index, user) {
                data[index] = user;
            };
            svc.delete = function(index) {
                data[index] = null;
            };
            return svc;
        }
    ]);


//$.addScript('scripts/app/admin/controllers/userController.js');
$.addScript('scripts/app/admin/controllers/summaryController.js');
$.addScript('scripts/app/admin/controllers/playerController.js');
$.addScript('scripts/app/admin/controllers/activityController.js');
$.addScript('scripts/app/admin/controllers/recordController.js');
$.addScript('scripts/app/admin/controllers/levelController.js');
$.addScript('scripts/app/admin/controllers/passController.js');
$.addScript('scripts/app/admin/controllers/messageController.js');
$.addScript('scripts/app/admin/controllers/threadController.js');

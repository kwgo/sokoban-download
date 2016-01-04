
﻿'use strict';

angular
    .module('boxman.admin', ['ngRoute','angular-jwt', 'angular-jwt.interceptor', 'pascalprecht.translate', 'ui.router'])
    .config(
    [
        '$locationProvider', '$routeProvider', '$translateProvider', 
        function ($locationProvider, $routeProvider, $translateProvider) {
            console.log(".config...");
            var viewPath = "scripts/app/admin/views/";
            $routeProvider
                .when("/login", {templateUrl: viewPath + "login.html", controller: "loginController"})
                .when("/summary", {templateUrl: viewPath + "summaryList.html", controller: "summaryController"})
                .when("/players", {templateUrl: viewPath + "playerList.html", controller: "playerListController"})
                .when("/players/add", {templateUrl: viewPath + "playerDetail.html", controller: "playerAddController"})
                .when("/players/:index", {templateUrl: viewPath + "playerDetail.html", controller: "playerEditController"})
                .when("/activity", {templateUrl: viewPath + "activityList.html", controller: "activityController"})
                .when("/record", {templateUrl: viewPath + "recordList.html", controller: "recordController"})
                .when("/level", {templateUrl: viewPath + "levelList.html", controller: "levelController"})
                .when("/pass", {templateUrl: viewPath + "passList.html", controller: "passController"})
                .when("/message", {templateUrl: viewPath + "messageList.html", controller: "messageController"})
                .when("/thread", {templateUrl: viewPath + "threadList.html", controller: "threadController"})
                .otherwise({redirectTo: "/login"}
            );
        }
    ])
    .factory('actionService',
    [
        '$rootScope', '$http',
        function($rootScope, $http) {

            console.log(".factory...");
            var svc = {};
            //var data = [];
            //var url = "";
            
            var user;
            svc.setUser = function(loginedUser){
                user = loginedUser;
            }
            svc.isLoggedIn = function(){
                return(user)? user : false;
            }

            
            svc.http = {};
            svc.http.get = function(url, params, success, error) {
                console.log("get:" +  url + " - params = " + params);
               console.log(user.authorization);
                
                $http({
                    method: 'GET',
                    url: url,
                    params: params,
                    headers: {
//                        'Accept': 'application/json; odata=verbose' 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json; odata=verbose',
                        'Authorization': 'Basic ' + user.authorization
                    }
                })
                .then(
                    function(response) {
                        console.log(response);
                        if(success)
                            success(response);
                    },
                    function(response) {
                        console.log(response);
                        if(error)
                            error(response);
                    }
                );
            }
            svc.http.post = function(url, data, success, error) {
                console.log("post:" +  url + " == " + data);
                $http({
                    url: url,
                    method: "POST",
                    data: data
                })
                .then(
                    function(response) {
                        console.log('-- success --');
                        console.log(response);
                        if(success)
                            success(response);
                    },
                    function(response) {
                        console.log('-- error --');
                        console.log(response);
                        if(error)
                            error(response);
                    }
                );
            }

            svc.list = function(url, params, success, error) {
                svc.http.get(
                    url,
                    params,
                    function(response) {
                        var data = [];
                        if(response.data.isSuccess) {
                            for(var i=0; i < response.data.records.length; i++) {
                                data[i] = response.data.records[i];
                            }
                            if(success)
                                success(data);
                        }
                    },
                    error
                );
            }
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
    ])
    .run([
        '$rootScope', '$location', 'actionService',
        function ($rootScope, $location, actionService) {
            console.log(".run...");
            $rootScope.$on('$routeChangeStart', function (event) {
                console.log('$routeChangeStart');
                if (!actionService.isLoggedIn()) {
                    console.log('login DENY');
                    event.preventDefault();
                    $location.path('/login');
                }
                else {
                    console.log('login ALLOW');
                    //$location.path('/summary');
                }
            });
        }
    ]);

$.addScript('scripts/app/admin/controllers/loginController.js');
$.addScript('scripts/app/admin/controllers/summaryController.js');
$.addScript('scripts/app/admin/controllers/playerController.js');
$.addScript('scripts/app/admin/controllers/activityController.js');
$.addScript('scripts/app/admin/controllers/recordController.js');
$.addScript('scripts/app/admin/controllers/levelController.js');
$.addScript('scripts/app/admin/controllers/passController.js');
$.addScript('scripts/app/admin/controllers/messageController.js');
$.addScript('scripts/app/admin/controllers/threadController.js');

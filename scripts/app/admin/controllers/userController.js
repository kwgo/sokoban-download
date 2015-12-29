
﻿'use strict';

angular
    .module('boxman.admin', ['ngRoute'])
    .config(function($routeProvider){
        $routeProvider.when("/Items", {templateUrl: "views/admin/userList.html", controller: "listController"})
        .when("/Items/Add", {templateUrl: "views/admin/userDetail.html", controller: "addController"})
        .when("/Items/:index", {templateUrl: "views/admin/userDetail.html", controller: "editController"})
        .otherwise({redirectTo: "/Items"});
    })
    .factory('userService',
    [
        '$rootScope', function($rootScope) {
            var svc = {};
            var data = [
                {name:"jiang0", country:"", email:"a@c.com", level:2, entered:"12-12-2015", login:"01-11-2010", status:0},
                {name:"jiang1", country:"", email:"b@f.com", level:3, entered:"12-12-2015", login:"02-11-2011", status:1},
                {name:"jiang2", country:"", email:"c@b.com", level:3, entered:"12-12-2015", login:"03-11-2012", status:1},
                {name:"jiang3", country:"", email:"v@d.com", level:5, entered:"12-12-2015", login:"04-11-2013", status:0}
            ];
            svc.getUsers = function() {
                return data;
            };
            svc.getUser = function(index) {
                return data[index];
            };
            svc.addUser = function(user) {
                data.push(user);
            };
            svc.editUser = function(index, user) {
                data[index] = user;
            };
            return svc;
        }
    ])
    .controller('listController',
    [
        '$scope', '$http', '$location', '$routeParams', 'userService',
        function ($scope, $http, $location, $routeParams, userService) {
            $scope.data = userService.getUsers();

            $scope.addUser = function() {
                $location.path("/Items/Add");
            };
            $scope.editUser = function(index) {
                $location.path("/Items/" + index);
            };
            
        }
    ])
    .controller('addController',
    [
        '$scope', '$http', '$location', '$routeParams', 'userService',
        function ($scope, $http, $location, $routeParams, userService) {
            $scope.save = function() {
                var user = {
                    name: $scope.item.name,
                    country: "",
                    email: $scope.item.email,
                    level: 1,
                    entered: "",
                    login: "",
                    status: $scope.item.status
                };
                userService.addUser(user);
                $location.path("/Items");
            };
            $scope.cancel = function() {
                $location.path("/Items");
            };
            
        }
    ])
    .controller('editController',
    [
        '$scope', '$http', '$location', '$routeParams', 'userService',
        function ($scope, $http, $location, $routeParams, userService) {
            var index = parseInt($routeParams.index);
            var user = userService.getUser(index);
            $scope.item = user;

            $scope.save = function() {
                user.name = $scope.item.name;
                user.email = $scope.item.email;
                user.status = $scope.item.status;
                userService.editUser(index, user);
                $location.path("/Items");
            };
            $scope.cancel = function() {
                $location.path("/Items");
            };
            
        }
    ]);


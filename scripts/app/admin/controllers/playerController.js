'use strict';
angular
    .module('boxman.admin')
    .controller('playerListController',
    [
        '$scope', '$http', '$location', '$routeParams', 'actionService',
        function ($scope, $http, $location, $routeParams, actionService) {
            //url: "http://www.jchip.com/boxman/api/admin/player/playerList",
            var url = '/boxman/api/admin/player/playerList';
            
            if(!$scope.orderby)
                $scope.orderby = "ORDER BY id DESC";
            if(!$scope.limit)
                $scope.limit = "LIMIT 50";

            $scope.list = function() {
                actionService.list(
                    url,
                    { orderby: $scope.orderby, limit: $scope.limit },
                    function(data) {
                        $scope.data = data;
                    },
                    function(error) {
                        console.log(error);
                    }
                );
            };
            $scope.add = function() {
                $location.path("/players/add");
            };
            $scope.edit = function(index) {
                $location.path("/players/" + index);
            };
            
            $scope.list();
        }
    ])
    .controller('playerAddController',
    [
        '$scope', '$http', '$location', '$routeParams', 'actionService',
        function ($scope, $http, $location, $routeParams, actionService) {
            $scope.save = function() {
                var user = {
                    userid: 1,
                    username: $scope.item.username,
                    usercountry: "",
                    //usertype: 0,
                    useremail: $scope.item.useremail,
                    entereddate: "",
                    changeddate: "",
                    logindate: "",
                    userlevel: 1,
                    usermaxlevel: 1,
                    userfrozen: 0,
                    userstatus: $scope.item.userstatus
                };
                actionService.add(user);
                $location.path("/playes");
            };
            $scope.cancel = function() {
                $location.path("/playes");
            };
            
        }
    ])
    .controller('playerEditController',
    [
        '$scope', '$http', '$location', '$routeParams', 'actionService',
        function ($scope, $http, $location, $routeParams, actionService) {
            
            var index = parseInt($routeParams.index);
            var user = actionService.load(index);
            $scope.item = user;

            $scope.save = function() {
                user.username = $scope.item.username;
                user.useremail = $scope.item.useremail;
                user.userstatus = $scope.item.userstatus;

                actionService.edit(index, user);
                $location.path("/players");
            };
            $scope.cancel = function() {
                $location.path("/players");
            };
            
        }
    ]);

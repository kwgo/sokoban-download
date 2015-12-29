
﻿'use strict';

angular
    .module('boxman.admin')

/*        
    .config(function($routeProvider){
        $routeProvider.when("/players", {templateUrl: "views/admin/playerList.html", controller: "listController"})
        .when("/players/add", {templateUrl: "views/admin/playerDetail.html", controller: "addController"})
        .when("/players/:index", {templateUrl: "views/admin/playerDetail.html", controller: "editController"})
        .otherwise({redirectTo: "/players"});
    })
*/
    .factory('playerService',
    [
        '$rootScope', '$http',
        function($rootScope, $http) {
            var svc = {};
            var data = [];
            /*
                {"id":"2","username":"kwgoinfo","password":"","passwordmd5":"c2b2f076c396328a28f6c0bd5f6756af","usertype":"0","usercountry":"US","entereddate":"2007-05-07 12:50:05","useremail":"kwgoinfo@gmail.com","userstatus":"1","userlevel":"2","usermaxlevel":"2","userfrozen":"0","userpost":"0","changeddate":"2007-05-07 01:03:59","logindate":"2008-05-23 08:23:32"},
                {"id":"3","username":"jchip","password":"","passwordmd5":"9c7421ccd323a24565ed793efd7791c5","usertype":"0","usercountry":"CA","entereddate":"2007-05-14 11:54:15","useremail":"jchiphead@gmail.com","userstatus":"1","userlevel":"2","usermaxlevel":"42","userfrozen":"0","userpost":"3","changeddate":"2007-05-14 11:55:01","logindate":"2015-06-28 12:06:18"},
                {"id":"4","username":"jchiphead","password":"","passwordmd5":"c2b2f076c396328a28f6c0bd5f6756af","usertype":"0","usercountry":"CA","entereddate":"2007-05-29 12:50:51","useremail":"jchiphead@gmail.com","userstatus":"0","userlevel":"1","usermaxlevel":"1","userfrozen":"0","userpost":"0","changeddate":"2007-05-29 12:52:31","logindate":"2007-08-10 21:59:19"},
                {"id":"5","username":"cyberbin","password":"","passwordmd5":"a86b7fb97ce3a345129e621a6767736d","usertype":"0","usercountry":"CA","entereddate":"2007-05-29 07:18:56","useremail":"cyberbin@hotmail.com","userstatus":"1","userlevel":"11","usermaxlevel":"11","userfrozen":"0","userpost":"0","changeddate":"2007-05-29 07:19:26","logindate":"2007-06-09 20:55:30"},
                {"id":"25","username":"greencocoloco","password":"","passwordmd5":"6c1c8557c50075b740281b5479012c8e","usertype":"0","usercountry":"","entereddate":"2007-05-30 02:47:38","useremail":"greencocoloco@yahoo.com","userstatus":"0","userlevel":"0","usermaxlevel":"0","userfrozen":"0","userpost":"0","changeddate":"0000-00-00 00:00:00","logindate":"0000-00-00 00:00:00"},
                {"id":"3714","username":"kwgotest","password":"","passwordmd5":"c2b2f076c396328a28f6c0bd5f6756af","usertype":"0","usercountry":"","entereddate":"2015-10-15 12:46:44","useremail":"123@hotmail.com","userstatus":"1","userlevel":"0","usermaxlevel":"0","userfrozen":"0","userpost":"0","changeddate":"2015-10-15 12:46:44","logindate":"2015-10-15 12:46:57"}
            ];*/
            
            //Utility fuction to get aparameter from query string.
            svc.getQueryStringParameter = function (urlParameter) {
                var params = document.URL.split('?')[1].split('&');
                var strParams = '';
                for(var i = 0; i < params.length; i++) {
                    var singleParam = params[i].split('=');
                    if(singleParam[0] == urlParameter)
                        return singleParam[1];
                }
            };
            svc.list = function(orderby, limit, callback) {
                //var url = '/boxman/api/admin/player/list' + '?orderby='+orderby + '&limit='+limit;
                //url: "http://www.jchip.com/boxman/api/admin/player/list",
                //url: '/boxman/api/admin/player/list',
                var url = '/boxman/api/admin/player/list';
                console.log(url);
                
                $http({
                    method: 'GET',
                    //url: "http://www.jchip.com/boxman/api/admin/player/list",
                    //url: '/boxman/api/admin/player/list',
                    url: url,
                    params: {
                        orderby: orderby,
                        limit: limit
                    },
                    headers: {
                        'Accept': 'application/json; odata=verbose' 
                    }
                })
                .success(function(results) {
                    console.log(results);
                    //data = [];
                    for(var i=0; i < results.length; i++) {
                       data[i] = results[i];
//                       data.push(results[i]);
                       //console.log(results[i]);
                    }
                    callback(data);
                })
                .error(function(err) {
                    console.log(err);
                });
                //data = svc.data;
                return data;
            };
            svc.get = function(index) {
                return data[index];
            };
            svc.add = function(user) {
                data.push(user);
            };
            svc.edit = function(index, user) {
                data[index] = user;
            };
            return svc;
        }
    ])
    .controller('listController',
    [
        '$scope', '$http', '$location', '$routeParams', 'playerService',
        function ($scope, $http, $location, $routeParams, playerService) {
            
            if(!$scope.orderby)
                $scope.orderby = "ORDER BY id DESC";
            if(!$scope.limit)
                $scope.limit = "LIMIT 50";

            //$scope.data = 

            $scope.listPlayers = function() {
                playerService.list($scope.orderby, $scope.limit,
                    function(data) {
                        $scope.data = data;
                    }
                );
            };
            $scope.addPlayer = function() {
                $location.path("/players/add");
            };
            $scope.editPlayer = function(index) {
                $location.path("/players/" + index);
            };
            $scope.listPlayers();
        }
    ])
    .controller('addController',
    [
        '$scope', '$http', '$location', '$routeParams', 'playerService',
        function ($scope, $http, $location, $routeParams, playerService) {
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
                playerService.add(user);
                $location.path("/playes");
            };
            $scope.cancel = function() {
                $location.path("/playes");
            };
            
        }
    ])
    .controller('editController',
    [
        '$scope', '$http', '$location', '$routeParams', 'playerService',
        function ($scope, $http, $location, $routeParams, playerService) {
            var index = parseInt($routeParams.index);
            var user = playerService.get(index);
            $scope.item = user;

            $scope.save = function() {
                user.username = $scope.item.username;
                user.useremail = $scope.item.useremail;
                user.userstatus = $scope.item.userstatus;

                playerService.edit(index, user);
                $location.path("/players");
            };
            $scope.cancel = function() {
                $location.path("/players");
            };
            
        }
    ]);



﻿'use strict';

angular
    .module('boxman.admin', ['ngRoute','pascalprecht.translate'])
    .config(
    [
        '$locationProvider', '$routeProvider', '$translateProvider',
        function ($locationProvider, $routeProvider, $translateProvider) {
        $routeProvider.when("/players", {templateUrl: "views/admin/playerList.html", controller: "listController"})
        .when("/players/add", {templateUrl: "views/admin/playerDetail.html", controller: "addController"})
        .when("/players/:index", {templateUrl: "views/admin/playerDetail.html", controller: "editController"})
        .when("/summary", {templateUrl: "views/admin/summaryList.html", controller: "summaryController"})
        .otherwise({redirectTo: "/summary"});

//            $locationProvider.html5Mode(true);
//            $routeProvider.when(locationService.current.path + ":culture/:page*", { reloadOnSearch: true, caseInsensitiveMatch: true});
//            $routeProvider.when(locationService.current.path + ":culture", { reloadOnSearch: false, caseInsensitiveMatch: true});
//            $routeProvider.when(locationService.current.path, { reloadOnSearch: false, caseInsensitiveMatch: true });
//            if (locationService.root != "") {
//                $routeProvider.otherwise(locationService.current.path, { reloadOnSearch: false, caseInsensitiveMatch: true });
//            }
        }
    ]);


//$.addScript('scripts/app/admin/controllers/userController.js');
$.addScript('scripts/app/admin/controllers/summaryController.js');
$.addScript('scripts/app/admin/controllers/playerController.js');

'use strict';
angular
    .module('app')
    .controller('notfoundController',
    [
        '$translatePartialLoader',
        function ($translatePartialLoader) {
            $translatePartialLoader.addPart('notfound');
        }
    ]);
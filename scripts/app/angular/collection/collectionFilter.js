'use strict';

angular
    .module('lgi.emr.mar.web.collection')
    .filter('emptytofirst', function() {
        return function (collection, key) {
            if (angular.isArray(collection)) {
                var present = collection.filter(function (item) {
                    return item[key];
                });
                var empty = collection.filter(function (item) {
                    return !item[key];
                });
                return empty.concat(present);
            } else {
                return collection;
            }
        };
    }).filter('emptytolast', function() {
        return function (collection, key) {
            if (angular.isArray(collection)) {
                var present = collection.filter(function (item) {
                    return item[key];
                });
                var empty = collection.filter(function (item) {
                    return !item[key];
                });
                return present.concat(empty);
            } else {
                return collection;
            }
        }
    });
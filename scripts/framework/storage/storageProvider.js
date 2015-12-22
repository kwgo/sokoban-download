'use strict';
angular
    .module('lgi.infra.web.storage')
    .provider('storageService',
    [
        function () {
            var storageIsSuppored = typeof (Storage) !== "undefined";
            var provider = {
                supported: storageIsSuppored
            };

            this.$get =
            [
                function () {
                    var service = {
                        session: {
                            get: function (key) {
                                if (provider.supported) {
                                    return JSON.parse(sessionStorage.getItem(key));
                                }
                                return null;
                            },
                            set: function (key, value) {
                                if (provider.supported) {
                                    sessionStorage.setItem(key, JSON.stringify(value));
                                }
                            },
                            remove: function (key) {
                                if (provider.supported) {
                                    sessionStorage.removeItem(key);
                                }
                            },
                            removeAll: function (keys) {
                                // Remove the keys in the above array from the session storage
                                angular.forEach(keys, function (item) {
                                    service.session.remove(item);
                                });
                            }
                        },
                        local: {
                            get: function (key) {
                                if (provider.supported) {
                                    return JSON.parse(localStorage.getItem(key));
                                }
                                return null;
                            },
                            set: function (key, value) {
                                if (provider.supported) {
                                    localStorage.setItem(key, JSON.stringify(value));
                                }
                            },
                            remove: function (key) {
                                if (provider.supported) {
                                    localStorage.removeItem(key);
                                }
                            },
                            removeAll: function (keys) {
                                // Remove the keys in the above array from the session storage
                                angular.forEach(keys, function (item) {
                                    service.local.remove(item);
                                });
                            }
                        }
                    };

                    return service;
                }
            ];
        }
    ]);

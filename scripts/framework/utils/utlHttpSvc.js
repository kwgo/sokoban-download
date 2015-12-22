'use strict';

angular
    .module('lgi.infra.web.utils')
    .service('utlHttp',
    [
        '$http', 'utlString',
        function ($http, utlString) {

            this.get = function (cfg) {

                // Invokers should at least specify the url parameter
                if (utlString.isBlank(cfg.url)) {
                    throw new Error('url value is mandatory on cfg parameter');
                }

                var promise = $http.get(cfg.url, cfg);

                promise.error = function (fn) {
                    promise.then(null, function (response) {
                        if (response.status == 401 || response.status == 403) {
                            return;
                        }
                        fn(response.data, response.status, response.headers, cfg.config);
                    });
                    return promise;
                };

                return promise;
            };

            this.post = function (cfg) {

                // Invokers should at least specify the url parameter
                if (utlString.isBlank(cfg.url)) {
                    throw new Error('url value is mandatory on cfg parameter');
                }

                if (cfg.data === undefined)
                    throw new Error('data value is mandatory on cfg parameter for POST requests');

                var promise = $http.post(cfg.url, cfg.data);

                promise.error = function (fn) {
                    promise.then(null, function (response) {
                        if (response.status == 401 || response.status == 403) {
                            return;
                        }
                        fn(response.data, response.status, response.headers, cfg.config);
                    });
                    return promise;
                };
                return promise;
            };

            this.put = function (cfg) {

                // Invokers should at least specify the url parameter
                if (utlString.isBlank(cfg.url)) {
                    throw new Error('url value is mandatory on cfg parameter');
                }

                if (cfg.data === undefined)
                    throw new Error('data value is mandatory on cfg parameter for PUT requests');

                var promise = $http.put(cfg.url, cfg.data);

                promise.error = function (fn) {
                    promise.then(null, function (response) {
                        if (response.status == 401 || response.status == 403) {
                            return;
                        }
                        fn(response.data, response.status, response.headers, cfg.config);
                    });
                    return promise;
                };
                return promise;
            };

            this.del = function (cfg) {

                // Invokers should at least specify the url parameter
                if (utlString.isBlank(cfg.url)) {
                    throw new Error('url value is mandatory on cfg parameter');
                }

                var promise = $http.delete(cfg.url, cfg);

                promise.error = function (fn) {
                    promise.then(null, function (response) {
                        if (response.status == 401 || response.status == 403) {
                            return;
                        }
                        fn(response.data, response.status, response.headers, cfg.config);
                    });
                    return promise;
                };
                return promise;
            };
        }]);

'use strict';
angular
    .module('lgi.infra.web.loading')
    .provider('loadingService', 
    [
        function() {
            var provider = {
                template: '',
                displayTimeout: 0
            };
            this.setTemplate = function(content) {
                provider.template = content;
            };
            this.setOptions = function(options) {
                angular.extend(provider, options);
            };
            this.setTemplate('scripts/framework/loading/views/loading.html');

            this.$get = [
                '$q','$templateCache', 
                function ($q, $templateCache) {
                    var initInjector = angular.injector(['ng']);
                    var $http = initInjector.get('$http');
                    var service = {
                        displayTimeout: provider.displayTimeout,
                        getTemplate: function() {
                            var defer = $q.defer();
                            if (provider.template.toLowerCase().indexOf(".html") != -1) {
                                $http
                                    .get(provider.template, { cache: $templateCache })
                                    .success(function(data) {
                                        defer.resolve(data);
                                    })
                                    .error(function() {
                                        defer.reject('');
                                    });
                            } else {
                                defer.resolve(provider.template);
                            }

                            return defer.promise;
                        }
                    };

                    return service;
                }
            ];
        }
    ]);
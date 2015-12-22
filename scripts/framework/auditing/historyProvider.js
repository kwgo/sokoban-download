'use strict';

angular
    .module('lgi.infra.web.auditing')
    .provider('historyService',
    [
        'locationServiceProvider',
        function (locationServiceProvider) {
            var provider = {
                templateUrl: "",
                resourceUrl: "",
            };
            this.setTemplateUrl = function (url) {
                provider.templateUrl = url;
            };
            this.setResourceUrl = function (url) {
                provider.resourceUrl = url;
            };
            this.setTemplateUrl(locationServiceProvider.framework.root + "auditing/views/history.html");
            this.setResourceUrl(locationServiceProvider.framework.root + "auditing/i18n/history");

            this.$get = [
                function () {
                    var service = {
                        templateUrl: angular.copy(provider.templateUrl),
                        resourceUrl: angular.copy(provider.resourceUrl),
                        id: null,
                        type: null,
                        idSub: null,
                        rowFilter: null
                    };
                    service.setParams = function (id, type) {
                        service.id = id;
                        service.type = type;
                        service.idSub = -1;
                    };
                    service.setParams = function (id, type, idSub) {
                        service.id = id;
                        service.type = type;
                        service.idSub = idSub;
                    };
                    service.setRowFilter = function(filter) {
                        if (typeof filter == 'function' || filter == null) {
                            service.rowFilter = filter;
                        }
                    };
                    return service;
                }
            ];
        }
    ]);
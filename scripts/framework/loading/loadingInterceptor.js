'use strict';
angular
    .module('lgi.infra.web.loading')
    .factory('loadingInterceptor',
    [
        '$q', '$timeout', 'loadingService',
        function ($q, $timeout, loadingService) {

            var factory = {};
            var numLoadings = 0;
            var templateLoading = false;
            var template = null;
            var transparent = null;
            var transparentTemplate = "<div id='loading-mask' onselectstart='return false' style='position:fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 99999999999998; background:transparent'></div>";
            var timeout = null;

            var request = function (config) {

                if (!templateLoading) {
                    templateLoading = true;
                    transparent = $(transparentTemplate);
                    $(document.body).prepend(transparent);
                    loadingService.getTemplate().then(function (data) {
                        template = $(data).hide();
                        $(document.body).prepend(template);
                        displayLoading();
                    });
                }

                numLoadings++;
                displayLoading();
                return config || $q.when(config);
            };
            var response = function (res) {
                if ((--numLoadings) === 0) {
                    displayLoading();
                }
                return res || $q.when(res);
            };
            var responseError = function (res) {

                if (!(--numLoadings)) {
                    displayLoading();
                }

                return $q.reject(res);
            }
            var displayLoading = function () {
                if (template != null) {
                    if (numLoadings === 0) {
                        $timeout.cancel(timeout);
                        timeout = null;
                        transparent.hide();
                        template.hide();
                    } else {

                        if (timeout == null) {
                            transparent.show();
                            timeout = $timeout(function () {
                                template.show();
                            }, loadingService.displayTimeout);
                        }
                    }
                }
            }
            
            factory.request = request;
            factory.responseError = responseError;
            factory.response = response;

            return factory;
        }
    ]);
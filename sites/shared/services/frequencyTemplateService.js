'use strict';

angular
    .module('app')
    .service('frequencyTemplateService',

            ['$http', '$q', 'locationService', 'appSettingConstants',

            function ($http, $q, locationService, appSettingConstants) {
 
                var url = locationService.api + 'FrequencyTemplateService.svc/json/';

                return {
                    getTemplateList: function () {
                        var deferred = $q.defer(),
                            start = new Date().getTime(),
                            dataCache = sessionStorage.getItem(appSettingConstants.selectedFrequencyTemplateKey);

                        if (dataCache != null) {
                            deferred.resolve(JSON.parse(dataCache));
                        } else {
                            $http.get(url + "templates", { headers: { 'Content-Type': 'application/json' } })
                                .success(function (responseData) {
                                    console.log('Time taken for request FrequencyTemplateService: ' + (new Date().getTime() - start) + 'ms');
                                    //console.log(JSON.stringify(responseData.Result));

                                    var frequencies = responseData.Result;
                                    
                                    sessionStorage.setItem(appSettingConstants.selectedFrequencyTemplateKey, JSON.stringify(frequencies));
                                    deferred.resolve(frequencies);
                                });
                        }
                        return deferred.promise;
                    },
                    getTemplateById: function (id) {
                        var deferred = $q.defer(),
                            start = new Date().getTime();                            
                        $http.get(url + "template/"+id, { headers: { 'Content-Type': 'application/json' } })
                            .success(function (responseData) {
                                console.log('Time taken for request FrequencyTemplateService: ' + (new Date().getTime() - start) + 'ms');
                                var frequency = responseData.Result;
                                deferred.resolve(frequency);
                            });
                        return deferred.promise;
                    }
                };
            }
            ]);
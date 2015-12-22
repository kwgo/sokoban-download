'use strict';

angular
    .module('app')
    .service('observationService', [
        '$http', '$q', 'locationService',
        function ($http, $q, locationService) {
            var observationService = this;

            observationService.importObservations = function (pid, typeFlowSheet) {
                
                //var start = new Date().getTime();
                var deferred = $q.defer();

                var urlsvc = locationService.api + 'observationservice.svc/json/pid/' + pid + '/workflow/' + typeFlowSheet + '/latestObservations';
                $http.get(urlsvc, { headers: { 'Content-Type': 'application/json' } })
                         .success(function (responseData) {
                             //console.log('Time taken for request observationservice.importObservations ': ' + (new Date().getTime() - start) + 'ms');
                             //console.log("Response observationservice.svc: " + JSON.stringify(responseData));
                            deferred.resolve(responseData);
                        })
                        .error(function (responseData) {
                            return responseData;
                        });

                return deferred.promise;
            };
        }
]);
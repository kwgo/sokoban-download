'use strict';

angular
    .module('app')
    .service('advisorService', ['$http', '$q', 'locationService', function ($http, $q, locationService) {

        return {
            analyseAddition: function (patient, mx) {
                var urlsvc = locationService.api + 'advisorservice.svc/json/analyseAddition';
                var params = new Lgi.Emr.Mar.Dto.Advisor.MxAdditionAnalysisParam();
                params.patient = patient;
                params.mx = mx;

                var deferred = $q.defer();
                $http.post(urlsvc, params, { headers: { 'Content-Type': 'application/json' } })
                   .success(function (responseData, status) {
                       deferred.resolve(responseData);
                   })
                   .error(function (responseData, status) { 
                       deferred.reject(responseData.Errors); 
                   });

                return deferred.promise;
            }
        }
    }]);
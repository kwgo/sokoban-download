'use strict';

angular
    .module('app')
    .service('workflowService', [
        '$http', '$q', 'locationService',
        function ($http, $q, locationService) {
            var workflowService = this;

            workflowService.getLatestByVisitId = function (visitId, workflowId, limit) {
                var deferred = $q.defer(),
                    url = locationService.api + 'workflowinstanceservice.svc/json/' + 'visit/' + visitId + '/lastWorkflowInstances/' + workflowId;

                if (angular.isDefined(limit) && limit != null)
                    url += ('?limit=' + limit);

                $http.get(url, { headers: { 'Content-Type': 'application/json' } })
                    .success(function (responseData) {
                        deferred.resolve(responseData);
                    })
                    .error(function (responseData, status) {
                        return responseData;
                    });

                return deferred.promise;
            };

            return {
                getLatestByVisitId: function (visitId, workflowId, limit) {
                    return workflowService.getLatestByVisitId(visitId, workflowId, limit);
                }
            };
        }
]);
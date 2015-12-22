'use strict';
angular
    .module('app')
    .controller('workflowCancellationController', [

        '$filter', '$modalInstance', '$scope',
        'appSettingsFactory', 'entrepriseServices',
        function ($filter, $modalInstance, $scope,
                  appSettingsFactory, entrepriseServices) {

             initialize();

             function initialize() {
                 $scope.cultureManager.resources.shared.load('workflowCancellation');
                 $scope.model = {
                     reasonId: undefined
                 };

                 var orderBy = $filter('orderBy');
                 entrepriseServices
                     .lookup
                     .set(appSettingsFactory.dataLookups.cancellationReason, "cancellationReasons", $scope.model)
                     .then(function (result) {
                         result.scope[result.property] = orderBy(result.value, 'shortDescription');
                     });
             }

             $scope.onClose = function () {
                 $modalInstance.dismiss('cancel');
             };

             $scope.onSubmit = function () {
                 var item = {
                     reasonId: $scope.model.reasonId
                 };

                 $modalInstance.close(item);
             };

         }
    ]);
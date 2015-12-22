'use strict';
angular
    .module('app')
    .controller('mxCompositionController',
    [
        '$rootScope', '$scope', 'appSettingsFactory', '$modal', 'locationService', '$window', 'parameterService', 'entrepriseServices',
        function($rootScope, $scope, appSettingsFactory, $modal, locationService, $window, parameterService, entrepriseServices) {

            // Initialize variables
            $scope.amountUnitList = [];
            $scope.mxCompositeTypeList = [];
            $scope.strengthUnitList = [];

            // Only show the instructions section if there's at least one mx components whose type is "Other"
            $scope.displayInstructions = function () {
                return Enumerable.From($scope.rx.mxComposites)
                    .Where(function (i) {
                        return i.mxCompositeTypeId == 3;
                    }).Count();
            }

            // Get mx components whose type is "Other"
            $scope.mxCompositionTypeOther = function () {
                return function (item) {
                    console.log("item.mxCompositeTypeId: " + item.mxCompositeTypeId);
                    return item.mxCompositeTypeId == 3;
                };
            };

            var lookups = [
                [appSettingsFactory.dataLookups.amountUnit, "amountUnitList"],
                [appSettingsFactory.dataLookups.mxCompositeType, "mxCompositeTypeList"],
                [appSettingsFactory.dataLookups.strengthUnit, "strengthUnitList"]
            ];
            entrepriseServices
                .lookup
                .setMany(lookups, $scope);

            // Get amount unit description
            $scope.getAmountUnitListDescription = function(id) {
                console.log("Unit (amount) with id " + id + ": " + appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.amountUnitList));
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.amountUnitList);
            }

            // Get amount mx composite type description
            $scope.getMxCompositeTypeListDescription = function (id) {
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.mxCompositeTypeList);
            }

            // Get strength unit description
            $scope.getStrengthUnitListDescription = function (id) {
                console.log("Unit (strength) with id " + id + ": " + appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.strengthUnitList));
                return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.strengthUnitList);
            }
        }
    ]
);
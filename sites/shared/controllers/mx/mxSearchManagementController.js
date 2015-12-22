//mx Search Management Controller
'use strict';
angular.module('app')
    .controller('mxSearchManagementController',
    [
         '$scope', '$modalInstance', '$log', '$filter', 'entrepriseServices', 'appSettingsFactory', 'mxService', 'utlString',
         function ($scope, $modalInstance, $log, $filter, entrepriseServices, appSettingsFactory, mxService, utlString) {

             //Initialize
             initialize();

             $scope.onClickMx = function (mx) {
                $scope.selectedMx = mx;
                $modalInstance.close(mx); 
             };

             $scope.reverseDisplay = function () {
                 $scope.fullDisplay = !$scope.fullDisplay;
             };

             $scope.onSearch = function () {
                 //assign criteria to a new object
                 var criteria = {
                     productName: $scope.mxSearchCriteria.productName,
                     formId: (($scope.mxSearchCriteria.form != null) ? ($scope.mxSearchCriteria.form.id) : null),
                     includeAdvisor: $scope.mxSearchCriteria.includeAdvisor
                 };
                 //search only if we have at least a value
                 if (criteria.productName != null && criteria.productName.length >= 3) {
                     mxService.get(criteria).then(
                         function(scResult) {
                             $scope.isSearchAsRun = true; //mark for at least one search (will display search result message)
                             $scope.model.mx = Enumerable.From(scResult).Select(function(i) {
                                 return new Lgi.Emr.Mar.Dto.mxDto(angular.extend(i, { form: getFormDescription(i.formId) }));
                             }).ToArray();

                         },
                         function(scError) {
                             appSettingsFactory.displayError($scope.cultureManager.resources.translate('ERROR'), scError.data.Errors, $scope.cultureManager.resources.translate('CLOSE'));
                         }
                     );
                 } else {
                     //search length error
                     appSettingsFactory.displayPopover('bottom', '', $scope.cultureManager.resources.translate('ERROR_SEARCH_CRITERIA'), '#searchInput', 3000);
                 }

             };
             $scope.onClose = function () {
                 $modalInstance.dismiss('cancel');
             };
             $scope.onSubmit = function (mx) {
                 $modalInstance.close(mx);
             };
             $scope.onSearchCriteriaChange = function (evt) {
                 //evt is an optional kendo event, call onSearch only if we have a select value 
                 if (angular.isDefined(evt)) {
                     if (angular.isDefined(evt.sender.dataItem(evt.sender.select()))) {
                         $scope.onSearch();
                     }
                 }
                 //we need at least on searchCriteria to enable the search button
                if (angular.isDefined($scope.form.searchMxForm)) {
                    $scope.form.searchMxForm.$dirty = (($scope.mxSearchCriteria.productName != null) && ($scope.mxSearchCriteria.productName != '')) || ($scope.mxSearchCriteria.form != null);
                }
             };

             $scope.normalizeOrderBy = function (item) {
                 return utlString.normalize(item[$scope.model.orderByField]);

             };

             function initialize() {
                 $scope.cultureManager.resources.shared.load('mx-search');
                 $scope.isSearchAsRun = false;
                 $scope.selectedMx = null;
                 $scope.form = {};
                 $scope.model = {
                     orderByField: 'pharmacyDescription',
                     reverseSort: false,
                     mx: []
                 };
                 $scope.mxSearchCriteria = {
                     productName: null,
                     form: null,
                     includeAdvisor: false
                 };
                 $scope.formSelected = {};
                 $scope.fullDisplay = false;
                 entrepriseServices
                     .lookup
                     .set(appSettingsFactory.dataLookups.form, "formList", $scope).then(function () {
                         //diacritical sort on shortDescription
                         $scope.formList = Enumerable.From($scope.formList).Where(function (i) { return i.isActive == true && angular.isDefined(i.shortDescription); })
                         .OrderBy(function (i) { return utlString.normalize(i.shortDescription); }).ToArray();
                     
                 });
             }
             // form description
             function getFormDescription (id) {
                 return appSettingsFactory.getDataLookupShortDescriptionById(id, $scope.formList);
             };

         }
    ]);
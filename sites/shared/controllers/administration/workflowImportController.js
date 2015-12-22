'use strict';
angular
    .module('app')
    .controller('workflowImportController', [

        '$modalInstance', '$scope',
        'observationService', 'observationFactory',
        
        function ($modalInstance, $scope, observationService, observationFactory) {

             initialize();

             $scope.selectAll = function () {
                 var oldValue = $scope.model.selected;
                 Enumerable.From($scope.model.listObservation).ForEach(function (item) {
                     $scope.selectItem(item, !oldValue);
                 });
             };

             $scope.selectItem = function (item, newValue) {
                 if (item.selected != newValue){
                     item.selected = newValue;
                     item.selected ? ++$scope.model.selectedCount : --$scope.model.selectedCount;
                     $scope.model.selected = $scope.model.selectedCount > 0;
                 }
             };

             $scope.onSubmit = function () {
                 var selectedItems = Enumerable.From($scope.model.listObservation).Where(function(i) { return (i.selected); }).ToArray();
                 $modalInstance.close(selectedItems);
             };

             $scope.onClose = function () {
                 $modalInstance.dismiss('cancel');
             };

             function initialize() {
                 $scope.cultureManager.resources.shared.load('workflowImport');

                 $scope.model = {
                     selected: false,
                     selectedCount: 0,
                     listObservation: []
                 };

                 if ($scope.mode == "IMPORT") {
                     observationService
                         .importObservations($scope.pid, $scope.currentWorkflow.id)
                         .then(function(data) {
                                 // Extends the observation data to display
                                 if (angular.isDefined(data.Result)) {
                                     $scope.model.listObservation = data.Result;
                                     angular.forEach($scope.model.listObservation, function(observation) {
                                         angular.extend(observation,
                                             {
                                                 selected: false,
                                                 observation: observationFactory.getObservationById(observation.observationTypeId)
                                             }
                                         );
                                     });
                                 }
                             }
                         );
                 } else {
                     $scope.model.listObservation = $scope.currentWorkflowInstance.observations;
                     $scope.model.selected = true;
                     $scope.model.listObservation = Enumerable.From($scope.model.listObservation).Where(function (i) { return i.data != null && i.data.toString() != ""; }).ToArray();
                     $scope.model.selectedCount = Enumerable.From($scope.model.listObservation).Count(function (i) { return (i); });
                     angular.forEach($scope.model.listObservation, function (observation) {
                         if (observation.data != null && observation.data.toString() != "") {
                             angular.extend(observation,
                             {
                                 selected: true,
                                 observation: observationFactory.getObservationById(observation.observationTypeId),
                                 timestamp: observation.isNew ? $scope.currentWorkflowInstance.startDateTime : observation.timestamp,
                                 list: false
                             });

                             switch (observation.observation.code) {
                                 case observationFactory.observations.AXAADVREAC.code:
                                     if (angular.isUndefined(observation.dataAsString) || observation.dataAsString == null)
                                         observation.dataAsString = "";
                                     var arr = [];
                                     angular.forEach(observation.data.split(','), function (obs) {
                                         arr.push(Enumerable.From($scope.axaAdvReacList).Where(function (i) { return i.code == obs; }).First().shortDescription);
                                     });
                                     observation.dataAsString += arr.join(", ");
                                     break;
                                 case observationFactory.observations.GLYADVREAC.code:
                                     if (angular.isUndefined(observation.dataAsString) || observation.dataAsString == null)
                                         observation.dataAsString = "";
                                     var arr = [];
                                     angular.forEach(observation.data.split(','), function (obs) {
                                         arr.push(Enumerable.From($scope.glyAdvReacList).Where(function(i) { return i.code == obs; }).First().shortDescription);
                                     });
                                     observation.dataAsString += arr.join(", ");
                                     break;
                                 case observationFactory.observations.INSTYPE.code:
                                     var arr = observation.data.split("|");
                                     var str = new String("");
                                     str = arr[0] == true || arr[0] == "true"  ? $scope.cultureManager.resources.translate("BASAL") : "";
                                     str += arr[1] == true || arr[1] == "true" ? " " + $scope.cultureManager.resources.translate("PRANDIAL") : "";
                                     str += arr[2] == true || arr[2] == "true" ? " " + $scope.cultureManager.resources.translate("CORRECTIVE") : "";
                                     str += arr[3] == true || arr[3] != undefined && arr[3] != null ? " (" + $scope.cultureManager.resources.translate(arr[3]) + ")" : "";
                                     observation.dataAsString = str.trim();

                                     observation.dataAsList = [];
                                     if (arr[0] == true || arr[0] == "true") observation.dataAsList.push($scope.cultureManager.resources.translate("BASAL"));
                                     if (arr[1] == true || arr[1] == "true") observation.dataAsList.push($scope.cultureManager.resources.translate("PRANDIAL"));
                                     if (arr[2] == true || arr[2] == "true") observation.dataAsList.push($scope.cultureManager.resources.translate("CORRECTIVE"));
                                     if (arr[3] == true || arr[3] != undefined && arr[3] != null) observation.dataAsList.push($scope.cultureManager.resources.translate(arr[3]));
                                     observation.list = true;
                                     break;
                                 case observationFactory.observations.INSADM.code:
                                     var arr = observation.data.split("|");
                                     var str = arr[0] == true || arr[0] == "true" ? $scope.cultureManager.resources.translate("PEN_ADMINISTERED") : "";
                                     str += arr[1] == true || arr[1] == "true" ? " " + $scope.cultureManager.resources.translate("PATIENT_ADMINISTERED") : "";
                                     str += arr[2] == true || arr[2] == "true" ? " " + $scope.cultureManager.resources.translate("PROTOCOL_APPLICATION") : "";
                                     observation.dataAsString = str.trim();

                                     observation.dataAsList = [];
                                     if (arr[0] == true || arr[0] == "true") observation.dataAsList.push($scope.cultureManager.resources.translate("PEN_ADMINISTERED"));
                                     if (arr[1] == true || arr[1] == "true") observation.dataAsList.push($scope.cultureManager.resources.translate("PATIENT_ADMINISTERED"));
                                     if (arr[2] == true || arr[2] == "true") observation.dataAsList.push($scope.cultureManager.resources.translate("PROTOCOL_APPLICATION"));
                                     
                                     observation.list = true;
                                     break;
                                 case observationFactory.observations.GLUCOSE.code:
                                     var arr = observation.data.split("|");
                                     var str = arr[0];
                                     if (arr.length >= 3)
                                        str = arr[2] === "H" ? $scope.cultureManager.resources.translate("HIGH") : $scope.cultureManager.resources.translate("LOW");
                                     if (arr[1] === "BM")
                                        str += " (" + $scope.cultureManager.resources.translate("IN_BETWEEN_MEALS") + ")";
                                     else
                                        str += " (" + $scope.cultureManager.resources.translate(arr[1]) + ")";

                                     observation.dataAsString = str.trim();
                                     break;
                                 case observationFactory.observations.PAIN.code:
                                     var arr = observation.data.split("|");
                                     var scale = 10;
                                     if (arr[0] == "CPOT")
                                         scale = 8;
                                     if (arr[0] == "Dolo+")
                                         scale = 30;
                                     if (arr[0] == "PIPP")
                                         scale = 21;
                                     if (arr[0] == "PACSLAC")
                                         scale = 60;
                                     var str = arr[1] + " / " + scale + " (" + arr[0] + ")";
                                     observation.dataAsString = str.trim();
                                     break;
                                 case observationFactory.observations.SEDATION.code:
                                     var arr = observation.data.split("|");
                                     var str = arr[1] + " (" + arr[0] + ")";
                                     observation.dataAsString = str.trim();
                                     break;
                                 case observationFactory.observations.MOTOR.code:
                                     var arr = observation.data.split("|");
                                     var str = $scope.cultureManager.resources.translate(Enumerable.From(observationFactory.motricityCodes).Where(function (i) { return i.code == arr[0]; }).First().label);
                                     observation.dataAsString = str.trim();
                                     break;
                                 case observationFactory.observations.SENSATION.code:
                                     var arr = observation.data.split("|");
                                     var str = $scope.cultureManager.resources.translate(Enumerable.From(observationFactory.sensationCodes).Where(function (i) { return i.code == arr[0]; }).First().label);
                                     observation.dataAsString = str.trim();
                                     break;
                                 case observationFactory.observations.SNORING.code:
                                     var str = observation.data == true || observation.data == "true" ? $scope.cultureManager.resources.translate("YES") : $scope.cultureManager.resources.translate("NO");
                                     observation.dataAsString = str.trim();
                                     break;
                                 case observationFactory.observations.RR.code:
                                     var arr = observation.data.split("|");
                                     var str = arr[0] + " (";
                                     str += arr[1] == true || arr[1] == "true" ? $scope.cultureManager.resources.translate("REGULAR_ABBRV") + ", " : $scope.cultureManager.resources.translate("IRREGULAR_ABBRV") + ", ";
                                     var arr2 = [];
                                     if (arr.length > 2) {
                                         angular.forEach(arr[2].split(','), function (obs) {
                                             arr2.push(Enumerable.From($scope.rDescList).Where(function (i) { return i.code == obs; }).First().shortDescription);
                                         });
                                         str += arr2.join(", ");
                                     }
                                     str += ")";
                                     observation.dataAsString = str.trim();
                                     break;
                                 case observationFactory.observations.OXYGEN.code:
                                     var arr = observation.data.split("|");
                                     var str = arr[0] + " " + arr[1];
                                     observation.dataAsString = str.trim();
                                     break;
                                 case observationFactory.observations.PULSE.code:
                                     var arr = observation.data.split("|");
                                     var str = arr[0] + " (";
                                     str += arr[1] == true || arr[1] == "true" ? $scope.cultureManager.resources.translate("REGULAR_ABBRV") : $scope.cultureManager.resources.translate("IRREGULAR_ABBRV");
                                     str += ")";
                                     observation.dataAsString = str.trim();
                                     break;
                                 case observationFactory.observations.BP.code:
                                     var arr = observation.data.split("|");
                                     var str = arr[0] + "/" + arr[1];
                                     if(arr.length > 2)
                                        str += " (" + $scope.cultureManager.resources.translate(arr[2]) + ")";
                                     observation.dataAsString = str.trim();
                                     break;
                                 case observationFactory.observations.TEMP.code:
                                     if ((typeof observation.data === 'string') && observation.data.search("|") > -1) {
                                         var arr = observation.data.split("|");
                                         var str = arr[0] + " (" + $scope.cultureManager.resources.translate(arr[1]) + ")";
                                         observation.dataAsString = str.trim();
                                     }
                                     else
                                         observation.dataAsString = observation.data;
                                     break;
                                 default:
                                     observation.dataAsString = observation.data;
                                     break;
                             }
                         }
                     });
                 }
             }
         }
    ]);
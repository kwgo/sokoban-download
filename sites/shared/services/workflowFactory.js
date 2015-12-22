'use strict';

angular
    .module('app')
    .service('workflowFactory', [
        'cultureManager', 'observationFactory', 'utlString',
        function (cultureManager, observationFactory, utlString) {
            var workflowFactory = this;

            workflowFactory.workflows = {
                ANTICOAG: { shortDescription: 'Anticoagulant', index: 0 },
                DIABETES: { shortDescription: 'Diabetes', index: 1 },
                PAIN: { shortDescription: 'Pain', index: 2 },
                VITALS: { shortDescription: 'Vital signs', index: 3 },

                asArray: function () {
                    return [this.ANTICOAG, this.DIABETES, this.PAIN, this.VITALS];
                }
            };

            workflowFactory.initialized = false;
            workflowFactory.initialize = function (workflows, axaAdvReacList, glyAdvReacList) {
                var theWorkflows = angular.isArray(workflows) ? workflows : [workflows];
                angular.forEach(theWorkflows, function (aWorkflow) {
                    if (angular.isDefined(workflowFactory.workflows[aWorkflow.code])) {
                        // This adds the id, code, shortDescription attrs
                        workflowFactory.workflows[aWorkflow.code] = angular.extend(workflowFactory.workflows[aWorkflow.code], aWorkflow);
                    }
                });

                workflowFactory.axaAdvReacList = axaAdvReacList;
                workflowFactory.glyAdvReacList = glyAdvReacList;
                workflowFactory.initialized = true;
            };

            workflowFactory.workflowFactory = {
                newWorkflowInstance: function (workflow) {
                    var res = undefined;
                    switch (workflow.code) {
                        case workflowFactory.workflows.ANTICOAG.code: {
                            res = new Anticoag(workflow);
                            break;
                        }
                        case workflowFactory.workflows.PAIN.code: {
                            res = new Pain(workflow);
                            break;
                        }
                        case workflowFactory.workflows.DIABETES.code: {
                            res = new Diabetes(workflow);
                            break;
                        }
                        case workflowFactory.workflows.VITALS.code: {
                            res = new Vitals(workflow);
                            break;
                        }
                        default: {
                            throw new Error('Undefined workflow code [' + workflow.code + ']')
                        };
                    }
                    return res;
                }
            };

            workflowFactory.getObservation = function (observations, type) {
                if (angular.isUndefined(observations))
                    return observationFactory.newObservation(type);

                var res = undefined;
                angular.forEach(observations, function (observation) {
                    if (angular.isDefined(res))
                        return;
                    if (observation.observationTypeId === type.id)
                        res = observation;
                });
                if (angular.isUndefined(res))
                    res = observationFactory.newObservation(type);
                return res;
            };

            function Anticoag(workflow) {
                // this workflow object's id
                this.id = undefined;
                // this workflow object's version
                this.version = undefined;
                // a flag indicating if this workflow object has been cancelled
                this.isCancelled = false;
                // the cancellation reason id
                this.cancellationReasonId = undefined;
                // a flag indicating if this workflow object is a draft
                this.draft = true;
                // workflow type reference
                this.workflow = workflow;
                // timestamp
                this.dateTime = new Date();
                // flowsheet note
                this.note = observationFactory.newObservation(observationFactory.observations.NOTE);
                // partial tromboplastin time - int (ex: 50)
                this.ptt = observationFactory.newObservation(observationFactory.observations.PTT);
                // coagulation test - decimal (ex: 0.5)
                this.antiXa = observationFactory.newObservation(observationFactory.observations.ANTIXA);
                // international normalized ratio - decimal (ex: 3.5)
                this.inr = observationFactory.newObservation(observationFactory.observations.INR);
                // hemoglobin - int (ex: 300)
                this.hgb = observationFactory.newObservation(observationFactory.observations.HGB);
                // platelet - int (ex: 250)
                this.platelet = observationFactory.newObservation(observationFactory.observations.PLATELET);
                // adverse reaction, multi instance - string (ex: 'AXA_2')
                this.axaAdvReac = {
                    list: []
                };

                this.save = function () {
                    this.draft = false;
                }
                this.isDraft = function () { return this.draft === true; }
                this.isSaved = function () { return !this.isDraft()}
                this.isComplete = function () {
                    return (angular.isDefined(this.dateTime) && this.dateTime != null && this.dateTime != ""
                        && (
                            (angular.isDefined(this.note.data) && this.note.data != null && this.note.data != "")
                            || (angular.isDefined(this.ptt.data) && this.ptt.data != null)
                            || (angular.isDefined(this.antiXa.data) && this.antiXa.data != null)
                            || (angular.isDefined(this.inr.data) && this.inr.data != null)
                            || (angular.isDefined(this.hgb.data) && this.hgb.data != null)
                            || (angular.isDefined(this.platelet.data) && this.platelet.data != null)
                            || (angular.isDefined(this.axaAdvReac.list) && this.axaAdvReac.list.length > 0))
                        );
                }
                this.toWorkflowInstance = function () {
                    var instance = {
                        id: this.id,
                        version: this.version,
                        workflowId: this.workflow.id,
                        isCancelled: this.isCancelled,
                        cancellationReasonId: this.cancellationReasonId,
                        observations: []
                    };
                    if (angular.isDate(this.dateTime)) {
                        instance.startDateTime = this.dateTime;
                    } else {
                        instance.startDateTime = moment(this.dateTime).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                    };
                    if (angular.isDefined(this.ptt.data) && this.ptt.data != null)
                        instance.observations.push(this.ptt);
                    if (angular.isDefined(this.antiXa.data) && this.antiXa.data != null)
                        instance.observations.push(this.antiXa);
                    if (angular.isDefined(this.inr.data) && this.inr.data != null)
                        instance.observations.push(this.inr);
                    if (angular.isDefined(this.hgb.data) && this.hgb.data != null)
                        instance.observations.push(this.hgb);
                    if (angular.isDefined(this.platelet.data) && this.platelet.data != null)
                        instance.observations.push(this.platelet);
                    if (angular.isDefined(this.axaAdvReac.list) && this.axaAdvReac.list.length > 0) {
                        var obs = observationFactory.newObservation(observationFactory.observations.AXAADVREAC);
                        obs.id = this.axaAdvReac.id;
                        obs.isNew = angular.isDefined(this.axaAdvReac.isNew) ? this.axaAdvReac.isNew : obs.isNew;
                        obs.version = this.axaAdvReac.version;
                        obs.timestamp = angular.isDefined(this.axaAdvReac.timestamp) ? this.axaAdvReac.timestamp : obs.timestamp;

                        if (Enumerable.From(this.axaAdvReac.list).Any(function (i) { return angular.isDefined(i.data); }))
                            obs.data = Enumerable.From(this.axaAdvReac.list).Where(function (i) { return angular.isDefined(i.data); }).Select(function (i) { return i.data; }).ToArray().join(",");
                        else
                            obs.data = Enumerable.From(this.axaAdvReac.list).Select(function (i) { return i; }).ToArray().join(",");

                        instance.observations.push(obs);
                    }
                    if (angular.isDefined(this.note.data) && this.note.data != null && this.note.data != "")
                        instance.observations.push(this.note);

                    // All new observation timestamp must be same as flowsheet
                    angular.forEach(instance.observations, function (observation) {
                        observation.timestamp = observation.isNew && !instance.isCancelled ? instance.startDateTime : observation.timestamp;
                    });

                    return instance;
                };
                this.fromWorkflowInstance = function (workflowInstance) {
                    this.id = workflowInstance.id;
                    this.version = workflowInstance.version;
                    this.isCancelled = workflowInstance.isCancelled;
                    this.cancellationReasonId = workflowInstance.cancellationReasonId;
                    this.dateTime = workflowInstance.startDateTime;

                    angular.forEach(workflowInstance.observations, function (observation) {
                        var targetObservation = undefined;
                        var data = undefined;
                        if (observationFactory.observations.PTT.id === observation.observationTypeId) {
                            targetObservation = this.ptt;
                            data = parseFloat(observation.data);
                        }
                        if (observationFactory.observations.ANTIXA.id === observation.observationTypeId) {
                            targetObservation = this.antiXa;
                            data = parseFloat(observation.data);
                        }
                        if (observationFactory.observations.INR.id === observation.observationTypeId) {
                            targetObservation = this.inr;
                            data = parseFloat(observation.data);
                        }
                        if (observationFactory.observations.HGB.id === observation.observationTypeId) {
                            targetObservation = this.hgb;
                            data = parseInt(observation.data);
                        }
                        if (observationFactory.observations.PLATELET.id === observation.observationTypeId) {
                            targetObservation = this.platelet;
                            data = parseInt(observation.data);
                        }
                        if (observationFactory.observations.NOTE.id === observation.observationTypeId) {
                            targetObservation = this.note;
                            data = observation.data;
                        }
                        if (angular.isDefined(targetObservation)) {
                            targetObservation.dataAsString = observation.dataAsString;
                            targetObservation.data = data;
                            targetObservation.id = observation.id;
                            targetObservation.isNew = observation.isNew;
                            targetObservation.timestamp = observation.timestamp,
                            targetObservation.version = observation.version;
                        }
                        else {
                            if (observationFactory.observations.AXAADVREAC.id === observation.observationTypeId) {
                                this.axaAdvReac.id = observation.id;
                                this.axaAdvReac.isNew = observation.isNew;
                                this.axaAdvReac.timestamp = observation.timestamp;
                                this.axaAdvReac.data = observation.data;
                                this.axaAdvReac.dataAsString = observation.dataAsString;
                                this.axaAdvReac.version = observation.version;
                                var listdata = [];
                                angular.forEach(observation.data.split(','), function (_data) {
                                    listdata.push({
                                        data: _data,
                                    });
                                });
                                this.axaAdvReac.list = listdata;
                            }
                        }
                    }, this);
                };
            }
            function Pain(workflow) {
                // this workflow object's id
                this.id = undefined;
                // this workflow object's version
                this.version = undefined;
                // a flag indicating if this workflow object has been cancelled
                this.isCancelled = false;
                // the cancellation reason id
                this.cancellationReasonId = undefined;
                // a flag indicating if this workflow object is a draft
                this.draft = true;
                // workflow type reference
                this.workflow = workflow;
                // timestamp
                this.dateTime = new Date();
                // flowsheet note
                this.note = observationFactory.newObservation(observationFactory.observations.NOTE);

                // pain
                this.pain = observationFactory.newObservation(observationFactory.observations.PAIN);
                // enum: NPIS, CPOT, DOLO+, VAS, FPS, FLACC, PIPP, PACSLAC
                this.pain.scale = observationFactory.painScales.NPIS.code;
                // int (ex: 4)
                this.pain.intensity = undefined;

                // pain site
                this.painSite = observationFactory.newObservation(observationFactory.observations.PAINSITE);

                // snoring - boolean (ex: true)
                this.snoring = observationFactory.newObservation(observationFactory.observations.SNORING);

                // sedation
                this.sedation = observationFactory.newObservation(observationFactory.observations.SEDATION);
                // enum: POSS, RASS, RAMSAY
                this.sedation.scale = undefined;
                // string, according to scale
                //   POSS = S, 1, 2, 3, 4
                //   RASS = +4, +3, +2, +1, 0, -1, -2, -3, -4, -5
                //   RAMSAY = 1, 2, 3, 4, 5, 6
                this.sedation.level = undefined;

                // motricity - enum: P, I, A (ex: 'A')
                this.motor = observationFactory.newObservation(observationFactory.observations.MOTOR);

                // sensation - enum: P, I, A (ex: 'A')
                this.sensation = observationFactory.newObservation(observationFactory.observations.SENSATION);

                // breathing - 
                this.rr = observationFactory.newObservation(observationFactory.observations.RR);
                // int (ex: 22)
                this.rr.value = undefined;
                // boolean (ex: true)
                this.rr.regular = true;

                // saturation - int (ex: 100)
                this.spo2 = observationFactory.newObservation(observationFactory.observations.SPO2);

                // oxygen
                this.oxygen = observationFactory.newObservation(observationFactory.observations.OXYGEN);
                // int
                this.oxygen.amount = undefined;
                // enum: %, LMIN
                this.oxygen.unit = '%';

                // pulse
                this.pulse = observationFactory.newObservation(observationFactory.observations.PULSE);
                // int
                this.pulse.value = undefined;
                // boolean: true|false
                this.pulse.regular = true;

                // blood pressure
                this.bp = observationFactory.newObservation(observationFactory.observations.BP);
                // int
                this.bp.systolic = undefined;
                this.bp.diastolic = undefined;
                // enum: LYING, SITTING, STANDING
                this.bp.position = undefined;

                // respiration description, multi instance - string (ex: 'PAUSE')
                this.rr.rDesc = {
                    list: undefined
                };

                this.save = function () {
                    this.draft = false;
                }
                this.isDraft = function () { return this.draft === true; }
                this.isSaved = function () { return !this.isDraft() }
                this.isComplete = function () {

                    if (angular.isUndefined(this.rr.rDesc.list) || this.rr.rDesc.list.length <= 0) {
                        this.rr.rDesc.list = [];
                        return false;
                    }
                    if (angular.isUndefined(this.rr.value) || this.rr.value == null || this.rr.value == "") {
                        return false;
                    }
                    if (angular.isUndefined(this.painSite.data) || this.painSite.data == null || this.painSite.data == "") {
                        return false;
                    }
                    return angular.isDefined(this.dateTime) && this.dateTime != null && this.dateTime != ""
                        && (
                            (angular.isDefined(this.note.data) && this.note.data != null && this.note.data != "")
                            || (angular.isDefined(this.pain.scale) && angular.isDefined(this.pain.intensity) && this.pain.scale != null && this.pain.intensity != null)
                            || (angular.isDefined(this.painSite.data) && this.painSite.data != null && this.painSite.data != "")
                            || (angular.isDefined(this.snoring.data) && this.snoring.data != null)
                            || (angular.isDefined(this.sedation.scale) && angular.isDefined(this.sedation.level) && this.sedation.scale != null && this.sedation.level != null)
                            || (angular.isDefined(this.motor.data) && this.motor.data != null && this.motor.data != "")
                            || (angular.isDefined(this.sensation.data) && this.sensation.data != null)
                            || (angular.isDefined(this.rr.value) && angular.isDefined(this.rr.regular) && this.rr.value != null && this.rr.regular != null && this.rr.value != "")
                            || (angular.isDefined(this.spo2.data) && this.spo2.data != null)
                            || (angular.isDefined(this.oxygen.amount) && angular.isDefined(this.oxygen.unit) && this.oxygen.amount != null && this.oxygen.unit != null)
                            || (angular.isDefined(this.pulse.value) && angular.isDefined(this.pulse.regular) && this.pulse.value != null && this.pulse.regular != null)
                            || (angular.isDefined(this.bp.systolic) && angular.isDefined(this.bp.diastolic) && this.bp.systolic != null && this.bp.diastolic != null)
                        );
                };
                this.toWorkflowInstance = function () {
                    var instance = {
                        id: this.id,
                        version: this.version,
                        workflowId: this.workflow.id,
                        isCancelled: this.isCancelled,
                        cancellationReasonId: this.cancellationReasonId,
                        observations: []
                    };
                    if (angular.isDate(this.dateTime)) {
                        instance.startDateTime = this.dateTime;
                    } else {
                        instance.startDateTime = moment(this.dateTime).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                    };
                    if (angular.isDefined(this.pain.scale) && angular.isDefined(this.pain.intensity) && this.pain.scale != null && this.pain.intensity != null) {
                        this.pain.data = this.pain.scale + '|' + this.pain.intensity;
                        instance.observations.push(this.pain);
                    }
                    if (angular.isDefined(this.painSite.data) && this.painSite.data != null && this.painSite.data != "")
                        instance.observations.push(this.painSite);
                    if (angular.isDefined(this.snoring.data) && this.snoring.data != null)
                        instance.observations.push(this.snoring);
                    if (angular.isDefined(this.sedation.scale) && angular.isDefined(this.sedation.level) && this.sedation.scale != null && this.sedation.level != null) {
                        this.sedation.data = this.sedation.scale + '|' + this.sedation.level;
                        instance.observations.push(this.sedation);
                    }
                    if (angular.isDefined(this.motor.data) && this.motor.data != null && this.motor.data != "")
                        instance.observations.push(this.motor);
                    if (angular.isDefined(this.sensation.data) && this.sensation.data != null)
                        instance.observations.push(this.sensation);
                    if ((angular.isDefined(this.rr.value) && angular.isDefined(this.rr.regular) && this.rr.value != null && this.rr.regular != null) || (angular.isDefined(this.rr.rDesc) && angular.isDefined(this.rr.rDesc.list) && this.rr.rDesc.list.length > 0)) {

                        if (angular.isDefined(this.rr.value) && angular.isDefined(this.rr.regular) && this.rr.value != null && this.rr.regular != null)
                            this.rr.data = this.rr.value + '|' + this.rr.regular;
                        else
                            this.rr.data = '|' + this.rr.regular;

                        if (angular.isDefined(this.rr.rDesc) && angular.isDefined(this.rr.rDesc.list) && this.rr.rDesc.list.length > 0) {
                            if (Enumerable.From(this.rr.rDesc.list).Any(function (i) { return angular.isDefined(i.data); }))
                                this.rr.data += '|' + Enumerable.From(this.rr.rDesc.list).Where(function (i) { return angular.isDefined(i.data); }).Select(function (i) { return i.data; }).ToArray().join(",");
                            else 
                                this.rr.data += '|' + Enumerable.From(this.rr.rDesc.list).Select(function (i) { return i; }).ToArray().join(",");
                        }
                        instance.observations.push(this.rr);
                    }
                    if (angular.isDefined(this.spo2.data) && this.spo2.data != null)
                        instance.observations.push(this.spo2);
                    if (angular.isDefined(this.oxygen.amount) && angular.isDefined(this.oxygen.unit) && this.oxygen.amount != null && this.oxygen.unit != null) {
                        this.oxygen.data = this.oxygen.amount + '|' + this.oxygen.unit;
                        instance.observations.push(this.oxygen);
                    }
                    if (angular.isDefined(this.pulse.value) && angular.isDefined(this.pulse.regular) && this.pulse.value != null && this.pulse.regular != null) {
                        this.pulse.data = this.pulse.value + '|' + this.pulse.regular;
                        instance.observations.push(this.pulse);
                    }
                    if ((angular.isDefined(this.bp.systolic) && this.bp.systolic != null) || (angular.isDefined(this.bp.diastolic) && this.bp.diastolic != null)) {

                        if (angular.isDefined(this.bp.systolic) && this.bp.systolic != null)
                            this.bp.data = this.bp.systolic;
                        else
                            this.bp.data = "";

                        this.bp.data += '|';

                        if (angular.isDefined(this.bp.diastolic) && this.bp.diastolic != null)
                            this.bp.data += this.bp.diastolic;
                        else
                            this.bp.data += "";

                        if (angular.isDefined(this.bp.position) && this.bp.position != null)
                            this.bp.data += '|' + this.bp.position;
                        instance.observations.push(this.bp);
                    }

                    if (angular.isDefined(this.note.data) && this.note.data != null && this.note.data != "")
                        instance.observations.push(this.note);

                    // All new observation timestamp must be same as flowsheet
                    angular.forEach(instance.observations, function (observation) {
                        observation.timestamp = observation.isNew && !instance.isCancelled ? instance.startDateTime : observation.timestamp;
                    });

                    return instance;
                };
                this.fromWorkflowInstance = function (workflowInstance) {
                    this.id = workflowInstance.id;
                    this.version = workflowInstance.version;
                    this.isCancelled = workflowInstance.isCancelled;
                    this.cancellationReasonId = workflowInstance.cancellationReasonId;
                    this.dateTime = workflowInstance.startDateTime;

                    angular.forEach(workflowInstance.observations, function (observation) {
                        var targetObservation = undefined;
                        var data = undefined;
                        if (observationFactory.observations.NOTE.id === observation.observationTypeId) {
                            targetObservation = this.note;
                            data = observation.data;
                        }
                        if (observationFactory.observations.PAIN.id === observation.observationTypeId) {
                            var values = observation.data.split('|');
                            this.pain.scale = values[0];
                            if (observationFactory.isPainScaleNumeric(this.pain.scale))
                                this.pain.intensity = parseInt(values[1]);
                            else
                                this.pain.intensity = values[1];

                            this.pain.dataAsString = observation.dataAsString;
                            this.pain.id = observation.id;
                            this.pain.isNew = observation.isNew;
                            this.pain.timestamp = observation.timestamp;
                            this.pain.version = observation.version;
                        }
                        if (observationFactory.observations.PAINSITE.id === observation.observationTypeId) {
                            targetObservation = this.painSite;
                            data = observation.data;
                        }
                        if (observationFactory.observations.SNORING.id === observation.observationTypeId) {
                            targetObservation = this.snoring;
                            data = observation.data.toString().toLowerCase() === 'true';
                        }
                        if (observationFactory.observations.SEDATION.id === observation.observationTypeId) {
                            var values = observation.data.split('|');
                            this.sedation.scale = values[0];
                            this.sedation.level = values[1];

                            this.sedation.dataAsString = observation.dataAsString;
                            this.sedation.id = observation.id;
                            this.sedation.isNew = observation.isNew;
                            this.sedation.timestamp = observation.timestamp;
                            this.sedation.version = observation.version;
                        }
                        if (observationFactory.observations.MOTOR.id === observation.observationTypeId) {
                            targetObservation = this.motor;
                            data = observation.data;
                        }
                        if (observationFactory.observations.SENSATION.id === observation.observationTypeId) {
                            targetObservation = this.sensation;
                            data = observation.data;
                        }
                        if (observationFactory.observations.RR.id === observation.observationTypeId) {
                            var values = observation.data.split('|');
                            this.rr.value = parseInt(values[0]);
                            this.rr.regular = values[1].toLowerCase() === 'true';
                            this.rr.rDesc = {}; this.rr.rDesc.list = [];
                            if (values.length > 2)
                                this.rr.rDesc.list = values[2].split(',');

                            this.rr.dataAsString = observation.dataAsString;
                            this.rr.id = observation.id;
                            this.rr.isNew = observation.isNew;
                            this.rr.timestamp = observation.timestamp;
                            this.rr.version = observation.version;
                        }
                        if (observationFactory.observations.SPO2.id === observation.observationTypeId) {
                            targetObservation = this.spo2;
                            data = parseInt(observation.data);
                        }
                        if (observationFactory.observations.OXYGEN.id === observation.observationTypeId) {
                            var values = observation.data.split('|');
                            this.oxygen.amount = parseInt(values[0]);
                            this.oxygen.unit = values[1];

                            this.oxygen.dataAsString = observation.dataAsString;
                            this.oxygen.id = observation.id;
                            this.oxygen.isNew = observation.isNew;
                            this.oxygen.timestamp = observation.timestamp;
                            this.oxygen.version = observation.version;
                        }
                        if (observationFactory.observations.PULSE.id === observation.observationTypeId) {
                            var values = observation.data.split('|');
                            this.pulse.value = parseInt(values[0]);
                            this.pulse.regular = values[1].toLowerCase() === 'true';

                            this.pulse.dataAsString = observation.dataAsString;
                            this.pulse.id = observation.id;
                            this.pulse.isNew = observation.isNew;
                            this.pulse.timestamp = observation.timestamp;
                            this.pulse.version = observation.version;
                        }
                        if (observationFactory.observations.BP.id === observation.observationTypeId) {
                            var values = observation.data.split('|');
                            this.bp.systolic = parseInt(values[0]);
                            this.bp.diastolic = parseInt(values[1]);
                            if (values.length > 2)
                                this.bp.position = values[2];

                            this.bp.dataAsString = observation.dataAsString;
                            this.bp.id = observation.id;
                            this.bp.isNew = observation.isNew;
                            this.bp.timestamp = observation.timestamp;
                            this.bp.version = observation.version;
                        }

                        if (angular.isDefined(targetObservation)) {
                            targetObservation.dataAsString = observation.dataAsString;
                            targetObservation.data = data;
                            targetObservation.id = observation.id;
                            targetObservation.isNew = observation.isNew;
                            targetObservation.timestamp = observation.timestamp;
                            targetObservation.version = observation.version;
                        }
                    }, this);
                };
            }
            function Diabetes(workflow) {
                this.id = undefined;
                this.version = undefined;
                this.isCancelled = false;
                this.cancellationReasonId = undefined;
                this.draft = true;

                this.workflow = workflow;
                // timestamp
                this.dateTime = new Date();
                // note
                this.diabNote = observationFactory.newObservation(observationFactory.observations.DIABNOTE);

                // glucose
                this.glucose = observationFactory.newObservation(observationFactory.observations.GLUCOSE);
                // decimal
                this.glucose.value = undefined;
                // enum: AC, PC, BM
                this.glucose.period = 'AC';

                // string - must contain one or two integer(s) seperated by an hypen ("-")
                // ex: 0-49, 75
                this.mealPerc = observationFactory.newObservation(observationFactory.observations.MEALPERC);

                // int (ex: 100)
                this.carbohydrates = observationFactory.newObservation(observationFactory.observations.CARBS);

                // boolean|boolean|boolean - basal|prandial|correction (ex: false|true|false)
                this.insType = observationFactory.newObservation(observationFactory.observations.INSTYPE);
                this.insType.basal = false;
                this.insType.prandial = false;
                this.insType.corrective = false;
                this.insType.insInjSite = undefined;

                // boolean|boolean|boolean - withAPen|selfAdministered|hypoglycemiaProtocol (ex: true|false|false)
                this.insAdm = observationFactory.newObservation(observationFactory.observations.INSADM);
                this.insAdm.withAPen = false;
                this.insAdm.selfAdministered = false;
                this.insAdm.hypoglycemiaProtocol = false;

                // adverse reaction, multi instance - string (ex: 'GLY_1')
                this.glyAdvReac = {
                    list: []
                };

                this.save = function () {
                    this.draft = false;
                }
                this.isDraft = function () { return this.draft === true; }
                this.isSaved = function () { return !this.isDraft() };
                this.isComplete = function () {
                    return angular.isDefined(this.dateTime) && this.dateTime != null && this.dateTime != ""
                        && (this.insType.basal == true || this.insType.prandial == true || this.insType.corrective == true)
                        && (
                            (angular.isDefined(this.diabNote.data) && this.diabNote.data != null && this.diabNote.data != "")
                            || ((angular.isDefined(this.glucose.value) && angular.isDefined(this.glucose.period) && this.glucose.value != null && this.glucose.period != null)
                                || (angular.isDefined(this.glucose.highLow) && this.glucose.highLow != null))
                            || (angular.isDefined(this.mealPerc.data) && this.mealPerc.data != null && this.mealPerc.data != "")
                            || (angular.isDefined(this.carbohydrates.data) && this.carbohydrates.data != null)
                            || (angular.isDefined(this.insType.basal) && angular.isDefined(this.insType.prandial) && angular.isDefined(this.insType.corrective)
                                    && this.insType.basal != null && this.insType.prandial != null && this.insType.corrective != null)
                            || (angular.isDefined(this.insAdm.withAPen) && angular.isDefined(this.insAdm.selfAdministered) && angular.isDefined(this.insAdm.hypoglycemiaProtocol)
                                    && this.insAdm.withAPen != null && this.insAdm.selfAdministered != null && this.insAdm.hypoglycemiaProtocol != null)
                            || (angular.isDefined(this.glyAdvReac.list) && this.glyAdvReac.list.length > 0)
                        );
                };
                this.toWorkflowInstance = function () {
                    var instance = {
                        id: this.id,
                        version: this.version,
                        workflowId: this.workflow.id,
                        isCancelled: this.isCancelled,
                        cancellationReasonId: this.cancellationReasonId,
                        observations: []
                    };
                    if (angular.isDate(this.dateTime)) {
                        instance.startDateTime = this.dateTime;
                    } else {
                        instance.startDateTime = moment(this.dateTime).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                    };

                    if (angular.isDefined(this.glucose.highLow) && this.glucose.highLow != null && this.glucose.highLow != '' && (this.glucose.highLow == 'H' || this.glucose.highLow == 'L')) {
                        this.glucose.data = '0' + '|' + this.glucose.period + '|' + this.glucose.highLow;
                        instance.observations.push(this.glucose);
                    } else if (angular.isDefined(this.glucose.value) && angular.isDefined(this.glucose.period) && this.glucose.value != null && this.glucose.value != "" && this.glucose.period != null) {
                        this.glucose.data = this.glucose.value + '|' + this.glucose.period;
                        instance.observations.push(this.glucose);
                    }
                    
                    if (angular.isDefined(this.mealPerc.data) && this.mealPerc.data != null && this.mealPerc.data != "")
                        instance.observations.push(this.mealPerc);
                    if (angular.isDefined(this.carbohydrates.data) && this.carbohydrates.data != null)
                        instance.observations.push(this.carbohydrates);
                    if (angular.isDefined(this.insType.basal) && angular.isDefined(this.insType.prandial) && angular.isDefined(this.insType.corrective) 
                            && this.insType.basal != null && this.insType.prandial != null && this.insType.corrective != null) {
                        this.insType.data = this.insType.basal + '|' + this.insType.prandial + '|' + this.insType.corrective;

                        if (angular.isDefined(this.insType.insInjSite) && this.insType.insInjSite != null && this.insType.insInjSite != "")
                            this.insType.data += '|' + this.insType.insInjSite;

                        instance.observations.push(this.insType);
                    }
                    if (angular.isDefined(this.insAdm.withAPen) && angular.isDefined(this.insAdm.selfAdministered) && angular.isDefined(this.insAdm.hypoglycemiaProtocol)
                            && this.insAdm.withAPen != null && this.insAdm.selfAdministered != null && this.insAdm.hypoglycemiaProtocol != null) {
                        this.insAdm.data = this.insAdm.withAPen + '|' + this.insAdm.selfAdministered + '|' + this.insAdm.hypoglycemiaProtocol;
                        instance.observations.push(this.insAdm);
                    }

                    if (angular.isDefined(this.glyAdvReac.list) && this.glyAdvReac.list.length > 0) {
                        var obs = observationFactory.newObservation(observationFactory.observations.GLYADVREAC);
                        obs.id = this.glyAdvReac.id;
                        obs.isNew = angular.isDefined(this.glyAdvReac.isNew) ? this.glyAdvReac.isNew : obs.isNew;
                        obs.version = this.glyAdvReac.version;
                        obs.timestamp = angular.isDefined(this.glyAdvReac.timestamp) ? this.glyAdvReac.timestamp : obs.timestamp;
                           
                        if (Enumerable.From(this.glyAdvReac.list).Any(function (i) { return angular.isDefined(i.data); }))
                            obs.data = Enumerable.From(this.glyAdvReac.list).Where(function (i) { return angular.isDefined(i.data); }).Select(function (i) { return i.data; }).ToArray().join(",");
                        else
                            obs.data = Enumerable.From(this.glyAdvReac.list).Select(function (i) { return i; }).ToArray().join(",");
                            
                        instance.observations.push(obs);
                    }
                    if (angular.isDefined(this.diabNote.data) && this.diabNote.data != null && this.diabNote.data != "")
                        instance.observations.push(this.diabNote);

                    // All new observation timestamp must be same as flowsheet
                    angular.forEach(instance.observations, function (observation) {
                        observation.timestamp = observation.isNew && !instance.isCancelled ? instance.startDateTime : observation.timestamp;
                    });

                    return instance;
                };
                this.fromWorkflowInstance = function (workflowInstance) {
                    this.id = workflowInstance.id;
                    this.version = workflowInstance.version;
                    this.isCancelled = workflowInstance.isCancelled;
                    this.cancellationReasonId = workflowInstance.cancellationReasonId;
                    this.dateTime = workflowInstance.startDateTime;

                    angular.forEach(workflowInstance.observations, function (observation) {
                        var targetObservation = undefined;
                        var data = undefined;
                        if (observationFactory.observations.DIABNOTE.id === observation.observationTypeId) {
                            targetObservation = this.diabNote;
                            data = observation.data;
                        }
                        if (observationFactory.observations.GLUCOSE.id === observation.observationTypeId) {
                            var values = observation.data.split('|');
                            this.glucose.value = values[0] > 0 ? parseFloat(values[0]) : undefined;
                            this.glucose.period = values[1];
                            this.glucose.highLow = values.length >= 2 ? values[2] : '';

                            this.glucose.dataAsString = observation.dataAsString;
                            this.glucose.id = observation.id;
                            this.glucose.isNew = observation.isNew;
                            this.glucose.timestamp = observation.timestamp;
                            this.glucose.version = observation.version;
                        }
                        if (observationFactory.observations.MEALPERC.id === observation.observationTypeId) {
                            targetObservation = this.mealPerc;
                            data = observation.data;
                        }
                        if (observationFactory.observations.CARBS.id === observation.observationTypeId) {
                            targetObservation = this.carbohydrates;
                            data = parseInt(observation.data);
                        }
                        if (observationFactory.observations.INSTYPE.id === observation.observationTypeId) {
                            var values = observation.data.split('|');
                            this.insType.basal = values[0].toLowerCase() === 'true';
                            this.insType.prandial = values[1].toLowerCase() === 'true';
                            this.insType.corrective = values[2].toLowerCase() === 'true';

                            if (values.length > 3)
                                this.insType.insInjSite = values[3];

                            this.insType.dataAsString = observation.dataAsString;
                            this.insType.id = observation.id;
                            this.insType.isNew = observation.isNew;
                            this.insType.timestamp = observation.timestamp;
                            this.insType.version = observation.version;
                        }

                        if (observationFactory.observations.INSADM.id === observation.observationTypeId) {
                            var values = observation.data.split('|');
                            this.insAdm.withAPen = values[0].toLowerCase() === 'true';
                            this.insAdm.selfAdministered = values[1].toLowerCase() === 'true';
                            this.insAdm.hypoglycemiaProtocol = values[2].toLowerCase() === 'true';

                            this.insAdm.dataAsString = observation.dataAsString;
                            this.insAdm.id = observation.id;
                            this.insAdm.isNew = observation.isNew;
                            this.insAdm.timestamp = observation.timestamp;
                            this.insAdm.version = observation.version;
                        }

                        if (angular.isDefined(targetObservation)) {
                            targetObservation.dataAsString = observation.dataAsString;
                            targetObservation.data = data;
                            targetObservation.id = observation.id;
                            targetObservation.isNew = observation.isNew;
                            targetObservation.timestamp = observation.timestamp;
                            targetObservation.version = observation.version;
                        }
                        else {
                            if (observationFactory.observations.GLYADVREAC.id === observation.observationTypeId) {                               
                                this.glyAdvReac.id = observation.id;
                                this.glyAdvReac.isNew = observation.isNew;
                                this.glyAdvReac.timestamp = observation.timestamp;
                                this.glyAdvReac.data = observation.data;
                                this.glyAdvReac.dataAsString = observation.dataAsString;
                                this.glyAdvReac.version = observation.version;
                                var listdata = []; 
                                angular.forEach(observation.data.split(','), function (_data) {
                                    listdata.push({
                                        data: _data,
                                    });
                                });
                                this.glyAdvReac.list = listdata;
                            }
                        }
                    }, this);
                };
            }
            function Vitals(workflow) {
                this.id = undefined;
                this.version = undefined;
                this.isCancelled = false;
                this.cancellationReasonId = undefined;
                this.draft = true;

                this.workflow = workflow;
                // timestamp
                this.dateTime = new Date();
                // flowsheet note
                this.note = observationFactory.newObservation(observationFactory.observations.NOTE);

                // temperature
                this.temp = observationFactory.newObservation(observationFactory.observations.TEMP);
                // decimal (ex: 36.0)
                this.temp.value = undefined;
                // enum: ORAL, RECTAL, AXILLARY, SKIN, CORE, TYMPANIC
                this.temp.site = undefined;

                // blood pressure
                this.bp = observationFactory.newObservation(observationFactory.observations.BP);
                // int
                this.bp.systolic = undefined;
                this.bp.diastolic = undefined;
                // enum: LYING, SITTING, STANDING
                this.bp.position = undefined;

                // pulse
                this.pulse = observationFactory.newObservation(observationFactory.observations.PULSE);
                // int
                this.pulse.value = undefined;
                // boolean: true|false
                this.pulse.regular = true;

                // respiration - ex: 22|true, 18|false
                this.rr = observationFactory.newObservation(observationFactory.observations.RR);
                // int (ex: 22)
                this.rr.value = undefined;
                // boolean (ex: true)
                this.rr.regular = true;

                // respiration description, multi instance - string (ex: 'PAUSE')
                this.rr.rDesc = {
                    list: undefined
                };

                // saturation - int (ex: 100)
                this.spo2 = observationFactory.newObservation(observationFactory.observations.SPO2);

                // oxygen
                this.oxygen = observationFactory.newObservation(observationFactory.observations.OXYGEN);
                // int
                this.oxygen.amount = undefined;
                // enum: %, LMIN
                this.oxygen.unit = '%';

                this.save = function () {
                    this.draft = false;
                }
                this.isDraft = function () { return this.draft === true; };
                this.isSaved = function () { return !this.isDraft(); };
                this.isComplete = function () {
                    if (angular.isUndefined(this.rr.rDesc.list) || this.rr.rDesc.list.length <= 0) {
                        this.rr.rDesc.list = [];
                        return false;
                    }
                    if (angular.isUndefined(this.rr.value) || this.rr.value == null || this.rr.value == "") {
                        return false;
                    }

                    return angular.isDefined(this.dateTime) && this.dateTime != null && this.dateTime != ""
                        && (
                            (angular.isDefined(this.note.data) && this.note.data != null && this.note.data != "")
                            || (angular.isDefined(this.temp.value) && this.temp.value != null)
                            || (angular.isDefined(this.bp.systolic) && angular.isDefined(this.bp.diastolic) && this.bp.systolic != null && this.bp.diastolic != null)
                            || (angular.isDefined(this.pulse.value) && angular.isDefined(this.pulse.regular) && this.pulse.value != null && this.pulse.regular != null)
                            || (angular.isDefined(this.rr.value) && angular.isDefined(this.rr.regular) && this.rr.value != null && this.rr.regular != null && this.rr.value != "")
                            || (angular.isDefined(this.spo2.data) && this.spo2.data != null && this.spo2.data != "")
                            || (angular.isDefined(this.oxygen.amount) && angular.isDefined(this.oxygen.unit) && this.oxygen.amount != null && this.oxygen.unit != null)
                        );
                };

                this.toWorkflowInstance = function () {
                    var instance = {
                        id: this.id,
                        version: this.version,
                        workflowId: this.workflow.id,
                        isCancelled: this.isCancelled,
                        cancellationReasonId: this.cancellationReasonId,
                        observations: []
                    };
                    if (angular.isDate(this.dateTime)) {
                        instance.startDateTime = this.dateTime;
                    } else {
                        instance.startDateTime = moment(this.dateTime).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
                    };

                    if (angular.isDefined(this.temp.value) && this.temp.value != null) {
                        this.temp.data = this.temp.value;
                        if (angular.isDefined(this.temp.site) && this.temp.site != null)
                            this.temp.data += '|' + this.temp.site;
                        instance.observations.push(this.temp);
                    }
                    if ((angular.isDefined(this.bp.systolic) && this.bp.systolic != null) || (angular.isDefined(this.bp.diastolic) && this.bp.diastolic != null)) {

                        if (angular.isDefined(this.bp.systolic) && this.bp.systolic != null)
                            this.bp.data = this.bp.systolic;
                        else
                            this.bp.data = "";

                        this.bp.data += '|';

                        if (angular.isDefined(this.bp.diastolic) && this.bp.diastolic != null)
                            this.bp.data += this.bp.diastolic;
                        else
                            this.bp.data += "";

                        if (angular.isDefined(this.bp.position) && this.bp.position != null)
                            this.bp.data += '|' + this.bp.position;
                        instance.observations.push(this.bp);
                    }
                    if (angular.isDefined(this.pulse.value) && angular.isDefined(this.pulse.regular) && this.pulse.value != null && this.pulse.regular != null) {
                        this.pulse.data = this.pulse.value + '|' + this.pulse.regular;
                        instance.observations.push(this.pulse);
                    }
                    if ((angular.isDefined(this.rr.value) && angular.isDefined(this.rr.regular) && this.rr.value != null && this.rr.regular != null) || (angular.isDefined(this.rDesc) && angular.isDefined(this.rr.rDesc.list) && this.rDesc.list.length > 0)) {

                        if (angular.isDefined(this.rr.value) && angular.isDefined(this.rr.regular) && this.rr.value != null && this.rr.regular != null) 
                            this.rr.data = this.rr.value + '|' + this.rr.regular;
                        else
                            this.rr.data = '|' + this.rr.regular;

                        if (angular.isDefined(this.rr.rDesc) && angular.isDefined(this.rr.rDesc.list) && this.rr.rDesc.list.length > 0) {
                            if (Enumerable.From(this.rr.rDesc.list).Any(function (i) { return angular.isDefined(i.data); }))
                                this.rr.data += '|' + Enumerable.From(this.rr.rDesc.list).Where(function (i) { return angular.isDefined(i.data); }).Select(function (i) { return i.data; }).ToArray().join(",");
                            else
                                this.rr.data += '|' + Enumerable.From(this.rr.rDesc.list).Select(function (i) { return i; }).ToArray().join(",");
                        }
                        
                        instance.observations.push(this.rr);
                    }
                    if (angular.isDefined(this.spo2.data) && this.spo2.data != null && this.spo2.data != "") {
                        instance.observations.push(this.spo2);
                    }
                    if (angular.isDefined(this.oxygen.amount) && angular.isDefined(this.oxygen.unit) && this.oxygen.amount != null && this.oxygen.unit != null) {
                        this.oxygen.data = this.oxygen.amount + '|' + this.oxygen.unit;
                        instance.observations.push(this.oxygen);
                    }
                    if (angular.isDefined(this.note.data) && this.note.data != null && this.note.data != "")
                        instance.observations.push(this.note);

                    // All new observation timestamp must be same as flowsheet
                    angular.forEach(instance.observations, function (observation) {
                        observation.timestamp = observation.isNew && !instance.isCancelled ? instance.startDateTime : observation.timestamp;
                    });

                    return instance;
                };

                this.fromWorkflowInstance = function (workflowInstance) {
                    this.id = workflowInstance.id;
                    this.version = workflowInstance.version;
                    this.isCancelled = workflowInstance.isCancelled;
                    this.cancellationReasonId = workflowInstance.cancellationReasonId;
                    this.dateTime = workflowInstance.startDateTime;

                    angular.forEach(workflowInstance.observations, function (observation) {
                        var targetObservation = undefined;
                        var data = undefined;
                        if (observationFactory.observations.NOTE.id === observation.observationTypeId) {
                            targetObservation = this.note;
                            data = observation.data;
                        }
                        if (observationFactory.observations.TEMP.id === observation.observationTypeId) {
                            var values = observation.data.split('|');
                            this.temp.value = parseFloat(values[0]);
                            if (values.length > 1)
                                this.temp.site = values[1];

                            this.temp.dataAsString = observation.dataAsString;
                            this.temp.id = observation.id;
                            this.temp.isNew = observation.isNew;
                            this.temp.timestamp = observation.timestamp;
                            this.temp.version = observation.version;
                        }
                        if (observationFactory.observations.BP.id === observation.observationTypeId) {
                            var values = observation.data.split('|');
                            this.bp.systolic = parseInt(values[0]);
                            this.bp.diastolic = parseInt(values[1]);
                            if (values.length > 2)
                                this.bp.position = values[2];

                            this.bp.dataAsString = observation.dataAsString;
                            this.bp.id = observation.id;
                            this.bp.isNew = observation.isNew;
                            this.bp.timestamp = observation.timestamp;
                            this.bp.version = observation.version;
                        }
                        if (observationFactory.observations.PULSE.id === observation.observationTypeId) {
                            var values = observation.data.split('|');
                            this.pulse.value = parseInt(values[0]);
                            this.pulse.regular = values[1].toLowerCase() === 'true';

                            this.pulse.dataAsString = observation.dataAsString;
                            this.pulse.id = observation.id;
                            this.pulse.isNew = observation.isNew;
                            this.pulse.timestamp = observation.timestamp;
                            this.pulse.version = observation.version;
                        }
                        if (observationFactory.observations.RR.id === observation.observationTypeId) {
                            var values = observation.data.split('|');
                            this.rr.value = parseInt(values[0]);
                            this.rr.regular = values[1].toLowerCase() === 'true';
                            this.rr.rDesc = {}; this.rr.rDesc.list = [];
                            if (values.length > 2)
                                this.rr.rDesc.list = values[2].split(',');

                            this.rr.dataAsString = observation.dataAsString;
                            this.rr.id = observation.id;
                            this.rr.isNew = observation.isNew;
                            this.rr.timestamp = observation.timestamp;
                            this.rr.version = observation.version;
                        }
                        if (observationFactory.observations.SPO2.id === observation.observationTypeId) {
                            targetObservation = this.spo2;
                            data = parseInt(observation.data);
                        }
                        if (observationFactory.observations.OXYGEN.id === observation.observationTypeId) {
                            var values = observation.data.split('|');
                            this.oxygen.amount = parseInt(values[0]);
                            this.oxygen.unit = values[1];

                            this.oxygen.dataAsString = observation.dataAsString;
                            this.oxygen.id = observation.id;
                            this.oxygen.isNew = observation.isNew;
                            this.oxygen.timestamp = observation.timestamp;
                            this.oxygen.version = observation.version;
                        }

                        if (angular.isDefined(targetObservation)) {
                            targetObservation.dataAsString = observation.dataAsString;
                            targetObservation.data = data;
                            targetObservation.id = observation.id;
                            targetObservation.isNew = observation.isNew;
                            targetObservation.timestamp = observation.timestamp;
                            targetObservation.version = observation.version;
                        }
                    }, this);
                };
            }

            return {
                initialize: workflowFactory.initialize,
                isInitialized: function () { return workflowFactory.initialized === true },
                workflows: workflowFactory.workflows,
                getWorkflowForId: function (workflowId) {
                    var res = undefined;
                    angular.forEach(workflowFactory.workflows.asArray(), function (workflow) {
                        if (workflow.id === workflowId)
                            res = workflow;
                    });
                    return res;
                },
                getWorkflowForCode: function (workflowCode) {
                    var res = undefined;
                    angular.forEach(workflowFactory.workflows.asArray(), function (workflow) {
                        if (workflow.code === workflowCode)
                            res = workflow;
                    });
                    return res;
                },
                getWorkflowDesc: function (workflowCode) {
                    var res = undefined;
                    var workflow = this.getWorkflowForCode(workflowCode);
                    if (angular.isDefined(workflow))
                        res = workflow.shortDescription;
                    return res;
                },
                newWorkflowInstance: function (workflow) {
                    return workflowFactory.workflowFactory.newWorkflowInstance(workflow);
                }
            };
        }
]);
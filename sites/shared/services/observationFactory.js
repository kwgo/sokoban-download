'use strict';

angular
    .module('app')
    .service('observationFactory', [

        function () {
            var _this = this;
            // available observation types
            _this.observationTypes = {
                ANTIXA: {},
                AXAADVREAC: {},
                BP: {},
                CARBS: {},
                GLUCOSE: {},
                GLYADVREAC: {},
                HGB: {},
                INR: {},
                INSADM: {},
                INSTYPE: {},
                //INJSITE: {},
                MEALPERC: {},
                MOTOR: {},
                NOTE: {},
                DIABNOTE: {},
                OXYGEN: {},
                PAIN: {},
                PAINSITE: {},
                PLATELET: {},
                PTT: {},
                PULSE: {},
                RR: {},
                SEDATION: {},
                SENSATION: {},
                SNORING: {},
                SPO2: {},
                TEMP: {}
            };

            _this.injectionSites = ['RUQABD', 'LUQABD', 'RLQABD', 'LLQABD', 'RARM', 'LARM', 'RTHIGH', 'LTHIGH', 'RBUTTOCK', 'LBUTTOCK', 'OTHER'];
            _this.motricityCodes = [{ code: '0', label: 'NONE' }, { code: '1', label: 'TRACE' }, { code: '2', label: 'POOR_RESISTANCE' }, { code: '3', label: 'FAIR' }, { code: '4', label: 'GOOD' }, { code: '5', label: 'NORMAL' } ];
            _this.sensationCodes = [{ code: '0', label: 'ABSENT' }, { code: '1', label: 'DIMINISHED' }, { code: '2', label: 'NORMAL' }, { code: '3', label: 'INCREASED' }];
            _this.bpPositions = ['LYING', 'SITTING', 'STANDING'];
            _this.temperatureSites = ['ORAL', 'RECTAL', 'AXILLARY', 'SKIN', 'CORE', 'TYMPANIC'];
            _this.rDescriptions = [
                'SNOMED', 'EUPNEIC', 'DYSPNEA', 'APNEA', 'PARADOXICAL', 'SHALLOW', 'FLARING',
                'BIOT', 'BRADYPNEA', 'CHEYNE_STOKES', 'HYPERVENTILATION', 'KUSSMAUL',
                'PAUSE', 'POLYPNEA', 'TACHYPNEA', 'INTERCOSTAL_INDRAWING', 'GENERALISED_INDRAWING',
                'CHEST_WALL_INDRAWING', 'SUB_STERNAL_INDRAWING', 'SUS_STERNAL_INDRAWING', 'SUS_CLAVICULAR_INDRAWING'
            ];

            _this.sedationScales = {
                POSS: { code: 'POSS', values: [{ code: 'S', label: 'possSleep' }, { code: '1', label: 'possAwake' }, { code: '2', label: 'possSlightlyDrowsy' }, { code: '3', label: 'possFrequentlyDrowsy' }, { code: '4', label: 'possNoResponse' }] },
                RASS: { code: 'RASS', values: [{ code: '+4', label: 'rassCombative' }, { code: '+3', label: 'rassVeryAgitated' }, { code: '+2', label: 'rassAgitated' }, { code: '+1', label: 'rassRestless' }, { code: '0', label: 'rassCalm' }, { code: '-1', label: 'rassDrowsy' }, { code: '-2', label: 'rassLightSedation' }, { code: '-3', label: 'rassModeratedSedation' }, { code: '-4', label: 'rassDeepSedation' }, { code: '-5', label: 'rassUnarousable' }] },
                RAMSAY: { code: 'RAMSAY', values: [{ code: '1', label: 'ramsAnxious' }, { code: '2', label: 'ramsCooperative' }, { code: '3', label: 'ramsResponding' }, { code: '4', label: 'ramsBrisk' }, { code: '5', label: 'ramsSluggish' }, { code: '6', label: 'ramsNoResponse' }] },

                asArray: function () {
                    return [this.POSS, this.RASS, this.RAMSAY];
                }
            };
            _this.getSedationScaleValues = function (sedationScaleCode) {
                var res = [];
                if (angular.isUndefined(sedationScaleCode))
                    return res;
                res = _this.sedationScales[sedationScaleCode];
                if (angular.isUndefined(res))
                    throw new Error('Undefined sedation scale code [' + sedationScaleCode +']');
                return res.values;
            };

            _this.painScales = {
                // 'NPIS', 'CPOT', 'DOLO+', 'VAS', 'FPS', 'FLACC', 'PIPP', 'PACSLAC'
                NPIS: { code: 'NPIS', values: [{ code: '0', label: 'zeroNoPain' }, { code: '1', label: 'one' }, { code: '2', label: 'two' }, { code: '3', label: 'three' }, { code: '4', label: 'four' }, { code: '5', label: 'five' }, { code: '6', label: 'six' }, { code: '7', label: 'seven' }, { code: '8', label: 'eight' }, { code: '9', label: 'nine' }, { code: '10', label: 'tenWorstPain' }] },
                CPOT: { code: 'CPOT', values: undefined, rules: { min: 0, max: 8 } },
                DOLO: { code: 'DOLO', values: undefined, rules: { min: 0, max: 30 } },
                VAS: { code: 'VAS', values: undefined, rules: { min: 0, max: 10 } },
                FPS: { code: 'FPS', values: [{ code: '0', label: 'zeroNonePain' }, { code: '2', label: 'twoMildPain' }, { code: '4', label: 'fourModeratePain' }, { code: '6', label: 'sixSeverePain' }, { code: '8', label: 'eightVerySeverePain' }, { code: '10', label: 'tenExtremePain' }] },
                FLACC: { code: 'FLACC', values: undefined, rules: { min: 0, max: 10 } },
                PIPP: { code: 'PIPP', values: undefined, rules: { min: 0, max: 21 } },
                PACSLAC: { code: 'PACSLAC', values: undefined, rules: { min: 0, max: 60 } },

                asArray: function () {
                    return [this.NPIS, this.CPOT, this.DOLO, this.VAS, this.FPS, this.FLACC, this.PIPP, this.PACSLAC];
                }
            };
            _this.getPainScaleValues = function (code) {
                var res = [];
                if (angular.isUndefined(code))
                    return res;
                res = _this.painScales[code];
                if (angular.isUndefined(res))
                    throw new Error('Undefined pain scale code [' + code + ']');
                return res.values;
            }
            _this.getPainScaleRules = function (code) {
                var res = [];
                if (angular.isUndefined(code))
                    return res;
                res = _this.painScales[code];
                if (angular.isUndefined(res))
                    throw new Error('Undefined pain scale code [' + code + ']');
                return res.rules;
            };
            _this.isPainScaleNumeric = function (code) {
                var res = true;
                if (angular.isUndefined(code) || code === _this.painScales.NPIS.code || code === _this.painScales.FPS.code)
                    res = false;
                return res;
            };

            // service instance initialized state - defaults to false
            _this.initialized = false;

            // initialize this service instance with given observations array
            _this.initialize = function (observations) {
                var theObservations = angular.isArray(observations) ? observations : [observations];
                angular.forEach(theObservations, function (anObservation) {
                    if (angular.isDefined(_this.observationTypes[anObservation.code])) {
                        // this adds the observationTypeId, code and shortDescription attrs
                        _this.observationTypes[anObservation.code] = angular.extend(_this.observationTypes[anObservation.code], anObservation);
                    }
                });

                _this.initialized = true;
            };
            this.observationFactory = {
                newObservationInstance: function (observationType) {
                    // check that given observation type is valid
                    var type = _this.observationTypes[observationType.code];
                    if (angular.isUndefined(type))
                        throw new Error('Undefined observation type code [' + observationType + ']');
                    return {
                        id: undefined,
                        isNew: true,
                        version: undefined,
                        observationType: observationType,
                        observationTypeId: observationType.id,
                        data: undefined,
                        dataAsString: undefined,
                        timestamp: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ')
                    }
                }
            };

            // Return the observation object
            this.getObservationById = function (id) {

                if (_this.observationTypes.NOTE.id === id) {
                    return _this.observationTypes.NOTE;
                }
                if (_this.observationTypes.DIABNOTE.id === id) {
                    return _this.observationTypes.DIABNOTE;
                }
                if (_this.observationTypes.PTT.id === id) {
                    return _this.observationTypes.PTT;
                }
                if (_this.observationTypes.ANTIXA.id === id) {
                    return _this.observationTypes.ANTIXA;
                }
                if (_this.observationTypes.INR.id === id) {
                    return _this.observationTypes.INR;
                }
                if (_this.observationTypes.HGB.id === id) {
                    return _this.observationTypes.HGB;
                }
                if (_this.observationTypes.PLATELET.id === id) {
                    return _this.observationTypes.PLATELET;
                }
                if (_this.observationTypes.AXAADVREAC.id === id) {
                    return _this.observationTypes.AXAADVREAC;
                }
                if (_this.observationTypes.BP.id === id) {
                    return _this.observationTypes.BP;
                }
                if (_this.observationTypes.CARBS.id === id) {
                    return _this.observationTypes.CARBS;
                }
                if (_this.observationTypes.GLUCOSE.id === id) {
                    return _this.observationTypes.GLUCOSE;
                }
                if (_this.observationTypes.GLYADVREAC.id === id) {
                    return _this.observationTypes.GLYADVREAC;
                }
                if (_this.observationTypes.INSADM.id === id) {
                    return _this.observationTypes.INSADM;
                }
                if (_this.observationTypes.INSTYPE.id === id) {
                    return _this.observationTypes.INSTYPE;
                }
                if (_this.observationTypes.MEALPERC.id === id) {
                    return _this.observationTypes.MEALPERC;
                }
                if (_this.observationTypes.MOTOR.id === id) {
                    return _this.observationTypes.MOTOR;
                }
                if (_this.observationTypes.OXYGEN.id === id) {
                    return _this.observationTypes.OXYGEN;
                }
                if (_this.observationTypes.PAIN.id === id) {
                    return _this.observationTypes.PAIN;
                }
                if (_this.observationTypes.PAINSITE.id === id) {
                    return _this.observationTypes.PAINSITE;
                }
                if (_this.observationTypes.PULSE.id === id) {
                    return _this.observationTypes.PULSE;
                }
                if (_this.observationTypes.RR.id === id) {
                    return _this.observationTypes.RR;
                }
                if (_this.observationTypes.SEDATION.id === id) {
                    return _this.observationTypes.SEDATION;
                }
                if (_this.observationTypes.SENSATION.id === id) {
                    return _this.observationTypes.SENSATION;
                }
                if (_this.observationTypes.SNORING.id === id) {
                    return _this.observationTypes.SNORING;
                }
                if (_this.observationTypes.SPO2.id === id) {
                    return _this.observationTypes.SPO2;
                }
                if (_this.observationTypes.TEMP.id === id) {
                    return _this.observationTypes.TEMP;
                }
                //if (_this.observationTypes.INJSITE.id === id) {
                //    return _this.observationTypes.INJSITE;
                //}
                return null;
            };

            return {
                initialize: _this.initialize,
                isInitialized: function () { return _this.initialized === true; },
                newObservation: function (observationType) {
                    return _this.observationFactory.newObservationInstance(observationType);
                },
                observations: _this.observationTypes,
                painScales: _this.painScales,
                painScaleValues: _this.getPainScaleValues,
                painScaleRules: _this.getPainScaleRules,
                isPainScaleNumeric: _this.isPainScaleNumeric,
                temperatureSites: _this.temperatureSites,
                bpPositions: _this.bpPositions,
                sedationScales: _this.sedationScales,
                sedationScaleValues: _this.getSedationScaleValues,
                motricityCodes: _this.motricityCodes,
                sensationCodes: _this.sensationCodes,
                injectionSites: _this.injectionSites,
                rDescriptions: _this.rDescriptions,
                getObservationById: _this.getObservationById
            };
        }
]);
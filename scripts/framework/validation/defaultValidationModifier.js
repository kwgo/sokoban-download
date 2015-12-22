'use strict';
angular
    .module('lgi.infra.web.validation')
    .factory('defaultValidationModifier',
    [
        'validationFactory',
        function (validationFactory) {
        	return {
        		makeValid: validationFactory.reset,
        		makeInvalid: validationFactory.invalid,
        		makeDefault: validationFactory.default,
        		key: 'defaultValidationModifier'
        	};
        }
    ]);

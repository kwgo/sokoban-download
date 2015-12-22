'use strict';

angular
    .module('app')
    .directive('kendoCustomFilter',
    [
        function() {
            return {
                restrict: 'A',
                scope: false,
                link: function(scope, element, attr) {
                    scope.$on('kendoWidgetCreated', function(event, target) {
                        if ($(target.element)[0] === $(element)[0]) {
                            var comboBox = element.data('kendoComboBox');
                            comboBox.options.filter = 'custom';
                            var filters = scope.$eval(attr.kendoCustomFilter);
                            comboBox.bind("filtering", function(e) {
                                e.preventDefault();
                                angular.forEach(filters.filters, function(filter) {
                                    filter.value = e.sender.text();
                                });
                                e.sender.dataSource.filter(filters);
                            });
                        }
                    });
                }
            }
        }
    ]);

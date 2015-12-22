'use strict';

angular
    .module('lgi.emr.mar.web.controls')
    .directive('ctlFixedHeaderTable', ['$timeout', function ($timeout) {

    return {
            restrict: 'A',
            scope: {
                tableHeight: '@',
                triggerRender: '@'
            },
            link: function ($scope, $elem, $attrs, $ctrl) {

                // wait for page to load, THIS ONE IS FOR IE
                $(document).ready(function () {
                    renderTable();
                });

                // wait for content to load into table
                $scope.$watch(function() { return $elem.find("tbody").is(':visible'); },
                    function (newValue, oldValue) {
                        if (newValue === true) {
                            renderTable();
                        }
                });
                // check if change in nbr of rows
                $scope.$watch(function () { return $elem.children('tbody').children('tr').children('td').length; },
                    function (newValue, oldValue) {
                        if (newValue != oldValue) {
                            renderTable();
                        }
                });
                // check for resize
                $scope.$watch("triggerRender", function (newValue, oldValue) {
                    if (newValue != oldValue) {
                        renderTable();
                    }
                });

                function renderTable() {                   
                    // reset display styles so column widths are correct when measured below
                    $elem.find('thead, tbody, tfoot').css('display', '');

                    // wrap in $timeout to give table a chance to finish rendering
                    $timeout(function () {
                        // set widths of columns
                        $elem.find('th').each(function (i, thElem) {
                            thElem = $(thElem);
                            var tdElems = $elem.find('tbody tr:first td:nth-child(' + (i + 1) + ')');
                            var tfElems = $elem.find('tfoot tr:first td:nth-child(' + (i + 1) + ')');

                            var columnWidth = thElem.width();
                            thElem.width(columnWidth);
                            tdElems.width(columnWidth);
                            tfElems.width(columnWidth);
                        });


                        $elem.parent('div').css({
                            'height': $scope.tableHeight || '400px',
                            'display': 'block',
                            'overflow': 'auto'
                        });

                        $elem.css({
                            'display': 'table'
                        });
                        $elem.find('thead').css({
                            'display': 'table-header-group'
                        });
                        $elem.find('tfoot').css({
                            'display': 'table-footer-group'
                        });
                        //all
                        $elem.find('tbody').css({
                            'display': 'table-row-group',
                        });
                        $elem.find('tr').css({
                            'display': 'table-row'
                        });
                        $elem.find('th td').css({
                            'display': 'table-cell'
                        });
                        // reduce width of last column by width of scrollbar
                        var scrollBarWidth = $elem.find('thead').width() - $elem.find('tbody')[0].clientWidth;
                        if (scrollBarWidth > 0) {
                            // for some reason trimming the width by 2px lines everything up better
                            scrollBarWidth -= 2;
                            var nbrColumns = $elem.find('tbody tr:first td').length;
                            if (nbrColumns > 1) $elem.find('tbody tr:first td:last-child').each(function (i, elem) {
                                                      $(elem).width($(elem).width() - scrollBarWidth);
                            });
                        }
                    });
                };

            }
        };
    }]);
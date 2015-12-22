'use strict';

angular
    .module('lgi.emr.mar.web.controls')
    .directive('ctlPopup',
    [
        function () {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    var content = attrs['content'];
                    $(element)
                        .popover({ trigger: "manual", html: true })
                        .on("click", function () {
                                var _this = this;
                                $(this).popover("show");
                        })
                        .on("mouseenter", function () {
                           // console.log($(element).attr('id') + '>' + content + '<');
                                var _this = this;
                                $(this).popover("show");
                                $(".popover").on("mouseleave", function () {
                                    $(_this).popover('hide');
                                });
                        }).on("mouseleave", function () {
                            var _this = this;
                            setTimeout(function () {
                                if (!$(".popover:hover").length) {
                                    $(_this).popover("hide");
                                }
                            }, 100);
                        });
                    
                }
            };
        }
    ]);
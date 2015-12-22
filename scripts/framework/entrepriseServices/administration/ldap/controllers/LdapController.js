'use strict';
angular
    .module('lgi.infra.web.entrepriseServices.administration.ldap')
    .controller('LdapController',
    [
        'ldapService', '$scope', '$q',
        function (ldapService, $scope, $q) {
            var basePath = "scripts/framework/entrepriseServices/administration/ldap/";
            var viewsPath = basePath + "views/";
            var i18nPath = basePath + "i18n/";

            $q.all({
                resources: $scope.cultureManager.resources.load(i18nPath + 'ldap')
            })
            .then(function () {
                init();
            });

            var init = function() {
                $scope.layout = {
                    detail: {
                        search: {
                            template: "",
                            controller: ""
                        },
                        searchResult: {
                            template: viewsPath + "detail-searchresult.html",
                            controller: "LdapDetailSearchResultController"
                        },
                        actions: {
                            template: viewsPath + "detail-actions.html",
                            controller: 'LdapDetailActionsController'
                        },
                        content: {
                            template: viewsPath + "detail-content.html",
                            controller: 'LdapDetailContentController'
                        }
                    }
                };
            };
            
        }
    ]);
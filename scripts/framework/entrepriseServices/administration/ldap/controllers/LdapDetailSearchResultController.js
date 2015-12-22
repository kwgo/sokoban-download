'use strict';
angular
    .module('lgi.infra.web.entrepriseServices.administration.ldap')
    .controller('LdapDetailSearchResultController',
    [
        'ldapService', '$scope',
        function (ldapService, $scope) {
            $scope.model = ldapService.model;
            $scope.select = function(server) {
                ldapService.selectServer(server);
            };
            ldapService.servers();
        }
    ]);
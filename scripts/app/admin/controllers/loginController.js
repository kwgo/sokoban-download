'use strict';
angular
    .module('boxman.admin')
    .controller('loginController',
    [
        '$scope', '$http', '$location', '$routeParams', 'actionService',
        function ($scope, $http, $location, $routeParams, actionService) {
            $scope.isLogin = true;
            $scope.remember = false;

            $scope.user = {};
            
            $scope.login = function() {
                var url = "http://localhost:8081/session/create";
/*                
                $http({
                    url: url,
                    method: "POST",
                    data: $scope.user
                })
                .then(
                    function(response) {
//                      store.set("jwt", response.data.id_token);
//                      $state.go("home");
                        $location.path("/summary");
                    },
                    function(error) {
                        console.log(error.data);
                    }
                );
*/
                        $location.path("/summary");
            };
        }
    ]);

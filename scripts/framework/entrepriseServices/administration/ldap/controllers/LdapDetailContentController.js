'use strict';
angular
    .module('lgi.infra.web.entrepriseServices.administration.ldap')
    .controller('LdapDetailContentController',
    [
        'ldapService', '$scope', 'notificationService', 'formService', '$timeout',
        function (ldapService, $scope, notificationService, formService, $timeout) {
            $scope.model = ldapService.model;
            $scope.controls = {
                branches: null,
                tabs: null
            };

            ldapService.serverSelected(function (server) {
                if (!server.hasOwnProperty('credential')) {
                    server.credential = {
                        userName: "",
                        password: "",
                        encrypted: false
                    };
                }
                if (!server.hasOwnProperty("connected")) {
                    server.connected = false;
                }
                if (!server.hasOwnProperty("passwordChanged")) {
                    server.passwordChanged = false;
                }
                formService.pristine.set();
                
                ldapService
                      .server(server.id)
                      .then(function (serverInfo) {

                          // Note that the 'name' property in the 'Branches' objects corresponds to the 'path' property in the treeview data.
                          // Also, when writing back to the server, the 'searchFilter' property must be empty.
                          var clearSearchFitler = function (b) { b.searchFilter = ""; };
                          serverInfo.groupBranches.forEach(clearSearchFitler);
                          serverInfo.userBranches.forEach(clearSearchFitler);

                          $scope.orignalServerInfo = angular.copy(serverInfo);
                      });
            });

            //#region Server Tab
            $scope.connectionTypes = [
                { id: 0, text: $scope.cultureManager.resources.translate('UNSECURE') },
                { id: 1, text: $scope.cultureManager.resources.translate('SECURE') },
                { id: 2, text: $scope.cultureManager.resources.translate('SSL') }
            ];
            $scope.clearPassword = function () {
                if (!$scope.model.selectedServer.passwordChanged) {
                    $scope.model.selectedServer.passwordChanged = true;
                    $scope.model.selectedServerInfo.serviceAccountPwd = "";
                }
            };
            //#endregion

            //#region Branches Tab
            $scope.connect = function () {
                $scope.model.selectedServer.connected = false;
                connect();
            };
            $scope.disconnect = function () {
                $scope.model.selectedServer.connected = false;
                $scope.model.selectedServer.credential.userName = "";
                $scope.model.selectedServer.credential.password = "";
            };
            var connect = function () {
                if ($scope.controls.tabs.select().index() == 1) {
                    if (!$scope.model.selectedServer.connected) {
                        ldapService
                          .branches($scope.model.selectedServer.id, $scope.model.selectedServer.credential)
                          .then(function (data) {
                              $scope.model.selectedServer.connected = true;
                              initializeBranches([data]);
                          }, function (errors) {
                              $scope.model.selectedServer.connected = false;
                              notificationService.error({
                                  title: "Connection error",
                                  message: errors[0].errorMessage
                              });
                          });
                    }
                }
            };

            var initializeBranches = function (branches) {
                addDynamicRow(branches, $scope.model.selectedServer.id);
                $scope.orignalBranches = angular.copy(branches);

                $scope.dsDetails = new kendo.data.HierarchicalDataSource({
                    data: branches,
                    schema: {
                        model: {
                            id: "id",
                            children: "ldapServerBranches"
                        }
                    }
                });
            };

            var once = true;
            $scope.$on("kendoWidgetCreated", function (event, widget) {
                if (widget === $scope.controls.branches) {
                    if (once) {
                        once = false;
                        expandFirstNode($scope.dsDetails);

                        var loadNode = function (items) {
                            items.forEach(function (item) {
                                if (!item.isTerminalNode) {
                                    item.load();
                                    loadNode(item.ldapServerBranches);

                                }
                            });
                        };

                        // enable a more UI responsiveness
                        $timeout(function () { loadNode($scope.controls.branches.dataSource.data()); }, 1);
                    }
                }
            });

            var expandFirstNode = function (dataSource) {
                var branches = dataSource.data();
                if (branches.length > 0) {
                    var dataItem = dataSource.get(branches[0].id);
                    var firstNode = $scope.controls.branches.findByUid(dataItem.uid);
                    $scope.controls.branches.expand(firstNode);
                }
            };

            var addDynamicRow = function (items, serverId) {
                items.forEach(function (item) {
                    if (item.ldapServerBranches === undefined) {
                        item.ldapServerBranches = [];
                    }
                    if (item.ldapServerBranches.length == 0) {
                        item.isTerminalNode = true;
                        item.ldapServerBranches.push({
                            id: item.id + "g", name: "Groups", isGroup: true,
                            serverId: serverId, path: item.path, ldapServerBranches: []
                        });
                        item.ldapServerBranches.push({
                            id: item.id + "u", name: "Users", isUser: true,
                            serverId: serverId, path: item.path, ldapServerBranches: []
                        });
                    } else {
                        item.isTerminalNode = false;
                        addDynamicRow(item.ldapServerBranches);
                    }
                    if (findByPath(item.path, $scope.model.selectedServerInfo.groupBranches) != null
                        || findByPath(item.path, $scope.model.selectedServerInfo.userBranches) != null) {
                        item.checked = true;
                    }
                });
            };

            function findByPath(path, array) {
                if (path !== undefined && path != null) {
                    var result = $.grep(array, function (obj) {
                        return obj.name == path;
                    });
                    if (result.length > 0) {
                        return result[0];
                    }
                }
                return null;
            };

            $scope.onExpand = function (e) {
                var dataItem = e.sender.dataItem(e.node);
                if (dataItem.isTerminalNode && !dataItem.isLoaded) {
                    ldapService
                       .branchObjects($scope.model.selectedServer.id, dataItem.path, $scope.model.selectedServer.credential)
                       .then(function (data) {
                           loadDetail(dataItem, data.ldapServerBranches);
                       });
                }
            };
            $scope.onDataBound = function (e) {
                var dataItem = e.sender.dataItem(e.node);
                if (dataItem) {
                    if (dataItem.isTerminalNode) {
                        if (!e.node.hasClass('terminal-node')) {
                            e.node.addClass('terminal-node');
                        }
                    }
                }
            };
            $scope.onCheck = function (e) {
                var allChildrenChecked = function (items) {
                    for (var i = 0; i < items.length; i++) {
                        if (!items[i].checked || !allChildrenChecked(items[i].ldapServerBranches)) {
                            return false;
                        }
                    }
                    return true;
                };

                // We only want to keep the topmost checked items in the tree. It's easier to
                // to traverse the tree and rebuild the 'Branches' structures than to treat
                // each individual item associated with the click.
                var buildBranches = function (items) {
                    items.forEach(function (item) {
                        if (item.isDetail === true) {
                            return;
                        }
                        if (item.checked && allChildrenChecked(item.ldapServerBranches)) {
                            if (item.isGroup === true) {
                                addBranchItem($scope.model.selectedServerInfo.groupBranches, item);
                            } else if (item.isUser === true) {
                                addBranchItem($scope.model.selectedServerInfo.userBranches, item);
                            } else {
                                addBranchItem($scope.model.selectedServerInfo.groupBranches, item);
                                addBranchItem($scope.model.selectedServerInfo.userBranches, item);
                            }
                            return;
                        }
                        buildBranches(item.ldapServerBranches);
                    });
                };

                $scope.model.selectedServerInfo.groupBranches = [];
                $scope.model.selectedServerInfo.userBranches = [];

                buildBranches($scope.controls.branches.dataSource.data());
            };

            // Add an item to the passed branch array. Note the zero id is important as the
            // server uses this to determine that this is a newly checked item.
            function addBranchItem(array, treeItem) {
                array.push({ id: 0, name: treeItem.path });
            };

            var loadDetail = function (dataItem, branches) {
                var groups = dataItem.ldapServerBranches[0];
                var users = dataItem.ldapServerBranches[1];

                if (branches.length > 0) {
                    for (var i = 0; i < branches.length; i++) {
                        branches[i].id = dataItem.id + "." + (i + 1);
                        branches[i].name = branches[i].description;
                        branches[i].ldapServerBranches = [];
                        branches[i].isDetail = true;

                        if (branches[i].type == "Group") {
                            groups.append(new kendo.data.Node(branches[i]));
                        } else {
                            users.append(new kendo.data.Node(branches[i]));
                        }
                    }
                }

                if (groups.ldapServerBranches.length == 0) {
                    dataItem.ldapServerBranches.splice(0, 1);
                } else {
                    groups.load();
                }
                if (users.ldapServerBranches.length == 0) {
                    dataItem.ldapServerBranches.splice(dataItem.ldapServerBranches.indexOf(users), 1);
                } else {
                    users.load();
                }
                dataItem.isLoaded = true;

            };
            //#endregion

        }
    ]);
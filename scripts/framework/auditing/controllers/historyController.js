'use strict';

angular
    .module('lgi.infra.web.auditing')
    .controller('historyController',
    [
        '$scope', '$http', '$location', 'locationService', 'historyService', '$systemParameters', 'dateService',
        function ($scope, $http, $location, locationService, historyService, $systemParameters, dateService) {

            // ---------------------------- bottom panel ----------------------------
            function initBottom() {

                function formatValue(value, item) {
                    if (value instanceof Date) {
                        value = $scope.fixDateTime(value);
                    }

                    var metaItem = $scope.metaItemsById[item.metaIndex];
                    if (value && metaItem.DisplayType) {
                        switch (metaItem.DisplayType) {
                            case "datetime":
                                return dateService.getDisplayDateTime(value);
                            case "shortdate":
                                return dateService.getDisplayDate(value);
                            case "longdate":
                                return dateService.getDisplayDate(value); // + ' ' + value.getFullYear();
                            case "shorttime":
                                return dateService.getDisplayShortTime(value);
                            case "longtime":
                                return dateService.getDisplayLongTime(value);
                            case "checkbox":
                                item.useCheck = true;
                                return value.toString() != "0" ? "true" : "false";
                        }
                    }
                    if (typeof value == "string") {
                        if (value.length > 100) {
                            item.isLongString = true;
                        }
                        if (value.indexOf("\n") >= 0) {
                            item.hasLineFeeds = true;
                        }
                    }
                    return value;
                }

                function formatItem(item) {
                    // Do any special formatting for the old and new values
                    item.oldVal = formatValue(item.oldVal, item);
                    item.newVal = formatValue(item.newVal, item);
                }

                function setTreeListData(data) {
                    $scope.bottomDataSource = new kendo.data.TreeListDataSource({
                        data: data,
                        schema: {
                            model: {
                                id: "id",
                                fields: {
                                    id: { field: "id", nullable: true, type: "string" },
                                    parentId: { field: "parentId", nullable: true, type: "string" },
                                    oldVal: { editable: false, type: "string", nullable: true },
                                    newVal: { editable: false, type: "string", nullable: true }
                                }
                            }
                        }
                    });

                    var isChecked = function (metaItem) {
                        // Determines if the metaItem or any one of its children is checked
                        if (metaItem.checked == true) {
                            return true;
                        }
                        var children = $.grep($scope.metaItemsById, function (item) { return metaItem.metaIndex == item.parentMetaIndex; });
                        for (var i = 0; i < children.length; i++) {
                            if (isChecked(children[i])) {
                                return true;
                            }
                        }
                        return false;
                    };

                    var onFirstDataBound = function () {
                        // Expand all of the nodes. This can be a bit slow if there are a lot of rows,
                        // so putting it in a timeout gives the user some visual feedback
                        // while the nodes are expanding.
                        var treeList = $("#treeList").data("kendoTreeList");
                        var treeRows = $("tr.k-treelist-group", treeList.tbody);
                        $.each(treeRows, function (idx, treeRow) {
                            var dataRow = treeList.dataItem(treeRow);
                            var metaItem = $scope.metaItemsById[dataRow.metaIndex];
                            if (isChecked(metaItem) == true) {
                                setTimeout(function () {
                                    treeList.expand(treeRow);
                                }, 0);
                            }
                        });

                        $('#treeList .colFirst').parent().addClass("trFirst");
                        $('#treeList .colFirst[isHeader=true]').parent().addClass("tr-header");
                        $('#treeList .colMiddle').parent().addClass("trMiddle");
                        $('#treeList .colLast').parent().addClass("trLast");
                        $('#treeList [ng-show=true].little-data').parent().parent().addClass("little-data");

                        setTimeout(function () {
                            $scope.metaItemsById.forEach(function (metaItem) {
                                if (isChecked(metaItem) == false) {
                                    $scope.setListRowVisibility(metaItem, false);
                                }
                            });
                        }, 0);
                    };

                    $scope.setCollapsedState = function(parentRow, isCollapsed) {
                        var treeList = $("#treeList").data("kendoTreeList");
                        var rows = $("tr", treeList.tbody);
                        for (var i = 0; i < rows.length; i++) {
                            var row = rows[i];
                            var dataItem = treeList.dataItem(row);
                            if (dataItem) {
                                if (dataItem.parentId == parentRow.id) {
                                    if (isCollapsed) {
                                        $(row).find(".trFirst").addClass("h-collapsed");
                                    } else {
                                        $(row).find(".trFirst").removeClass("h-collapsed");
                                    }
                                }
                            }
                        }
                    };

                    $scope.treelistOptions = {
                        dataSource: $scope.bottomDataSource,
                        sortable: false,
                        editable: false,
                        scrollable: false,
                        messages: { noRows: "" },
                        columns: [
                            {
                                field: "description",
                                title: $scope.cultureManager.resources.translate('DESCRIPTION'),
                                expandable: true,
                                template: "<span class='colFirst' isHeader='#: isHeader #' style='vertical-align: middle'>#: description # </span>" +
                                    "<button bs-pull='right' class='big-data' ng-click='showBigData(dataItem)' ng-show='#: isLob || isLongString #'>" +
                                    "<span class='fa fa-ellipsis-h'></span></button>"
                            },
                            // The following commented lines are useful for debugging
                            //{ title: "id", field: "id" },
                            //{ title: "parentId", field: "parentId" },
                            //{ title: "sort", field: "sortValue" },
                            {
                                field: "newVal",
                                title: $scope.cultureManager.resources.translate('NEW_VALUE'),
                                width: "35%",
                                template: "<span class='colMiddle'>" +
                                    "<span ng-show='#: useCheck #' class='#: (newVal != null) ? ((newVal == 'true') ? 'fa fa-check' : 'fa fa-times') : ''  #'></span>" +
                                    "<textarea readonly class='little-data' ng-show='#: hasLineFeeds #'>#: (newVal == null) ? ' ' : newVal.substring(0,500) #</textarea>" +
                                    "<span ng-hide='#: useCheck || hasLineFeeds #'>#: (newVal == null) ? ' ' : newVal.substring(0,100) #</span>" +
                                    "</span>"
                        },
                            {
                                field: "oldVal",
                                title: $scope.cultureManager.resources.translate('OLD_VALUE'),
                                width: "35%",
                                template: "<span class='colLast ng-binding'>" +
                                    "<span ng-show='#: useCheck #' class='#: (oldVal != null) ? ((oldVal == 'true') ? 'fa fa-check' : 'fa fa-times') : ''  #'></span>" +
                                    "<textarea readonly class='little-data' ng-show='#: hasLineFeeds #'>#: (oldVal == null) ? ' ' : oldVal.substring(0,500) #</textarea>" +
                                    "<span ng-hide='#: useCheck || hasLineFeeds #'>#: (oldVal == null) ? ' ' : oldVal.substring(0,100) #</span>" +
                                    "</span>"
                            }
                        ],
                        dataBound: function (e) {
                            // This event is called many times. We only want to do some work once.
                            if (onFirstDataBound != null) {
                                var fn = onFirstDataBound;
                                onFirstDataBound = null;
                                fn();
                            }
                        },
                        expand: function (e) {
                            $scope.setCollapsedState(e.model, false);
                            setTimeout(function () {
                                $('#treeList .d-hide-logDetail').parent().hide();
                            }, 0);
                        },
                        collapse: function (e) {
                            $scope.setCollapsedState(e.model, true);
                        }
                    };
                };

                function getMetaItem(metaId) {
                    var metaItem = $.grep($scope.metaItemsById, function (obj) {
                        return obj.Id == metaId;
                    });
                    // This code useful for debugging the xml file
                    //if (metaItem.length <= 0) {
                    //    console.log("The field with id " + metaId + " is not defined in " + historyService.type + "CL.xml");
                    //    return null;
                    //}
                    return metaItem[0];
                };

                function makeBottomItem(id, oldVal, newVal, metaItem, description) {
                    if (oldVal === undefined) {
                        oldVal = null;
                    }
                    if (newVal === undefined) {
                        newVal = null;
                    }
                    var item = {
                        id: id,
                        parentId: null,
                        newVal: newVal,
                        oldVal: oldVal,
                        useCheck: false,
                        hasLineFeeds: false,
                        isLob: false,
                        isLongString: false,
                        isHeader: oldVal == null && newVal == null
                    };

                    if (metaItem != null) {
                        item.metaIndex = metaItem.metaIndex;
                        item.description = metaItem.Description;
                        item.sortValue = metaItem.metaIndex;
                    }

                    if (description !== undefined && description !== null) {
                        item.description = description;
                    }

                    return item;
                };

                // Adds the parent node to the data items. The parent node corresponds to a
                // non-terminal node in the top-left panel.
                function addParent(item, items) {
                    var pmi = $scope.metaItemsById[item.metaIndex].parentMetaIndex;
                    if (pmi == null) {
                        return;
                    }
                    var parent = $.grep(items, function (obj) {
                        return obj.metaIndex == pmi;
                    });
                    if (parent.length > 0) {
                        // Node already added
                        item.parentId = parent[0].id;
                        return;
                    }
                    var metaItem = $scope.metaItemsById[pmi];
                    var newItem = makeBottomItem(metaItem.metaIndex + "-1", null, null, metaItem);
                    item.parentId = newItem.id;
                    items.push(newItem);

                    // Make sure higher up in the hierarchy is present
                    addParent(newItem, items);
                }

                function addGroupNode(items, metaId) {
                    var metaItem = getMetaItem(metaId);
                    var item = $.grep(items, function (obj) {
                        return obj.metaIndex == metaItem.metaIndex;
                    });
                    if (item.length > 0) {
                        return item[0];
                    }

                    var newItem = makeBottomItem(metaItem.metaIndex + "-1", null, null, metaItem);
                    items.push(newItem);
                    addParent(newItem, items);
                    return newItem;
                }
                
                function setupTreeList(rawRows) {
                    var data = [];
                    rawRows.forEach(function (row) {
                        var metaItem = getMetaItem(row.MetaId);
                        if (historyService.rowFilter == null || historyService.rowFilter(row, metaItem)) {
                            var rowItem = makeBottomItem(row.Id, row.OldValue, row.NewValue, metaItem, row.Description);
                            if (row.ParentId !== undefined && row.ParentId != null) {
                                rowItem.parentId = row.ParentId;
                            } else {
                                addParent(rowItem, data);
                            }
                            formatItem(rowItem);
                            data.push(rowItem);
                        }
                    });
                    
                    data = data.sort(function (a, b) {
                        return a.sortValue - b.sortValue;
                    });

                    setTreeListData(data);
                };

                $scope.readBigData = function (idClob) {
                    var urlDetails = locationService.api + "accesslogservice.svc/json/changeloglob/" + historyService.type + "/" + idClob;
                    $http.get(urlDetails).success(function (data) {
                        $scope.bigDataRow = data.Result;
                    });
                };

                $scope.showBigData = function (dataItem) {
                    if (dataItem.isLob === true) {
                        $scope.readBigData(dataItem.id);
                    } else {
                        $scope.bigDataRow = { OldValue: dataItem.oldVal, NewValue: dataItem.newVal };
                    }

                    $("#splitter").fadeOut("fast", function () {
                        $("#bigDetail").fadeIn("fast", function () {
                            $("#historyDialog").trigger('resize');
                        });
                    });
                };

                $scope.hideBigData = function () {
                    $("#bigDetail").fadeOut("fast", function () {
                        $("#splitter").fadeIn("fast", function () {
                            $("#historyDialog").trigger('resize');
                        });
                    });
                };

                $scope.readBottomData = function (changeLogType, idData, idSubData) {
                    if (!idSubData) {
                        idSubData = -1;
                    }
                    var urlDetails = locationService.api + "accesslogservice.svc/json/changelogs/" + changeLogType + "/" + idData + "/" + idSubData;

                    $http.get(urlDetails).success(function (data) {
                        setupTreeList(data.Result);
                        $scope.treeListDataTrigger = idData;
                    });

                }
            }

            // ---------------------------- buttons in top-right panel ----------------------------
            function initButtonsCtrl() {

                // Groups data into groups for being displayed heirachically according
                // to which sort button the user selected.
                var groupBy = function (data, fnGroupingValue) {
                    var keys = [];      // the key for each group
                    var values = [];    // the array of objects corresponding to each group

                    data.forEach(function (d) {
                        var groupingValue = fnGroupingValue(d);
                        var idx = $.inArray(groupingValue, keys);
                        if (idx < 0) {
                            idx = keys.push(groupingValue) - 1;
                            values[idx] = [];
                        }
                        values[idx].push(d);
                    });

                    var newData = [];
                    for (var i = 0; i < keys.length; i++) {
                        var obj = { text: keys[i], items: values[i], hasChildren: true, time: values[i][0].time, idData: keys[i] };
                        newData.push(obj);
                    }
                    return newData;
                }

                $scope.fnGroupBy = null;

                $scope.clearSelectedButton = function () {
                    var buttons = $('#divSortButtons .hbtn-state-selected');
                    if (buttons) {
                        buttons.removeClass("hbtn-state-selected");
                    }
                };

                $scope.setSelectedButton = function (btn) {
                    $scope.clearSelectedButton();
                    $(btn).addClass("hbtn-state-selected");
                };

                $scope.SortByDay = function (e) {
                    $scope.setSelectedButton(e.delegateTarget);
                    $scope.fnGroupBy = function (t) {
                        return t.year + "-" + t.month + "-" + t.day;
                    };
                    $scope.ApplyData();
                };

                $scope.SortByMonth = function (e) {
                    $scope.setSelectedButton(e.delegateTarget);
                    $scope.fnGroupBy = function (t) {
                        return t.year + "-" + t.month;
                    };
                    $scope.ApplyData();
                };

                $scope.SortByYear = function (e) {
                    $scope.setSelectedButton(e.delegateTarget);
                    $scope.fnGroupBy = function (t) {
                        return t.year;
                    };
                    $scope.ApplyData();
                };

                $scope.SortByDateTime = function (e) {
                    $scope.setSelectedButton(e.delegateTarget);
                    $scope.fnGroupBy = null;
                    $scope.ApplyData($scope.treeViewData);
                };

                $scope.ApplyData = function () {
                    var data = $scope.fnGroupBy == null ? $scope.treeViewData : groupBy($scope.treeViewData, $scope.fnGroupBy);

                    var id;
                    if ($scope.topRightTreeView.bigDataRow) {
                        // save the currently selected id
                        id = $scope.topRightTreeView.bigDataRow.id;
                    }

                    $scope.treeDataTopRight.data(data);

                    var objSort = { field: "time", dir: "desc" };
                    $scope.treeDataTopRight.sort(objSort);

                    // Telerik only applies the sort to the top-most level, so we have to traverse the
                    // nodes to manually apply the sort to each sub-level.
                    var traverseNodes = function (nodes) {
                        for (var i = 0; i < nodes.length; i++) {
                            if (nodes[i].hasChildren) {
                                nodes[i].children.sort(objSort);
                                traverseNodes(nodes[i].children.view());
                            }
                        }
                    };
                    traverseNodes($scope.treeDataTopRight.view());

                    if (id) {
                        // reset the current selection
                        var treeview = $scope.topRightTreeView;
                        var node = treeview.findByUid($scope.topRightTreeView.dataSource.get(id).uid);
                        treeview.expand(treeview.parent(node));
                        treeview.select(node);
                    }
                };

                $scope.Filter = function () {
                    // Filter button: filters the items in the top-right panel according to
                    // which items are checked in the top-left panel.
                    var idList = [];
                    var allchecked = true;
                    $scope.metaItemsById.forEach(function (metaItem) {
                        // We test only the terminal nodes of the top-left treeview
                        if (metaItem.Items.length == 0) {
                            if (metaItem.checked == true) {
                                idList.push(metaItem.Id);
                            } else {
                                allchecked = false;
                            }
                        }
                    });
                    if (idList.length > 0) {
                        if (allchecked) {
                            // Everything is checked: do a regular read
                            $scope.readTopRightData(historyService.type, historyService.id, historyService.idSub);
                        } else {
                            // Do a filtered read
                            $scope.filterTopRightData(historyService.type, historyService.id, historyService.idSub, idList);
                        }
                    }
                };

            }

            // ---------------------------- top-right panel ----------------------------
            function initTopRight() {

                function selectLogItem(dataItem) {
                    $scope.topRightTreeView.bigDataRow = dataItem;
                    if (dataItem.idData != $scope.currentdetailid) {
                        $scope.readBottomData(historyService.type, dataItem.idData, historyService.idSub);
                    }
                }

                function selectFirstItem(e) {
                    var treeview = $("#accessLogTreeView").data("kendoTreeView");
                    treeview.unbind("dataBound");

                    var data = treeview.dataSource.data();
                    if (data.length > 0) {
                        var dataItem = data[0];
                        if (dataItem.hasChildren) {
                            // The user has previously clicked a sort button. Expand the first node and
                            // select the first node underneath.
                            treeview.expand(treeview.findByUid(dataItem.uid));
                            dataItem = dataItem.children.at(0);
                        }
                        selectLogItem(dataItem);

                        var node = treeview.findByUid(dataItem.uid);
                        treeview.select(node);
                    } else {
                        $scope.topRightTreeView.bigDataRow = false;
                    }
                }

                $scope.onSelectLogItem = function (e) {
                    var dataItem = $scope.topRightTreeView.dataItem(e.node);

                    if (dataItem.hasChildren) {
                        $scope.topRightTreeView.bigDataRow = false;
                        return;
                    }

                    // The user has clicked on one of the treeview details:
                    // read corresponding data for the grid in the bottom panel
                    selectLogItem(dataItem);
                };

                function getSlString(obj, fieldName, fieldNameSl) {
                    if ($scope.cultureManager.currentCulture.Culture.Code == $systemParameters.codeCulture) {
                        return obj[fieldName];
                    }
                    return obj[fieldNameSl] === undefined ? obj[fieldName] : obj[fieldNameSl];
                };

                function processTopRightData(data) {
                    // When data is read for the treeview in the top-right panel, we have to
                    // create data objects appropriate for use by the Kendo TreeView.
                    var items = [];
                    data.forEach(function (d) {
                        var item = {};
                        item.idData = d.id;

                        //d.logDh = $scope.fixDateTime(d.logDh);
                        item.time = d.logDh;

                        if (d.userTitle != undefined) {
                            item.text = dateService.getDisplayDateTime(d.logDh) + ", " + d.FirstName + " " + d.LastName + " - " + d.userTitle + " (" +
                                getSlString(d, "logAction", "LogActionSL") + ")";
                        } else {
                            item.text = dateService.getDisplayDateTime(d.logDh) + ", " + d.FirstName + " " + d.LastName + " (" +
                                getSlString(d, "logAction", "LogActionSL") + ")";
                        }

                        // create fields to use for grouping after button events
                        item.year = item.time.getFullYear().toString();
                        item.month = (item.time.getMonth() + 1).toString();
                        if (item.month.length < 2) {
                            item.month = '0' + item.month;
                        }
                        item.day = item.time.getDate().toString();
                        if (item.day.length < 2) {
                            item.day = '0' + item.day;
                        }

                        item.hasChildren = false;

                        items.push(item);
                    });
                    $scope.treeViewData = items;
                };

                var onTopRightData = function (data) {
                    var treeview = $("#accessLogTreeView").data("kendoTreeView");
                    treeview.bind("dataBound", selectFirstItem);

                    processTopRightData(data.Result);
                    $scope.treeDataTopRight = new kendo.data.HierarchicalDataSource({
                        schema: {
                            model: {
                                id: "idData",
                                children: "items"
                            }
                        }
                    });
                    $scope.ApplyData();
                };

                $scope.filterTopRightData = function(changeLogType, idData, idSubData, filterBy) {
                    if (!idSubData) {
                        idSubData = -1;
                    }

                    var dataObj = {
                        TypeCl: changeLogType,
                        Id: idData,
                        ChildId: idSubData,
                        FilterBy: filterBy
                    };
                    var url = locationService.api + 'accesslogservice.svc/json/filteredaccesslogs';

                    $http.post(url, dataObj).success(function (data) {
                        onTopRightData(data);
                    });
                };

                $scope.readTopRightData = function (changeLogType, idData, idSubData) {
                    if (!idSubData) {
                        idSubData = -1;
                    }
                    var url = locationService.api + 'accesslogservice.svc/json/accesslogs/' + changeLogType + '/' + idData + '/' + idSubData;

                    $http.get(url).success(function (data) {
                        onTopRightData(data);
                    });
                };

                initButtonsCtrl();
                $scope.readTopRightData(historyService.type, historyService.id, historyService.idSub);
            }

            // ---------------------------- top-left panel ----------------------------
            function initTopLeft() {

                $scope.itemTemplate = "{{dataItem.Description}}";

                $scope.treeOptions = {
                    checkboxes: {
                        checkChildren: true
                    },
                };

                // This is a flat list of the data items in the top-left treeview.
                $scope.metaItemsById = [];

                $scope.setListRowVisibility = function (metaItem, checked) {
                    if ($scope.bottomDataSource === undefined) {
                        return;
                    }
                    $scope.bottomDataSource.data().forEach(function (grdDataItem) {
                        // Find rows in the grid that have the same id as the selected treeview node
                        if (metaItem.metaIndex == grdDataItem.metaIndex) {
                            // We use Kendo's data-uid to get the 'tr' element we want to hide/show
                            var tr = $("#treeList tr[data-uid='" + grdDataItem.uid + "']");
                            var elem = $(tr).find(".trFirst")[0];
                            if (checked) {
                                $(elem).removeClass("d-hide-logDetail");
                                if (!$(elem).hasClass("h-collapsed")) {
                                    tr.show();
                                }
                            } else {
                                $(elem).addClass("d-hide-logDetail");
                                tr.hide();
                            }
                        }
                    });
                };

                function setNodeAndChildren(dataItem, b) {
                    dataItem.checked = b;
                    if (dataItem.Items) {
                        dataItem.Items.forEach(function (item) {
                            setNodeAndChildren(item, b);
                        });
                    }
                    $scope.setListRowVisibility(dataItem, b);
                };

                function setNode(node, b) {
                    // *** WARNING ***
                    // The Kendo treeview works with copies of the data it is given. So to make the binding work between the top-left
                    // and bottom panels, we have to manually set the original copy of the data items.
                    // Get the treeview's copy of the dataItem
                    var kendoDataItem = $scope.topLeftTreeView.dataItem(node);

                    //// Get the original version and set its value as well as its descendents
                    var originalItem = $scope.metaItemsById[kendoDataItem.metaIndex];
                    setNodeAndChildren(originalItem, b);

                    if (kendoDataItem.parentMetaIndex !== undefined) {
                        if (b) {
                            // Make sure tha parent is visible.
                            $scope.setListRowVisibility($scope.metaItemsById[kendoDataItem.parentMetaIndex], b);
                        } else {
                            var parent = $scope.topLeftTreeView.parent(node);
                            var cb = $(parent).find(":checkbox");
                            if (cb[0].indeterminate !== true) {
                                // If indeterminate is false, then all of the subnodes are in the same state
                                // and we want to make sure the parent node row is not visible.
                                setNode(parent, false);
                            }
                        }
                    }
                };

                $scope.onKendoCheck = function (e) {
                    var kendoDataItem = $scope.topLeftTreeView.dataItem(e.node);
                    setNode(e.node, kendoDataItem.checked);
                };

                function prepareDescItem(row) {
                    row.checked = true;
                    row.expanded = true;

                    row.metaIndex = $scope.metaItemsById.length;
                    $scope.metaItemsById.push(row);

                    if (row.Items) {
                        row.Items.forEach(function(item) {
                            prepareDescItem(item);
                            item.parentMetaIndex = row.metaIndex;
                        });
                    }

                    return row;
                };

                function prepareDescriptions(rows) {
                    // Modify the data from the server to conform to the structure required for
                    // the Kendo treeview.
                    rows.forEach(function (row) {
                        prepareDescItem(row);
                    });

                    return rows;
                    //return new kendo.data.ObservableArray(rows);
                };

                function readTopLeftData() {
                    var url = locationService.api + 'accesslogservice.svc/json/structurecl/' + historyService.type;

                    $http.get(url).success(function (data) {
                        $scope.topLeftData = prepareDescriptions(data.Result.Rows);
                        $scope.descriptionData = new kendo.data.HierarchicalDataSource({
                            schema: {
                                model: {
                                    id: "Id",
                                    children: "Items"
                                }
                            },
                            data: $scope.topLeftData
                        });
                    });
                };

                readTopLeftData();
            }

            // ---------------------------- main initialisation ----------------------------
            function initHistoryController() {

                $scope.cultureManager.resources.load(historyService.resourceUrl);
                initTopLeft();
                initTopRight();
                initBottom();
                $scope.currentdetailid = null;
                $scope.treeListDataTrigger = null;

                $("#bigDetail").fadeOut("fast");
            }

            function dateTimeFixInit() {
                // Warning: Chrome parses this as UTC, IE does not (which is correct). It is used here for
                // sorting. Be careful not to use it for anything else.
                var test = JSON.parse('"2014-01-19T11:02:00.000"');
                if (test.getHours() != 11 || test.getMinutes() != 2) {
                    // need to fix dates in this browser
                    $scope.fixDateTime = function (dateTimeValue) {
                        var offset = dateTimeValue.getTimezoneOffset();
                        var separator = offset > 0 ? "-" : "+";
                        offset = Math.abs(offset);
                        var hours = offset / 60;
                        hours = hours <= 9 ? "0" + hours : hours.toString();
                        var minutes = offset % 60;
                        minutes = minutes <= 9 ? "0" + minutes : minutes.toString();

                        var fix = JSON.stringify(dateTimeValue);
                        fix = fix.replace(/\"/g, '');
                        fix = fix.replace('Z', '');
                        fix = '"' + fix + separator + hours + ":" + minutes + '"';
                        return JSON.parse(fix);
                    };
                } else {
                    $scope.fixDateTime = function(dateTimeValue) { return dateTimeValue; };
                }
            }

            if ($scope.historyWndVisible) {
                // *** the historyController (this file) is initialized here ***
                dateTimeFixInit();
                initHistoryController();
            }
        }
    ]);

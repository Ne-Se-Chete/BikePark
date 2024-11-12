angular.module('page', ["ideUI", "ideView", "entityApi"])
	.config(["messageHubProvider", function (messageHubProvider) {
		messageHubProvider.eventIdPrefix = 'bike-park.BikeStand.BikeStand';
	}])
	.config(["entityApiProvider", function (entityApiProvider) {
		entityApiProvider.baseUrl = "/services/ts/bike-park/gen/bike-park/api/BikeStand/BikeStandService.ts";
	}])
	.controller('PageController', ['$scope', '$http', 'messageHub', 'entityApi', 'Extensions', function ($scope, $http, messageHub, entityApi, Extensions) {

		$scope.dataPage = 1;
		$scope.dataCount = 0;
		$scope.dataOffset = 0;
		$scope.dataLimit = 10;
		$scope.action = "select";

		//-----------------Custom Actions-------------------//
		Extensions.get('dialogWindow', 'bike-park-custom-action').then(function (response) {
			$scope.pageActions = response.filter(e => e.perspective === "BikeStand" && e.view === "BikeStand" && (e.type === "page" || e.type === undefined));
		});

		$scope.triggerPageAction = function (action) {
			messageHub.showDialogWindow(
				action.id,
				{},
				null,
				true,
				action
			);
		};
		//-----------------Custom Actions-------------------//

		function refreshData() {
			$scope.dataReset = true;
			$scope.dataPage--;
		}

		function resetPagination() {
			$scope.dataReset = true;
			$scope.dataPage = 1;
			$scope.dataCount = 0;
			$scope.dataLimit = 10;
		}

		//-----------------Events-------------------//
		messageHub.onDidReceiveMessage("clearDetails", function (msg) {
			$scope.$apply(function () {
				$scope.selectedEntity = null;
				$scope.action = "select";
			});
		});

		messageHub.onDidReceiveMessage("entityCreated", function (msg) {
			refreshData();
			$scope.loadPage($scope.dataPage, $scope.filter);
		});

		messageHub.onDidReceiveMessage("entityUpdated", function (msg) {
			refreshData();
			$scope.loadPage($scope.dataPage, $scope.filter);
		});

		messageHub.onDidReceiveMessage("entitySearch", function (msg) {
			resetPagination();
			$scope.filter = msg.data.filter;
			$scope.filterEntity = msg.data.entity;
			$scope.loadPage($scope.dataPage, $scope.filter);
		});
		//-----------------Events-------------------//

		$scope.loadPage = function (pageNumber, filter) {
			if (!filter && $scope.filter) {
				filter = $scope.filter;
			}
			if (!filter) {
				filter = {};
			}
			$scope.selectedEntity = null;
			entityApi.count(filter).then(function (response) {
				if (response.status != 200) {
					messageHub.showAlertError("BikeStand", `Unable to count BikeStand: '${response.message}'`);
					return;
				}
				if (response.data) {
					$scope.dataCount = response.data;
				}
				$scope.dataPages = Math.ceil($scope.dataCount / $scope.dataLimit);
				filter.$offset = ($scope.dataPage - 1) * $scope.dataLimit;
				filter.$limit = $scope.dataLimit;
				if ($scope.dataReset) {
					filter.$offset = 0;
					filter.$limit = $scope.dataPage * $scope.dataLimit;
				}

				entityApi.search(filter).then(function (response) {
					if (response.status != 200) {
						messageHub.showAlertError("BikeStand", `Unable to list/filter BikeStand: '${response.message}'`);
						return;
					}
					if ($scope.data == null || $scope.dataReset) {
						$scope.data = [];
						$scope.dataReset = false;
					}
					$scope.data = $scope.data.concat(response.data);
					$scope.dataPage++;
				});
			});
		};
		$scope.loadPage($scope.dataPage, $scope.filter);

		$scope.selectEntity = function (entity) {
			$scope.selectedEntity = entity;
			messageHub.postMessage("entitySelected", {
				entity: entity,
				selectedMainEntityId: entity.Id,
				optionsStandType: $scope.optionsStandType,
				optionsCoordinate: $scope.optionsCoordinate,
			});
		};

		$scope.createEntity = function () {
			$scope.selectedEntity = null;
			$scope.action = "create";

			messageHub.postMessage("createEntity", {
				entity: {},
				optionsStandType: $scope.optionsStandType,
				optionsCoordinate: $scope.optionsCoordinate,
			});
		};

		$scope.updateEntity = function () {
			$scope.action = "update";
			messageHub.postMessage("updateEntity", {
				entity: $scope.selectedEntity,
				optionsStandType: $scope.optionsStandType,
				optionsCoordinate: $scope.optionsCoordinate,
			});
		};

		$scope.deleteEntity = function () {
			let id = $scope.selectedEntity.Id;
			messageHub.showDialogAsync(
				'Delete BikeStand?',
				`Are you sure you want to delete BikeStand? This action cannot be undone.`,
				[{
					id: "delete-btn-yes",
					type: "emphasized",
					label: "Yes",
				},
				{
					id: "delete-btn-no",
					type: "normal",
					label: "No",
				}],
			).then(function (msg) {
				if (msg.data === "delete-btn-yes") {
					entityApi.delete(id).then(function (response) {
						if (response.status != 204) {
							messageHub.showAlertError("BikeStand", `Unable to delete BikeStand: '${response.message}'`);
							return;
						}
						refreshData();
						$scope.loadPage($scope.dataPage, $scope.filter);
						messageHub.postMessage("clearDetails");
					});
				}
			});
		};

		$scope.openFilter = function (entity) {
			messageHub.showDialogWindow("BikeStand-filter", {
				entity: $scope.filterEntity,
				optionsStandType: $scope.optionsStandType,
				optionsCoordinate: $scope.optionsCoordinate,
			});
		};

		//----------------Dropdowns-----------------//
		$scope.optionsStandType = [];
		$scope.optionsCoordinate = [];


		$http.get("/services/ts/bike-park/gen/bike-park/api/Settings/StandTypeService.ts").then(function (response) {
			$scope.optionsStandType = response.data.map(e => {
				return {
					value: e.Id,
					text: e.Name
				}
			});
		});

		$http.get("/services/ts/bike-park/gen/bike-park/api/Settings/CoordinateService.ts").then(function (response) {
			$scope.optionsCoordinate = response.data.map(e => {
				return {
					value: e.Id,
					text: e.Name
				}
			});
		});

		$scope.optionsStandTypeValue = function (optionKey) {
			for (let i = 0; i < $scope.optionsStandType.length; i++) {
				if ($scope.optionsStandType[i].value === optionKey) {
					return $scope.optionsStandType[i].text;
				}
			}
			return null;
		};
		$scope.optionsCoordinateValue = function (optionKey) {
			for (let i = 0; i < $scope.optionsCoordinate.length; i++) {
				if ($scope.optionsCoordinate[i].value === optionKey) {
					return $scope.optionsCoordinate[i].text;
				}
			}
			return null;
		};
		//----------------Dropdowns-----------------//

	}]);

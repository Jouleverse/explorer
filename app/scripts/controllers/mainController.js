angular.module('ethExplorer')
	.controller('mainCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

		var web3 = $rootScope.web3;

		$scope.init = function () {
			var maxBlocks = 5; // TODO: into setting file or user select
			// XXX reduced from 50 to 15 to speed up the page loading.

			getBlockHeight().then(function (result) {
				var blockNum = $scope.blockNum = result;
				if (maxBlocks > blockNum) {
					maxBlocks = blockNum + 1;
				}

				// get latest N blocks
				$scope.blocks = [];
				for (var i = 0; i < maxBlocks; ++i) {
					getBlockInfo(blockNum - i).then(function (result) {
						result.time_localestring = new Date(result.timestamp * 1000).toLocaleString('zh-CN', { timezone: 'UTC', timeZoneName: 'short' });

						if (result.number == blockNum) {
							var current = Date.now() / 1000;
							console.log("local time: ", current, " block time: ", result.timestamp);
							if (current - result.timestamp < 60) { // last block is within 60 sec
								$scope.status = "🟢 数据正常";
							} else {
								$scope.status = "🔴 数据异常";
							}
						}

						//$scope.blocks.push(result);
						var j = 0;
						while (j < $scope.blocks.length && result.number < $scope.blocks[j].number) {
							j++;
						}
						$scope.blocks.splice(j, 0, result);
					});
				}
			});
		}

		function getBlockHeight() {
			var deferred = $q.defer();

			//var height = parseInt(web3.eth.blockNumber, 10);
			var height = web3.eth.getBlockNumber(); // fix: make it compatible with web3 1.8.2

			// intentionally delay...
			window.setTimeout(function() {
				deferred.resolve(height);
			}, 0 /*Math.floor(Math.random() * 3000) + 2000*/);

			return deferred.promise;
		}

		function getBlockInfo(blockNum) {
			var deferred = $q.defer();

			var blockInfo = web3.eth.getBlock(blockNum); // it is a promise 

			// intentionally delay...
			window.setTimeout(function() {
				deferred.resolve(blockInfo);
			}, 0 /*Math.floor(Math.random() * 3000) + 2000*/);

			return deferred.promise;
		}

		$scope.init();

	});

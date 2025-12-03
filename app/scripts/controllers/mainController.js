angular.module('jouleExplorer')
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

			getTimelockInfo().then(function (result) {
				var released = result.released; //总释放量 == total energy
				var locked = result.available; //尚在时间锁中 == reserved energy
				var circulated = result.used; //已进入流通 == free energy

				$scope.energy = {
					total: (released.all/10**6).toLocaleString() + "M",
					free: (circulated.all/10**6).toLocaleString() + "M",
					reserved: (locked.all/10**6).toLocaleString() + "M",
					reserved_core: (locked.core/10**6).toLocaleString() + "M",
					reserved_eco: (locked.eco/10**6).toLocaleString() + "M",
				};
				$scope.$apply(); // force refresh
			});

			// 新增：获取创世区块时间戳并计算运行时间
			getBlockInfo(0).then(function(genesisBlock) {
				if (genesisBlock && genesisBlock.timestamp) {
					var genesisTimestamp = genesisBlock.timestamp;
					var currentTimestamp = Math.floor(Date.now() / 1000);
					var uptimeSeconds = currentTimestamp - genesisTimestamp;

					// 计算年、天
					var years = Math.floor(uptimeSeconds / (365 * 24 * 60 * 60));
					var remainingSeconds = uptimeSeconds % (365 * 24 * 60 * 60);
					var days = Math.floor(remainingSeconds / (24 * 60 * 60));

					var uptimeText = "";
					if (years > 0) {
						uptimeText += years + "年";
					}
					if (days > 0) {
						uptimeText += days + "天";
					}

					// 如果时间很短，显示天数
					if (years === 0 && days === 0) {
						uptimeText = "不足1天";
					}

					$scope.updays = uptimeText;
					$scope.$apply(); // 确保AngularJS更新视图
				} else {
					$scope.updays = "未知";
					$scope.$apply();
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

		async function getTimelockInfo() {
			var deferred = $q.defer();

			var timelockInfo = {};

			var timelock_core_contract = new web3.eth.Contract(timelock_ABI, timelock_core_contract_address);
			var timelock_ecosystem_contract = new web3.eth.Contract(timelock_ABI, timelock_ecosystem_contract_address);

			var released_core = await timelock_core_contract.methods.released().call();
			var released_eco = await timelock_ecosystem_contract.methods.released().call();
			released_core = parseInt(web3.utils.fromWei(released_core, 'ether'));
			released_eco = parseInt(web3.utils.fromWei(released_eco, 'ether'));
			var released_total = parseInt(released_core) + parseInt(released_eco);

			timelockInfo['released'] = { all: released_total,
				core: released_core,
				eco: released_eco
			};

			var available_core = await timelock_core_contract.methods.available().call();
			var available_eco = await timelock_ecosystem_contract.methods.available().call();
			available_core = parseInt(web3.utils.fromWei(available_core, 'ether'));
			available_eco = parseInt(web3.utils.fromWei(available_eco, 'ether'));
			var available_total = parseInt(available_core) + parseInt(available_eco);

			timelockInfo['available'] = { all: available_total,
				core: available_core,
				eco: available_eco
			};

			var used_core = await timelock_core_contract.methods.used().call();
			var used_eco = await timelock_ecosystem_contract.methods.used().call();
			used_core = parseInt(web3.utils.fromWei(used_core, 'ether'));
			used_eco = parseInt(web3.utils.fromWei(used_eco, 'ether'));
			var used_total = parseInt(used_core) + parseInt(used_eco);

			timelockInfo['used'] = { all: used_total,
				core: used_core,
				eco: used_eco
			};

			deferred.resolve(timelockInfo);

			return deferred.promise;
		}

		$scope.init();

	});

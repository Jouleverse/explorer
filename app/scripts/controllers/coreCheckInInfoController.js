angular.module('jouleExplorer')
	.controller('coreCheckInInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q, $timeout) {

		var web3 = $rootScope.web3;
		var popBadgeContract;
		var currentBatchStart = 0; // 当前批次开始的索引（从最新开始）
		var totalSupply = 0; // 总token数量
		var isLoading = false;
		var monthHistory = []; // 月份历史记录，用于前进后退
		var historyPosition = -1; // 当前在历史记录中的位置
		var monthsDataCache = {}; // 月份数据缓存

		// 初始化变量
		$scope.currentMonth = null; // 当前显示的月份
		$scope.currentMonthStats = null; // 当前月份统计
		$scope.hasMoreData = true;
		$scope.isLoading = false;
		$scope.loadedCount = 0;
		$scope.totalRecords = 0;
		$scope.canGoBack = false;
		$scope.canGoForward = false;

		// 安全地应用AngularJS作用域更新
		function safeApply(fn) {
			var phase = $scope.$root.$$phase;
			if (phase === '$apply' || phase === '$digest') {
				if (fn && (typeof fn === 'function')) {
					fn();
				}
			} else {
				$scope.$apply(fn);
			}
		}

		// 初始化合约
		function initContract() {
			if (typeof pop_ABI === 'undefined') {
				console.error("pop_ABI 未定义");
				return;
			}

			if (typeof pop_contract_address === 'undefined') {
				console.error("pop_contract_address 未定义");
				return;
			}

			popBadgeContract = new web3.eth.Contract(pop_ABI, pop_contract_address);
		}

		// 获取总token数量
		function getTotalSupply() {
			var deferred = $q.defer();

			if (!popBadgeContract) {
				initContract();
				if (!popBadgeContract) {
					deferred.reject("合约未初始化");
					return deferred.promise;
				}
			}

			popBadgeContract.methods.totalSupply().call()
				.then(function(supply) {
					totalSupply = parseInt(supply);
					$scope.totalRecords = totalSupply;
					console.log(`[pop] 总token数量: ${totalSupply}`);
					deferred.resolve(supply);
				})
				.catch(function(error) {
					console.error("[pop] 获取总供应量失败:", error);
					deferred.reject(error);
				});

			return deferred.promise;
		}

		// 按索引获取token ID（从最新开始）
		function getTokenIdByIndex(indexFromLatest) {
			if (!popBadgeContract) {
				initContract();
				if (!popBadgeContract) {
					return $q.reject("合约未初始化");
				}
			}

			// 计算实际索引：从最新开始，0表示最新（totalSupply-1）
			var actualIndex = totalSupply - 1 - indexFromLatest;
			console.log(`[pop] 获取token ID: 最新索引 ${indexFromLatest} -> 实际索引 ${actualIndex}`);
			return popBadgeContract.methods.tokenByIndex(actualIndex).call();
		}

		// 批量获取token信息
		function getTokenInfoBatch(tokenIds) {
			if (!popBadgeContract) {
				initContract();
				if (!popBadgeContract) {
					return $q.reject("合约未初始化");
				}
			}

			var promises = tokenIds.map(function(tokenId) {
				return popBadgeContract.methods.getPOPInfo(tokenId).call()
					.then(function(popInfo) {
						return {
							tokenId: tokenId,
							coreId: popInfo.jvCoreTokenId,
							checkInBlockNumber: popInfo.checkInBlockNumber,
							checkInTimestamp: popInfo.checkInTimestamp
						};
					})
					.catch(function(error) {
						console.error(`[pop] 查询token ${tokenId} 失败:`, error);
						return null;
					});
			});

			return $q.all(promises).then(function(results) {
				// 过滤掉失败的查询结果
				return results.filter(function(item) {
					return item !== null;
				});
			});
		}

		// 加载下一个完整月份的数据
		$scope.loadNextMonth = function() {
			if (isLoading || !$scope.hasMoreData) return;

			isLoading = true;
			$scope.isLoading = true;

			console.log(`[pop] 开始加载下一个月份数据，当前批次开始索引: ${currentBatchStart}`);

			// 查找下一个完整的月份
			loadCompleteMonth()
				.then(function(result) {
					if (result.completedMonth && result.monthCheckIns && result.monthCheckIns.length > 0) {
						console.log(`[pop] 完成加载月份: ${result.completedMonth}`);

						// 处理这个月份的数据
						var monthData = processMonthData(result.monthCheckIns, result.monthKey);

						if (monthData) {
							// 缓存月份数据
							monthsDataCache[monthData.monthKey] = monthData;

							// 添加到历史记录
							addToHistory(monthData);

							// 显示这个月份
							displayMonth(monthData);

							// 检查是否还有更多数据
							if (currentBatchStart >= totalSupply) {
								$scope.hasMoreData = false;
								console.log(`[pop] 已加载所有可用数据，currentBatchStart: ${currentBatchStart}, totalSupply: ${totalSupply}`);
							}
						}
					} else {
						console.log(`[pop] 没有找到完整的月份数据或数据为空`);
						$scope.hasMoreData = false;
					}

					isLoading = false;
					$scope.isLoading = false;

					// 使用安全的方式更新作用域
					safeApply(function() {});
				})
				.catch(function(error) {
					console.error("[pop] 加载失败:", error);
					isLoading = false;
					$scope.isLoading = false;

					// 使用安全的方式更新作用域
					safeApply(function() {});
				});
		};

		// 加载一个完整的月份（按需动态加载）
		function loadCompleteMonth() {
			var deferred = $q.defer();
			var currentMonth = null;
			var monthCheckIns = [];
			var monthKey = null;
			var batchSize = 20; // 每批加载的数量
			var isLastBatch = false;
			var startIndex = currentBatchStart; // 记录开始时的索引

			console.log(`[pop] 开始查找完整月份，从最新索引 ${startIndex} 开始，总记录: ${totalSupply}`);

			// 递归加载直到找到一个完整的月份
			function loadBatch() {
				// 检查是否还有更多数据
				if (currentBatchStart >= totalSupply) {
					console.log(`[pop] 已到达数据末尾，处理最后一个月份数据`);

					// 如果有收集到的数据，返回这些数据作为最后一个月份
					if (monthCheckIns.length > 0) {
						deferred.resolve({ 
							completedMonth: formatMonthLabel(currentMonth),
							monthKey: monthKey,
							monthCheckIns: monthCheckIns
						});
					} else {
						deferred.resolve({ 
							completedMonth: null,
							monthKey: monthKey,
							monthCheckIns: []
						});
					}
					return;
				}

				// 计算本批次要加载的数量
				var tokensToLoad = Math.min(batchSize, totalSupply - currentBatchStart);
				var tokenIndices = [];

				// 从最新开始：currentBatchStart 表示从最新开始的偏移量
				for (var i = 0; i < tokensToLoad; i++) {
					tokenIndices.push(currentBatchStart + i);
				}

				console.log(`[pop] 加载批次，最新索引范围: ${currentBatchStart}-${currentBatchStart + tokensToLoad - 1}`);

				// 检查是否是最后一批数据
				if (currentBatchStart + tokensToLoad >= totalSupply) {
					isLastBatch = true;
				}

				// 第一步：获取token IDs
				var tokenIdPromises = tokenIndices.map(function(indexFromLatest) {
					return getTokenIdByIndex(indexFromLatest);
				});

				$q.all(tokenIdPromises)
					.then(function(tokenIds) {
						// 第二步：获取token信息
						return getTokenInfoBatch(tokenIds);
					})
					.then(function(newCheckIns) {
						// 更新当前索引
						currentBatchStart += tokensToLoad;

						if (newCheckIns.length === 0) {
							// 如果没有有效数据，继续加载下一批
							loadBatch();
							return;
						}

						// 检查是否确定了当前月份
						if (!currentMonth) {
							// 第一个数据，确定当前月份
							var firstCheckIn = newCheckIns[0];
							var firstDate = new Date(firstCheckIn.checkInTimestamp * 1000);
							currentMonth = firstDate.getFullYear() + "-" + (firstDate.getMonth() + 1).toString().padStart(2, '0');
							monthKey = currentMonth;
							console.log(`[pop] 当前处理月份: ${currentMonth}`);
						}

						// 添加到月份数据
						newCheckIns.forEach(function(checkIn) {
							var date = new Date(checkIn.checkInTimestamp * 1000);
							var checkInMonth = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, '0');

							if (checkInMonth === currentMonth) {
								// 属于当前月份
								monthCheckIns.push(checkIn);
							}
						});

						// 检查批次中是否有下个月份的数据
						var lastCheckIn = newCheckIns[newCheckIns.length - 1];
						var lastDate = new Date(lastCheckIn.checkInTimestamp * 1000);
						var lastMonth = lastDate.getFullYear() + "-" + (lastDate.getMonth() + 1).toString().padStart(2, '0');

						if (lastMonth === currentMonth) {
							// 还在同一个月份
							if (isLastBatch) {
								// 这是最后一批数据，当前月份已完成
								console.log(`[pop] 最后一批数据，月份 ${currentMonth} 已完成`);
								deferred.resolve({ 
									completedMonth: formatMonthLabel(currentMonth),
									monthKey: monthKey,
									monthCheckIns: monthCheckIns
								});
							} else {
								// 继续加载下一批
								console.log(`[pop] 仍在月份 ${currentMonth} 内，继续加载`);
								loadBatch();
							}
						} else {
							// 找到了月份边界，当前月份已完成
							console.log(`[pop] 月份 ${currentMonth} 已完成，找到边界: ${currentMonth} -> ${lastMonth}`);

							deferred.resolve({ 
								completedMonth: formatMonthLabel(currentMonth),
								monthKey: monthKey,
								monthCheckIns: monthCheckIns
							});
						}
					})
					.catch(function(error) {
						deferred.reject(error);
					});
			}

			loadBatch();
			return deferred.promise;
		}

		// 处理月份数据
		function processMonthData(checkIns, monthKey) {
			if (!checkIns || checkIns.length === 0) {
				console.error(`[pop] 月份 ${monthKey} 没有有效数据`);
				return null;
			}

			// 按Core ID分组统计
			var coreStats = {};
			checkIns.forEach(function(checkIn) {
				var coreId = checkIn.coreId.toString();
				if (!coreStats[coreId]) {
					coreStats[coreId] = {
						coreId: coreId,
						count: 0,
						checkIns: []
					};
				}

				coreStats[coreId].count++;
				coreStats[coreId].checkIns.push(checkIn);
			});

			// 为每个Core ID计算统计信息
			Object.keys(coreStats).forEach(function(coreId) {
				var stat = coreStats[coreId];
				if (stat.checkIns.length > 0) {
					// 按时间排序（最新的在前）
					stat.checkIns.sort(function(a, b) {
						return b.checkInTimestamp - a.checkInTimestamp;
					});

					// 最后签到（最早的，因为是倒序）
					stat.lastCheckIn = stat.checkIns[0];
					// 首次签到（最晚的）
					stat.firstCheckIn = stat.checkIns[stat.checkIns.length - 1];
				}
			});

			return {
				monthKey: monthKey,
				monthYear: formatMonthLabel(monthKey),
				checkIns: checkIns,
				coreStats: coreStats,
				totalCheckIns: checkIns.length,
				uniqueCores: Object.keys(coreStats).length
			};
		}

		// 添加到历史记录
		function addToHistory(monthData) {
			// 如果当前位置不是历史记录的末尾，则截断后面的历史
			if (historyPosition < monthHistory.length - 1) {
				monthHistory = monthHistory.slice(0, historyPosition + 1);
			}

			// 添加到历史记录
			monthHistory.push({
				monthKey: monthData.monthKey,
				monthYear: monthData.monthYear
			});

			historyPosition = monthHistory.length - 1;

			// 更新导航按钮状态
			updateNavigationButtons();
		}

		// 显示月份数据
		function displayMonth(monthData) {
			if (!monthData || !monthData.coreStats) {
				console.error("[pop] 月份数据为空");
				$scope.currentMonthStats = null;
				return;
			}

			$scope.currentMonth = monthData.monthYear;

			// 转换为数组并按Core ID从小到大排序
			var coreStatsArray = [];
			try {
				coreStatsArray = Object.values(monthData.coreStats).sort(function(a, b) {
					// 按Core ID从小到大排序
					return parseInt(a.coreId) - parseInt(b.coreId);
				});
			} catch (error) {
				console.error("[pop] 转换coreStats为数组失败:", error);
				coreStatsArray = [];
			}

			// 更新显示数据
			$scope.currentMonthStats = {
				monthYear: monthData.monthYear,
				totalCheckIns: monthData.totalCheckIns || 0,
				uniqueCores: monthData.uniqueCores || 0,
				coreStats: coreStatsArray.map(function(stat) {
					return {
						coreId: stat.coreId,
						count: stat.count,
						firstCheckInTime: stat.firstCheckIn ? new Date(stat.firstCheckIn.checkInTimestamp * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '-',
						firstBlockNumber: stat.firstCheckIn ? stat.firstCheckIn.checkInBlockNumber : '-',
						lastCheckInTime: stat.lastCheckIn ? new Date(stat.lastCheckIn.checkInTimestamp * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '-',
						lastBlockNumber: stat.lastCheckIn ? stat.lastCheckIn.checkInBlockNumber : '-'
					};
				})
			};

			// 更新Core ID筛选选项
			updateCoreFilterOptions(monthData);

			// 更新已加载计数
			updateLoadedCount();
		}

		// 更新Core ID筛选选项
		function updateCoreFilterOptions(monthData) {
			var coreIds = new Set();

			// 添加当前月份的所有Core ID
			if (monthData && monthData.coreStats) {
				Object.keys(monthData.coreStats).forEach(function(coreId) {
					coreIds.add(coreId);
				});
			}

			$scope.availableCoreIds = Array.from(coreIds).sort(function(a, b) {
				return parseInt(a) - parseInt(b);
			});
		}

		// 更新已加载计数
		function updateLoadedCount() {
			$scope.loadedCount = Object.keys(monthsDataCache).reduce(function(total, monthKey) {
				var monthData = monthsDataCache[monthKey];
				return total + (monthData.checkIns ? monthData.checkIns.length : 0);
			}, 0);
		}

		// 按Core ID筛选当前月份
		$scope.filterByCore = function() {
			if (!$scope.selectedCoreId || !monthsDataCache[getCurrentMonthKey()]) {
				// 显示所有Core ID
				var monthKey = getCurrentMonthKey();
				if (monthKey && monthsDataCache[monthKey]) {
					displayMonth(monthsDataCache[monthKey]);
				}
			} else {
				var monthKey = getCurrentMonthKey();
				var monthData = monthsDataCache[monthKey];
				if (!monthData || !monthData.coreStats) return;

				// 筛选当前月份中指定Core ID的数据
				var coreStat = monthData.coreStats[$scope.selectedCoreId];

				if (coreStat) {
					$scope.currentMonthStats = {
						monthYear: monthData.monthYear,
						totalCheckIns: coreStat.count,
						uniqueCores: 1,
						coreStats: [{
							coreId: coreStat.coreId,
							count: coreStat.count,
							firstCheckInTime: coreStat.firstCheckIn ? new Date(coreStat.firstCheckIn.checkInTimestamp * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '-',
							firstBlockNumber: coreStat.firstCheckIn ? coreStat.firstCheckIn.checkInBlockNumber : '-',
							lastCheckInTime: coreStat.lastCheckIn ? new Date(coreStat.lastCheckIn.checkInTimestamp * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '-',
							lastBlockNumber: coreStat.lastCheckIn ? coreStat.lastCheckIn.checkInBlockNumber : '-'
						}]
					};
				} else {
					// 当前月份没有这个Core ID
					$scope.currentMonthStats = {
						monthYear: monthData.monthYear,
						totalCheckIns: 0,
						uniqueCores: 0,
						coreStats: []
					};
				}
			}

			safeApply(function() {});
		};

		// 获取当前月份key
		function getCurrentMonthKey() {
			if (historyPosition >= 0 && historyPosition < monthHistory.length) {
				return monthHistory[historyPosition].monthKey;
			}
			return null;
		}

		// 导航到上一个月份
		$scope.goBack = function() {
			if (historyPosition > 0) {
				historyPosition--;
				var monthKey = monthHistory[historyPosition].monthKey;
				var monthData = monthsDataCache[monthKey];
				if (monthData) {
					displayMonth(monthData);
					updateNavigationButtons();
				}
			}
		};

		// 导航到下一个月份
		$scope.goForward = function() {
			if (historyPosition < monthHistory.length - 1) {
				historyPosition++;
				var monthKey = monthHistory[historyPosition].monthKey;
				var monthData = monthsDataCache[monthKey];
				if (monthData) {
					displayMonth(monthData);
					updateNavigationButtons();
				}
			}
		};

		// 更新导航按钮状态
		function updateNavigationButtons() {
			$scope.canGoBack = historyPosition > 0;
			$scope.canGoForward = historyPosition < monthHistory.length - 1;
		}

		// 跳转到历史月份
		$scope.goToHistoryMonth = function(monthKey) {
			var monthData = monthsDataCache[monthKey];
			if (monthData) {
				// 查找这个月份在历史记录中的位置
				var index = monthHistory.findIndex(function(item) {
					return item.monthKey === monthKey;
				});

				if (index !== -1) {
					historyPosition = index;
					displayMonth(monthData);
					updateNavigationButtons();
				}
			}
		};

		// 格式化月份标签
		function formatMonthLabel(monthKey) {
			if (!monthKey) return "未知月份";

			var parts = monthKey.split("-");
			if (parts.length === 2) {
				return parts[0] + "年" + parseInt(parts[1]) + "月";
			}
			return monthKey;
		}

		// 初始化数据
		$scope.initData = function() {
			console.log("[pop] 初始化数据加载");

			// 重置状态
			monthHistory = [];
			monthsDataCache = {};
			historyPosition = -1;
			currentBatchStart = 0;
			totalSupply = 0;
			$scope.currentMonth = null;
			$scope.currentMonthStats = null;
			$scope.hasMoreData = true;
			$scope.isLoading = true;
			$scope.loadedCount = 0;
			$scope.totalRecords = 0;
			$scope.selectedCoreId = "";
			$scope.canGoBack = false;
			$scope.canGoForward = false;

			// 使用$timeout确保不在digest循环中
			$timeout(function() {
				// 先获取总数量
				getTotalSupply()
					.then(function(supply) {
						if (supply == 0) {
							$scope.hasMoreData = false;
							$scope.isLoading = false;
							safeApply(function() {});
							return;
						}

						console.log(`[pop] 开始加载第一个月份...`);
						// 加载第一个完整月份
						$scope.loadNextMonth();
					})
					.catch(function(error) {
						console.error("[pop] 数据初始化失败:", error);
						$scope.isLoading = false;
						safeApply(function() {});
					});
			}, 0);
		};

		// 页面初始化
		$scope.init = function() {
			console.log("[pop] 初始化POP签到记录页面");
			initContract();
			$scope.initData();
		};

		$scope.init();

	});

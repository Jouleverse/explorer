angular.module('jouleExplorer')
	.controller('coreCheckInInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q, $timeout) {

		var web3 = $rootScope.web3;
		var popBadgeContract;

		// 核心数据结构
		var tokenCache = []; // 按token ID索引的缓存数组
		var totalSupply = 0; // 总token数量
		var monthsMap = {}; // 月份字典：monthKey -> {monthYear, minId, maxId, tokenIds[], isComplete}
		var monthKeys = []; // 月份键列表（从新到旧排序）
		var currentMonthKey = null; // 当前显示的月份键
		var nextLoadStartId = -1; // 下一次加载的起始ID（从最新开始，递减）
		var isLoading = false;
		var BATCH_SIZE = 20; // 每批次加载20个
		var isFindingFirstCompleteMonth = true; // 是否正在寻找第一个完整月份

		// 显示相关的变量
		$scope.currentMonth = null;
		$scope.currentMonthStats = null;
		$scope.currentMonthIntegrity = null;
		$scope.hasMoreData = true;
		$scope.isLoading = false;
		$scope.loadedCount = 0;
		$scope.totalRecords = 0;
		$scope.canGoPreviousMonth = false;
		$scope.canGoNextMonth = false;

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
					tokenCache = new Array(totalSupply).fill(null);
					// 初始化从最新的token开始加载
					nextLoadStartId = totalSupply - 1;
					deferred.resolve(supply);
				})
				.catch(function(error) {
					console.error("[pop] 获取总供应量失败:", error);
					deferred.reject(error);
				});
			return deferred.promise;
		}

		// 批量加载token数据（从指定的起始位置开始，向前加载）
		function loadTokenBatch(startId, count) {
			if (!popBadgeContract) {
				initContract();
				if (!popBadgeContract) {
					return $q.reject("合约未初始化");
				}
			}

			// 确保不越界
			var actualStartId = Math.max(0, startId - count + 1);
			var actualEndId = startId;
			var batchCount = Math.min(count, actualEndId - actualStartId + 1);

			console.log(`[pop] 加载token批次: ${actualStartId} 到 ${actualEndId}, 共${batchCount}个`);

			var promises = [];
			for (var i = actualStartId; i <= actualEndId; i++) {
				promises.push(
					popBadgeContract.methods.tokenByIndex(i).call()
					.then(function(tokenId) {
						return parseInt(tokenId);
					})
					.then(function(tokenId) {
						return popBadgeContract.methods.getPOPInfo(tokenId).call()
							.then(function(popInfo) {
								// 转换为UTC+8时间
								var timestamp = parseInt(popInfo.checkInTimestamp);
								var utc8Timestamp = timestamp + (8 * 60 * 60);
								var date = new Date(utc8Timestamp * 1000);
								var year = date.getUTCFullYear();
								var month = date.getUTCMonth() + 1;
								var monthKey = year + "-" + month.toString().padStart(2, '0');

								var tokenData = {
									tokenId: tokenId,
									coreId: parseInt(popInfo.jvCoreTokenId),
									checkInBlockNumber: parseInt(popInfo.checkInBlockNumber),
									checkInTimestamp: timestamp,
									month: monthKey,
									monthYear: year + "年" + month + "月",
									utc8Timestamp: utc8Timestamp,
									date: date
								};

								tokenCache[tokenId] = tokenData;
								return tokenData;
							});
					})
					.catch(function(error) {
						console.error(`[pop] 加载token ${i} 失败:`, error);
						return null;
					})
				);
			}

			return $q.all(promises).then(function(results) {
				var validResults = results.filter(function(item) {
					return item !== null;
				});
				console.log(`[pop] 批次加载完成: ${validResults.length} 个有效token`);
				$scope.loadedCount = tokenCache.filter(function(item) {
					return item !== null;
				}).length;
				return validResults;
			});
		}

		// 处理新加载的token，更新月份信息
		function processNewTokens(tokens) {
			console.log(`[pop] 处理 ${tokens.length} 个新token`);

			if (tokens.length === 0) return;

			// 按月份分组
			var monthGroups = {};
			tokens.forEach(function(token) {
				if (!token) return;

				var monthKey = token.month;
				if (!monthGroups[monthKey]) {
					monthGroups[monthKey] = {
						tokens: [],
						minId: token.tokenId,
						maxId: token.tokenId,
						monthYear: token.monthYear
					};
				}
				monthGroups[monthKey].tokens.push(token);
				monthGroups[monthKey].minId = Math.min(monthGroups[monthKey].minId, token.tokenId);
				monthGroups[monthKey].maxId = Math.max(monthGroups[monthKey].maxId, token.tokenId);
			});

			// 更新月份字典
			Object.keys(monthGroups).forEach(function(monthKey) {
				var group = monthGroups[monthKey];

				if (!monthsMap[monthKey]) {
					// 新月份
					monthsMap[monthKey] = {
						monthKey: monthKey,
						monthYear: group.monthYear,
						tokenIds: group.tokens.map(t => t.tokenId).sort((a, b) => b - a),
						minId: group.minId,
						maxId: group.maxId,
						count: group.tokens.length,
						isComplete: false // 初始化为不完整
					};
					// 插入到月份列表的适当位置（保持从新到旧排序）
					insertMonthKey(monthKey);
					console.log(`[pop] 发现新月份: ${monthKey}, token范围: ${group.minId}-${group.maxId}`);
				} else {
					// 更新现有月份
					var monthData = monthsMap[monthKey];
					// 合并token IDs
					group.tokens.forEach(function(token) {
						if (!monthData.tokenIds.includes(token.tokenId)) {
							monthData.tokenIds.push(token.tokenId);
						}
					});
					// 重新排序
					monthData.tokenIds.sort((a, b) => b - a);
					// 更新边界
					monthData.minId = Math.min(monthData.minId, group.minId);
					monthData.maxId = Math.max(monthData.maxId, group.maxId);
					monthData.count = monthData.tokenIds.length;
					console.log(`[pop] 更新月份: ${monthKey}, 新范围: ${monthData.minId}-${monthData.maxId}, 总数: ${monthData.count}`);
				}
			});

			console.log(`[pop] 当前月份数量: ${monthKeys.length}`);

			// 如果当前有显示的月份，检查是否需要刷新
			if (currentMonthKey) {
				var monthData = monthsMap[currentMonthKey];
				if (monthData) {
					// 检查是否有新的token属于当前月份
					var hasNewTokensForCurrentMonth = false;
					tokens.forEach(function(token) {
						if (token && token.month === currentMonthKey) {
							hasNewTokensForCurrentMonth = true;
						}
					});

					// 如果有新的token属于当前月份，刷新显示
					if (hasNewTokensForCurrentMonth) {
						console.log(`[pop] 检测到当前月份 ${currentMonthKey} 有新数据，刷新显示`);
						$timeout(function() {
							displayMonth(currentMonthKey);
						}, 100);
					}
				}
			}
		}

		// 将月份键插入到正确位置（从新到旧排序）
		function insertMonthKey(monthKey) {
			// 解析年月用于比较
			var parts = monthKey.split('-');
			var year = parseInt(parts[0]);
			var month = parseInt(parts[1]);

			var inserted = false;
			for (var i = 0; i < monthKeys.length; i++) {
				var existingParts = monthKeys[i].split('-');
				var existingYear = parseInt(existingParts[0]);
				var existingMonth = parseInt(existingParts[1]);

				// 比较：新月份应该排在前面（时间上更新）
				if (year > existingYear || (year === existingYear && month > existingMonth)) {
					monthKeys.splice(i, 0, monthKey);
					inserted = true;
					break;
				}
			}

			if (!inserted) {
				monthKeys.push(monthKey);
			}
		}

		// 检查月份完整性
		function checkMonthIntegrity(monthKey) {
			var monthData = monthsMap[monthKey];
			if (!monthData) return { status: 'error', message: '月份不存在' };

			var minId = monthData.minId;
			var maxId = monthData.maxId;
			var actualCount = monthData.count;
			var expectedCount = maxId - minId + 1;

			console.log(`[pop] 检查月份 ${monthKey}: min=${minId}, max=${maxId}, 实际=${actualCount}, 理论=${expectedCount}`);

			// 检查边界token
			var hasLeftBoundary = true;
			var hasRightBoundary = true;

			if (minId > 0) {
				var leftToken = tokenCache[minId - 1];
				hasLeftBoundary = leftToken !== null && leftToken !== undefined && leftToken.month !== monthKey;
				if (!hasLeftBoundary && leftToken) {
					console.log(`[pop] 左边界token ${minId - 1} 属于同一月份: ${leftToken.month}`);
				}
			}

			if (maxId < totalSupply - 1) {
				var rightToken = tokenCache[maxId + 1];
				hasRightBoundary = rightToken !== null && rightToken !== undefined && rightToken.month !== monthKey;
				if (!hasRightBoundary && rightToken) {
					console.log(`[pop] 右边界token ${maxId + 1} 属于同一月份: ${rightToken.month}`);
				}
			}

			// 判断完整性
			if (actualCount === expectedCount && hasLeftBoundary && hasRightBoundary) {
				monthData.isComplete = true;
				return { 
					status: 'valid', 
					message: `数据完整 (${actualCount}/${expectedCount})`,
					isComplete: true
				};
			}

			// 如果不完整，说明需要继续加载
			var message = '正在加载数据...';
			if (actualCount !== expectedCount) {
				message = `数据不完整: ${actualCount}/${expectedCount}`;
			} else if (!hasLeftBoundary) {
				message = '左边界不完整';
			} else if (!hasRightBoundary) {
				message = '右边界不完整';
			}

			return { 
				status: 'loading', 
				message: message,
				isComplete: false
			};
		}

		// 检查是否找到第一个完整月份
		function hasFoundFirstCompleteMonth() {
			if (monthKeys.length === 0) return false;

			// 获取最新月份
			var latestMonthKey = monthKeys[0];
			var latestMonth = monthsMap[latestMonthKey];

			if (!latestMonth) return false;

			// 检查完整性
			var integrity = checkMonthIntegrity(latestMonthKey);

			// 如果最新月份完整，说明找到了第一个完整月份
			if (integrity.isComplete) {
				console.log(`[pop] 找到第一个完整月份: ${latestMonthKey}`);
				return true;
			}

			return false;
		}

		// 更新导航按钮状态
		function updateNavigationButtons() {
			if (!currentMonthKey || monthKeys.length === 0) {
				$scope.canGoPreviousMonth = false;
				$scope.canGoNextMonth = false;
				return;
			}

			var currentIndex = monthKeys.indexOf(currentMonthKey);
			$scope.canGoPreviousMonth = currentIndex < monthKeys.length - 1;
			$scope.canGoNextMonth = currentIndex > 0;

			console.log(`[pop] 导航按钮状态: currentIndex=${currentIndex}, totalMonths=${monthKeys.length}, canGoPreviousMonth=${$scope.canGoPreviousMonth}, canGoNextMonth=${$scope.canGoNextMonth}`);
		}

		// 更新UI
		function updateUI() {
			if (!$scope.$$phase) {
				$scope.$digest();
			}
		}

		// 重新加载当前月份
		$scope.reloadCurrentMonth = function() {
			if (currentMonthKey) {
				console.log(`[pop] 重新加载当前月份: ${currentMonthKey}`);
				displayMonth(currentMonthKey);
			}
		};

		// 添加一个新变量来跟踪是否正在为当前月份加载
		var isAutoLoadingForCurrentMonth = false;

		// 为当前显示的月份触发自动加载
		function autoLoadForCurrentMonth() {
			if (!currentMonthKey) return;

			var monthData = monthsMap[currentMonthKey];
			if (!monthData) return;

			// 检查月份是否完整
			var integrity = checkMonthIntegrity(currentMonthKey);

			// 如果月份不完整，开始自动加载
			if (!integrity.isComplete && !isAutoLoadingForCurrentMonth && $scope.hasMoreData && !isLoading) {
				console.log(`[pop] 当前月份 ${currentMonthKey} 不完整，开始自动加载`);
				isAutoLoadingForCurrentMonth = true;
				isFindingFirstCompleteMonth = true; // 启用自动加载模式

				// 开始加载
				$timeout(function() {
					$scope.loadMore();
				}, 300);
			}
		}

		// 修改导航函数，触发自动加载
		$scope.goPreviousMonth = function() {
			if (!currentMonthKey) return;

			var currentIndex = monthKeys.indexOf(currentMonthKey);
			if (currentIndex < monthKeys.length - 1) {
				var nextMonthKey = monthKeys[currentIndex + 1];
				console.log(`[pop] 导航到上一月: ${currentMonthKey} -> ${nextMonthKey}`);
				displayMonth(nextMonthKey);

				// 导航后检查是否需要自动加载
				$timeout(function() {
					autoLoadForCurrentMonth();
				}, 500);
			} else {
				console.log(`[pop] 无法导航到上一月: 已经在最早的月份`);
			}
		};

		$scope.goNextMonth = function() {
			if (!currentMonthKey) return;

			var currentIndex = monthKeys.indexOf(currentMonthKey);
			if (currentIndex > 0) {
				var prevMonthKey = monthKeys[currentIndex - 1];
				console.log(`[pop] 导航到下一月: ${currentMonthKey} -> ${prevMonthKey}`);
				displayMonth(prevMonthKey);

				// 导航后检查是否需要自动加载
				$timeout(function() {
					autoLoadForCurrentMonth();
				}, 500);
			} else {
				console.log(`[pop] 无法导航到下一月: 已经在最新的月份`);
			}
		};

		// 修改 displayMonth 函数，添加自动加载检查
		function displayMonth(monthKey) {
			var monthData = monthsMap[monthKey];
			if (!monthData) {
				console.error(`[pop] 月份不存在: ${monthKey}`);
				return;
			}

			currentMonthKey = monthKey;
			var monthIndex = monthKeys.indexOf(monthKey);

			console.log(`[pop] 显示月份: ${monthData.monthYear}, 索引: ${monthIndex}, tokens: ${monthData.count}, 完整: ${monthData.isComplete}`);

			// 更新导航按钮状态
			updateNavigationButtons();

			// 更新当前月份显示
			$scope.currentMonth = monthData.monthYear;

			// 统计Core ID数据
			var coreStats = {};
			monthData.tokenIds.forEach(function(tokenId) {
				var token = tokenCache[tokenId];
				if (!token) return;

				var coreId = token.coreId.toString();
				if (!coreStats[coreId]) {
					coreStats[coreId] = {
						coreId: coreId,
						count: 0,
						tokens: []
					};
				}

				coreStats[coreId].count++;
				coreStats[coreId].tokens.push(token);
			});

			// 为每个Core ID计算首次和最后签到时间
			Object.values(coreStats).forEach(function(stat) {
				if (stat.tokens.length > 0) {
					// 按token ID排序（最大的最先）
					stat.tokens.sort(function(a, b) {
						return b.tokenId - a.tokenId;
					});

					stat.firstToken = stat.tokens[stat.tokens.length - 1];
					stat.lastToken = stat.tokens[0];
				}
			});

			// 转换为数组并按Core ID排序
			var coreStatsArray = Object.values(coreStats).sort(function(a, b) {
				return parseInt(a.coreId) - parseInt(b.coreId);
			});

			// 更新显示数据
			$scope.currentMonthStats = {
				monthYear: monthData.monthYear,
				totalCheckIns: monthData.count,
				uniqueCores: coreStatsArray.length,
				coreStats: coreStatsArray.map(function(stat) {
					return {
						coreId: stat.coreId,
						count: stat.count,
						firstCheckInTime: stat.firstToken ?
						new Date(stat.firstToken.utc8Timestamp * 1000)
						.toLocaleString('zh-CN', { timeZone: 'UTC' }) : '-',
						firstBlockNumber: stat.firstToken ? stat.firstToken.checkInBlockNumber : '-',
						lastCheckInTime: stat.lastToken ?
						new Date(stat.lastToken.utc8Timestamp * 1000)
						.toLocaleString('zh-CN', { timeZone: 'UTC' }) : '-',
						lastBlockNumber: stat.lastToken ? stat.lastToken.checkInBlockNumber : '-'
					};
				})
			};

			// 检查完整性
			$scope.currentMonthIntegrity = checkMonthIntegrity(monthKey);

			updateUI();
		}

		// 判断是否应该继续加载
		function shouldContinueLoading() {
			// 如果没有数据，需要加载
			if (monthKeys.length === 0) {
				console.log(`[pop] 没有月份数据，继续加载`);
				return true;
			}

			// 如果是为当前月份自动加载，只检查当前月份
			if (isAutoLoadingForCurrentMonth && currentMonthKey) {
				var monthData = monthsMap[currentMonthKey];
				if (monthData) {
					var integrity = checkMonthIntegrity(currentMonthKey);
					console.log(`[pop] 为当前月份自动加载: ${currentMonthKey}, 完整: ${integrity.isComplete}`);

					// 如果当前月份已完整，停止加载
					if (integrity.isComplete) {
						isAutoLoadingForCurrentMonth = false;
						isFindingFirstCompleteMonth = false;
						console.log(`[pop] 当前月份 ${currentMonthKey} 已完整，停止自动加载`);
						return false;
					}

					// 当前月份不完整，继续加载
					console.log(`[pop] 当前月份 ${currentMonthKey} 不完整，继续加载`);
					return true;
				}
			}

			// 如果正在寻找第一个完整月份（初始加载）
			if (isFindingFirstCompleteMonth) {
				var hasFound = hasFoundFirstCompleteMonth();
				if (hasFound) {
					isFindingFirstCompleteMonth = false; // 停止寻找
					console.log(`[pop] 已找到第一个完整月份，停止自动加载`);
					return false;
				}
				console.log(`[pop] 尚未找到第一个完整月份，继续加载`);
				return true;
			}

			// 其他情况不自动加载
			console.log(`[pop] 停止自动加载`);
			return false;
		}

		// 修改 loadMore 函数，简化对 isAutoLoadingForCurrentMonth 的处理
		$scope.loadMore = function() {
			if (isLoading || !$scope.hasMoreData) return;

			isLoading = true;
			$scope.isLoading = true;
			console.log(`[pop] 开始加载更多数据, nextLoadStartId=${nextLoadStartId}, isAutoLoadingForCurrentMonth=${isAutoLoadingForCurrentMonth}, currentMonthKey=${currentMonthKey}`);

			// 计算批次大小
			var batchSize = Math.min(BATCH_SIZE, nextLoadStartId + 1);
			if (batchSize <= 0) {
				$scope.hasMoreData = false;
				isLoading = false;
				$scope.isLoading = false;
				isAutoLoadingForCurrentMonth = false; // 重置状态
				updateUI();
				return;
			}

			loadTokenBatch(nextLoadStartId, batchSize)
				.then(function(tokens) {
					// 更新下一次加载的起始位置
					nextLoadStartId = nextLoadStartId - batchSize;

					// 处理新加载的token
					processNewTokens(tokens);

					// 更新当前显示月份的完整性状态
					if (currentMonthKey) {
						$scope.currentMonthIntegrity = checkMonthIntegrity(currentMonthKey);
					}

					// 如果没有当前显示的月份，显示最新月份
					if (!currentMonthKey && monthKeys.length > 0) {
						currentMonthKey = monthKeys[0];
						displayMonth(currentMonthKey);
					}

					// 更新加载状态
					$scope.hasMoreData = (nextLoadStartId >= 0);

					isLoading = false;
					$scope.isLoading = false;

					// 检查是否应该继续加载
					var needContinue = shouldContinueLoading();

					// 如果需要继续加载，延迟后自动加载下一批
					if (needContinue && $scope.hasMoreData) {
						console.log(`[pop] 自动继续加载下一批`);
						$timeout($scope.loadMore, 200);
					} else {
						// 确保更新导航按钮状态
						updateNavigationButtons();
						console.log(`[pop] 停止自动加载`);
						isAutoLoadingForCurrentMonth = false; // 重置状态
					}

					updateUI();
				})
				.catch(function(error) {
					console.error(`[pop] 加载失败:`, error);
					isLoading = false;
					$scope.isLoading = false;
					isAutoLoadingForCurrentMonth = false; // 重置状态
					updateUI();
				});
		};

		// 初始化数据
		$scope.initData = function() {
			console.log("[pop] 初始化数据加载");

			// 重置状态
			tokenCache = [];
			monthsMap = {};
			monthKeys = [];
			currentMonthKey = null;
			nextLoadStartId = -1;
			isLoading = false;
			isFindingFirstCompleteMonth = true;

			$scope.currentMonth = null;
			$scope.currentMonthStats = null;
			$scope.currentMonthIntegrity = null;
			$scope.hasMoreData = true;
			$scope.isLoading = true;
			$scope.loadedCount = 0;
			$scope.totalRecords = 0;
			$scope.canGoPreviousMonth = false;
			$scope.canGoNextMonth = false;

			// 使用$timeout确保不在digest循环中
			$timeout(function() {
				getTotalSupply()
					.then(function() {
						if (totalSupply == 0) {
							$scope.hasMoreData = false;
							$scope.isLoading = false;
							updateUI();
							return;
						}

						console.log(`[pop] 开始加载初始数据...`);
						// 开始加载
						$scope.loadMore();
					})
					.catch(function(error) {
						console.error("[pop] 数据初始化失败:", error);
						$scope.isLoading = false;
						updateUI();
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

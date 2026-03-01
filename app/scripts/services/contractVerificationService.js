// app/scripts/services/contractVerificationService.js
angular.module('jouleExplorer')
	.service('contractVerificationService', function($q, $timeout) {

		let workerPool = {};
		let workerReady = {};

		/**
		 * 获取或创建 Worker
		 */
		function getWorker(version) {
			if (!workerPool[version]) {
				const workerUrl = '/scripts/workers/solcWorker.js';
				console.log('创建 Worker，路径:', workerUrl);

				try {
					const worker = new Worker(workerUrl);

					worker.onerror = function(error) {
						console.error('Worker 错误:', error);
						workerReady[version] = false;
					};

					workerPool[version] = worker;
					workerReady[version] = true;

					console.log('Worker 创建成功');
				} catch (e) {
					console.error('Worker 创建失败:', e);
					workerReady[version] = false;
				}
			}
			return workerPool[version];
		}

		/**
		 * 使用 Web Worker 编译合约
		 */
		function compileWithWorker(sourceCode, contractName, version, optimizer, evmVersion, constructorArgs) {
			const deferred = $q.defer();

			try {
				const worker = getWorker(version);

				if (!worker || !workerReady[version]) {
					deferred.reject('Worker 不可用，请刷新页面重试');
					return deferred.promise;
				}

				worker.onmessage = function(e) {
					console.log('收到 Worker 消息:', e.data);

					if (e.data.error) {
						deferred.reject(e.data.error);
					} else {
						// 确保 optimizer 信息被传递
						const result = {
							...e.data,
							optimizer: e.data.optimizer || optimizer  // 如果worker没返回，使用传入的
						};
						deferred.resolve(result);
					}
				};

				worker.onerror = function(error) {
					console.error('Worker 错误事件:', error);
					deferred.reject('Worker 错误: ' + error.message);
				};

				console.log('发送编译任务到 Worker，优化设置:', optimizer);
				worker.postMessage({
					sourceCode: sourceCode,
					contractName: contractName,
					version: version,
					optimizer: optimizer,  // 确保传入 optimizer
					evmVersion: evmVersion,
					constructorArgs: constructorArgs
				});

				$timeout(function() {
					deferred.reject('编译超时');
				}, 60000);

			} catch (e) {
				console.error('启动 Worker 失败:', e);
				deferred.reject('启动 Worker 失败: ' + e.message);
			}

			return deferred.promise;
		}

		/**
		 * 编译合约源码
		 */
		function compileSource(sourceCode, contractName, specifiedVersion, optimizer, evmVersion, constructorArgs) {
			const deferred = $q.defer();

			try {
				let version = specifiedVersion;

				console.log('compileSource 接收到的版本:', version);
				console.log('compileSource 接收到的优化设置:', optimizer);
				console.log('compileSource 接收到的evm版本:', evmVersion);
				console.log('compileSource 接收到的构造参数:', constructorArgs);

				if (!version) {
					version = extractPragmaVersion(sourceCode);
					console.log('从源码提取的版本:', version);

					if (!version) {
						deferred.reject('无法识别Solidity版本，且未指定编译器版本');
						return deferred.promise;
					}
				} else {
					version = version.toString();
				}

				// 使用 Worker 编译，传入优化设置
				compileWithWorker(sourceCode, contractName, version, optimizer, evmVersion, constructorArgs)
					.then(result => {
						deferred.resolve(result);
					})
					.catch(error => {
						console.error('Worker 编译失败:', error);
						deferred.reject('编译失败: ' + error);
					});

			} catch (e) {
				deferred.reject('编译准备过程出错: ' + e.message);
			}

			return deferred.promise;
		}

		/**
		 * 从源码中提取pragma solidity版本
		 */
		function extractPragmaVersion(sourceCode) {
			const pragmaMatch = sourceCode.match(/pragma\s+solidity\s+([^;]+);/);
			if (!pragmaMatch) return null;

			const versionStr = pragmaMatch[1].trim();

			// 处理 ^0.8.0 或 >=0.8.0 <0.9.0 等情况
			if (versionStr.startsWith('^')) {
				return versionStr.substring(1).split(' ')[0];
			} else if (versionStr.includes('<')) {
				const minMatch = versionStr.match(/([0-9]+\.[0-9]+\.[0-9]+)/);
				return minMatch ? minMatch[1] : null;
			} else {
				return versionStr;
			}
		}

		/**
		 * 从链上获取合约字节码
		 */
		function getOnChainBytecode(address, web3) {
			const deferred = $q.defer();

			web3.eth.getCode(address, function(error, code) {
				if (error) {
					deferred.reject(error);
				} else {
					deferred.resolve(code);
				}
			});

			return deferred.promise;
		}

		/**
		 * 比对字节码
		 */
		function compareBytecodes(compiledBytecode, onChainBytecode) {
			// 移除0x前缀
			let compiled = compiledBytecode.startsWith('0x') ?
				compiledBytecode.slice(2) : compiledBytecode;
			let onChain = onChainBytecode.startsWith('0x') ?
				onChainBytecode.slice(2) : onChainBytecode;

			// 基础信息（包含原始字节码供预览）
			const baseResult = {
				compiledBytecode: compiledBytecode,
				onChainBytecode: onChainBytecode,
				compiledLength: compiled.length,
				onChainLength: onChain.length
			};

			// 情况1：完全匹配（包括元数据）
			if (compiled === onChain) {
				return {
					...baseResult,
					verified: true,
					matchType: 'exact_match',
					message: '✅ 完全匹配（包括元数据）',
					similarity: 100
				};
			}

			// 通过CBOR长度移除元数据哈希
			const compiledClean = removeMetadataByCBOR(compiled);
			const onChainClean = removeMetadataByCBOR(onChain);

			// 情况2：去除元数据后完全匹配（相似度应为100%）
			if (compiledClean === onChainClean) {
				return {
					...baseResult,
					verified: true,
					matchType: 'metadata_diff',
					message: '✅ 验证一致（仅元数据哈希不同）',
					similarity: 100,  // 改为100%
					compiledCleanLength: compiledClean.length,
					onChainCleanLength: onChainClean.length
				};
			}

			// 情况3：不完全匹配 - 计算真实相似度（全量比较）
			const maxLength = Math.max(compiled.length, onChain.length);
			const minLength = Math.min(compiled.length, onChain.length);

			// 全量比较，找出所有差异位置
			let diffPositions = [];
			for (let i = 0; i < minLength; i++) {
				if (compiled[i] !== onChain[i]) {
					diffPositions.push(i);
				}
			}

			// 计算相似度
			const totalChars = maxLength; // 以较长字节码为准
			const matches = totalChars - diffPositions.length - (maxLength - minLength);
			const similarity = Math.round((matches / totalChars) * 100);

			return {
				...baseResult,
				verified: false,
				matchType: 'mismatch',
				message: `❌ 验证失败（相似度: ${similarity}%）`,
				similarity: similarity,
				compiledCleanLength: compiledClean.length,
				onChainCleanLength: onChainClean.length,
				diffPositions: diffPositions.slice(0, 10) // 记录前10个差异位置用于调试
			};
		}

		/**
		 * 通过CBOR长度可靠地移除元数据哈希
		 * Solidity文档：最后两个字节表示CBOR编码的长度
		 */
		function removeMetadataByCBOR(bytecode) {
			if (bytecode.length < 10) return bytecode;

			try {
				// 最后两个字节是CBOR长度（大端编码）
				const cborLengthHex = bytecode.slice(-4); // 取最后4个字符（2字节）
				const cborLength = parseInt(cborLengthHex, 16);

				// 验证长度是否合理（通常53-100字符左右）
				if (cborLength > 0 && cborLength < 200) {
					// 移除最后 CBOR长度 + 2字节长度字段
					const metadataLength = (cborLength * 2) + 4; // 每个字节占2字符 + 长度字段4字符
					if (metadataLength < bytecode.length) {
						return bytecode.slice(0, bytecode.length - metadataLength);
					}
				}
			} catch (e) {
				console.log('CBOR长度解析失败:', e);
			}

			// 如果无法通过CBOR长度解析，返回原字节码
			// 这样至少不会错误地截断
			return bytecode;
		}

		return {
			compileSource: compileSource,
			getOnChainBytecode: getOnChainBytecode,
			compareBytecodes: compareBytecodes,
			extractPragmaVersion: extractPragmaVersion
		};
	});

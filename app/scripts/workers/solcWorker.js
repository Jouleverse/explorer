// app/scripts/workers/solcWorker.js

const SOLC_VERSIONS = {
	'0.8.0': 'soljson-v0.8.0+commit.c7dfd78e.js',
	'0.8.4': 'soljson-v0.8.4+commit.c7e474f2.js',
	'0.8.7': 'soljson-v0.8.7+commit.e28d00a7.js',
	'0.8.19': 'soljson-v0.8.19+commit.7dd6d404.js',
	'0.8.20': 'soljson-v0.8.20+commit.a1b79de6.js'
};

// 在 solcWorker.js 中修改消息处理
self.addEventListener('message', function(e) {
    console.log('Worker 收到消息:', e.data);

    const { sourceCode, contractName, version, optimizer, evmVersion, constructorArgs } = e.data;

    console.log('开始加载 solc 版本:', version);
    console.log('优化设置:', optimizer);

    const solcFile = SOLC_VERSIONS[version];
    if (!solcFile) {
        self.postMessage({ error: `不支持的Solidity版本: ${version}` });
        return;
    }

    console.log('加载 solc 文件:', solcFile);

    try {
        importScripts(`https://binaries.soliditylang.org/bin/${solcFile}`);
        console.log('solc 脚本加载成功');

        if (self.Module && typeof self.Module._solidity_compile === 'function') {
            console.log('找到 _solidity_compile 函数');
            compileWithLowLevelAPI(self.Module, sourceCode, contractName, version, optimizer, evmVersion, constructorArgs);
        } else {
            console.error('未找到 _solidity_compile 函数');
            self.postMessage({ error: '无法创建编译器实例' });
        }

    } catch (e) {
        console.error('importScripts 失败:', e);
        self.postMessage({ error: '加载 solc 失败: ' + e.message });
    }
});

/**
 * 使用底层 API 编译，支持优化设置
 */
function compileWithLowLevelAPI(module, sourceCode, contractName, version, optimizer, evmVersion, constructorArgs) {
	try {
		// 准备编译输入，包含优化设置
		const input = {
			language: 'Solidity',
			sources: {
				'contract.sol': {
					content: sourceCode
				}
			},
			settings: {
				outputSelection: {
					'*': {
						'*': [
							'evm.bytecode.object',        // 创建代码（包含构造函数）
							'evm.deployedBytecode.object', // 运行时字节码（构造函数已执行）
							'metadata'
						]
					}
				},
				optimizer: optimizer || {
					enabled: true,
					runs: 200
				},
				evmVersion: evmVersion || 'istanbul',
				metadata: {
					useLiteralContent: true
				}
			}
		};

		console.log('使用的优化设置:', input.settings.optimizer);
		console.log('使用的evm版本:', input.settings.evmVersion);
		console.log('构造函数参数:', constructorArgs);

		const inputStr = JSON.stringify(input);
		const inputPtr = module._malloc(inputStr.length + 1);

		for (let i = 0; i < inputStr.length; i++) {
			module.HEAPU8[inputPtr + i] = inputStr.charCodeAt(i);
		}
		module.HEAPU8[inputPtr + inputStr.length] = 0;

		console.log('开始编译...');

		const outputPtr = module._solidity_compile(inputPtr);

		let outputStr = '';
		let offset = 0;
		while (true) {
			const charCode = module.HEAPU8[outputPtr + offset];
			if (charCode === 0) break;
			outputStr += String.fromCharCode(charCode);
			offset++;
		}

		module._free(inputPtr);

		console.log('编译完成，输出长度:', outputStr.length);

		const parsedOutput = JSON.parse(outputStr);

		if (parsedOutput.errors) {
			const errors = parsedOutput.errors.filter(e => e.severity === 'error');
			if (errors.length > 0) {
				self.postMessage({
					error: errors.map(e => e.message).join('\n')
				});
				return;
			}
		}

		if (!parsedOutput.contracts || !parsedOutput.contracts['contract.sol']) {
			self.postMessage({ error: '编译后未找到合约输出' });
			return;
		}

		const contractFile = parsedOutput.contracts['contract.sol'];
		const contractNames = Object.keys(contractFile);

		console.log('找到合约:', contractNames);

		// 确定目标合约
		let targetContract = contractName;
		if (!targetContract) {
			// 如果没有指定合约名，使用第一个
			targetContract = contractNames[0];
		}

		const exactMatch = contractNames.find(name =>
			name.toLowerCase() === targetContract.toLowerCase());

		if (exactMatch) {
			const contractOutput = contractFile[exactMatch];

			// 获取创建字节码（包含构造函数）
			const creationBytecode = contractOutput.evm.bytecode.object;

			// 获取运行时字节码（构造函数已执行）
			let runtimeBytecode = contractOutput.evm.deployedBytecode.object;

			console.log('创建代码长度:', creationBytecode.length);
			console.log('运行时字节码长度:', runtimeBytecode.length);

			// 如果有构造函数参数，需要验证它们是否影响运行时字节码
			// 对于只设置状态变量的构造函数，运行时字节码不变
			// 但对于有初始化逻辑的构造函数，可能需要模拟部署

			// 返回运行时字节码用于验证（这是链上存储的）
			self.postMessage({
				bytecode: '0x' + runtimeBytecode,  // 用于验证的字节码
				creationBytecode: '0x' + creationBytecode,  // 完整的创建代码
				contractName: exactMatch,
				metadata: contractOutput.metadata,
				version: version,
				optimizer: optimizer || { enabled: true, runs: 200 },
				evmVersion: evmVersion || 'istanbul',
				constructorArgs: constructorArgs || []  // 返回构造函数参数用于显示
			});
			return;
		}

		// 如果没找到匹配的合约
		self.postMessage({
			error: `未找到合约 "${contractName}"，可用的合约有: ${contractNames.join(', ')}`
		});

	} catch (e) {
		console.error('编译失败:', e);
		self.postMessage({ error: '编译失败: ' + e.message });
	}
}

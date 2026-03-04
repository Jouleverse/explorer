// app/scripts/workers/solcWorker.js
const SOLC_VERSIONS = {
	//'0.4.18': 'soljson-v0.4.18+commit.9cf6e910.js', // 暂时无法支持
	'0.5.16': 'soljson-v0.5.16+commit.9c3226ce.js',
	'0.5.17': 'soljson-v0.5.17+commit.d19bba13.js',
	'0.8.0': 'soljson-v0.8.0+commit.c7dfd78e.js',
	'0.8.7': 'soljson-v0.8.7+commit.e28d00a7.js',
	'0.8.20': 'soljson-v0.8.20+commit.a1b79de6.js',
};

self.addEventListener('message', function(e) {
	console.log('Worker 收到消息:', e.data);

	const { sourceCode, contractName, version, optimizer, evmVersion, constructorArgs } = e.data;

	console.log('开始加载 solc 版本:', version);
	console.log('优化设置:', optimizer);
	console.log('evm版本:', evmVersion);
	console.log('构造函数参数:', constructorArgs);

	const solcFile = SOLC_VERSIONS[version];
	if (!solcFile) {
		self.postMessage({ error: `不支持的Solidity版本: ${version}` });
		return;
	}

	console.log('加载 solc 文件:', solcFile);

	try {
		importScripts(`https://binaries.soliditylang.org/bin/${solcFile}`);
		console.log('solc 脚本加载成功');

		// 检查编译器是否可用
		checkCompiler(function(compiler) {
			if (compiler) {
				console.log('找到编译器，开始编译');
				compileWithCompiler(compiler, sourceCode, contractName, version, optimizer, evmVersion, constructorArgs);
			} else {
				self.postMessage({ error: '无法创建编译器实例' });
			}
		});

	} catch (e) {
		console.error('importScripts 失败:', e);
		self.postMessage({ error: '加载 solc 失败: ' + e.message });
	}
});

function checkCompiler(callback, attempts = 0) {
	console.log('检查编译器可用性, 尝试次数:', attempts);

	// 对于 0.8.0 版本，通常有 _solidity_compile 函数
	if (self.Module && typeof self.Module._solidity_compile === 'function') {
		console.log('找到 Module._solidity_compile');
		callback(self.Module);
		return;
	}

	// 检查 Module 函数
	if (typeof self.Module === 'function') {
		try {
			const compiler = self.Module();
			if (compiler && typeof compiler._solidity_compile === 'function') {
				console.log('通过 Module() 创建编译器成功');
				callback(compiler);
				return;
			}
		} catch (e) {
			console.log('Module() 调用失败:', e);
		}
	}

	// 检查 solc 函数
	if (typeof self.solc === 'function') {
		try {
			const compiler = self.solc();
			if (compiler && typeof compiler.compile === 'function') {
				console.log('找到 solc.compile');
				callback(compiler);
				return;
			}
		} catch (e) {
			console.log('solc() 调用失败:', e);
		}
	}

	// 检查直接是否有 compile 函数
	if (typeof self.compile === 'function') {
		console.log('找到全局 compile');
		callback(self);
		return;
	}

	// 检查是否有 solc 对象
	if (self.solc) {
		console.log('solc 对象存在:', Object.keys(self.solc));
		callback(self.solc);
		return;
	}

	if (attempts < 50) {
		setTimeout(() => checkCompiler(callback, attempts + 1), 100);
	} else {
		console.log('编译器检查超时');
		callback(null);
	}
}

function compileWithCompiler(compiler, sourceCode, contractName, version, optimizer, evmVersion, constructorArgs) {
	try {
		// 准备编译输入
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
						'*': ['evm.bytecode.object', 'evm.deployedBytecode.object', 'metadata']
					}
				},
				optimizer: optimizer || { enabled: true, runs: 200 },
				evmVersion: evmVersion || 'istanbul'
			}
		};

		const inputStr = JSON.stringify(input);
		console.log('编译输入长度:', inputStr.length);

		let output;

		// 对于 0.8.0，使用 _solidity_compile
		if (compiler._solidity_compile) {
			console.log('使用 _solidity_compile 编译');

			// 分配内存
			const inputPtr = compiler._malloc(inputStr.length + 1);

			// 写入字符串
			for (let i = 0; i < inputStr.length; i++) {
				compiler.HEAPU8[inputPtr + i] = inputStr.charCodeAt(i);
			}
			compiler.HEAPU8[inputPtr + inputStr.length] = 0;

			// 编译
			const outputPtr = compiler._solidity_compile(inputPtr);

			// 读取结果
			let outputStr = '';
			let offset = 0;
			while (true) {
				const charCode = compiler.HEAPU8[outputPtr + offset];
				if (charCode === 0) break;
				outputStr += String.fromCharCode(charCode);
				offset++;
			}

			// 释放内存
			compiler._free(inputPtr);

			output = outputStr;
		}
		// 使用标准 compile 方法
		else if (typeof compiler.compile === 'function') {
			console.log('使用 compile 方法编译');
			output = compiler.compile(inputStr);
		}
		// 使用 compileStandard 方法
		else if (typeof compiler.compileStandard === 'function') {
			console.log('使用 compileStandard 方法编译');
			output = compiler.compileStandard(inputStr);
		}
		else {
			throw new Error('找不到可用的编译方法');
		}

		console.log('编译完成，输出长度:', output.length);

		const parsedOutput = JSON.parse(output);

		if (parsedOutput.errors) {
			const errors = parsedOutput.errors.filter(e => e.severity === 'error');
			if (errors.length > 0) {
				self.postMessage({ error: errors.map(e => e.message).join('\n') });
				return;
			}
		}

		const contractFile = parsedOutput.contracts['contract.sol'];
		if (!contractFile) {
			self.postMessage({ error: '编译后未找到合约输出' });
			return;
		}

		const contractNames = Object.keys(contractFile);
		console.log('找到合约:', contractNames);

		let targetContract = contractName;
		if (!targetContract) {
			targetContract = contractNames[0];
		}

		const exactMatch = contractNames.find(name =>
			name.toLowerCase() === targetContract.toLowerCase());

		if (exactMatch) {
			const contractOutput = contractFile[exactMatch];

			// 获取运行时字节码
			let runtimeBytecode;
			if (contractOutput.evm && contractOutput.evm.deployedBytecode) {
				runtimeBytecode = contractOutput.evm.deployedBytecode.object;
			} else if (contractOutput.evm && contractOutput.evm.bytecode) {
				runtimeBytecode = contractOutput.evm.bytecode.object;
				console.log('警告：使用创建代码代替运行时字节码');
			} else {
				self.postMessage({ error: '无法获取字节码' });
				return;
			}

			console.log('编译成功，字节码长度:', runtimeBytecode.length);

			self.postMessage({
				bytecode: '0x' + runtimeBytecode,
				creationBytecode: contractOutput.evm.bytecode ? '0x' + contractOutput.evm.bytecode.object : null,
				contractName: exactMatch,
				metadata: contractOutput.metadata,
				version: version,
				optimizer: optimizer || { enabled: true, runs: 200 },
				evmVersion: evmVersion || 'istanbul',
				constructorArgs: constructorArgs || []
			});
		} else {
			self.postMessage({ error: `未找到合约 "${contractName}"，可用的合约有: ${contractNames.join(', ')}` });
		}

	} catch (e) {
		console.error('编译失败:', e);
		self.postMessage({ error: '编译失败: ' + e.message });
	}
}

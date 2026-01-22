#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 读取标准BIP-39汉字表文件
const standardFile = path.join(__dirname, 'bip-0039-chinese_simplified.txt');
// 上级目录的jvaddress.js文件
const jsFile = path.join(__dirname, '..', 'jvaddress.js');

console.log('正在验证BIP-39汉字表一致性...\n');

try {
	// 1. 读取标准汉字表文件 - 按行读取，每行一个汉字
	const standardContent = fs.readFileSync(standardFile, 'utf8');
	const standardLines = standardContent.split('\n');

	// 过滤空行和去除每行两端的空白字符
	const standardChars = standardLines
		.map(line => line.trim())
		.filter(line => line.length > 0);

	console.log(`标准汉字表文件: ${standardLines.length} 行`);
	console.log(`标准汉字表有效行: ${standardChars.length} 个汉字`);

	// 显示前几个字符用于调试
	console.log(`前10个汉字: ${standardChars.slice(0, 10).join('')}`);

	// 2. 直接require JavaScript模块
	const jvaddress = require(jsFile);

	if (!jvaddress.BIP39_CHINESE_CHARS) {
		throw new Error('jvaddress.js 没有导出 BIP39_CHINESE_CHARS 常量');
	}

	const jsChars = jvaddress.BIP39_CHINESE_CHARS.split('');

	console.log(`\nJS代码中的汉字表: ${jsChars.length} 个汉字`);
	console.log(`JS代码前10个: ${jsChars.slice(0, 10).join('')}`);

	// 3. 比较长度
	console.log('\n--- 长度比较 ---');
	console.log(`标准汉字表长度: ${standardChars.length}`);
	console.log(`JS汉字表长度: ${jsChars.length}`);

	if (standardChars.length !== jsChars.length) {
		console.error('\n⚠️  长度不一致！');
		console.error('可能的原因：');
		console.error('1. 文件中有空行或空白字符');
		console.error('2. 文件编码问题');
		console.error('3. JS代码中的字符串可能包含换行符');

		// 检查JS字符串中是否有换行符
		if (jvaddress.BIP39_CHINESE_CHARS.includes('\n')) {
			console.error('⚠️  JS字符串中包含换行符！');
		}

		// 显示差异样本
		console.error('\n文件前50个字符的十六进制表示:');
		const fileSample = standardContent.substring(0, 50);
		for (let i = 0; i < fileSample.length; i++) {
			const char = fileSample[i];
			const code = char.charCodeAt(0);
			console.error(`  ${i}: '${char === '\n' ? '\\n' : char === '\r' ? '\\r' : char}' = U+${code.toString(16).padStart(4, '0')} (${code})`);
		}

		throw new Error(`长度不一致！标准: ${standardChars.length}, JS: ${jsChars.length}`);
	}

	// 4. 逐字比较
	console.log('\n--- 逐字比较 ---');
	let differences = [];

	for (let i = 0; i < standardChars.length; i++) {
		if (standardChars[i] !== jsChars[i]) {
			differences.push({
				index: i,
				standard: standardChars[i],
				js: jsChars[i],
				charCodeStandard: standardChars[i].charCodeAt(0).toString(16),
				charCodeJs: jsChars[i].charCodeAt(0).toString(16)
			});

			// 只显示前5个差异
			if (differences.length >= 5) break;
		}
	}

	if (differences.length > 0) {
		console.log('❌ 发现差异:');
		differences.forEach(diff => {
			console.log(`  位置 ${diff.index}: 文件=" ${diff.standard}"(U+${diff.charCodeStandard}), JS=" ${diff.js}"(U+${diff.charCodeJs})`);
		});

		// 尝试找到第一个差异位置的前后文
		if (differences.length > 0) {
			const firstDiff = differences[0];
			console.log('\n第一个差异位置的上下文:');
			console.log(`  文件侧: ...${standardChars.slice(Math.max(0, firstDiff.index-5), firstDiff.index+6).join('')}...`);
			console.log(`  JS侧: ...${jsChars.slice(Math.max(0, firstDiff.index-5), firstDiff.index+6).join('')}...`);
		}

		throw new Error(`发现差异`);
	}

	console.log('✅ 所有汉字顺序和内容完全一致');

	// 5. 额外验证
	console.log('\n--- 额外验证 ---');
	console.log(`BIP-39标准要求: 2048个汉字`);
	console.log(`实际数量: ${jsChars.length}个汉字`);

	if (jsChars.length === 2048) {
		console.log('✅ 符合BIP-39标准');
	} else {
		console.log('⚠️  不符合BIP-39标准（应该是2048个汉字）');
	}

	// 检查重复字符
	const charSet = new Set(jsChars);
	console.log(`唯一字符数: ${charSet.size}`);
	if (charSet.size < jsChars.length) {
		console.log(`⚠️  有 ${jsChars.length - charSet.size} 个重复字符`);
	} else {
		console.log('✅ 所有字符都是唯一的');
	}

} catch (error) {
	console.error(`\n❌ 验证失败: ${error.message}`);

	// 提供更多调试信息
	console.error('\n调试信息:');
	console.error(`当前目录: ${__dirname}`);
	console.error(`标准文件路径: ${standardFile}`);
	console.error(`JS文件路径: ${jsFile}`);

	// 检查文件是否存在
	try {
		const stats = fs.statSync(standardFile);
		console.error(`标准文件大小: ${stats.size} 字节`);
	} catch (e) {
		console.error(`无法读取标准文件: ${e.message}`);
	}

	process.exit(1);
}

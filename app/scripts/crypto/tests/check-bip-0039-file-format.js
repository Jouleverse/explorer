#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const standardFile = path.join(__dirname, 'bip-0039-chinese_simplified.txt');

try {
	const content = fs.readFileSync(standardFile, 'utf8');

	console.log('=== 文件格式检查 ===\n');

	// 1. 基本统计
	console.log(`文件总长度: ${content.length} 字符`);
	console.log(`行数: ${content.split('\n').length}`);

	// 2. 检查换行符类型
	const crlfCount = (content.match(/\r\n/g) || []).length;
	const lfCount = (content.match(/\n/g) || []).length - crlfCount;
	const crCount = (content.match(/\r/g) || []).length - crlfCount;

	console.log(`\n换行符统计:`);
	console.log(`  CRLF (\\r\\n): ${crlfCount}`);
	console.log(`  LF (\\n): ${lfCount}`);
	console.log(`  CR (\\r): ${crCount}`);

	// 3. 按行分析
	const lines = content.split(/\r?\n/);
	console.log(`\n有效行分析:`);

	const validLines = lines.filter(line => line.trim().length > 0);
	const emptyLines = lines.length - validLines.length;

	console.log(`  总行数: ${lines.length}`);
	console.log(`  有效行（非空）: ${validLines.length}`);
	console.log(`  空行: ${emptyLines}`);

	// 4. 显示每行长度
	console.log(`\n前10行内容:`);
	for (let i = 0; i < Math.min(10, validLines.length); i++) {
		const line = validLines[i];
		const char = line.trim();
		console.log(`  行 ${i+1}: "${char}" (长度: ${char.length}, 十六进制: ${char.charCodeAt(0).toString(16)})`);
	}

	// 5. 检查是否有行包含多个字符
	const multiCharLines = validLines.filter(line => line.trim().length > 1);
	if (multiCharLines.length > 0) {
		console.log(`\n⚠️  警告: ${multiCharLines.length} 行包含多个字符`);
		console.log('前几个多字符行:');
		multiCharLines.slice(0, 3).forEach((line, idx) => {
			console.log(`  行 ${validLines.indexOf(line)+1}: "${line}"`);
		});
	}

	// 6. 检查是否有空白字符
	const whitespaceLines = validLines.filter(line => line !== line.trim());
	if (whitespaceLines.length > 0) {
		console.log(`\n⚠️  警告: ${whitespaceLines.length} 行包含前导或尾随空格`);
	}

	console.log('\n✅ 检查完成');

} catch (error) {
	console.error(`检查失败: ${error.message}`);
	process.exit(1);
}

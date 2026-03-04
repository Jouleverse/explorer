var deployments = {
	"mainnet": {
		"airdrop": {
			"tag": "JTI空投合约",
			"hex": "0xdA143f617808Db2E223a643104CCEB91Ec6E1C35",
			"src": "jti_airdrop.sol",
			"solc": {
				"version": "0.8.7",
				"evmVersion": "istanbul",
				"optimizer": {
					"enabled": true,
					"runs": 200
				},
				"contract": "JTIAirdrop",
				"params": [
					"0x826971d988d7d86Fdc9062A3f63E7b18D32Bc8EB", "17000000000000000"
				]
			}
		},
		"cryptojunks": {
			"tag": "CryptoJunks合约",
			"hex": "0x1b1d15726d64c5027b627138f2bf051cc1EF2680",
			"src": "cryptojunks.sol",
			"solc": {
				"version": "0.8.0",
				"evmVersion": "istanbul",
				"optimizer": {
					"enabled": true,
					"runs": 200
				},
				"contract": "CryptoJunks",
				"params": [
					"CryptoJunks",
					"JUNK"
				]
			}
		},
		"flyingj": {
			"tag": "飞翔的J合约",
			"hex": "0x045B997B5E05DF9795985aB9e6720d94557255BE",
			"src": "flyingj.sol",
			"solc": {
				"version": "0.8.0",
				"evmVersion": "istanbul",
				"optimizer": {
					"enabled": true,
					"runs": 200
				},
				"contract": "FlyingJ",
				"params": [
					"Flying J",
					"FLYING-J"
				]
			}
		},
		"jns": {
			"tag": "JNS合约",
			"hex": "0xf8AbF36Bb2dc525b1E566d6B42F6Fd1BB2035b89",
			"src": "jns.sol",
			"solc": {
				"version": "0.8.0",  // 编译器版本
				"evmVersion": "istanbul",  // EVM版本
				"optimizer": {  // 优化器设置
					"enabled": true,
					"runs": 200
				},
				"contract": "JNS",
				"params": [
					"J Name Service",
					"JNS"
				]
			}
		},
		"jnsdaov": {
			"tag": "JNSDAO加V",
			"hex": "0x9F57e77585E05CA7Def98f3171F448Fc8eb13A83",
			"src": "jnsdao_v.sol",
			"solc": {
				"version": "0.8.0",
				"evmVersion": "istanbul",
				"optimizer": {
					"enabled": true,
					"runs": 200
				},
				"contract": "JNSDAOV",
				"params": ["JNSDAO V", "JNSDAO-V"]
			}
		},
		"jnsvote": {
			"tag": "JNS投票合约",
			"hex": "0xEf1f38e95dd7F4FB564535F9317ecB3Bd419DA50",
			"src": "jns_vote.sol",
			"solc": {
				"version": "0.8.7",  // 编译器版本
				"evmVersion": "istanbul",  // EVM版本
				"optimizer": {  // 优化器设置
					"enabled": true,
					"runs": 200
				},
				"contract": "JNSVote",
				"params": [
					"JNS Vote", "JNSVote",
					"0xf8AbF36Bb2dc525b1E566d6B42F6Fd1BB2035b89",
					"0x826971d988d7d86Fdc9062A3f63E7b18D32Bc8EB"
				]
			}
		},
		"jti": {
			"tag": "JTI标识V1",
			"hex": "0x826971d988d7d86Fdc9062A3f63E7b18D32Bc8EB",
			"src": "jti.sol",
			"solc": {
				"version": "0.8.0",  // 编译器版本
				"evmVersion": "istanbul",  // EVM版本
				"optimizer": {  // 优化器设置
					"enabled": true,
					"runs": 200
				},
				"contract": "JTI",
				"params": ["J Trusted Identity", "JTI"]
			}
		},
		"jti2": {
			"tag": "JTI标识V2",
			"hex": "0x7e722837Ff19BE2687c2089DBf70D064fB9622AE",
			"src": "jti2_identity.sol",
			"solc": {
				"version": "0.8.0",  // 编译器版本
				"evmVersion": "istanbul",  // EVM版本
				"optimizer": {  // 优化器设置
					"enabled": true,
					"runs": 200
				},
				"contract": "Identity",
				"params": ["J Trusted Identity", "JTI",
					"0x77136ef358f55E20E7d51259fa47D3D68C9324db",
					"0x9c100856f5C60a3ec87Aa408567304DB2AfC241F"
				]
			}
		},
		"planet": {
			"tag": "星球",
			"hex": "0x9c100856f5C60a3ec87Aa408567304DB2AfC241F",
			"src": "jti2_planet.sol",
			"solc": {
				"version": "0.8.0",  // 编译器版本
				"evmVersion": "istanbul",  // EVM版本
				"optimizer": {  // 优化器设置
					"enabled": true,
					"runs": 200
				},
				"contract": "Planet",
				"params": ["Planet", "Planet",
					"0x77136ef358f55E20E7d51259fa47D3D68C9324db"
				]
			}
		},
		"jvcore": {
			"tag": "Core身份标识",
			"hex": "0x8d214415b9c5F5E4Cf4CbCfb4a5DEd47fb516392",
			"src": "JVCore_flattened.sol",
			"solc": {
				"version": "0.8.20",  // 编译器版本
				"evmVersion": "istanbul",  // EVM版本
				"optimizer": {  // 优化器设置
					"enabled": true,
					"runs": 200
				},
				"contract": "JVCore",
				"params": ["JVCore", "JVC",
					2592000, 86400, "0xCb1429da13cE40e75519148e796C6D58dD6b1a8E"
				]
			}
		},
		"popbadge": {
			"tag": "Core签到徽章",
			"hex": "0xCb1429da13cE40e75519148e796C6D58dD6b1a8E",
			"src": "POPBadge_flattened.sol",
			"solc": {
				"version": "0.8.20",  // 编译器版本
				"evmVersion": "istanbul",  // EVM版本
				"optimizer": {  // 优化器设置
					"enabled": true,
					"runs": 200
				},
				"contract": "POPBadge",
				"params": ["POPBadge", "POP"]
			}
		},
		"redpacket": {
			"tag": "红包",
			"hex": "0x0dc46592ACf76e149B108BDe2E56D8429a2D6046",
			"src": "redpacket.sol",
			"solc": {
				"version": "0.8.0",  // 编译器版本
				"evmVersion": "istanbul",  // EVM版本
				"optimizer": {  // 优化器设置
					"enabled": true,
					"runs": 200
				},
				"contract": "RedPacketJoule",
				"params": [
					"0x7fba9BB966189Db8C4fE33B7bf67Bfa24203c6AD",
					"0x826971d988d7d86Fdc9062A3f63E7b18D32Bc8EB"
				]
			}
		},
		"timelock_core": {
			"tag": "核心时间锁",
			"hex": "0x628beb88dD440A8c5e4cC89Ab33a041f521e4323",
			"src": "Timelock.sol",
			"solc": {
				"version": "0.5.16",  // 编译器版本
				"evmVersion": "istanbul",  // EVM版本
				"optimizer": {  // 优化器设置
					"enabled": true,
					"runs": 200
				},
				"contract": "Timelock",
				"params": [
					"0x3B717119878E2db1AA7df46F5AdcF9766A01706F",
					172800,
					"12000000000000000000000000"
				]
			}
		},
		"timelock_eco": {
			"tag": "生态时间锁",
			"hex": "0xbb6b53Fadf85B73258cb6A54F1343Ac4D5F99773",
			"src": "Timelock.sol",
			"solc": {
				"version": "0.5.16",  // 编译器版本
				"evmVersion": "istanbul",  // EVM版本
				"optimizer": {  // 优化器设置
					"enabled": true,
					"runs": 200
				},
				"contract": "Timelock",
				"params": [
					"0x3B717119878E2db1AA7df46F5AdcF9766A01706F",
					604800,
					"48000000000000000000000000"
				]
			}
		},
		"wj": {
			"tag": "Wrapped Joule",
			"hex": "0x7fba9BB966189Db8C4fE33B7bf67Bfa24203c6AD",
			"src": "WJ.sol",
			"solc": {
				"version": "0.8.0",  // 编译器版本
				"evmVersion": "istanbul",  // EVM版本
				"optimizer": {  // 优化器设置
					"enabled": true,
					"runs": 200
				},
				"contract": "WJ",
				"params": []
			}
		},
		//--------------------//
		"genesis": {
			"tag": "创世金库",
			"hex": "0x3B717119878E2db1AA7df46F5AdcF9766A01706F",
			"src": "multisig-wallet.sol",
			"solc": {
				"version": "0.4.18",  // 编译器版本
				"evmVersion": "byzantium",  // EVM版本
				"optimizer": {  // 优化器设置
					"enabled": true,
					"runs": 200
				},
				"contract": "MultiSigWalletWithDailyLimit",
				"params": [
					["0x40791e9888D4B8D8f0d75262aBD131ed613189Db","0xa2029982158382e5f60e7df51593a6309bc9ba1c","0xB313C0de794F530Ab08e0a71C31Ee022e875Fe76"],
					"2",
					"100000000000000000"
				]
			}
		},
		"ecofund1": {
			"tag": "生态基金1号",
			"hex": "0x50fe8f7cf122CFa689A634510C1b869E790f9760",
			"src": "multisig-wallet-safe.sol",
			"solc": {
				"version": "0.5.17",  // 编译器版本
				"evmVersion": "istanbul",  // EVM版本
				"optimizer": {  // 优化器设置
					"enabled": true,
					"runs": 200
				},
				"contract": "MultiSigWallet",
				"params": [
					[
						"0xc605e8c7E45410e598F835BE5E3e27a3Ed9c39Dd",
						"0x12a8AB14fe18b464f2286470a85223efcec52ad9", 
						"0xEDaD6273b53A38f827407A43AfFf71B1F8dd3a22", 
						"0x77aafda98de6485419b3bc367216e6abb220efdc", 
						"0xe5762924C843269E6E3F39F621D6e7127f95eEA2", 
						"0x23297B0749e51283d2424f8b4Fe1d472514B656a", 
						"0xF66082F48cBc11ac83Cdde11644f4Db2f363205a"
					], 6
				]
			}
		},
		"node_staking": {
			"tag": "节点PoS质押",
			"hex": "0xDb11694Ed05Db4a6230BDFd0914094FE7CE73646",
			"src": "multisig-wallet-safe.sol",
			"solc": {
				"version": "0.5.17",  // 编译器版本
				"evmVersion": "istanbul",  // EVM版本
				"optimizer": {  // 优化器设置
					"enabled": true,
					"runs": 200
				},
				"contract": "MultiSigWallet",
				"params": [
					["0x40791e9888D4B8D8f0d75262aBD131ed613189Db", "0xA2029982158382E5f60E7df51593a6309Bc9Ba1c", "0xB313C0de794F530Ab08e0a71C31Ee022e875Fe76", "0xb23823CBE3962aed787fAfbc2a5B907c0F4d1489", "0x3bD7F1E5C4b059a85a7b2F0a91934fB6A28e7104"],3
				]
			}
		},
		"vote_staking": {
			"tag": "投票权PoS质押",
			"hex": "0xB17b6812f3Ed0eb0Df6e9F1D308C975B5daa8dC3",
			"src": "multisig-wallet-safe.sol",
			"solc": {
				"version": "0.5.17",  // 编译器版本
				"evmVersion": "istanbul",  // EVM版本
				"optimizer": {  // 优化器设置
					"enabled": true,
					"runs": 200
				},
				"contract": "MultiSigWallet",
				"params": [
					["0x40791e9888D4B8D8f0d75262aBD131ed613189Db", "0xA2029982158382E5f60E7df51593a6309Bc9Ba1c", "0xB313C0de794F530Ab08e0a71C31Ee022e875Fe76", "0xb23823CBE3962aed787fAfbc2a5B907c0F4d1489", "0x3bD7F1E5C4b059a85a7b2F0a91934fB6A28e7104"],3
				]
			}
		},

	}

};

// 保留二级结构的反向索引
const deployment_addresses = {
	mainnet: {},
	// 如果有其他网络，可以在这里添加
	// testnet: {},
	// devnet: {},
};

// 遍历 deployments 构建索引
for (const network in deployments) {
	if (deployments.hasOwnProperty(network)) {
		// 初始化该网络的地址索引
		if (!deployment_addresses[network]) {
			deployment_addresses[network] = {};
		}

		for (const contractKey in deployments[network]) {
			if (deployments[network].hasOwnProperty(contractKey)) {
				const contract = deployments[network][contractKey];
				if (contract.hex) {
					const lc_address = contract.hex.toLowerCase();
					deployment_addresses[network][lc_address] = {
						key: contractKey,
						tag: contract.tag || contractKey,
						src: contract.src,
						hex: contract.hex,
						solc: contract.solc
					};
				}
			}
		}
	}
}

// 新增一个辅助函数来查找地址（支持指定网络或不指定网络）
function getDeploymentInfo(address, network = null) {
	if (!address) return null;

	const lc_address = address.toLowerCase();

	if (network) {
		// 指定网络查找
		if (deployment_addresses[network]) {
			return deployment_addresses[network][lc_address] || null;
		}
		return null;
	} else {
		// 在所有网络中查找（返回第一个匹配的）
		for (const net in deployment_addresses) {
			if (deployment_addresses[net][lc_address]) {
				const info = deployment_addresses[net][lc_address];
				return {
					...info,
					network: net
				};
			}
		}
		return null;
	}
}

function getAddressTag(address, network = 'mainnet') {
	if (!address) return address;

	const info = getDeploymentInfo(address, network);
	return info ? info.tag : address;
}

// 新增：获取地址的源代码文件
function getDeploymentSource(address, network = null) {
	const info = getDeploymentInfo(address, network);
	return info ? info.src : null;
}

// 新增：判断地址是否在部署列表中
function isDeployedAddress(address, network = null) {
	return getDeploymentInfo(address, network) !== null;
}

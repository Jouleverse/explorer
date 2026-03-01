var deployments = {
	"mainnet": {
		"airdrop": {
			"tag": "JTI空投合约",
			"hex": "0xdA143f617808Db2E223a643104CCEB91Ec6E1C35",
			"src": "jti_airdrop.sol",
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
		},
		"jnsvote": {
			"tag": "JNS投票合约",
			"hex": "0xEf1f38e95dd7F4FB564535F9317ecB3Bd419DA50",
			"src": "jns_vote.sol",
		},
		"jti": {
			"tag": "JTI标识",
			"hex": "0x826971d988d7d86Fdc9062A3f63E7b18D32Bc8EB",
			"src": "jti.sol",
		},
		"jti2": {
			"tag": "JTI标识V2",
			"hex": "0x7e722837Ff19BE2687c2089DBf70D064fB9622AE",
			"src": "jti2_identity.sol",
		},
		"jvcore": {
			"tag": "Core身份标识",
			"hex": "0x8d214415b9c5F5E4Cf4CbCfb4a5DEd47fb516392",
			"src": "JVCore.sol",
		},
		"planet": {
			"tag": "星球",
			"hex": "0x9c100856f5C60a3ec87Aa408567304DB2AfC241F",
			"src": "jti2_planet.sol",
		},
		"popbadge": {
			"tag": "Core签到徽章",
			"hex": "0xCb1429da13cE40e75519148e796C6D58dD6b1a8E",
			"src": "POPBadge.sol",
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
		},
		"timelock_eco": {
			"tag": "生态时间锁",
			"hex": "0xbb6b53Fadf85B73258cb6A54F1343Ac4D5F99773",
			"src": "Timelock.sol",
		},
		"wj": {
			"tag": "Wrapped Joule",
			"hex": "0x7fba9BB966189Db8C4fE33B7bf67Bfa24203c6AD",
			"src": "WJ.sol",
		},
		//--------------------//
		"genesis": {
			"tag": "创世金库",
			"hex": "0x3B717119878E2db1AA7df46F5AdcF9766A01706F",
			"src": "multisig-wallet.sol",
		},
		"ecofund1": {
			"tag": "生态基金1号",
			"hex": "0x50fe8f7cf122CFa689A634510C1b869E790f9760",
			"src": "multisig-wallet-safe.sol",
		},
		"node_staking": {
			"tag": "节点PoS质押",
			"hex": "0xDb11694Ed05Db4a6230BDFd0914094FE7CE73646",
			"src": "multisig-wallet-safe.sol",
		},
		"vote_staking": {
			"tag": "投票权PoS质押",
			"hex": "0xB17b6812f3Ed0eb0Df6e9F1D308C975B5daa8dC3",
			"src": "multisig-wallet-safe.sol",
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

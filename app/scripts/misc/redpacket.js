var redpacket_contract_address = "0x0dc46592ACf76e149B108BDe2E56D8429a2D6046"; // mainnet
var redpacket_ABI = 
	[
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "_wj",
					"type": "address"
				},
				{
					"internalType": "address",
					"name": "_jti",
					"type": "address"
				}
			],
			"stateMutability": "nonpayable",
			"type": "constructor"
		},
		{
			"inputs": [],
			"name": "JTI",
			"outputs": [
				{
					"internalType": "contract IERC721",
					"name": "",
					"type": "address"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "WJ",
			"outputs": [
				{
					"internalType": "contract IERC20",
					"name": "",
					"type": "address"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "id",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "quantity",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "amount",
					"type": "uint256"
				}
			],
			"name": "create",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "id",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "n",
					"type": "uint256"
				}
			],
			"name": "inspect",
			"outputs": [
				{
					"components": [
						{
							"internalType": "uint256",
							"name": "e",
							"type": "uint256"
						},
						{
							"internalType": "address",
							"name": "opener",
							"type": "address"
						},
						{
							"internalType": "uint256",
							"name": "block_height",
							"type": "uint256"
						}
					],
					"internalType": "struct RedPacketJoule.OpenedPacket",
					"name": "",
					"type": "tuple"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "id",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "lucky_n",
					"type": "uint256"
				}
			],
			"name": "open",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"name": "redpackets",
			"outputs": [
				{
					"internalType": "bool",
					"name": "created",
					"type": "bool"
				},
				{
					"internalType": "address",
					"name": "creator",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "expiry",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "total_e",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "total_n",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "left_e",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "left_n",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "final_e",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "final_n",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "last_seed",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "id",
					"type": "uint256"
				}
			],
			"name": "withdraw",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		}
	];

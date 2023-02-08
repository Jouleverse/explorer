angular.module('ethExplorer')
	.controller('addressInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

		var web3 = $rootScope.web3;

		////////////////////////////////////////////////////////////////////////////////
		
		$scope.star = function () {
			var nstar = prompt("请输入 JTI 星星数量（1-5）：", "");
			if (nstar) { // TODO more validation?
				if (nstar < 1 || nstar > 5) {
					alert("星等超出范围（1-5）");
				} else if (window.ethereum && window.ethereum.isConnected()) {
					// hacking...
					web3.setProvider(window.ethereum);
					web3.eth.defaultAccount = web3.eth.accounts[0];

					if (web3.eth.defaultAccount == this.jnsContractOwner) {
						var jti_contract = web3.eth.contract(jti_ABI).at(jti_contract_address);
						jti_contract.issue($scope.addressId, nstar,
							function (err, result) {
								if (err) {
									console.log(err);
									//alert('出错啦：' + err.message);
								}
							});

					}
				}

			}
			
		}

		$scope.register = function () {
			var npubkey = prompt("请输入你的npub key：", "");
			if (npubkey) { // TODO more validation?

				try {
					
					var bytes = bech32.fromWords(bech32.decode(npubkey).words);
					var hexkey = '0x' + bytesToHex(bytes);

					if (window.ethereum && window.ethereum.isConnected()) {
						// hacking...
						web3.setProvider(window.ethereum);
						web3.eth.defaultAccount = web3.eth.accounts[0];

						if (web3.eth.defaultAccount.toLowerCase() == this.addressId.toLowerCase()) {
							var jnsdaov_contract = web3.eth.contract(jnsdaov_ABI).at(jnsdaov_contract_address);
							jnsdaov_contract.register(hexkey,
								function (err, result) {
									if (err) {
										console.log(err);
										//alert('出错啦：' + err.message);
									}
								}); // no need to send()

						} else {
							alert('出错了：地址不匹配！');
						}
					} else {
						alert('出错了：没有web3环境！');
					}
				} catch (e) {
					console.log(e);
					alert('出错啦：' + e);
				}

			}
			
		}

		$scope.mint = function () {
			var namej = prompt("请输入JNS名字（不带后缀.j）：", "");
			if (!namej) {
				alert('错误：无效输入！');
			} else if (namej.search('.j$') > 0) {
				alert('错误：输入不能带后缀.j！');
			} else { // TODO more validation?
				if (window.ethereum && window.ethereum.isConnected()) {
					// hacking...
					web3.setProvider(window.ethereum);
					web3.eth.defaultAccount = web3.eth.accounts[0];

					if (web3.eth.defaultAccount == this.jnsContractOwner) {
						var jns_contract = web3.eth.contract(jns_ABI).at(jns_contract_address);
						jns_contract.claim(namej,
							function (err, result) {
								if (err) {
									console.log(err);
									//alert('出错啦：' + err.message);
								}
							}); // no need to send(), amazing!

					}
				}

			}
			
		}

		$scope.airdrop = function ()
		{
			// get the calldata
			var airdrop_contract = web3.eth.contract(airdrop_ABI).at(airdrop_contract_address);
			var hexdata = airdrop_contract.airdrop.getData($scope.addressId);

			// do it or show calldata
			if (window.ethereum && window.ethereum.isConnected() /*&& web3.eth.accounts.length > 0*/) {
				// hacking...
				web3.setProvider(window.ethereum);
				web3.eth.defaultAccount = web3.eth.accounts[0];

				airdrop_contract._approvers.call(web3.eth.defaultAccount, function (err, result) {
					if (err) {
						console.log(err);
						$scope.airdrop_hexdata = '';
						$scope.airdrop_errmsg = '出错啦：' + err.data.message;
						$scope.$apply();
					} else if (result == true) {
						console.log($scope.addressId);
						airdrop_contract.airdrop.estimateGas($scope.addressId, function (error, gas_amount) {
							if (error) {
								console.log('airdrop estimateGas error: ', error);
								$scope.airdrop_hexdata = '';
								$scope.airdrop_errmsg = '出错啦： ' + error.data.message;
								$scope.$apply();
							} else {
								console.log('airdrop estimateGas: ', gas_amount);

								airdrop_contract.airdrop($scope.addressId, function (err, result) {
									if (err) {
										console.log(err);
										$scope.airdrop_hexdata = '';
										$scope.airdrop_errmsg = '出错啦：' + err.data.message;
										$scope.$apply();
									} else {
										$scope.airdrop_hexdata = '';
										$scope.airdrop_errmsg = '成功发起空投，tx hash: ' + result; // tx id
										$scope.$apply();
									}
								});
							}
						});
					} else {
						$scope.airdrop_hexdata = '';
						$scope.airdrop_errmsg = '无权发起空投！请联系组长！';
						$scope.$apply();
					}
				});
			} else {
				this.airdrop_hexdata = '请联系组长向合约地址发送数据 ' + hexdata + ' 发起空投';
				this.airdrop_errmsg = '';
			}

		}

		////////////////////////////////////////////////////////////////////////////////

		$scope.init = function(){

			$scope.addressId = $routeParams.addressId;

			if($scope.addressId !== undefined) {

				getAddressInfos().then(function(result){
					$scope.balance = result.balance;
					$scope.balanceInEther = result.balanceInEther;
				});

				// fix '统计中...'
				$scope.allFlyingJ = [];
				$scope.allJTI = [];
				$scope.allJNS = [];
				$scope.allJNSDAOV = [];
				$scope.allJNSVote = [];

				// fetch & update
				getAllJTI();
				getAllFlyingJ();
				getJNSDAOV();
				getAddressNS();
				getAllJNS();
				getAllJNSVote();
				
			}

			function getAddressInfos(){
				var deferred = $q.defer();

				web3.eth.getBalance($scope.addressId, function(error, result) {
					if(!error) {
						// intentionally delay...
						window.setTimeout(function() {
							deferred.resolve({
								balance: result.toString(),
								balanceInEther: web3.fromWei(result, 'ether').toString()
							});
						}, 0 /*Math.floor(Math.random() * 3000) + 2000*/);
					} else {
						deferred.reject(error);
					}
				});
				return deferred.promise;
			}

			function parseTokenURI(tokenURI) {
				var [t, s] = tokenURI.split(',');
				if (t == 'data:application/json;base64') {
					var metadata = JSON.parse(atob(s));
				/*var [t2, s2] = metadata.image.split(',');
				if (t2 == 'data:image/svg+xml;base64') {
					var svg = atob(s2);
					metadata.image = svg;
				}*/
					return metadata;
				}
				return null;
			}

			function getAddressNS() {
				var addr = $scope.addressId;
				var jns_contract = web3.eth.contract(jns_ABI).at(jns_contract_address);
				jns_contract._whois.call(addr, function (err, result) {
					if (!err) {
						var jns_id = result.toString();
						if (jns_id > 0) {
							jns_contract.tokenURI.call(jns_id, function (err2, result2) {
								var jns_tokenURI = result2;
								$scope.jns_info = parseTokenURI(jns_tokenURI);
								$scope.$apply(); //update
							});
						}
					}
				});
			}

			function getAllJTI() {
				$scope.allJTI = [];
				var addr = $scope.addressId;
				var contract = web3.eth.contract(jti_ABI).at(jti_contract_address);
				contract.balanceOf.call(addr, function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countJTI = balance;
						for (var i = 0; i < balance; i++) {
							var token_name = "J Trusted Identity";
							contract.tokenOfOwnerByIndex.call(addr, i, function (err2, result2) {
								if (err2) {
									console.log(err2);
								} else {
									var token_id = result2.toString();
									var tag = token_name + ' #' + token_id;
									contract.tokenURI.call(token_id, function (err3, result3) {
										if (err3) {
											console.log(err3);
										} else {
											var tokenURI = result3;
											var tokenInfo = parseTokenURI(tokenURI);
											$scope.allJTI.push({'tag': tag, 'tokenInfo': tokenInfo});
											$scope.$apply(); // inform the data updates !
										}
									});
								}
							});
						}
					}
				});

				// if showing trust button
				contract.owner.call(function (err, result) {
					$scope.chainId = window.ethereum ? window.ethereum.chainId : '';
					$scope.account = window.ethereum ? window.ethereum.selectedAddress : '';
					$scope.jtiContractOwner = result.toString();
					console.log('[addressInfo] chainId: ', $scope.chainId, 'account: ', $scope.account, 'jtiContractOwner: ', $scope.jtiContractOwner);
					$scope.$apply();
				});
			}

			function getAllFlyingJ() {
				$scope.allFlyingJ = [];
				var addr = $scope.addressId;
				var contract = web3.eth.contract(flyingj_ABI).at(flyingj_contract_address);
				contract.balanceOf.call(addr, function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countFlyingJ = balance;
						for (var i = 0; i < balance; i++) {
							var token_name = "Flying J";
							contract.tokenOfOwnerByIndex.call(addr, i, function (err2, result2) {
								if (err2) {
									console.log(err2);
								} else {
									var token_id = result2.toString();
									var tag = token_name + ' #' + token_id;
									contract.tokenURI.call(token_id, function (err3, result3) {
										if (err3) {
											console.log(err3);
										} else {
											var tokenURI = result3;
											var tokenInfo = parseTokenURI(tokenURI);
											$scope.allFlyingJ.push({'tag': tag, 'tokenInfo': tokenInfo});
											$scope.$apply(); // inform the data updates !
										}
									});
								}
							});
						}
					}
				});
			}

			function getJNSDAOV() {
				$scope.allJNSDAOV = [];
				var addr = $scope.addressId;
				var contract = web3.eth.contract(jnsdaov_ABI).at(jnsdaov_contract_address);
				contract.query.call(addr, function (err2, result2) {
					if (err2) {
						console.log(err2);
					} else {
						var tokenURI = result2;
						var tokenInfo = parseTokenURI(tokenURI);
						var tag = tokenInfo.name;
						tokenInfo.npubkey = bech32.encode('npub', bech32.toWords(hexToBytes(tokenInfo.hex)));
						$scope.countJNSDAOV = 1;
						$scope.allJNSDAOV.push({'tag': tokenInfo.name, 'tokenInfo': tokenInfo});
						$scope.$apply(); // inform the data updates !
					}
				});
			}

			function getAllJNS() {
				$scope.allJNS = [];
				var addr = $scope.addressId;
				var contract = web3.eth.contract(jns_ABI).at(jns_contract_address);
				contract.balanceOf.call(addr, function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countJNS = balance;
						for (var i = 0; i < balance; i++) {
							var token_name = "J Name Service";
							contract.tokenOfOwnerByIndex.call(addr, i, function (err2, result2) {
								if (err2) {
									console.log(err2);
								} else {
									var token_id = result2.toString();
									var tag = token_name + ' #' + token_id;
									contract.tokenURI.call(token_id, function (err3, result3) {
										if (err3) {
											console.log(err3);
										} else {
											var tokenURI = result3;
											var tokenInfo = parseTokenURI(tokenURI);
											$scope.allJNS.push({'tag': tag, 'tokenInfo': tokenInfo});
											$scope.$apply(); // inform the data updates !
										}
									});
								}
							});
						}
					}
				});

				// if showing mint button
				contract.owner.call(function (err, result) {
					$scope.chainId = window.ethereum ? window.ethereum.chainId : '';
					$scope.account = window.ethereum ? window.ethereum.selectedAddress : '';
					$scope.jnsContractOwner = result.toString();
					console.log('[addressInfo] chainId: ', $scope.chainId, 'account: ', $scope.account, 'jnsContractOwner: ', $scope.jnsContractOwner);
					$scope.$apply();
				});
			}

			function getAllJNSVote() {
				$scope.allJNSVote = [];
				var addr = $scope.addressId;
				var contract = web3.eth.contract(jnsvote_ABI).at(jnsvote_contract_address);
				contract.balanceOf.call(addr, function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countJNSVote = balance;
						for (var i = 0; i < balance; i++) {
							var token_name = "JNS Vote";
							contract.tokenOfOwnerByIndex.call(addr, i, function (err2, result2) {
								if (err2) {
									console.log(err2);
								} else {
									var token_id = result2.toString();
									var tag = token_name + ' #' + token_id;
									contract.tokenURI.call(token_id, function (err3, result3) {
										if (err3) {
											console.log(err3);
										} else {
											var tokenURI = result3;
											var tokenInfo = parseTokenURI(tokenURI);
											$scope.allJNSVote.push({'tag': tag, 'tokenInfo': tokenInfo});
											$scope.$apply(); // inform the data updates !
										}
									});
								}
							});
						}
					}
				});

			}

			//////////////// add listeners /////////////////
			if (window.ethereum) {
				
				window.ethereum.on('chainChanged', function (chainId) {
					console.log("[addressInfo] switched to chain id: ", parseInt(chainId, 16));
					$scope.chainId = chainId;
					$scope.$apply();
				});

				window.ethereum.on('accountsChanged', function (accounts) {
					console.log("[addressInfo] switched to account: ", accounts[0]);
					$scope.account = accounts[0];
					$scope.$apply();
				});
			}

		};

		$scope.init();

	});

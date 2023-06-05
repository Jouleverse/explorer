angular.module('ethExplorer')
	.controller('addressInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

		var web3 = $rootScope.web3;

		//////////////////////////////////////////////////////////////////////////////
		// write functionalities in page scope                                      //
		//////////////////////////////////////////////////////////////////////////////
		
		//refactored-20230330
		$scope.star = function() {
			const DIALOG_TITLE = 'JTI认证';

			const nstar = parseInt(prompt("请输入 JTI 星星数量（1-5）："), 10);

			if (nstar && !isNaN(nstar)) { 
				if (nstar < 1 || nstar > 5) {
					alert("星等超出范围（1-5）");
				} else if (window.ethereum && window.ethereum.isConnected()) {
					web3.setProvider(window.ethereum);
					const connectedAccount = window.ethereum.selectedAddress;

					if (connectedAccount.toLowerCase() == this.jnsContractOwner.toLowerCase()) {
						const jti_contract = new web3.eth.Contract(jti_ABI, jti_contract_address);
						jti_contract.methods.issue($scope.addressId, nstar).estimateGas({from: connectedAccount}, (err, gas) => {
							if (!err) {
								jti_contract.methods.issue($scope.addressId, nstar)
									.send({from: connectedAccount}, handlerShowTx(DIALOG_TITLE))
									.then(handlerShowRct(DIALOG_TITLE));
							} else {
								dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message); //展示合约逻辑报错
							}
						});
					}
				}
			} else {
				dialogShowTxt(DIALOG_TITLE, "请输入有效的星级数量（1-5）");
			}
		};

		//refactored-20230330
		$scope.register = function () {
			const DIALOG_TITLE = '登记npub公钥';

			var npubkey = prompt("请输入你的npub公钥：", "");
			if (npubkey) {

				try {
					
					var bytes = bech32.fromWords(bech32.decode(npubkey).words);
					var hexkey = '0x' + bytesToHex(bytes);

					if (window.ethereum && window.ethereum.isConnected()) {
						web3.setProvider(window.ethereum);
						const connectedAccount = window.ethereum.selectedAddress;

						if (connectedAccount.toLowerCase() == this.addressId.toLowerCase()) {
							var jnsdaov_contract = new web3.eth.Contract(jnsdaov_ABI, jnsdaov_contract_address);
							jnsdaov_contract.methods.register(hexkey).estimateGas({from: connectedAccount}, (err, gas) => {
								if (!err) {
									jnsdaov_contract.methods.register(hexkey).send({from: connectedAccount}, handlerShowTx(DIALOG_TITLE))
										.then(handlerShowRct(DIALOG_TITLE));
								} else {
									dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message); //展示合约逻辑报错
								}
							});
						} else {
							dialogShowTxt(DIALOG_TITLE, '出错了：地址不匹配！');
						}
					} else {
						dialogShowTxt(DIALOG_TITLE, '出错了：没有web3环境！');
					}
				} catch (e) {
					dialogShowTxt(DIALOG_TITLE, '出错啦：' + e);
				}

			}
			
		}

		//refactored-20230330
		$scope.airdrop = function ()
		{
			const DIALOG_TITLE = '发放空投';
			// get the calldata
			var airdrop_contract = new web3.eth.Contract(airdrop_ABI, airdrop_contract_address);
			var hexdata = airdrop_contract.methods.airdrop($scope.addressId).encodeABI();

			// do it or show calldata
			if (window.ethereum && window.ethereum.isConnected()) {
				// using injected provider
				web3.setProvider(window.ethereum);
				const connectedAccount = window.ethereum.selectedAddress;

				airdrop_contract.methods._approvers(connectedAccount).call(function (error, isApprover) {
					if (error) {
						dialogShowTxt('出错啦：' + error.message);
					} else if (isApprover == true) {
						airdrop_contract.methods.airdrop($scope.addressId).estimateGas({ from: connectedAccount }, (err, gas) => {
							if (!err) {
								airdrop_contract.methods.airdrop($scope.addressId)
									.send({ from: connectedAccount }, handlerShowTx(DIALOG_TITLE))
									.then(handlerShowRct(DIALOG_TITLE));
							} else {
								dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message); //展示合约逻辑报错
							}
						});
					} else {
						dialogShowTxt(DIALOG_TITLE, '出错了：没有权限。请联系组长到该页面点击空投图标发放空投！');
					}
				});
			} else {
				dialogShowTxt(DIALOG_TITLE, '出错了：没有web3环境。请联系组长到该页面点击空投图标发放空投！');
			}

		}


		//////////////////////////////////////////////////////////////////////////////
		// read functionalities in page scope                                       //
		//////////////////////////////////////////////////////////////////////////////
		$scope.init = function(){

			// entry /did/:jnsId
			$scope.jnsId = $routeParams.jnsId;
			// entry /address/:addressId
			$scope.addressId = $routeParams.addressId;

			if($scope.addressId !== undefined) {
				update(true);
			} else if ($scope.jnsId !== undefined) {
				getNSAddress().then(function(addr) {
					$scope.addressId = addr;
					// do not use $apply here
					update(false);
				});
			}

			function update(shouldGetAddressNS) {
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
				
				if (shouldGetAddressNS) getAddressNS();

				getJNSDAOV();
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
								balanceInEther: web3.utils.fromWei(result, 'ether').toString()
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

			function getNSAddress() {
				var deferred = $q.defer();

				// check name format
				var matched = $scope.jnsId.match(/(.*)\.j$/);
				if (matched == null) {
					// not ending with .j
					$scope.addressId = "域名格式错误"; //FIXME
				}
				var jnsName = matched[1]; // the (.*) part

				var jns_contract = new web3.eth.Contract(jns_ABI, jns_contract_address);
				jns_contract.methods._nslookup(jnsName).call(function (err, result) {
					if (!err) {
						var token_id = result.toString();
						if (token_id > 0) {
							jns_contract.methods.tokenURI(token_id).call(function (err2, result2) {
								var jns_tokenURI = result2;
								$scope.jns_info = parseTokenURI(jns_tokenURI);
								$scope.$apply(); //update
							});

							jns_contract.methods._bound(token_id).call(function (error3, result3) {
								var bound_addr = (result3 == 0)? "未绑定地址" : result3.toString();
								/*$scope.addressId = bound_addr;
								$scope.$apply();*/

								deferred.resolve(bound_addr);
							});

						}
					} else {
						deferred.reject(err);
					}
				});

				return deferred.promise;
			}

			function getAddressNS() {
				var addr = $scope.addressId;
				console.log("getAddressNS(): addr = ", addr);
				var jns_contract = new web3.eth.Contract(jns_ABI, jns_contract_address);
				jns_contract.methods._whois(addr).call(function (err, result) {
					if (!err) {
						var jns_id = result.toString();
						console.log("getAddressNS(): jns_id = ", jns_id);
						if (jns_id > 0) {
							jns_contract.methods.tokenURI(jns_id).call(function (err2, result2) {
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
				var contract = new web3.eth.Contract(jti_ABI, jti_contract_address);
				contract.methods.balanceOf(addr).call(function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countJTI = balance;
						for (var i = 0; i < balance; i++) {
							var token_name = "J Trusted Identity";
							contract.methods.tokenOfOwnerByIndex(addr, i).call(function (err2, result2) {
								if (err2) {
									console.log(err2);
								} else {
									var token_id = result2.toString();
									var tag = token_name + ' #' + token_id;
									contract.methods.tokenURI(token_id).call(function (err3, result3) {
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
				contract.methods.owner().call(function (err, result) {
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
				var contract = new web3.eth.Contract(flyingj_ABI, flyingj_contract_address);
				contract.methods.balanceOf(addr).call(function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countFlyingJ = balance || "0";
						for (var i = 0; i < balance; i++) {
							var token_name = "Flying J";
							contract.methods.tokenOfOwnerByIndex(addr, i).call(function (err2, result2) {
								if (err2) {
									console.log(err2);
								} else {
									var token_id = result2.toString();
									var tag = token_name + ' #' + token_id;
									contract.methods.tokenURI(token_id).call(function (err3, result3) {
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
				var contract = new web3.eth.Contract(jnsdaov_ABI, jnsdaov_contract_address);
				contract.methods.query(addr).call(function (err2, result2) {
					if (err2) {
						console.log("getJNSDAOV() error: ", err2);
						$scope.countJNSDAOV = "0";
						$scope.$apply();
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
				var contract = new web3.eth.Contract(jns_ABI, jns_contract_address);
				contract.methods.balanceOf(addr).call(function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countJNS = balance || "0";
						for (var i = 0; i < balance; i++) {
							var token_name = "J Name Service";
							contract.methods.tokenOfOwnerByIndex(addr, i).call(function (err2, result2) {
								if (err2) {
									console.log(err2);
								} else {
									var token_id = result2.toString();
									var tag = token_name + ' #' + token_id;
									contract.methods.tokenURI(token_id).call(function (err3, result3) {
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
				contract.methods.owner().call(function (err, result) {
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
				var contract = new web3.eth.Contract(jnsvote_ABI, jnsvote_contract_address);
				contract.methods.balanceOf(addr).call(function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countJNSVote = balance || "0";
						for (var i = 0; i < balance; i++) {
							var token_name = "JNS Vote";
							contract.methods.tokenOfOwnerByIndex(addr, i).call(function (err2, result2) {
								if (err2) {
									console.log(err2);
								} else {
									var token_id = result2.toString();
									var tag = token_name + ' #' + token_id;
									contract.methods.tokenURI(token_id).call(function (err3, result3) {
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

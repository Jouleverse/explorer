angular.module('ethExplorer')
	.controller('addressInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

		var web3 = $rootScope.web3;

		//////////////////////////////////////////////////////////////////////////////
		// helpers in page scope                                      //
		//////////////////////////////////////////////////////////////////////////////
		
		$scope.toLocaleDateString = function (seconds) {
			return (new Date(seconds * 1000)).toLocaleDateString('zh-CN');
		};

		//////////////////////////////////////////////////////////////////////////////
		// write functionalities in page scope                                      //
		//////////////////////////////////////////////////////////////////////////////
		
		//refactored-20230330
		$scope.star = function() {
			const DIALOG_TITLE = 'JTI认证';

			const nstar = parseInt(prompt("请输入 JTI 星星数量（1-5）："), 10);

			if (nstar && !isNaN(nstar)) { 
				if (nstar < 1 || nstar > 5) {
					dialogShowTxt(DIALOG_TITLE, "错误：星等超出范围（1-5）");
				} else if (window.ethereum && window.ethereum.isConnected()) {
					web3.setProvider(window.ethereum);
					const connectedAccount = window.ethereum.selectedAddress;

					console.log("JTI admin check", connectedAccount, this.jnsContractOwner);
					if (connectedAccount.toLowerCase() == this.jtiContractOwner.toLowerCase()) {
						console.log("JTI admin logged in");
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
					} else {
						console.log("JTI admin not logged in");
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

		// unwrap wJoule
		$scope.wjUnwrapDialog = function () {
			$('#dialog-unwrap-wjoule').modal({keyboard:false, backdrop:'static'});
			$('#dialog-unwrap-wjoule').modal('show');
		}

		$scope.wjUnwrapToConfirm = function () {
			const amt = $('#wj-unwrap-amount')[0].value;
			const to = $('#wj-unwrap-to')[0].value;
			const save_info = $('#wj-unwrap-save-info')[0].checked;
			console.log('wjUnwrapTo', amt, to, save_info);

			$('#confirm-unwrap-wj-from').text($scope.addressId);
			$('#confirm-unwrap-wj-amount').text(amt ? amt : '0');
			$('#confirm-unwrap-wj-amount2').text(amt ? amt : '0');
			$('#confirm-unwrap-wj-to').text(to ? to : $scope.addressId);

			$('#dialog-unwrap-wjoule-confirm').modal({keyboard:false, backdrop:'static'});
			$('#dialog-unwrap-wjoule-confirm').modal('show');
		}

		// 新手加油
		$scope.wjUnwrapToNewbie = function () {
			$scope.chainId = window.ethereum ? window.ethereum.chainId : '';
			$scope.account = window.ethereum ? window.ethereum.selectedAddress : '';

			if ($scope.account) { // if having connected account
				const from = $scope.account;
				const to = $scope.addressId;
				const amt = '0.005';
				console.log('wjUnwrapTo', from, amt, to);

				$('#wj-unwrap-amount').val(amt); // set value, instead of innerText
				$('#wj-unwrap-to').val(to);
				$('#wj-unwrap-save-info').prop('checked', false);
				$('#wj-unwrap-check-balance').prop('checked', false); // don't check newbie's WJ balance

				$('#confirm-unwrap-wj-from').text(from); // set innerText for human reading
				$('#confirm-unwrap-wj-amount').text(amt ? amt : '0');
				$('#confirm-unwrap-wj-amount2').text(amt ? amt : '0');
				$('#confirm-unwrap-wj-to').text(to);

				$('#dialog-unwrap-wjoule-confirm').modal({keyboard:false, backdrop:'static'});
				$('#dialog-unwrap-wjoule-confirm').modal('show');
			}
		}
		
		// send wJoule
		$scope.wjSendDialog = function () {
			$('#dialog-send-wjoule').modal({keyboard:false, backdrop:'static'});
			$('#dialog-send-wjoule').modal('show');
		}

		$scope.wjSendToConfirm = function () {
			const amt = $('#wj-send-amount')[0].value;
			const to = $('#wj-send-to')[0].value;
			console.log('wjSendTo', amt, to);

			// 检查是否是JNS域名
			if (to.endsWith('.j')) {
				const jnsName = to.slice(0, -2); // 移除.j后缀
				const jns_contract = new web3.eth.Contract(jns_ABI, jns_contract_address);
				jns_contract.methods._nslookup(jnsName).call(function (err, result) {
					if (!err && result > 0) {
						jns_contract.methods._bound(result).call(function (error, boundAddress) {
							if (!error && boundAddress !== '0x0000000000000000000000000000000000000000') {
								$('#confirm-send-wj-from').text($scope.addressId);
								$('#confirm-send-wj-amount').text(amt ? amt : '0');
								$('#confirm-send-wj-to').text(boundAddress + ' (' + to + ')');

								$('#dialog-send-wjoule-confirm').modal({keyboard:false, backdrop:'static'});
								$('#dialog-send-wjoule-confirm').modal('show');
							} else {
								dialogShowTxt('发送 wJ', '错误：JNS域名未绑定有效地址');
							}
						});
					} else {
						dialogShowTxt('发送 wJ', '错误：无效的JNS域名');
					}
				});
			} else {
				$('#confirm-send-wj-from').text($scope.addressId);
				$('#confirm-send-wj-amount').text(amt ? amt : '0');
				$('#confirm-send-wj-to').text(to);

				$('#dialog-send-wjoule-confirm').modal({keyboard:false, backdrop:'static'});
				$('#dialog-send-wjoule-confirm').modal('show');
			}
		}

		$scope.wjSendTo = function () {
			const DIALOG_TITLE = '发送 wJ';
			const amt = $('#wj-send-amount')[0].value;
			const to = $('#wj-send-to')[0].value;
			console.log('wjSendTo', amt, to);

			if (amt && !isNaN(amt)) {
				if (!(amt > 0)) {
					dialogShowTxt(DIALOG_TITLE, "错误：wJ数量必须大于0");
				} else if (!(amt <= 2000)) {
					dialogShowTxt(DIALOG_TITLE, "错误：wJ数量必须不超过2000");
				} else if (!(parseFloat(amt) <= parseFloat($scope.wjBalanceInJoule))) {
					dialogShowTxt(DIALOG_TITLE, "错误：wJ数量 " + amt + " 不能超过持有量 " + $scope.wjBalanceInJoule);
				} else if (window.ethereum && window.ethereum.isConnected()) {
					web3.setProvider(window.ethereum);
					const connectedAccount = window.ethereum.selectedAddress;

					const e = web3.utils.toWei(amt);
					const wj_contract = new web3.eth.Contract(wj_ABI, wj_contract_address);

					// 检查是否是JNS域名
					if (to.endsWith('.j')) {
						const jnsName = to.slice(0, -2); // 移除.j后缀
						const jns_contract = new web3.eth.Contract(jns_ABI, jns_contract_address);
						jns_contract.methods._nslookup(jnsName).call(function (err, result) {
							if (!err && result > 0) {
								jns_contract.methods._bound(result).call(function (error, boundAddress) {
									if (!error && boundAddress !== '0x0000000000000000000000000000000000000000') {
										wj_contract.methods.transfer(boundAddress, e).estimateGas({from: connectedAccount}, (err, gas) => {
											if (!err) {
												wj_contract.methods.transfer(boundAddress, e)
													.send({from: connectedAccount}, handlerShowTx(DIALOG_TITLE))
													.then(handlerShowRct(DIALOG_TITLE));

												$('#wj-send-amount')[0].value = '';
												$('#wj-send-to')[0].value = '';
											} else {
												dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message);
											}
										});
									} else {
										dialogShowTxt(DIALOG_TITLE, '错误：JNS域名未绑定有效地址');
									}
								});
							} else {
								dialogShowTxt(DIALOG_TITLE, '错误：无效的JNS域名');
							}
						});
					} else if (web3.utils.isAddress(to)) {
						wj_contract.methods.transfer(to, e).estimateGas({from: connectedAccount}, (err, gas) => {
							if (!err) {
								wj_contract.methods.transfer(to, e)
									.send({from: connectedAccount}, handlerShowTx(DIALOG_TITLE))
									.then(handlerShowRct(DIALOG_TITLE));

								$('#wj-send-amount')[0].value = '';
								$('#wj-send-to')[0].value = '';
							} else {
								dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message);
							}
						});
					} else {
						dialogShowTxt(DIALOG_TITLE, '错误：目标地址不是正确的链地址格式');
					}
				}
			} else {
				dialogShowTxt(DIALOG_TITLE, "错误：请输入有效的wJ数量");
			}
		};

		$scope.wjUnwrapTo = function () {
			const DIALOG_TITLE = 'Unwrap wJ';
			const amt = $('#wj-unwrap-amount')[0].value;
			const to = $('#wj-unwrap-to')[0].value;
			const save_info = $('#wj-unwrap-save-info')[0].checked;
			const check_balance = $('#wj-unwrap-check-balance')[0].checked;
			console.log('wjUnwrapTo', amt, to, save_info, check_balance);
			
			if (amt && !isNaN(amt)) { // isNaN works, nice.
				if (!(amt > 0)) {
					dialogShowTxt(DIALOG_TITLE, "错误：wJ数量必须大于0");
				} else if (!(amt < 100)) {
					dialogShowTxt(DIALOG_TITLE, "错误：wJ数量必须小于100（大额释放请用合约工具进行，慎重操作！）");
				} else if (check_balance && !(parseFloat(amt) < parseFloat($scope.wjBalanceInJoule))) {
					dialogShowTxt(DIALOG_TITLE, "错误：wJ数量 " + amt + " 不能超过持有量 " + $scope.wjBalanceInJoule);
				} else if (window.ethereum && window.ethereum.isConnected()) {
					web3.setProvider(window.ethereum);
					const connectedAccount = window.ethereum.selectedAddress;

					const e = web3.utils.toWei(amt);
					const wj_contract = new web3.eth.Contract(wj_ABI, wj_contract_address);
					if (to === '') { // to is empty
						wj_contract.methods.withdraw(e).estimateGas({from: connectedAccount}, (err, gas) => {
							if (!err) {
								wj_contract.methods.withdraw(e)
									.send({from: connectedAccount}, handlerShowTx(DIALOG_TITLE))
									.then(handlerShowRct(DIALOG_TITLE));

								if (!save_info) {
									$('#wj-unwrap-amount')[0].value = '';
									$('#wj-unwrap-to')[0].value = '';
								}
							} else {
								dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message); //展示合约逻辑报错
							}
						});
					} else if (web3.utils.isAddress(to)) {
						wj_contract.methods.withdrawTo(to, e).estimateGas({from: connectedAccount}, (err, gas) => {
							if (!err) {
								wj_contract.methods.withdrawTo(to, e)
									.send({from: connectedAccount}, handlerShowTx(DIALOG_TITLE))
									.then(handlerShowRct(DIALOG_TITLE));

								if (!save_info) {
									$('#wj-unwrap-amount')[0].value = '';
									$('#wj-unwrap-to')[0].value = '';
								}
							} else {
								dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message); //展示合约逻辑报错
							}
						});
					} else { 
						dialogShowTxt(DIALOG_TITLE, '错误：目标地址不是正确的链地址格式');
					}

				}

			} else {
				dialogShowTxt(DIALOG_TITLE, "错误：请输入有效的wJ数量");
			}

		};


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

				getWJBalance().then(function (result) {
					$scope.wjBalance = result.balance;
					$scope.wjBalanceInJoule = result.balanceInJoule;
				});

				// fix '统计中...'
				$scope.allCryptoJunks = [];
				$scope.allFlyingJ = [];
				$scope.allPlanet = [];
				//$scope.allJTI = [];
				$scope.allJTI2 = [];
				$scope.allJNS = [];
				$scope.allJNSDAOV = [];
				$scope.allJNSVote = [];
				// proof of liveness
				$scope.allJVCore = [];
				$scope.allPOP = []; //POP Badges

				// fetch & update
				getAllJVCore();
				getAllPOP();

				//getAllJTI();
				getAllJTI2();
				getAllFlyingJ();
				getAllPlanet();
				
				if (shouldGetAddressNS) getAddressNS();

				// dynamically load reference for tagging gold inscriptions
				// only works while all 10000 junks are inscribed and set in stone (no change anymore)
				$.get('scripts/misc/punks/golden_idx.json')
				.success((data) => {
					console.log(data);
					getAllCryptoJunks(data);
				})
				.fail((xhr, status, err) => {
					console.log(xhr, status, err);
					getAllCryptoJunks(undefined);
				})
				.always(() => {
					console.log('loading golden_idx.json ...');
				});

				// JNS -> JNSDAOV, JNSVote, etc.
				getAllJNS().then(() => {
					getJNSDAOV();
					getAllJNSVote();
				});

				getAllBoredApes();
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

			function getWJBalance() {
				var deferred = $q.defer();
				var addr = $scope.addressId;
				var wj_contract = new web3.eth.Contract(wj_ABI, wj_contract_address);
				wj_contract.methods.balanceOf(addr).call(function (err, result) {
					if (!err) {
						deferred.resolve({
							balance: result.toString(),
							balanceInJoule: web3.utils.fromWei(result, 'ether').toString()
						});
					} else {
						deferred.reject(err);
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

			function getAllJVCore() {
				$scope.allPlanet = [];
				var addr = $scope.addressId;
				var contract = new web3.eth.Contract(jvcore_ABI, jvcore_contract_address);
				contract.methods.balanceOf(addr).call(function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countJVCore = balance || "0";
						for (var i = 0; i < balance; i++) {
							var token_name = "JVCore";
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
											$scope.allJVCore.push({'tag': tag, 'tokenInfo': tokenInfo});
											$scope.$apply(); // inform the data updates !
										}
									});
								}
							});
						}
					}
				});
			}

			function getAllPOP() {
				$scope.allPlanet = [];
				var addr = $scope.addressId;
				var contract = new web3.eth.Contract(pop_ABI, pop_contract_address);
				contract.methods.balanceOf(addr).call(function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countPOP = balance || "0";
						for (var i = 0; i < balance; i++) {
							var token_name = "POP";
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
											//console.log(tokenInfo);
											// 将 month 改成 yy.m 格式
											var date = new Date(tokenInfo.checkInTimestamp * 1000);
											var year = date.getFullYear().toString().slice(-2); // 获取年份的后两位
											var month = date.getMonth() + 1; // 获取月份
											var yy_m = year + '.' + month;

											// 插入数据到 allPOP
											$scope.allPOP.push({'tag': tag, 'tokenInfo': tokenInfo, 'month': yy_m, 'token_id': token_id});

											// 根据 token_id 排序
											$scope.allPOP.sort((a, b) => a.token_id - b.token_id);
											$scope.$apply(); // inform the data updates !
										}
									});
								}
							});
						}
					}
				});
			}

			/*function getAllJTI() {
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
							var token_name = "J Trusted Identity (JTI)";
							//var token_name = "JTI可信身份认证";
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
			*/

			function getAllJTI2() {
				$scope.allJTI2 = [];
				var addr = $scope.addressId;
				var contract = new web3.eth.Contract(jti2_ABI, jti2_contract_address);
				contract.methods.balanceOf(addr).call(function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countJTI2 = balance;
						for (var i = 0; i < balance; i++) {
							var token_name = "JTI";
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
											$scope.allJTI2.push({'tag': tag, 'tokenInfo': tokenInfo});
											$scope.$apply(); // inform the data updates !
										}
									});
								}
							});
						}
					}
				});
			}

			function getAllCryptoJunks(golden_idx) {
				$scope.allCryptoJunks = [];
				var addr = $scope.addressId;
				var contract = new web3.eth.Contract(cryptojunks_ABI, cryptojunks_contract_address);
				contract.methods.balanceOf(addr).call(function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countCryptoJunks = balance || "0";
						for (var i = 0; i < balance; i++) {
							var token_name = "CryptoJunks";
							contract.methods.tokenOfOwnerByIndex(addr, i).call(function (err2, result2) {
								if (err2) {
									console.log(err2);
								} else {
									var token_id = result2.toString();
									//var tag = token_name + ' #' + token_id;
									contract.methods.tokenURI(token_id).call(function (err3, result3) {
										if (err3) {
											console.log(err3, token_id, result3);
										} else {
											var tokenURI = result3;
											var tokenInfo = parseTokenURI(tokenURI);

											// if we have reference data
											if (golden_idx != undefined) {

												const is_golden = golden_idx['golden'];
												const legend_idx = golden_idx['alien'];
												const rare_idx = golden_idx['ape'];
												const precious_idx = golden_idx['zombie'];

												if (is_golden[token_id] == '1') 
													tokenInfo.golden = true;
												else
													tokenInfo.golden = false;

												id = parseInt(token_id);
												if (legend_idx.indexOf(id) > -1) 
													tokenInfo.rarity = 'legend';
												else if (rare_idx.indexOf(id) > -1)
													tokenInfo.rarity = 'rare';
												else if (precious_idx.indexOf(id) > -1)
													tokenInfo.rarity = 'precious';
												else 
													tokenInfo.rarity = 'normal';

												//console.log(token_id, tokenInfo.rarity);

											}

											$scope.allCryptoJunks.push({'id': token_id, 'pageId': Math.floor(token_id/100), 'tokenInfo': tokenInfo});
											$scope.$apply(); // inform the data updates !
										}
									});
								}
							});
						}
					}
				});
			}

			function getAllPlanet() {
				$scope.allPlanet = [];
				var addr = $scope.addressId;
				var contract = new web3.eth.Contract(planet_ABI, planet_contract_address);
				contract.methods.balanceOf(addr).call(function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countPlanet = balance || "0";
						for (var i = 0; i < balance; i++) {
							var token_name = "Planet";
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
											$scope.allPlanet.push({'tag': tag, 'tokenInfo': tokenInfo});
											$scope.$apply(); // inform the data updates !
										}
									});
								}
							});
						}
					}
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
				var deferred = $q.defer();

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
											$scope.allJNS.push({'id': token_id, 'tag': tag, 'tokenInfo': tokenInfo});
											$scope.$apply(); // inform the data updates !
										}
									});
								}
							});
						}

						if (balance > 0)
							deferred.resolve();
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


				return deferred.promise;
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


			function getAllBoredApes() {
				$scope.allBoredApes = [];
				var addr = $scope.addressId;
				var contract = new web3.eth.Contract(boredape_ABI, boredape_contract_address);
				contract.methods.balanceOf(addr).call(function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countBoredApes = balance || "0";
						for (var i = 0; i < balance; i++) {
							contract.methods.tokenOfOwnerByIndex(addr, i).call(function (err2, result2) {
								if (err2) {
									console.log(err2);
								} else {
									var token_id = result2.toString();
									//var tag = token_name + ' #' + token_id;
									contract.methods.tokenURI(token_id).call(function (err3, result3) {
										if (err3) {
											console.log(err3, token_id, result3);
										} else {
											var tokenURI = result3;
											var tokenInfo = parseTokenURI(tokenURI);

											$scope.allBoredApes.push({'id': token_id, 'pageId': Math.floor(token_id/100), 'tokenInfo': tokenInfo});
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

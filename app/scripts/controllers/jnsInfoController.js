angular.module('ethExplorer')
	.controller('jnsInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

		var web3 = $rootScope.web3;

		//////////////////////////////////////////////////////////////////////////////
		// write functionalities in page scope                                      //
		//////////////////////////////////////////////////////////////////////////////

		//refactored-20230330
		$scope.mintJNS = function (jnsId) {
			const DIALOG_TITLE = '铸造jns';

			// 1. jnsId必须以.j结尾；2. 暂时只允许大小写字母数字和中横线
			if (jnsId.search('.j$') > 0) { 
				// remove trailing .j (for correct call to contract)
				var namej = jnsId.slice(0, jnsId.length - 2); 
				if (namej.search("^([a-zA-Z0-9]|-)+$") == 0) {
					console.log('about to mint JNS name: ' + namej + '.j');

					if (window.ethereum && window.ethereum.isConnected()) {
						web3.setProvider(window.ethereum);
						const connectedAccount = window.ethereum.selectedAddress;

						if (connectedAccount.toLowerCase() == this.jnsContractOwner.toLowerCase()) {
							const jns_contract = new web3.eth.Contract(jns_ABI, jns_contract_address);
							jns_contract.methods.claim(namej).estimateGas({from: connectedAccount}, (err, gas) => {
								if (!err) {
									jns_contract.methods.claim(namej).send({from: connectedAccount}, handlerShowTx(DIALOG_TITLE))
										.then(handlerShowRct(DIALOG_TITLE));
								} else {
									dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message); //展示合约逻辑报错
								}
							});
						} else {
							dialogShowTxt(DIALOG_TITLE, '你没有JNS的铸造权限');
						}
					} else {
						dialogShowTxt(DIALOG_TITLE, '错误：没有web3环境，无法完成操作');
					}
				} else {
					dialogShowTxt(DIALOG_TITLE, '错误：JNS名称 ' + jnsId + ' 只可以包含大小写字母、数字以及中横线');
				}
			} else {
				dialogShowTxt(DIALOG_TITLE, '错误：JNS名称 ' + jnsId + ' 必须以.j结尾');
			}
			
		}

		//refactored-20230330
		$scope.bind = function ()
		{
			const DIALOG_TITLE = 'bind上链操作';

			if (window.ethereum && window.ethereum.isConnected()) {
				web3.setProvider(window.ethereum);
				const connectedAccount = window.ethereum.selectedAddress;

				if (connectedAccount.toLowerCase() == this.ownerAddress.toLowerCase()) {
					var jns_contract = new web3.eth.Contract(jns_ABI, jns_contract_address);
					jns_contract.methods.bind(this.nftId).estimateGas({ from: connectedAccount }, (err, gas) => {
						if (!err) {
							jns_contract.methods.bind(this.nftId).send({ from: connectedAccount }, handlerShowTx(DIALOG_TITLE))
								.then(handlerShowRct(DIALOG_TITLE));
						} else {
							dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message); //展示合约逻辑报错
						}
					});
				} else {
					dialogShowTxt(DIALOG_TITLE, '你不是 ' + this.jnsName + '.j 的所有者');
				}
			} else {
				dialogShowTxt(DIALOG_TITLE, '向合约地址 ' + jns_contract_address + ' 发送数据 ' + this.bindCalldata + ' 绑定');
			}

		}

		//refactored-20230330
		$scope.unbind = function ()
		{
			const DIALOG_TITLE = 'unbind上链操作';

			if (window.ethereum && window.ethereum.isConnected()) {
				web3.setProvider(window.ethereum); //switch to the injected metamask provider
				const connectedAccount = window.ethereum.selectedAddress;

				if (connectedAccount.toLowerCase() == this.ownerAddress.toLowerCase()) {
					var jns_contract = new web3.eth.Contract(jns_ABI, jns_contract_address);
					jns_contract.methods.unbind(this.nftId).estimateGas({ from: connectedAccount }, (err, gas) => {
						if (!err) {
							jns_contract.methods.unbind(this.nftId).send({ from: connectedAccount }, handlerShowTx(DIALOG_TITLE))
								.then(handlerShowRct(DIALOG_TITLE));
						} else {
							dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message); //展示合约逻辑报错
						}
					});
				} else {
					dialogShowTxt(DIALOG_TITLE, '你不是 ' + this.jnsName + '.j 的所有者');
				}
			} else {
				dialogShowTxt(DIALOG_TITLE, '向合约地址 ' + jns_contract_address + ' 发送数据 ' + this.unbindCalldata + ' 解除绑定');
			}

		}

		//refactored-20230330
		$scope.give = function ()
		{
			const DIALOG_TITLE = '赠予';

			var toAddress = prompt("请输入接收地址：", "0x"); // TODO use h5 dialog box for better compatibility
			if (toAddress && web3.utils.isAddress(toAddress)) {
				const nftId = this.nftId; // this. just works! cool.
				const fromAddress = this.ownerAddress;
				console.log(`will give jns: #${nftId} from: ${fromAddress} to: ${toAddress}`);
				if (window.ethereum && window.ethereum.isConnected()) {
					web3.setProvider(window.ethereum);
					const connectedAccount = window.ethereum.selectedAddress;

					var jns_contract = new web3.eth.Contract(jns_ABI, jns_contract_address);
					jns_contract.methods.safeTransferFrom(fromAddress, toAddress, nftId)
						.estimateGas({ from: connectedAccount }, (err, gas) => {
							if (!err) {
								jns_contract.methods.safeTransferFrom(fromAddress, toAddress, nftId)
									.send({ from: connectedAccount }, handlerShowTx(DIALOG_TITLE))
									.then(handlerShowRct(DIALOG_TITLE));
							} else {
								dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message); //展示合约逻辑报错
							}
						});

				} else {
					dialogShowTxt(DIALOG_TITLE, '错误：没有web3环境，无法完成操作');
				}
			} else {
				dialogShowTxt(DIALOG_TITLE, `出错啦：接收地址 ${toAddress} 不是有效的地址`);
			}
			
		}

		$scope.endorseJNSAmountDialog = function() 
		{
			const DIALOG_TITLE = '输入打赏金额';

			// init amount input field
			var radioAmount = document.getElementsByName('jns-endorse-amount');

			for (i = 0; i < radioAmount.length; i++) {
				if (radioAmount[i].checked && radioAmount[i].value === 'other') {
					$scope.disableManualInputAmount = false;
				} else if (radioAmount[i].checked) {
					$scope.disableManualInputAmount = true;
				}
            }
			
			$('#dialog-endorsejns-amount').modal({keyboard:false, backdrop:'static'});
			$('#dialog-endorsejns-amount').modal('show');
		}

		$scope.endorseJNSConfirmDialog = function() 
		{
			const DIALOG_TITLE = '确认打赏金额';

			var endorseAmount = 0;
			var radioAmount = document.getElementsByName('jns-endorse-amount');

			for (i = 0; i < radioAmount.length; i++) {
				if (radioAmount[i].checked && radioAmount[i].value === 'other') {
					endorseAmount = parseFloat($('#jns-endorse-amount-other-input')[0].value);
				} else if (radioAmount[i].checked) {
					endorseAmount = parseFloat(radioAmount[i].value);
				}
            }

			if (Number.isNaN(endorseAmount) || endorseAmount <= 0 || endorseAmount > 100) {
				dialogShowTxt(DIALOG_TITLE, '打赏金额须大于0且不超过100 WJ');
				return;
			}

			// float number allowed
			$scope.endorseJNSAmount = endorseAmount;
			$scope.realBoundAddress = $scope.boundAddress;
			console.log('[jns] endorseJNSConfirmDialog endorseAmount: ' + endorseAmount);

			$('#dialog-endorsejns-confirm').modal({keyboard:false, backdrop:'static'});
			$('#dialog-endorsejns-confirm').modal('show');
		}

		$scope.disableAmountInput = function() 
		{
			$scope.disableManualInputAmount = true;
			$scope.endorseAmountInputValue = ""; 
			console.log('[jns] disableAmountInput: ' + $scope.disableManualInputAmount);
		}

		$scope.enableAmountInput = function() 
		{
			$scope.disableManualInputAmount = false;
			console.log('[jns] enableAmountInput: ' + $scope.disableManualInputAmount);
		}

		$scope.endorseJNSTransfer = function(realBoundAddress, endorseJNSAmount) 
		{
			const DIALOG_TITLE = '转移打赏金额';
			
			console.log('[jns] endorseJNSTransfer boundAddress: ' + realBoundAddress);
			console.log('[jns] endorseJNSTransfer endorseJNSAmount: ' + endorseJNSAmount);

			if (window.ethereum && window.ethereum.isConnected()) {
				web3.setProvider(window.ethereum);
				const connectedAccount = window.ethereum.selectedAddress;

				const e = web3.utils.toWei(endorseJNSAmount.toString(), 'ether');
				const wj_contract = new web3.eth.Contract(wj_ABI, wj_contract_address);

				wj_contract.methods.transfer(realBoundAddress, e).estimateGas({from: connectedAccount}, (err, gas) => {
					if (!err) {
						wj_contract.methods.transfer(realBoundAddress, e)
							.send({from: connectedAccount}, handlerShowTx(DIALOG_TITLE))
							.then((receipt) => {
								dialogShowTxt(DIALOG_TITLE, '打赏成功！');
							});
					} else {
						dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message); //展示合约逻辑报错
					}
				});
			}
		}

		//////////////////////////////////////////////////////////////////////////////
		// read functionalities in page scope                                       //
		//////////////////////////////////////////////////////////////////////////////
		$scope.init = function()
		{
			$scope.jnsId = $routeParams.jnsId.toLowerCase(); // must in format xxx.j
			// pre-process two exceptions: GM.j Nana.j
			if ($scope.jnsId == "gm.j") $scope.jnsId = "GM.j";
			if ($scope.jnsId == "nana.j") $scope.jnsId = "Nana.j";

			$scope.connectedToJ = () => { return $scope.chainId === '0xe52' };

			if ($scope.jnsId !== undefined) {

				// check name format
				var matched = $scope.jnsId.match(/(.*)\.j$/);
				if (matched == null) {
					// not ending with .j
					$scope.jnsIdError = "错误的格式";
				}
				$scope.jnsName = matched[1]; // the (.*) part

				// display jns info
				getJNSInfo().then(function(result) {
					$scope.contractAddress = result.contractAddress;
					$scope.nftId = result.tokenId;
					$scope.ownerAddress = result.ownerAddress;
					$scope.boundAddress = result.boundAddress;
					$scope.boundAddressTag = result.boundAddressTag;
					$scope.logo = result.logo;
					$scope.bindCalldata = result.bindCalldata;
					$scope.unbindCalldata = result.unbindCalldata;
					$scope.chainId = result.chainId;
					$scope.account = result.account;
				}, function () {
					$scope.jnsIdError = "该名字不存在";
				});

				//////////////// listeners for chainId and accountId /////////////////
				if (window.ethereum) {
					window.ethereum.on('chainChanged', function (chainId) {
						console.log("[jns] switched to chain id: ", parseInt(chainId, 16));
						$scope.chainId = chainId;
						$scope.$apply();
					});

					window.ethereum.on('accountsChanged', function (accounts) {
						console.log("[jns] switched to account: ", accounts[0]);
						$scope.account = accounts[0];
						$scope.$apply();
					});

					window.ethereum
					.request({ method: 'eth_chainId' })
					.then((chainId) => {
						console.log(`[jns] got chain id: ${parseInt(chainId, 16)}`);
						$scope.chainId = chainId;
						const account = window.ethereum.selectedAddress;
						$scope.account = account;
						console.log("[jns] connected account is: ", account);
						$scope.$apply()
					})
					.catch((error) => {
						console.error(`[jns] error fetching chainId: ${error.code}: ${error.message}`);
					});
				}

			} else {
				$location.path("/");
			}


			function getJNSInfo() {
				var deferred = $q.defer();

				var jns_contract = new web3.eth.Contract(jns_ABI, jns_contract_address);

				// if showing mint button
				jns_contract.methods.owner().call(function (err, result) {
					$scope.chainId = window.ethereum ? window.ethereum.chainId : '';
					$scope.account = window.ethereum ? window.ethereum.selectedAddress : '';
					$scope.jnsContractOwner = result.toString();
					console.log('[jnsinfo addressInfo] chainId: ', $scope.chainId, 'account: ', $scope.account, 'jnsContractOwner: ', $scope.jnsContractOwner);
					$scope.$apply();
				});

				// search jns
				jns_contract.methods._nslookup($scope.jnsName).call(function (error, result) {
					if (!error) {
						var token_id = result.toString();
						jns_contract.methods.ownerOf(token_id).call(function (error2, result2) {
							if (!error2) {
								var owner_addr = result2.toString();
								jns_contract.methods._bound(token_id).call(function (error3, result3) {
									if (!error3) {
										var bound_addr = result3.toString();
										var bound_addr_tag = (result3 == 0)? "未绑定" : ('已绑定 ' + result3.toString());
										jns_contract.methods.tokenURI(token_id).call(function (error4, result4) {
											if (!error4) {
												var img = parseTokenURI(result4.toString()).image;

												//// get chain & connected account info ////
												
												function resolve(chainId, account) {
													deferred.resolve({
														contractAddress: jns_contract_address,
														tokenId: token_id,
														ownerAddress: owner_addr,
														boundAddress: bound_addr,
														boundAddressTag: bound_addr_tag,
														logo: img,
														bindCalldata: jns_contract.methods.bind(token_id).encodeABI(),
														unbindCalldata: jns_contract.methods.unbind(token_id).encodeABI(),
														chainId: chainId,
														account: account,
													});
												}

												if (window.ethereum) {
													// in metamask env
													var chainId = window.ethereum.chainId; 
													console.log('[jns] chain id: ', chainId);

													var account = window.ethereum.selectedAddress;
													console.log('[jns] connected account: ', account);

													resolve(chainId, account);

												} else {	
													// not in metamask env
													resolve(null, null);
												}

												//// ----  ////
												
											} else {
												deferred.reject(error4);
											}
										});
									} else {
										deferred.reject(error3);
									}
								});
							} else {
								deferred.reject(error2);
							}
						});
					} else {
						deferred.reject(error);
					}
				});

				return deferred.promise;
			}


		};

		$scope.init();

		//////////////////////////////////////////////////////////////////////////////
		// helper functionalities NOT in page scope                                 //
		//////////////////////////////////////////////////////////////////////////////
		function hex2a(hexx) {
			var hex = hexx.toString();//force conversion
			var str = '';
			for (var i = 0; i < hex.length; i += 2)
				str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
			return str;
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

	});

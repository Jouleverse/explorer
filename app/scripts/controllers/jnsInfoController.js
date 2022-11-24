angular.module('ethExplorer')
	.controller('jnsInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

		var web3 = $rootScope.web3;

		$scope.bind = function ()
		{
			if (window.ethereum && window.ethereum.isConnected()) {
				// hacking...
				web3.setProvider(window.ethereum);
				web3.eth.defaultAccount = web3.eth.accounts[0];

				if (web3.eth.defaultAccount == this.ownerAddress) {
					var jns_contract = web3.eth.contract(jns_ABI).at(jns_contract_address);
					jns_contract.bind(this.nftId,
						function (err, result) {
							if (err) {
								console.log(err);
								alert('出错啦：' + err.message);
							}
						}); // no need to send(), amazing!

				} else {
					this.hexdata = '向合约地址发送数据 ' + this.bindCalldata + ' 进行绑定';
				}
			} else {
				this.hexdata = '向合约地址发送数据 ' + this.bindCalldata + ' 进行绑定';
			}

		}

		$scope.unbind = function ()
		{
			if (window.ethereum && window.ethereum.isConnected()) {
				// hacking...
				web3.setProvider(window.ethereum);
				web3.eth.defaultAccount = web3.eth.accounts[0];

				if (web3.eth.defaultAccount == this.ownerAddress) {
					var jns_contract = web3.eth.contract(jns_ABI).at(jns_contract_address);
					jns_contract.unbind(this.nftId,
						function (err, result) {
							if (err) {
								console.log(err);
								alert('出错啦：' + err.message);
							}
						}); // no need to send(), amazing!

				} else {
					this.hexdata = '向合约地址发送数据 ' + this.unbindCalldata + ' 解除绑定';
				}
			} else {
				this.hexdata = '向合约地址发送数据 ' + this.unbindCalldata + ' 解除绑定';
			}

		}

		$scope.give = function ()
		{
			var toAddress = prompt("请输入接收地址：", "0x");
			if (toAddress && web3.isAddress(toAddress)) { // TODO more validation
				var nftId = this.nftId; // this. just works! cool.
				var fromAddress = this.ownerAddress;
				console.log(`will give jns #${nftId} from ${fromAddress} to: ${toAddress}`);
				if (window.ethereum && window.ethereum.isConnected()) {
					// hacking...
					web3.setProvider(window.ethereum);
					web3.eth.defaultAccount = web3.eth.accounts[0];

					var jns_contract = web3.eth.contract(jns_ABI).at(jns_contract_address);
					jns_contract.safeTransferFrom(fromAddress, toAddress, nftId,
						function (err, result) {
							if (err) {
								console.log(err);
								alert('出错啦：' + err.message);
							}
						}); // no need to send(), amazing!
				}
			} else {
				alert(`不是有效的地址：${toAddress}`);
			}
			
		}

		$scope.init = function()
		{
			$scope.jnsId = $routeParams.jnsId.toLowerCase(); // must in format xxx.j
			// pre-process two exceptions: GM.j Nana.j
			if ($scope.jnsId == "gm.j") $scope.jnsId = "GM.j";
			if ($scope.jnsId == "nana.j") $scope.jnsId = "Nana.j";

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
					$scope.logo = result.logo;
					$scope.bindCalldata = result.bindCalldata;
					$scope.unbindCalldata = result.unbindCalldata;
					$scope.chainId = result.chainId;
					$scope.account = result.account;
				}, function () {
					$scope.jnsIdError = "该名字不存在";
				});

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
				}

			} else {
				$location.path("/");
			}


			function getJNSInfo() {
				var deferred = $q.defer();

				var jns_contract = web3.eth.contract(jns_ABI).at(jns_contract_address);

				jns_contract._nslookup.call($scope.jnsName, function (error, result) {
					if (!error) {
						var token_id = result.toString();
						jns_contract.ownerOf.call(token_id, function (error2, result2) {
							if (!error2) {
								var owner_addr = result2.toString();
								jns_contract._bound.call(token_id, function (error3, result3) {
									if (!error3) {
										var bound_addr = (result3 == 0)? "未绑定" : result3.toString();
										jns_contract.tokenURI.call(token_id, function (error4, result4) {
											if (!error4) {
												var img = parseTokenURI(result4.toString()).image;

												//// get chain & connected account info ////
												
												function resolve(chainId, account) {
													deferred.resolve({
														contractAddress: jns_contract_address,
														tokenId: token_id,
														ownerAddress: owner_addr,
														boundAddress: bound_addr,
														logo: img,
														bindCalldata: jns_contract.bind.getData(token_id),
														unbindCalldata: jns_contract.unbind.getData(token_id),
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

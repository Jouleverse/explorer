angular.module('ethExplorer')
	.controller('junksInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

		var web3 = $rootScope.web3;

		//////////////////////////////////////////////////////////////////////////////
		// write functionalities in page scope                                      //
		//////////////////////////////////////////////////////////////////////////////

		//////////////////////////////////////////////////////////////////////////////
		// read functionalities in page scope                                       //
		//////////////////////////////////////////////////////////////////////////////
		$scope.init = function()
		{

			$scope.allCryptoJunks = [];
			getAllCryptoJunks();

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

			function getAllCryptoJunks() {
				$scope.allCryptoJunks = [];
				var contract = new web3.eth.Contract(cryptojunks_ABI, cryptojunks_contract_address);
				contract.methods.totalSupply().call(function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countCryptoJunks = balance || "0";
						$scope.$apply(); // inform the data updates !

						for (var i = 0; i < balance; i++) {
							var token_name = "CryptoJunks";
							contract.methods.tokenByIndex(i).call(function (err2, result2) {
								if (err2) {
									console.log(err2);
								} else {
									var token_id = result2.toString();
									//var tag = token_name + ' #' + token_id;
									contract.methods.tokenURI(token_id).call(function (err3, result3) {
										if (err3) {
											console.log(err3);
										} else {
											var tokenURI = result3;
											var tokenInfo = parseTokenURI(tokenURI);
											$scope.allCryptoJunks.push({'id': token_id, 'tokenInfo': tokenInfo});
											$scope.$apply(); // inform the data updates !
										}
									});
								}
							});
						}
					}
				});
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

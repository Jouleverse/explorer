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
			if ($routeParams.pageId) {
				// /#/cryptojunks/:pageId/id/:junkId
				// /#/cryptojunks/:pageId
				$scope.pageId = $routeParams.pageId;
			} else {
				// /#/cryptojunks
				$scope.pageId = 0;
			}
			console.log('cryptojunks page ' + $scope.pageId);

			if ($routeParams.junkId) {
				// /#/cryptojunks/:pageId/id/:junkId
				$scope.junkId = $routeParams.junkId;
			} else {
				// /#/cryptojunks/:pageId
				// /#/cryptojunks
				$scope.junkId = undefined;
			}
			console.log('cryptojunks junk #' + $scope.junkId);

			// page list
			$scope.allPages = [];
			for (var i = 0; i < 100; i++) {
				$scope.allPages.push(i);
			}

			// punk list
			$scope.allCryptoJunks = [];
			// get total supply & rendering
			getCryptoJunksSupply();

			// dynamically load reference for tagging the golden inscriptions
			$.get('scripts/misc/punks/' + $scope.pageId + '.json')
			.success((data) => { //won't execute if json format error!
				console.log(data);
				getAllCryptoJunksByPage($scope.pageId, $scope.junkId, data);
			})
			.fail((xhr, status, err) => {
				console.log(xhr, status, err);
				getAllCryptoJunksByPage($scope.pageId);
			})
			.always(() => {
				console.log('loading ', $scope.pageId + '.json ...');
			});

			function getCryptoJunksSupply() {
				const contract = new web3.eth.Contract(cryptojunks_ABI, cryptojunks_contract_address);
				contract.methods.totalSupply().call(function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						const supply = result1.toString();
						$scope.countCryptoJunks = supply || "0";
						$scope.$apply(); // inform the data updates !

					}
				});
			}

			function getAllCryptoJunksByPage(pageId, junkId, references) {
				$scope.allCryptoJunks = [];

				const contract = new web3.eth.Contract(cryptojunks_ABI, cryptojunks_contract_address);

				const length = 100; //100 junks per page
				const begin = pageId * length;

				function getCryptoJunkById(tokenId) {
					contract.methods.tokenURI(tokenId).call(function (e2, tokenURI) {
						if (e2) {
							console.log('token not exists: ' + e2);
							$scope.allCryptoJunks.splice(i, 0, {'id': tokenId, 'tokenInfo': undefined});
							$scope.$apply(); // inform the data updates !
						} else {
							var tokenInfo = parseTokenURI(tokenURI);

							if (references == undefined) {
								tokenInfo.golden = undefined;
							} else {
								if (tokenInfo.image.slice(22) == references[tokenId]) //is punk! set it golden
									tokenInfo.golden = true;
								else
									tokenInfo.golden = false;
							}

							if (tokenInfo.image == 'data:image/png;base64,')
								tokenInfo = undefined; //not exists

							$scope.allCryptoJunks.splice(i, 0, {'id': tokenId, 'tokenInfo': tokenInfo});
							$scope.$apply(); // inform the data updates !
						}
					})

				}

				if (junkId == undefined) { // not specified, show all
					for (var i = 0; i < length; i++) {
						const tokenId = begin + i;
						getCryptoJunkById(tokenId);
					}
				} else {
					const tokenId = junkId;
					getCryptoJunkById(tokenId);
				}
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

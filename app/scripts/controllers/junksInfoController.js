angular.module('jouleExplorer')
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

			// ONLY AFTER SEALED: special pages 1000 - 1002 for broken ones (total: 299)
			$scope.allPages.push(1000, 1001, 1002)
			// precious 88
			$scope.allPages.push(10000)
			// rare 24
			$scope.allPages.push(100000)
			// legend 9
			$scope.allPages.push(1000000)

			// punk list
			$scope.allCryptoJunks = [];
			// get total supply & rendering
			getCryptoJunksSupply();

			// DONOT DELETE. THIS WAS USED FOR INCOMPLETE INSCRIBING GOLDEN RECOGONITION.
			// dynamically load reference for tagging the golden inscriptions
			/*$.get('scripts/misc/punks/' + $scope.pageId + '.json')
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
			});*/
			// dynamically load reference for tagging gold inscriptions
			// only works while all 10000 junks are inscribed and set in stone (no change anymore)
			$.get('scripts/misc/punks/golden_idx.json')
				.success((data) => {
					console.log(data);
					getAllCryptoJunksByPage($scope.pageId, $scope.junkId, data);
				})
				.fail((xhr, status, err) => {
					console.log(xhr, status, err);
					getAllCryptoJunksByPage($scope.pageId);
				})
				.always(() => {
					console.log('loading golden_idx.json ...');
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

				// calculate which junks to show
				const length = 100; //100 junks per page
				var junkIds = [];

				if (pageId < 100) { // normal #0 - #9999
					const begin = pageId * length;

					for (var i = 0; i < length; i++) {
						const tokenId = begin + i;
						junkIds.push(tokenId);
					}
				} else if (pageId >= 1000 && pageId < 1003) { // special pages for broken
					const golden_idx = references;
					const broken_idx = golden_idx['broken'];

					const begin = (pageId - 1000) * length;

					for (var i = 0; i < length; i++) {
						const tokenId = broken_idx[begin + i];
						junkIds.push(tokenId);
					}
				} else if (pageId == 10000) { // special pages for precious
					const golden_idx = references;
					const broken_idx = golden_idx['zombie'];

					const begin = (pageId - 10000) * length;

					for (var i = 0; i < length; i++) {
						const tokenId = broken_idx[begin + i];
						junkIds.push(tokenId);
					}
				} else if (pageId == 100000) { // special pages for rare
					const golden_idx = references;
					const broken_idx = golden_idx['ape'];

					const begin = (pageId - 100000) * length;

					for (var i = 0; i < length; i++) {
						const tokenId = broken_idx[begin + i];
						junkIds.push(tokenId);
					}
				} else if (pageId == 1000000) { // special pages for rare
					const golden_idx = references;
					const broken_idx = golden_idx['alien'];

					const begin = (pageId - 1000000) * length;

					for (var i = 0; i < length; i++) {
						const tokenId = broken_idx[begin + i];
						junkIds.push(tokenId);
					}
				}
				console.log(junkIds);

				// helper func
				function getCryptoJunkById(tokenId) {
					contract.methods.tokenURI(tokenId).call(function (e2, tokenURI) {
						if (e2) {
							console.log('token not exists: ' + e2);
							$scope.allCryptoJunks.splice(i, 0, {'id': tokenId, 'tokenInfo': undefined});
							$scope.$apply(); // inform the data updates !
						} else {
							var tokenInfo = parseTokenURI(tokenURI);

							// DONOT DELETE. OLD references: punk img base64. must do str comparison for user may burn and re-mint.
							/*if (references == undefined) {
								tokenInfo.golden = undefined;
							} else {
								if (tokenInfo.image.slice(22) == references[tokenId]) //is punk! set it golden
									tokenInfo.golden = true;
								else
									tokenInfo.golden = false;
							}*/
							// new reference data after set in stone is golden_idx
							const token_id = tokenId;
							const golden_idx = references;
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

								//console.log(token_id, tokenInfo.golden, tokenInfo.rarity);
							}

							if (tokenInfo.image == 'data:image/png;base64,')
								tokenInfo = undefined; //not exists

							$scope.allCryptoJunks.splice(i, 0, {'id': tokenId, 'tokenInfo': tokenInfo});
							$scope.$apply(); // inform the data updates !
						}
					})

				}

				if (junkId == undefined) { // not specified, show all
					for (const i in junkIds) {
						const tokenId = junkIds[i];
						getCryptoJunkById(tokenId);
					}
				} else { // specified junkId, show only one
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

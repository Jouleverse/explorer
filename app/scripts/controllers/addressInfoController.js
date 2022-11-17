angular.module('ethExplorer')
	.controller('addressInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

		var web3 = $rootScope.web3;

		////////////////////////////////////////////////////////////////////////////////

		$scope.init=function(){

			$scope.addressId=$routeParams.addressId;

			if($scope.addressId!==undefined) {

				getAddressInfos().then(function(result){
					$scope.balance = result.balance;
					$scope.balanceInEther = result.balanceInEther;
				});

				getAllFlyingJ().then(function(result) {
					$scope.countFlyingJ = result.length.toString(); // .toString() is important to work with ||
					$scope.allFlyingJ = result;
				});

				getAllJNS().then(function(result) {
					$scope.countJNS = result.length.toString(); // .toString() !!
					$scope.allJNS = result;
				});
			}


			function getAddressInfos(){
				var deferred = $q.defer();

				web3.eth.getBalance($scope.addressId,function(error, result) {
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

			async function _getAllFlyingJ() {
				//var deferred = $q.defer();

				var list = [];

				var addr = $scope.addressId;

				////////////////////////////////////////////////////////////////////////////////
				//console.log(flyingj_ABI);

				var contract = web3.eth.contract(flyingj_ABI).at(flyingj_contract_address);
				var balance = await contract.balanceOf.call(addr).toString();

				//console.log(balance);

				if (balance > 0) {
					//var token_name = await contract.name.call();
					var token_name = "Flying J";
					var token_id = await contract.tokenOfOwnerByIndex.call(addr).toString();
					var tag = token_name + ' #' + token_id;
					var tokenURI = await contract.tokenURI.call(token_id);

					//console.log(tag);

					var tokenInfo = parseTokenURI(tokenURI);

					//console.log(tokenInfo);

					list.push({'tag': tag, 'tokenInfo': tokenInfo});
				}

				return list;
			}

			function getAllFlyingJ() {
				var deferred = $q.defer();

				// intentionally delay...
				window.setTimeout(function() {
					var list = _getAllFlyingJ();
					deferred.resolve(list);
				}, 0 /*Math.floor(Math.random() * 3000) + 2000*/);

				return deferred.promise;
			}


			async function _getAllJNS() {
				//var deferred = $q.defer();

				var list = [];

				var addr = $scope.addressId;

				//-------------------------------------------------------------------------------

				var jns_contract = web3.eth.contract(jns_ABI).at(jns_contract_address);
				var jns_balance = await jns_contract.balanceOf.call(addr).toString();

				//try {
				var jns_id = await jns_contract._whois.call(addr).toString();
				if (jns_id > 0) {
					var jns_tokenURI = await jns_contract.tokenURI.call(jns_id);
					$scope.jns_info = parseTokenURI(jns_tokenURI);
				}
				//} catch (e) {
				//	  console.log(e);
				//}

				for (var i = 0; i < jns_balance; i++) {
					//var jns_token_name = await jns_contract.name.call();
					var jns_token_name = "J Name Service";
					var jns_token_id = await jns_contract.tokenOfOwnerByIndex.call(addr, i).toString();
					var jns_tag = jns_token_name + ' #' + jns_token_id;
					var jns_tokenURI = await jns_contract.tokenURI.call(jns_token_id);
					var jns_tokenInfo = parseTokenURI(jns_tokenURI);

					list.push({'tag': jns_tag, 'tokenInfo': jns_tokenInfo});
				}

				////////////////////////////////////////////////////////////////////////////////
				//console.log(list);

				//deferred.resolve(list);

				//return deferred.promise;
				return list;
			}

			function getAllJNS() {
				var deferred = $q.defer();

				// intentionally delay...
				window.setTimeout(function() {
					var list = _getAllJNS();
					deferred.resolve(list);
				}, 0 /*Math.floor(Math.random() * 3000) + 2000*/);

				return deferred.promise;
			}

		};

		$scope.init();

	});

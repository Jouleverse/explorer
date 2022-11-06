angular.module('ethExplorer')
    .controller('addressInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

      var web3 = $rootScope.web3;
	
      $scope.init=function(){

        $scope.addressId=$routeParams.addressId;

        if($scope.addressId!==undefined) {
          getAddressInfos().then(function(result){
            $scope.balance = result.balance;
            $scope.balanceInEther = result.balanceInEther;
          });

		  getAddressNFTs().then(function(result) {
			  $scope.NFTs = result;
		  });
        }


        function getAddressInfos(){
          var deferred = $q.defer();

          web3.eth.getBalance($scope.addressId,function(error, result) {
            if(!error) {
                deferred.resolve({
                  balance: result.toString(),
                  balanceInEther: web3.fromWei(result, 'ether').toString()
                });
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
				var [t2, s2] = metadata.image.split(',');
				/*if (t2 == 'data:image/svg+xml;base64') {
					var svg = atob(s2);
					metadata.image = svg;
				}*/
				return metadata;
			}
			return null;
		}

		  async function getAddressNFTs() {
			 var deferred = $q.defer();

			  var list = [];

			  //console.log(flyingj_ABI);

			  var addr = $scope.addressId;
			  var contract = web3.eth.contract(flyingj_ABI).at(flyingj_contract_address);
			  var balance = await contract.balanceOf.call(addr).toString();

			  //console.log(balance);

			  if (balance > 0) {
				  var token_name = await contract.name.call();
				  var token_id = await contract.tokenOfOwnerByIndex.call(addr).toString();
				  var tag = token_name + ' #' + token_id;
				  var tokenURI = await contract.tokenURI.call(token_id);

				  //console.log(tag);

				  var tokenInfo = parseTokenURI(tokenURI);

				  //console.log(tokenInfo);

				  list.push({'tag': tag, 'tokenInfo': tokenInfo});
			  }

			  //console.log(list);

			  deferred.resolve(list);

			  return deferred.promise;
		  }

      };
      
      $scope.init();

    });

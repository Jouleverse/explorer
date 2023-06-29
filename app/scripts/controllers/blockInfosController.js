angular.module('ethExplorer')
    .controller('blockInfosCtrl', function ($rootScope, $scope, $location, $routeParams,$q) {

	var web3 = $rootScope.web3;

		$scope.address2tag = function (address) {
			return __getAddressTag(address);
		}

        $scope.init = function()
        {

            $scope.blockId = $routeParams.blockId;

            if($scope.blockId!==undefined) {

                getBlockInfos()
                    .then(function(result){

                    $scope.result = result;

                    if(result.hash!==undefined){
                        $scope.hash = result.hash;
                    }
                    else{
                        $scope.hash ='等待中';
                    }
                    if(result.miner!==undefined){
                        $scope.miner = result.miner;
                    }
                    else{
                        $scope.miner ='等待中';
                    }
                    $scope.gasLimit = result.gasLimit;
                    $scope.gasUsed = result.gasUsed;
                    $scope.nonce = result.nonce;
                    $scope.difficulty = ("" + result.difficulty).replace(/['"]+/g, '');
                    $scope.gasLimit = result.gasLimit; // that's a string
                    $scope.nonce = result.nonce;
                    $scope.number = result.number;
                    $scope.parentHash = result.parentHash;
                    $scope.blockNumber = result.number;
                    $scope.timestamp = result.timestamp;
                    $scope.timestamp_localestring = new Date(result.timestamp * 1000).toLocaleString('zh-CN', { timezone: 'UTC', timeZoneName: 'short' });
                    $scope.extraData = result.extraData;
                    $scope.dataFromHex = hex2a(result.extraData);
                    $scope.size = result.size;
                    if($scope.blockNumber!==undefined){
						$scope.conf = '未确认';
						web3.eth.getBlockNumber(function (err, number) {
							if (!err && number > $scope.blockNumber) {
								$scope.conf = number - $scope.blockNumber + " 确认数";
								$scope.$apply();
							}
						});
                    }


                });

            } else {
                $location.path("/");
            }


            function getBlockInfos() {
                var deferred = $q.defer();

                web3.eth.getBlock($scope.blockId,function(error, result) {
                    if(!error) {
                        deferred.resolve(result);
                    } else {
                        deferred.reject(error);
                    }
                });
                return deferred.promise;

            }


        };
        $scope.init();

        // parse transactions
        $scope.transactions = []
        web3.eth.getBlockTransactionCount($scope.blockId, function(error, result){
          var txCount = result

          for (var blockIdx = 0; blockIdx < txCount; blockIdx++) {
            web3.eth.getTransactionFromBlock($scope.blockId, blockIdx, function(error, result) {

              var transaction = {
                id: result.hash,
                hash: result.hash,
                from: result.from,
                to: result.to,
                gas: result.gas,
                input: result.input,
                value: result.value + "",
				valueJ: result.value / 10**18 + ""
              }
              $scope.$apply(
                $scope.transactions.push(transaction)
              )
            })
          }
        })


function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}
});

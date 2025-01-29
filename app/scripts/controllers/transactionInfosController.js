angular.module('ethExplorer')
    .controller('transactionInfosCtrl', function ($rootScope, $scope, $location, $routeParams,$q) {

       var web3 = $rootScope.web3;
	
		$scope.address2tag = function (address) {
			return __getAddressTag(address);
		}

        $scope.init=function()
        {
            $scope.txId=$routeParams.transactionId;

            if($scope.txId!==undefined) { // add a test to check if it match tx paterns to avoid useless API call, clients are not obliged to come from the search form...

                getTransactionInfos()
                    .then(function(result){

                    $scope.result = result;

                    if(result.blockHash!==undefined){
                        $scope.blockHash = result.blockHash;
                    }
                    else{
                        $scope.blockHash ='等待中';
                    }
                    if(result.blockNumber!==undefined){
                        $scope.blockNumber = result.blockNumber;
                    }
                    else{
                        $scope.blockNumber ='等待中';
                    }
                    $scope.from = result.from;
                    $scope.gas = result.gas;
                    //$scope.gasPrice = result.gasPrice.c[0] + " e";
                    $scope.gasPrice = result.gasPrice + " e";
					//var gasPriceGwei = result.gasPrice.c[0] / 10**9;
					var gasPriceGwei = result.gasPrice / 10**9;
                    $scope.gasPriceGwei = gasPriceGwei < 10 ? parseInt(gasPriceGwei * 10)/10 : parseInt(gasPriceGwei);
                    $scope.hash = result.hash;
                    $scope.input = result.input; // that's a string

                    $scope.inputFormat = 'raw_data';
                    $scope.targetInputFormat = "decode";
                    $scope.inputDecoderJsonString = "";

                    $scope.toggleDecodeInput = function() {

                        if ($scope.inputFormat == "raw_data") {
                            
                            if ($scope.inputDecoderJsonString == "") {
                                let inputDecoder = decodeInput($scope.input);
                                $scope.inputDecoderJsonString = JSON.stringify(inputDecoder, '', 2);
                            }

                            $scope.inputFormat = 'decode_data';
                            $scope.targetInputFormat = "raw data";

                        } else {
                            
                            $scope.inputFormat = 'raw_data';
                            $scope.targetInputFormat = "decode";

                        }
                        
                    }


                    $scope.nonce = result.nonce;
                    $scope.to = result.to;
                    $scope.transactionIndex = result.transactionIndex;
                    //$scope.ethValue = result.value.c[0] / 10000; 
                    $scope.ethValue = result.value / 10000; 
                    $scope.txprice = (result.gas * result.gasPrice)/1000000000000000000 + " J";
					var txfee = result.gas * result.gasPrice / 10**9;
					$scope.txfeeGwei = txfee < 10 ? parseInt(txfee * 10)/10 : parseInt(txfee);

                    if($scope.blockNumber!==undefined){
						web3.eth.getBlock($scope.blockNumber, false, function (err, info) {
							if(info) {
								$scope.time = info.timestamp;
								$scope.time_localestring = new Date(info.timestamp * 1000).toLocaleString('zh-CN', { timezone: 'UTC', timeZoneName: 'short' });
								$scope.$apply(); // $scope.$appy() can trigger getBlock twice! HAHAHAHA....
							}
						});

						$scope.conf = '未确认';
						web3.eth.getBlockNumber(function (err, number) {
							if (number && number > $scope.blockNumber) {
								$scope.conf = number - $scope.blockNumber + " 确认数";
								$scope.$apply();

							}
						});
                    }


                });

            }



            else{
                $location.path("/"); // add a trigger to display an error message so user knows he messed up with the TX number
            }


            function getTransactionInfos(){
                var deferred = $q.defer();

                web3.eth.getTransaction($scope.txId,function(error, result) {
                    if(!error){
                        deferred.resolve(result);
                    }
                    else{
                        deferred.reject(error);
                    }
                });
                return deferred.promise;

            }

            function decodeInput(inputString) {
                abiDecoder.addABI(wj_ABI);
                abiDecoder.addABI(redpacket_ABI);
                abiDecoder.addABI(pop_ABI);
                abiDecoder.addABI(planet_ABI);
                abiDecoder.addABI(jvcore_ABI);
                abiDecoder.addABI(jti2_ABI);
                abiDecoder.addABI(jti_ABI);
                abiDecoder.addABI(jnsvote_ABI);
                abiDecoder.addABI(jns_ABI);
                abiDecoder.addABI(flyingj_ABI);
                abiDecoder.addABI(airdrop_ABI);
                return abiDecoder.decodeMethod(inputString);
                
            }



        };
        $scope.init();
        //console.log($scope.result);

    });

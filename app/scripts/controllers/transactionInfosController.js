angular.module('jouleExplorer')
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

					var confirmed = false;
                    if(result.blockHash){
						confirmed = true;
                        $scope.blockHash = result.blockHash;
                        $scope.blockNumber = result.blockNumber;
                    } else {
						$scope.time = '尚未确认';
						$scope.conf = '尚未确认'; // 缺省值
                    }

                    $scope.from = result.from;

                    //$scope.gasPrice = result.gasPrice.c[0] + " e";
					//var gasPriceGwei = result.gasPrice.c[0] / 10**9;
					var gasPrice = result.gasPrice;
					$scope.gasPrice = web3.utils.fromWei(gasPrice, "ether");
                    $scope.gasPriceGwei = parseInt(web3.utils.fromWei(gasPrice, "gwei"));

                    $scope.gasLimit = result.gas; // 保存 gas limit
                    
					var fee = String(result.gas * result.gasPrice); // 预估值
					$scope.txfee = web3.utils.fromWei(fee, "ether");
					$scope.txfeeGwei = parseInt(web3.utils.fromWei(fee, "gwei"));

					if (confirmed) {
						// 获取实际消耗的 gas
						web3.eth.getTransactionReceipt($scope.txId, function(error, receipt) {
							if(!error && receipt) {
								$scope.gasUsed = receipt.gasUsed;
								// 使用实际消耗的 gas 计算交易费用
								var fee = String(receipt.gasUsed * result.gasPrice);
								console.log(fee);
								$scope.txfee = web3.utils.fromWei(fee, "ether");
								$scope.txfeeGwei = parseInt(web3.utils.fromWei(fee, "gwei"));
								$scope.$apply();
							}
						});
					}

                    //$scope.hash = result.hash;
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
                    //$scope.txValue = result.value.c[0] / 10000; 
                    $scope.txValue = result.value / 10000;

                    if(confirmed){
						web3.eth.getBlock($scope.blockNumber, false, function (err, info) {
							if(info) {
								$scope.time = info.timestamp;
								$scope.time_localestring = new Date(info.timestamp * 1000).toLocaleString('zh-CN', { timezone: 'UTC', timeZoneName: 'short' });
								$scope.$apply(); // $scope.$appy() can trigger getBlock twice! HAHAHAHA....
							}
						});

						web3.eth.getBlockNumber(function (err, number) {
							if (number && number >= $scope.blockNumber) {
								$scope.conf = 1 + number - $scope.blockNumber;
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

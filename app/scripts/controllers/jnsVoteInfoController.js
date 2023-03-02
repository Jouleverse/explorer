angular.module('ethExplorer')
	.controller('jnsVoteInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

		var web3 = $rootScope.web3;

		$scope.voteFor = function (proposal)
		{
			if (window.ethereum && window.ethereum.isConnected()) {
				// hacking...
				web3.setProvider(window.ethereum);
				web3.eth.defaultAccount = web3.eth.accounts[0];

				var jnsvote_contract = web3.eth.contract(jnsvote_ABI).at(jnsvote_contract_address);

				jnsvote_contract.voteFor.estimateGas(proposal, function (error, gas_amount) {
					if (error) {
						console.log('voteFor estimateGas error: ', error);
						$scope.errmsg = error.data.message;
						$scope.$apply();
					} else {
						console.log('voteFor estimateGas: ', gas_amount);

						jnsvote_contract.voteFor(proposal,
							function (err, result) {
								if (err) {
									console.log('voteFor error: ', err);
									$scope.errmsg = err.message;
									$scope.$apply();
								}
							}); // no need to send()

						$scope.errmsg = '投票上链中，请15秒后刷新此页面';
						$scope.$apply();
					}

				});

			} else {
				this.hexdata = '向合约地址 ' + jnsvote_contract_address + ' 发送数据 ' + this.voteForCalldata[proposal] + ' 投赞成票';
			}

		}

		$scope.voteAgainst = function (proposal)
		{
			if (window.ethereum && window.ethereum.isConnected()) {
				// hacking...
				web3.setProvider(window.ethereum);
				web3.eth.defaultAccount = web3.eth.accounts[0];

				var jnsvote_contract = web3.eth.contract(jnsvote_ABI).at(jnsvote_contract_address);

				jnsvote_contract.voteAgainst.estimateGas(proposal, function (error, gas_amount) {
					if (error) {
						console.log('voteAgainst estimateGas error: ', error);
						$scope.errmsg = error.data.message;
						$scope.$apply();
					} else {
						console.log('voteAgainst estimateGas: ', gas_amount);

						jnsvote_contract.voteAgainst(proposal,
							function (err, result) {
								if (err) {
									console.log('voteAgainst error: ', err);
									$scope.errmsg = err.message;
									$scope.$apply();
								}
							}); // no need to send()

						$scope.errmsg = '投票上链中，请15秒后刷新此页面';
						$scope.$apply();
					}

				});

			} else {
				this.hexdata = '向合约地址 ' + jnsvote_contract_address + ' 发送数据 ' + this.voteAgainstCalldata[proposal] + ' 投反对票';
			}

		}

		$scope.init = function()
		{
			$scope.countJNSVote = 0;
			$scope.allJNSVote = [];
			$scope.allProposals = [];

			getAllProposals();

			/////////////////// handlers or helpers ///////////////////////
			
			function getAllJNSVote(addr) {
				console.log('fetching JNSVote POAPs of address ' + addr);
				$scope.countJNSVote = 0;
				$scope.allJNSVote = [];
				var contract = web3.eth.contract(jnsvote_ABI).at(jnsvote_contract_address);
				contract.balanceOf.call(addr, function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countJNSVote = balance;
						for (var i = 0; i < balance; i++) {
							var token_name = "JNS Vote";
							contract.tokenOfOwnerByIndex.call(addr, i, function (err2, result2) {
								if (err2) {
									console.log(err2);
								} else {
									var token_id = result2.toString();
									var tag = token_name + ' #' + token_id;
									contract.tokenURI.call(token_id, function (err3, result3) {
										if (err3) {
											console.log(err3);
										} else {
											var tokenURI = result3;
											var tokenInfo = parseTokenURI(tokenURI);
											$scope.allJNSVote.push({'tag': tag, 'tokenInfo': tokenInfo});
											$scope.$apply(); // inform the data updates !
										}
									});
								}
							});
						}
					}
				});

			}

			function getAllProposals() {
				$scope.allProposals = [];
				$scope.voteForCalldata = {};
				$scope.voteAgainstCalldata = {};

				var jnsvote_contract = web3.eth.contract(jnsvote_ABI).at(jnsvote_contract_address);
				jnsvote_contract._totalProposals.call(function (err, result) {
						if (err) {
							console.log(err);
							alert('出错啦：' + err.message);
						} else {
							$scope.countProposals = result.toString();

							var gen_callback2 = function (id) {
								return function (err2, result2) {
									if (err2) {
										console.log(err2);
										alert('出错啦：' + err2.message);
									} else {
										beginBlock = result2[2];
										endBlock = result2[3];
										currentBlock = web3.eth.blockNumber;
										var progress;
										var countdown1 = '', countdown2 = '';
										if (currentBlock < beginBlock) {
											progress = '未开始';
											countdown1 = formatTime((beginBlock - currentBlock) * 15);
										} else if (currentBlock < endBlock) {
											progress = '进行中';
											countdown2 = formatTime((endBlock - currentBlock) * 15);
										} else {
											progress = '已结束';
										}

										var info = {
											id: id,
											title: result2[0],
											cid: result2[1],
											link: cid2link(result2[1]),
											timeBegin: result2[2].toString(),
											timeEnd: result2[3].toString(),
											countVotesFor: result2[4].toString() + " (" + (result2[4] == 0 ? "0" : Math.floor(result2[4]/(result2[4].add(result2[5]))*10000)/100) + "%)",

											countVotesAgainst: result2[5].toString() + " (" + (result2[5] == 0 ? "0" : Math.floor(result2[5]/(result2[4].add(result2[5]))*10000)/100) + "%)",

											countJNSvoted: result2[6].toString() + " (" + (result2[6] == 0 ? "0" : Math.floor(result2[6].div(result2[8])*10000)/100) + "%)",
											countJNSvotedFor: result2[7].toString() + " (" + (result2[7] == 0 ? "0" : Math.floor(result2[7].div(result2[8])*10000)/100) + "%)",

											totalJNS: result2[8].toString(),
											disabled: result2[9],
											progress: progress,
											countdown1: countdown1,
											countdown2: countdown2,
										};

										//$scope.allProposals.push(info);
										var j = 0;
										while (j < $scope.allProposals.length && info.id < $scope.allProposals[j].id) {
											j++;
										}
										$scope.allProposals.splice(j, 0, info);

										$scope.$apply(); // trigger update
									}
								};

							};

							for (var i = 0; i < $scope.countProposals; i++) {
								var pid = i + 1;
								$scope.voteForCalldata[pid] = jnsvote_contract.voteFor.getData(pid);
								$scope.voteAgainstCalldata[pid] = jnsvote_contract.voteAgainst.getData(pid);
								// fetch data from blockchain
								jnsvote_contract._proposals.call(pid, gen_callback2(pid));
							}

						}
					});

			}

			//////////////// add listeners /////////////////
			if (window.ethereum) {
				
				window.ethereum.on('connect', function (connectInfo) {
					console.log("[jnsVote] connected: ", connectInfo);
					//web3.setProvider(window.ethereum);
					//web3.eth.defaultAccount = web3.eth.accounts[0];

					window.ethereum
						.request({ method: 'eth_requestAccounts' })
						.then((accounts) => {
							console.log("connected account is: ", accounts[0]);
							getAllJNSVote(accounts[0]);
						})
						.catch((error) => {
							console.error(`Error requesting accounts: ${error.code}: ${error.message}`);
						});
				});

				window.ethereum.on('chainChanged', function (chainId) {
					console.log("[jnsVote] switched to chain id: ", parseInt(chainId, 16));
					$scope.chainId = chainId;
					$scope.$apply();
				});

				window.ethereum.on('accountsChanged', function (accounts) {
					console.log("[jnsVOte] switched to account: ", accounts[0]);
					getAllJNSVote(accounts[0]); //refresh!
					$scope.account = accounts[0];
					$scope.$apply();
				});
			}

		}

		$scope.init();

		function formatTime(seconds) {
			var days, hours, minutes;
			var result = '';

			days = Math.floor(seconds / 3600 / 24);
			if (days > 0)
				result += days + '天';

			seconds -= days * 3600 * 24;
			hours = Math.floor(seconds / 3600);
			if (hours > 0)
				result += hours + '小时';

			seconds -= hours * 3600;
			minutes = Math.floor(seconds / 60);
			if (minutes > 0)
				result += minutes + '分钟';

			return result;
		}

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

		function cid2link(ipfsURI) { //ipfs CIDv0 to link CIDv1.dweb.link
			const cidv0 = ipfsURI.slice(7);
			const cidv1 = Multiformats.CID.parse(cidv0).toV1().toString();
			return 'https://' + cidv1 + '.ipfs.w3s.link';
			//return 'https://' + cidv1 + '.ipfs.dweb.link';
			//return 'https://gateway.pinata.cloud/ipfs/' + cidv0; //use pinata.cloud
		}

	});

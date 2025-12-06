angular.module('jouleExplorer')
	.controller('jnsVoteInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

		var web3 = $rootScope.web3;

		//////////////////////////////////////////////////////////////////////////////
		// write functionalities in page scope                                      //
		//////////////////////////////////////////////////////////////////////////////

		//refactored-20230330
		$scope.voteFor = function (proposal)
		{
			const DIALOG_TITLE = "投赞成票";

			if (window.ethereum && window.ethereum.isConnected()) {
				// using injected provider
				web3.setProvider(window.ethereum);
				const connectedAccount = window.ethereum.selectedAddress;

				var jnsvote_contract = new web3.eth.Contract(jnsvote_ABI, jnsvote_contract_address);
				jnsvote_contract.methods.voteFor(proposal).estimateGas({from: connectedAccount}, (err, gas) => {
					if (!err) {
						jnsvote_contract.methods.voteFor(proposal).send({from: connectedAccount}, handlerShowTx(DIALOG_TITLE))
							.then(handlerShowRct(DIALOG_TITLE));
					} else {
						dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message); //展示合约逻辑报错
					}
				});
			} else {
				this.hexdata = '向合约地址 ' + jnsvote_contract_address + ' 发送数据 ' + this.voteForCalldata[proposal] + ' 投赞成票';
			}

		}

		//refactored-20230330
		$scope.voteAgainst = function (proposal)
		{
			const DIALOG_TITLE = "投反对票";

			if (window.ethereum && window.ethereum.isConnected()) {
				// using injected provider
				web3.setProvider(window.ethereum);
				const connectedAccount = window.ethereum.selectedAddress;

				var jnsvote_contract = new web3.eth.Contract(jnsvote_ABI, jnsvote_contract_address);
				jnsvote_contract.methods.voteAgainst(proposal).estimateGas({from: connectedAccount}, (err, gas) => {
					if (!err) {
						jnsvote_contract.methods.voteAgainst(proposal).send({from: connectedAccount}, handlerShowTx(DIALOG_TITLE))
							.then(handlerShowRct(DIALOG_TITLE));
					} else {
						dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message); //展示合约逻辑报错
					}
				});
			} else {
				this.hexdata = '向合约地址 ' + jnsvote_contract_address + ' 发送数据 ' + this.voteAgainstCalldata[proposal] + ' 投反对票';
			}

		}

		//////////////////////////////////////////////////////////////////////////////
		// read functionalities in page scope                                       //
		//////////////////////////////////////////////////////////////////////////////
		$scope.init = function()
		{
			$scope.countJNSVote = 0;
			$scope.allJNSVote = [];
			$scope.allProposals = [];

			getAllProposals();

			/////////////////// handlers or helpers ///////////////////////
			function getJTIBalance(addr) {
				console.log('fetching JTI balance of address ' + addr);
				$scope.countJTI = 0;

				var contract = new web3.eth.Contract(jns_ABI, jns_contract_address);
				contract.methods.balanceOf(addr).call(function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countJTI = balance;
						$scope.$apply(); //refresh!
					}
				});
			}

			function getJNSBalance(addr) {
				console.log('fetching JNS balance of address ' + addr);
				$scope.countJNS = 0;

				var contract = new web3.eth.Contract(jns_ABI, jns_contract_address);
				contract.methods.balanceOf(addr).call(function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countJNS = balance;
						$scope.$apply(); //refresh!
					}
				});
			}

			function getAddressNS(addr) {
				console.log('fetching bound JNS of address ' + addr);
				$scope.jns_info = '';
				//$scope.$apply(); //clear//错误：不能在此apply. 只能在callback中apply.

				var jns_contract = new web3.eth.Contract(jns_ABI, jns_contract_address);
				jns_contract.methods._whois(addr).call(function (err, result) {
					if (!err) {
						var jns_id = result.toString();
						if (jns_id > 0) {
							jns_contract.methods.tokenURI(jns_id).call(function (err2, result2) {
								var jns_tokenURI = result2;
								$scope.jns_info = parseTokenURI(jns_tokenURI);
								$scope.$apply(); //update
							});
						}
					}
				});
			}
			
			function getAllJNSVote(addr) {
				console.log('fetching JNSVote POAPs of address ' + addr);
				$scope.countJNSVote = 0;
				$scope.allJNSVote = [];

				var contract = new web3.eth.Contract(jnsvote_ABI, jnsvote_contract_address);
				contract.methods.balanceOf(addr).call(function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countJNSVote = balance;
						for (var i = 0; i < balance; i++) {
							var token_name = "JNS Vote";
							contract.methods.tokenOfOwnerByIndex(addr, i).call(function (err2, result2) {
								if (err2) {
									console.log(err2);
								} else {
									var token_id = result2.toString();
									var tag = token_name + ' #' + token_id;
									contract.methods.tokenURI(token_id).call(function (err3, result3) {
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

				var jnsvote_contract = new web3.eth.Contract(jnsvote_ABI, jnsvote_contract_address);
				jnsvote_contract.methods._totalProposals().call(function (err, result) {
						if (err) {
							console.log('_totalProposals error: ', err, result);
						} else {
							console.log('_totalProposals: ', result);
							$scope.countProposals = result.toString();
							$scope.$apply();

							var gen_callback2 = function (id) {
								return function (err2, result2) {
									if (err2) {
										console.log('read proposal error: ', id, err2, result2);
									} else {
										const beginBlock = result2[2];
										const endBlock = result2[3];
										const countVotesFor = web3.utils.BN(result2[4]);
										const countVotesAgainst = web3.utils.BN(result2[5]);
										const countJNSvoted = web3.utils.BN(result2[6]);
										const countJNSvotedFor = web3.utils.BN(result2[7]);
										const totalJNS = web3.utils.BN(result2[8]);

										web3.eth.getBlockNumber(function (e, currentBlock) {
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

												decision = decisionMaker(id, countVotesFor, countVotesAgainst, countJNSvoted, countJNSvotedFor, totalJNS);
											}

											var info = {
												id: id,
												title: result2[0],
												cid: result2[1],
												link: cid2link(result2[1]),
												timeBegin: result2[2].toString(),
												timeEnd: result2[3].toString(),

												//countVotesFor: countVotesFor.toString() + " (" + (countVotesFor == 0 ? "0" : Math.floor(countVotesFor.div(countVotesFor.add(countVotesAgainst))*10000)/100) + "%)",

												//countVotesAgainst: countVotesAgainst.toString() + " (" + (countVotesAgainst == 0 ? "0" : Math.floor(countVotesAgainst.div(countVotesFor.add(countVotesAgainst))*10000)/100) + "%)",
												//countJNSvoted: countJNSvoted.toString() + " (" + (countJNSvoted == 0 ? "0" : Math.floor(countJNSvoted.div(totalJNS)*10000)/100) + "%)",
												//countJNSvotedFor: countJNSvotedFor.toString() + " (" + (countJNSvotedFor == 0 ? "0" : Math.floor(countJNSvotedFor.div(totalJNS)*10000)/100) + "%)",
												
												countVotesFor: countVotesFor.toString() + " (" + (countVotesFor == 0 ? "0" : Math.floor(countVotesFor/countVotesFor.add(countVotesAgainst)*10000)/100) + "%)",
												countVotesAgainst: countVotesAgainst.toString() + " (" + (countVotesAgainst == 0 ? "0" : Math.floor(countVotesAgainst/countVotesFor.add(countVotesAgainst)*10000)/100) + "%)",

												countJNSvoted: countJNSvoted.toString() + " (" + (countJNSvoted == 0 ? "0" : Math.floor(countJNSvoted/totalJNS*10000)/100) + "%)",
												countJNSvotedFor: countJNSvotedFor.toString() + " (" + (countJNSvotedFor == 0 ? "0" : Math.floor(countJNSvotedFor/totalJNS*10000)/100) + "%)",

												totalJNS: totalJNS.toString(),
												disabled: result2[9],
												progress: progress,
												countdown1: countdown1,
												countdown2: countdown2,
												decision: decision,
											};

											//$scope.allProposals.push(info);
											var j = 0;
											while (j < $scope.allProposals.length && info.id < $scope.allProposals[j].id) {
												j++;
											}
											$scope.allProposals.splice(j, 0, info);

											$scope.$apply(); // trigger update
										});
									}

								};

							};

							for (var i = 0; i < $scope.countProposals; i++) {
								var pid = i + 1;
								$scope.voteForCalldata[pid] = jnsvote_contract.methods.voteFor(pid).encodeABI();
								//$scope.voteAgainstCalldata[pid] = jnsvote_contract.voteAgainst.getData(pid);
								$scope.voteAgainstCalldata[pid] = jnsvote_contract.methods.voteAgainst(pid).encodeABI();
								// fetch data from blockchain
								jnsvote_contract.methods._proposals(pid).call(gen_callback2(pid));
							}

						}
					});

			}

			//////////////// get data && add listeners /////////////////
			if (window.ethereum && window.ethereum.isConnected()) {
				console.log("[jnsVote] get data && add listeners");

				//web3.setProvider(window.ethereum);
				const connectedAccount = window.ethereum.selectedAddress;
				console.log("[jnsVote] connected account is: ", connectedAccount);
				getAllJNSVote(connectedAccount);
				getJNSBalance(connectedAccount);
				getJTIBalance(connectedAccount);
				getAddressNS(connectedAccount);
				$scope.account = connectedAccount;
				//$scope.$apply(); //错误：不能在init时apply. 只能在callback中apply.

				window.ethereum.on('chainChanged', function (chainId) {
					console.log("[jnsVote] switched to chain id: ", parseInt(chainId, 16));
					$scope.chainId = chainId;
					$scope.$apply();
				});

				window.ethereum.on('accountsChanged', function (accounts) {
					const connectedAccount = window.ethereum.selectedAddress;
					console.log("[jnsVote] switched to account: ", connectedAccount);
					getAllJNSVote(connectedAccount); //refresh!
					getJNSBalance(connectedAccount);
					getJTIBalance(connectedAccount);
					getAddressNS(connectedAccount);
					$scope.account = connectedAccount;
					$scope.$apply();
				});
			}

		}

		$scope.init();

		//////////////////////////////////////////////////////////////////////////////
		// helper functionalities NOT in page scope                                 //
		//////////////////////////////////////////////////////////////////////////////
		function decisionMaker(proposalId, countVotesFor, countVotesAgainst, countJNSvoted, countJNSvotedFor, totalJNS) {
			var decision = 0;
			//var approvalRate = countVotesFor == 0 ? 0 : countVotesFor.div(countVotesFor.add(countVotesAgainst)); //从1.8.x web3的BN .div只有整数部分，而却没有.dividedBy ...
			//var representativeRate = countJNSvotedFor == 0 ? 0 : countJNSvotedFor.div(totalJNS);
			var approvalRate = countVotesFor == 0 ? 0 : countVotesFor/countVotesFor.add(countVotesAgainst);
			var representativeRate = countJNSvotedFor == 0 ? 0 : countJNSvotedFor/totalJNS;

			console.log('[decisionMaker] decision for proposal #', proposalId, ' countVotesFor: ', countVotesFor.toString(), ' countVotesAgainst: ', countVotesAgainst.toString(), ' countJNSvotedFor: ', countJNSvotedFor.toString(), ' totalJNS: ', totalJNS.toString(), ' approvalRate: ', approvalRate.toString(), ' representativeRate: ', representativeRate.toString());

			//const ar = approvalRate.toNumber();
			//const rr = representativeRate.toNumber();
			const ar = approvalRate;
			const rr = representativeRate;

			if (proposalId <= 2) { // use V1 rule
				if (ar > 2/3 && rr > 1/2) {
					decision = 1;
				} else {
					decision = -1;
				}
			} else { // use V2 rule, boostrapped by proposal #3
				if (ar > 2/3 && rr > 0.4) {
					decision = 1;
				} else {
					decision = -1;
				}
			}

			console.log('[decisionMaker] proposal id#: ', proposalId, ' ar: ', ar, ' rr: ', rr, ' decision: ', decision);
			return decision;
		}

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

			// check which one is available: https://ipfs.github.io/public-gateway-checker/

			//return 'https://' + cidv1 + '.ipfs.w3s.link';
			//return 'https://' + cidv1 + '.ipfs.dweb.link';
			return 'https://gateway.pinata.cloud/ipfs/' + cidv1; //use pinata.cloud
		}

	});

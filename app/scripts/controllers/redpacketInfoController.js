angular.module('jouleExplorer')
	.controller('redpacketInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

		var web3 = $rootScope.web3;

		//////////////////////////////////////////////////////////////////////////////
		// write functionalities in page scope                                      //
		//////////////////////////////////////////////////////////////////////////////

		$scope.redpacketWjApproveDialog = function ()
		{
			$scope.redpacketAmount = $('#new-redpacket-amount')[0].value;
			$('#approve-wj-to').text(redpacket_contract_address);
			$('#approve-wj-from').text($scope.account);

			$('#dialog-approve-wjoule').modal({keyboard:false, backdrop:'static'});
			$('#dialog-approve-wjoule').modal('show');
		}

		$scope.redPacketWjApproveConfirm = function (redpacketAmount)
		{
			console.log('[redpacketInfo] Approve redpacketAmount: ' + redpacketAmount);

			const DIALOG_TITLE = '红包授权WJ';
			var inputError = '';

			// Validate input
			if (Number.isNaN(parseFloat(redpacketAmount)) || parseFloat(redpacketAmount) < 0 || parseFloat(redpacketAmount) > 2000) {
				inputError += '授权红包总额非法: 红包总额必须在0~2000 WJ之间用于授权。';
			}

			if (inputError.length > 0) {
				dialogShowTxt(DIALOG_TITLE, inputError);
				return;
			}

			if (window.ethereum && window.ethereum.isConnected()) {
				web3.setProvider(window.ethereum);
				const connectedAccount = window.ethereum.selectedAddress;

				const e = web3.utils.toWei(redpacketAmount, 'ether');
				const wj_contract = new web3.eth.Contract(wj_ABI, wj_contract_address);

				wj_contract.methods.approve(redpacket_contract_address, e).estimateGas({from: connectedAccount}, (err, gas) => {
					if (!err) {
						wj_contract.methods.approve(redpacket_contract_address, e)
							.send({from: connectedAccount}, handlerShowTx(DIALOG_TITLE))
							.then((receipt) => {
								dialogShowTxt(DIALOG_TITLE, '上链成功！');
								// let's update the allowance.value
								$scope.updateWJAllowance();
							});
					} else {
						dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message); //展示合约逻辑报错
					}
				});
			}
		}

		$scope.createRedPacket = function () 
		{
			const DIALOG_TITLE = '创建红包';
			const newpacketId = $scope.newpacketId;
			const amount = $('#new-redpacket-amount')[0].value;
			const quantity = $('#new-redpacket-quantity')[0].value;
			var inputError = '';

			console.log('[redpacketInfo] Dialog title: ' + DIALOG_TITLE);
			console.log('[redpacketInfo] Packet ID: ' + newpacketId);
			console.log('[redpacketInfo] Packet amount: ' + amount);
			console.log('[redpacketInfo] Packet quantity: ' + quantity);
			
			// Input validation
			if (amount == '' ||parseFloat(amount) < 0 || parseFloat(amount) > 2000) {
				inputError += '红包总额非法: 输入红包总额必须在0~2000 WJ之间。';
			}

			if (quantity == '' || parseFloat(quantity) < 0 || parseFloat(quantity) > 500) {
				inputError += ' 红包个数非法: 输入红包个数必须在0~500之间。';
			}

			if (inputError.length > 0) {
				dialogShowTxt(DIALOG_TITLE, inputError);
				return;
			}

			if (window.ethereum && window.ethereum.isConnected()) {
				web3.setProvider(window.ethereum);
				const connectedAccount = window.ethereum.selectedAddress;
				const redpacket_contract = new web3.eth.Contract(redpacket_ABI, redpacket_contract_address);
				const redpacket_amount = web3.utils.toWei(amount, 'ether');

				redpacket_contract.methods.create(newpacketId, quantity, redpacket_amount).estimateGas({from: connectedAccount}, (err, gas) => {
					if (!err) {
						redpacket_contract.methods.create(newpacketId, quantity, redpacket_amount)
							.send({from: connectedAccount}, handlerShowTx(DIALOG_TITLE))
							.then(displayRedPacketInfoToCopy(newpacketId, amount, quantity));
					} else {
						dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message); //展示合约逻辑报错
					}
				});
			}

			function displayRedPacketInfoToCopy(newpacketId, amount, quantity) {
				return (receipt) => {
					// hide the default dialog showing tx info.
					dialogHide();

					// save the red packet id to local storage for later retrieval
					if (typeof(Storage) !== 'undefined') {
						const n = parseInt(localStorage.getItem('TotalRedPackets') || 0);
						localStorage.setItem('RedPacket' + n + 'Id', newpacketId);
						localStorage.setItem('RedPacket' + n + 'Amount', amount);
						localStorage.setItem('RedPacket' + n + 'Quantity', quantity);
						localStorage.setItem('TotalRedPackets', n + 1);
					}

					// update the allowance value
					$scope.updateWJAllowance();

					// show info of redpacket for copying to clipboard
					const newpacketCopyUrl = $location.absUrl() + '/' + newpacketId;
					
					$('#newpacket-copy-url').text(newpacketCopyUrl);
					$('#newpacket-copy-amount').text(amount);
					$('#newpacket-copy-quantity').text(quantity);
					$('#dialog-display-redpacketinfo-tocopy').modal({keyboard:false, backdrop:'static'});
					$('#dialog-display-redpacketinfo-tocopy').modal('show');
				}
			}
		}

		$scope.copyRedpacketInfoToClipboard = function ()
		{
			var redpacketClipboardValue = '红包地址：' + document.getElementById('newpacket-copy-url').innerHTML + '\n \n';
			redpacketClipboardValue += '红包总额：' + document.getElementById('newpacket-copy-amount').innerHTML + ' WJ\n \n';
			redpacketClipboardValue += '红包个数：' + document.getElementById('newpacket-copy-quantity').innerHTML;
			console.log('[redpacketInfo] Clipboard value: ' + redpacketClipboardValue);
			
			navigator.clipboard.writeText(redpacketClipboardValue);
		}

		$scope.openRedPacket = function ()
		{
			const DIALOG_TITLE = '打开红包';
			const redpacketId = $scope.redpacketId;
			const luckynum = $('#open-redpacket-luckynum')[0].value;
			var inputError = '';

			console.log('[redpacketInfo] Dialog title: ' + DIALOG_TITLE);
			console.log('[redpacketInfo] Packet ID: ' + redpacketId);
			console.log('[redpacketInfo] Lucky Number: ' + luckynum);

			// Input validation
			if (redpacketId.substr(0, 2) !== '0x') {
				inputError += '红包地址非法: 必须以0x开头。';
			}

			if (!Number.isInteger(parseFloat(luckynum)) || parseFloat(luckynum) < 0 || parseFloat(luckynum) > 2 ** 256 - 1) {
				inputError += '红包幸运数字非法: 必须是 0 ~ 2^256-1 之间的整数。';
			}

			if (inputError.length > 0) {
				dialogShowTxt(DIALOG_TITLE, inputError);
				return;
			}

			if (window.ethereum && window.ethereum.isConnected()) {
				web3.setProvider(window.ethereum);
				const connectedAccount = window.ethereum.selectedAddress;
				console.log('[redpacket > openRedPacket] connectedAccount: ', connectedAccount);
				const redpacket_contract = new web3.eth.Contract(redpacket_ABI, redpacket_contract_address);

				redpacket_contract.methods.open(redpacketId, luckynum).estimateGas({from: connectedAccount}, (err, gas) => {
					if (!err) {
						redpacket_contract.methods.open(redpacketId, luckynum)
							.send({from: connectedAccount}, handlerShowTx(DIALOG_TITLE))
							.then(() => {
								handlerShowRct(DIALOG_TITLE)
								$scope.displayRedPacketInfo($scope.redpacketId)
							})
					} else {
						dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message); //展示合约逻辑报错
					}
				});
			}

		}

		//////////////////////////////////////////////////////////////////////////////
		// read functionalities in page scope                                       //
		//////////////////////////////////////////////////////////////////////////////
		$scope.init = function()
		{
			$scope.redpacketId = $routeParams.redpacketId; // must in format 0x...

			// synchronized methods may not work...
			//$scope.chainId = window.ethereum?.chainId;
			//$scope.account= window.ethereum?.selectedAddress;

			$scope.connectedToJ = () => { return $scope.chainId === '0xe52' }; //use closure for responsiveness

			$scope.updateWJAllowance = () => {
				getWJAllowance().then((allowance) => {
					$scope.wjAllowance = allowance;
				});
			}; //the closure
			$scope.updateWJAllowance(); //call it once

			console.log('[redpacketInfo] redpacketId: ', $scope.redpacketId);
			console.log('[redpacketInfo] wj allowance: ', $scope.wjAllowance);
			console.log('[redpacketInfo] chain id, connected account: ', $scope.chainId, $scope.account);

			if ($scope.redpacketId !== undefined) {
				// Random generate a (0 ~ 10000) luck number if users do not want to input one
				$scope.preGenLuckyNum = Math.floor(Math.random() * 10001);
				displayRedPacketInfo($scope.redpacketId);
			} else {
				// Random create new red packet Id
				$scope.newpacketId = web3.utils.randomHex(32).toString();

				// Retrieve all created red packets on this machine
				$scope.myRedPacketList = [];
				if (typeof(Storage) !== 'undefined') {
					const total = localStorage.getItem('TotalRedPackets') || 0;
					for (var i = 0; i < total; i++) {
						const newpacketId = localStorage.getItem('RedPacket' + i + 'Id');
						const amount = localStorage.getItem('RedPacket' + i + 'Amount');
						const quantity = localStorage.getItem('RedPacket' + i + 'Quantity');
						$scope.myRedPacketList.unshift({
							'id': newpacketId,
							'amount': amount,
							'quantity': quantity
						});
					}
				}
			}

			function getWJAllowance() {
				var deferred = $q.defer();

				if ($scope.connectedToJ() && $scope.account) {
					const wj_contract = new web3.eth.Contract(wj_ABI, wj_contract_address);
					wj_contract.methods.allowance($scope.account, redpacket_contract_address)
						.call(function (err, allowance) {
							if (!err) {
								deferred.resolve(
									web3.utils.fromWei(allowance, 'ether')
								);
							} else {
								deferred.reject(err);
							}
						});
				} else {
					deferred.resolve('---');
				}

				return deferred.promise;
			}

			function displayRedPacketInfo(redpacketId) {
				getRedPacketInfo(redpacketId).then(function(redpacketInfo){
					console.log('[redpacketInfo] Redpacket address info: ' + redpacketInfo.creator.toString());
					$scope.redpacketInfo_totalamt = redpacketInfo.total_e;
					$scope.redpacketInfo_totaln = redpacketInfo.total_n;
					$scope.redpacketInfo_leftamt = redpacketInfo.left_e;
					$scope.redpacketInfo_leftn = redpacketInfo.left_n;

					// Fill redpacket history info list here so we do not need to query redpacket info again.
					displayRedpacketOpenHistory(redpacketId);
				});
			}

			function getRedPacketInfo(redpacketId) {
				var deferred = $q.defer();
				var redpacket_contract = new web3.eth.Contract(redpacket_ABI, redpacket_contract_address);
				redpacket_contract.methods.redpackets(redpacketId).call(function (err, redpacketInfo) {
					if (!err) {
						deferred.resolve({
							created: redpacketInfo.created,
							creator: redpacketInfo.creator,
							expiry: redpacketInfo.expiry,
							total_e: web3.utils.fromWei(redpacketInfo.total_e, 'ether'),
							total_n: redpacketInfo.total_n,
							left_e: web3.utils.fromWei(redpacketInfo.left_e, 'ether'),
							left_n: redpacketInfo.left_n,
							final_e: redpacketInfo.final_e,
							final_n: redpacketInfo.final_n,
							last_seed: redpacketInfo.last_seed,
						});
					} else {
						deferred.reject(err);
					}
				});

				return deferred.promise;
			}

			function displayRedpacketOpenHistory(redpacketId) {
				// redpacket open history list
				$scope.redPacketOpenHistoryList = [];
				const packetOpenedMaxIdx = parseFloat($scope.redpacketInfo_totaln) - parseFloat($scope.redpacketInfo_leftn);
				console.log('[redpacketInfo] Redpacket open history max idx: ' + packetOpenedMaxIdx);

				for (var i = 0; i < packetOpenedMaxIdx; i++) {
					getSingleRedPacketOpenHistoryByIdx(redpacketId, i).then(function(openHistoryItem){
						console.log('[redpacketInfo] Redpacket address history opener: ' + openHistoryItem.opener.toString());
						$scope.redPacketOpenHistoryList.push({'amount': web3.utils.fromWei(openHistoryItem.amount, 'ether'), 'opener': openHistoryItem.opener.substr(0, 6) + '...'});
					});
				}
			}

			function getSingleRedPacketOpenHistoryByIdx(redpacketId, idx) {
				var deferred = $q.defer();
				var redpacket_contract = new web3.eth.Contract(redpacket_ABI, redpacket_contract_address);
				redpacket_contract.methods.inspect(redpacketId, idx).call(function (err, openHistoryItem) {
					if (!err) {
						deferred.resolve({
							amount: openHistoryItem.e,
							opener: openHistoryItem.opener,
							block_height: openHistoryItem.block_height,
						});
					} else {
						deferred.reject(err);
					}
				});

				return deferred.promise;
			}

			$scope.displayRedPacketInfo = (redpacketId) => {
				displayRedPacketInfo(redpacketId)
			}

			//////////////// add listeners /////////////////
			if (window.ethereum) {
				
				window.ethereum.on('chainChanged', function (chainId) {
					console.log("[redpacketInfo] switched to chain id: ", parseInt(chainId, 16));
					$scope.chainId = chainId;
					$scope.$apply();
					$scope.updateWJAllowance();
				});

				window.ethereum.on('accountsChanged', function (accounts) {
					console.log("[redpacketInfo] switched to account: ", accounts[0]);
					$scope.account = accounts[0];
					$scope.$apply();
					$scope.updateWJAllowance();
				});

				window.ethereum
					.request({ method: 'eth_chainId' })
					.then((chainId) => {
						console.log(`[redpacketInfo] got chain id: ${parseInt(chainId, 16)}`);
						$scope.chainId = chainId;
						const account = window.ethereum.selectedAddress;
						$scope.account = account;
						console.log("[redpacketInfo] connected account is: ", account);
						$scope.$apply()
						$scope.updateWJAllowance();
					})
					.catch((error) => {
						console.error(`[redpacketInfo] error fetching chainId: ${error.code}: ${error.message}`);
					});
			}
		};

		$scope.init();

		//////////////////////////////////////////////////////////////////////////////
		// helper functionalities NOT in page scope                                 //
		//////////////////////////////////////////////////////////////////////////////
		function hex2a(hexx) {
			var hex = hexx.toString(); // force conversion
			var str = '';
			for (var i = 0; i < hex.length; i += 2)
				str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
			return str;
		}

	});

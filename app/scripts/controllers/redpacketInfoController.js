angular.module('ethExplorer')
	.controller('redpacketInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

		var web3 = $rootScope.web3;

		//////////////////////////////////////////////////////////////////////////////
		// write functionalities in page scope                                      //
		//////////////////////////////////////////////////////////////////////////////

		$scope.redpacketWjApproveDialog = function ()
		{
			$scope.redpacketAmount = $('#new-redpacket-amount')[0].value;
			$('#approve-wj-to').text(redpacket_contract_address);

			$('#dialog-approve-wjoule').modal({keyboard:false, backdrop:'static'});
			$('#dialog-approve-wjoule').modal('show');
		}

		$scope.redPacketWjApproveConfirm = function (redpacketAmount)
		{
			console.log('Approve redpacketAmount: ' + redpacketAmount);

			const DIALOG_TITLE = '红包授权WJ';
			var inputError = '';

			// Validate input
			if (Number.isNaN(parseFloat(redpacketAmount)) || parseFloat(redpacketAmount) < 0 || parseFloat(redpacketAmount) > 2000) {
				inputError += '授权红包大小非法: 红包大小必须在0~2000WJ之间用于授权。';
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
							.then(handlerShowRct(DIALOG_TITLE));
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

			console.log('Dialog title: ' + DIALOG_TITLE);
			console.log('Packet ID: ' + newpacketId);
			console.log('Packet amount: ' + amount);
			console.log('Packet quantity: ' + quantity);
			
			// Input validation
			if (parseFloat(amount) < 0 || parseFloat(amount) > 2000) {
				inputError += '红包大小非法: 输入红包大小必须在0~2000WJ之间。';
			}

			if (parseFloat(quantity) < 0 || parseFloat(quantity) > 500) {
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
			redpacketClipboardValue += '红包大小：' + document.getElementById('newpacket-copy-amount').innerHTML + '\n \n';
			redpacketClipboardValue += '红包个数：' + document.getElementById('newpacket-copy-quantity').innerHTML;
			console.log('Clipboard value: ' + redpacketClipboardValue);
			
			navigator.clipboard.writeText(redpacketClipboardValue);
		}

		$scope.openRedPacket = function ()
		{
			const DIALOG_TITLE = '打开红包';
			const redpacketId = $scope.redpacketId;
			const luckynum = $('#open-redpacket-luckynum')[0].value;
			var inputError = '';

			console.log('Dialog title: ' + DIALOG_TITLE);
			console.log('Packet ID: ' + redpacketId);
			console.log('Lucky Number: ' + luckynum);

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
				const redpacket_contract = new web3.eth.Contract(redpacket_ABI, redpacket_contract_address);

				redpacket_contract.methods.open(redpacketId, luckynum).estimateGas({from: connectedAccount}, (err, gas) => {
					if (!err) {
						redpacket_contract.methods.open(redpacketId, luckynum)
							.send({from: connectedAccount}, handlerShowTx(DIALOG_TITLE))
							.then(handlerShowRct(DIALOG_TITLE));
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
			$scope.connectedToJ = window.ethereum?.chainId === '0xe52';
			
			console.log($scope.redpacketId);
			console.log('ChainId: ' + $scope.connectedToJ);

			if ($scope.redpacketId !== undefined) {
				// Random generate a (0 ~ 10000) luck number if users do not want to input one
				$scope.preGenLuckyNum = Math.floor(Math.random() * 10001);
				displayRedPacketInfo($scope.redpacketId);
			} else {
				// Random create new red packet Id
				$scope.newpacketId = web3.utils.randomHex(32).toString();
			}

			function displayRedPacketInfo(redpacketId) {
				getRedPacketInfo(redpacketId).then(function(redpacketInfo){
					console.log('Redpacket address info: ' + redpacketInfo.creator.toString());
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
				console.log('Redpacket open history max idx: ' + packetOpenedMaxIdx);

				for (var i = 0; i < packetOpenedMaxIdx; i++) {
					getSingleRedPacketOpenHistoryByIdx(redpacketId, i).then(function(openHistoryItem){
						console.log('Redpacket address history opener: ' + openHistoryItem.opener.toString());
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

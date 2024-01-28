angular.module('ethExplorer')
	.controller('redpacketInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

		var web3 = $rootScope.web3;

		//////////////////////////////////////////////////////////////////////////////
		// write functionalities in page scope                                      //
		//////////////////////////////////////////////////////////////////////////////

		$scope.redpacketWjApproveDialog = function ()
		{
			$scope.redPacketContractAddr = redpacket_contract_address;
			$scope.redpacketAmount = $('#new-redpacket-amount')[0].value;

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
				inputError += '授权红包大小非法: 红包大小必须在0~2000J之间用于授权。';
			}

			if (inputError.length > 0) {
				dialogShowTxt(DIALOG_TITLE, inputError);
				return;
			}

			if (window.ethereum && window.ethereum.isConnected()) {
				web3.setProvider(window.ethereum);
				const connectedAccount = window.ethereum.selectedAddress;

				const e = web3.utils.toWei(redpacketAmount);
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
				inputError += '红包大小非法: 输入红包大小必须在0~2000J之间。';
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

				redpacket_contract.methods.create(newpacketId, quantity, amount).estimateGas({from: connectedAccount}, (err, gas) => {
					if (!err) {
						redpacket_contract.methods.create(newpacketId, quantity, amount)
							.send({from: connectedAccount}, handlerShowTx(DIALOG_TITLE))
							.then(handlerShowRct(DIALOG_TITLE));
					} else {
						dialogShowTxt(DIALOG_TITLE, '错误：无法评估gas：' + err.message); //展示合约逻辑报错
					}
				});
			}
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
			console.log($scope.redpacketId);

			if ($scope.redpacketId !== undefined) {
				// Random generate a (0 ~ 10000) luck number if users do not want to input one
				$scope.preGenLuckyNum = Math.floor(Math.random() * 10001);
			} else {
				// Random create new red packet Id
				$scope.newpacketId = web3.utils.randomHex(32).toString();
			}


			function getRedPacketInfo(redpacketId) {
				var deferred = $q.defer();

				// TODO
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

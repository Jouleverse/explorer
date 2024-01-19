angular.module('ethExplorer')
	.controller('redpacketInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

		var web3 = $rootScope.web3;

		//////////////////////////////////////////////////////////////////////////////
		// write functionalities in page scope                                      //
		//////////////////////////////////////////////////////////////////////////////

		$scope.createRedPacket = function (redpacketId) 
		{
			const DIALOG_TITLE = '创建红包';

			// TODO
			
		}

		$scope.openRedPacket = function (redpacketId)
		{
			const DIALOG_TITLE = '打开红包';

			// TODO

		}

		//////////////////////////////////////////////////////////////////////////////
		// read functionalities in page scope                                       //
		//////////////////////////////////////////////////////////////////////////////
		$scope.init = function()
		{
			$scope.redpacketId = $routeParams.redpacketId; // must in format 0x...
			console.log($scope.redpacketId);

			if ($scope.redpacketId !== undefined) {

				// TODO 抢红包

			} else {
				// TODO 创建红包
				$scope.newPacketId = web3.utils.randomHex(32).toString();
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

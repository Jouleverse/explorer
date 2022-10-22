angular.module('ethExplorer')
    .controller('mainCtrl', function ($rootScope, $scope, $location) {

	var web3 = $rootScope.web3;
	var maxBlocks = 15; // TODO: into setting file or user select
		// XXX reduced from 50 to 15 to speed up the page loading.
		
	var blockNum = $scope.blockNum = parseInt(web3.eth.blockNumber, 10);
	if (maxBlocks > blockNum) {
	    maxBlocks = blockNum + 1;
	}

	// get latest N blocks
	$scope.blocks = [];
	for (var i = 0; i < maxBlocks; ++i) {
		var blockInfo = web3.eth.getBlock(blockNum - i);
		blockInfo.time_localestring = new Date(blockInfo.timestamp * 1000).toLocaleString('zh-CN', { timezone: 'UTC', timeZoneName: 'short' });

	    $scope.blocks.push(blockInfo);
	}

    });

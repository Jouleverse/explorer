'use strict';

angular.module('jouleExplorer', ['ngRoute','ui.bootstrap'])

// 1. 使用factory在config阶段之前注册服务
.factory('web3Initializer', function($q, $http) {
    // 使用 $http 异步加载 .rpc.txt 文件
    function loadRpcConfig() {
        return $http.get('.rpc.txt')
			.then(function(response) {
				var content = response.data;
				console.log(content);
				// 处理空内容
				if (!content || (typeof content === 'string' && content.trim() === '')) {
					console.log('.rpc.txt is empty');
					return null;
				}

				// 如果已经是对象（如JSON数组），直接返回
				if (typeof content !== 'string') {
					return content;
				}

				// 处理字符串内容
				try {
					// 尝试解析为JSON
					return JSON.parse(content);
				} catch (e) {
					console.warn('Failed to parse .rpc.txt file', e);
					return null;
				}
			})
            .catch(function(error) {
                console.warn('Failed to load .rpc.txt file', error);
                return null;
            });
    }

    // 初始化 Web3
    function initializeWeb3(config) {
        var web3 = new Web3();
        var PORT = 8503;
        var rpc_service = `https://rpc.jnsdao.com:${PORT}`;

        // 决定最终使用的RPC
        var finalRpc = rpc_service;
        if (config) {
            if (Array.isArray(config) && config.length > 0) {
                finalRpc = config[Math.floor(Math.random() * config.length)];
            } else if (typeof config === 'string' && config.trim() !== '') {
                finalRpc = config;
            }
        } else {
            console.log('Using default RPC service as no valid configuration was found');
        }

        // 设置provider
        web3.setProvider(new web3.providers.HttpProvider(finalRpc));
        console.log('Selected RPC: ', finalRpc);
        return web3;
    }

    // 返回一个 Promise，当 Web3 初始化完成后解析
    return {
        getWeb3: function() {
            var deferred = $q.defer();

            loadRpcConfig().then(function(config) {
                var web3 = initializeWeb3(config);
                deferred.resolve(web3);
            });

            return deferred.promise;
        }
    };
})

// 2. 配置路由
.config(function($routeProvider, $locationProvider) {
    // 修复哈希前缀问题
    $locationProvider.hashPrefix('');

        $routeProvider.
            when('/', {
                templateUrl: 'views/main.html',
                controller: 'mainCtrl'
            }).
            when('/block/:blockId', {
                templateUrl: 'views/blockInfos.html',
                controller: 'blockInfosCtrl'
            }).
            when('/tx/:transactionId', { // make it compatible with metamask
                templateUrl: 'views/transactionInfos.html',
                controller: 'transactionInfosCtrl'
            }).
            when('/address/:addressId', {
                templateUrl: 'views/addressInfo.html',
                controller: 'addressInfoCtrl'
            }).
            when('/did/:jnsId', {
                templateUrl: 'views/addressInfo.html',
                controller: 'addressInfoCtrl'
            }).
            when('/cryptojunks', {
                templateUrl: 'views/junksInfo.html',
                controller: 'junksInfoCtrl'
            }).
            when('/cryptojunks/page/:pageId', {
                templateUrl: 'views/junksInfo.html',
                controller: 'junksInfoCtrl'
            }).
            when('/cryptojunks/page/:pageId/id/:junkId', {
                templateUrl: 'views/junksInfo.html',
                controller: 'junksInfoCtrl'
            }).
            when('/redpacket/:redpacketId', {
                templateUrl: 'views/redpacketInfo.html',
                controller: 'redpacketInfoCtrl'
            }).
            when('/redpacket', {
                templateUrl: 'views/redpacketInfo.html',
                controller: 'redpacketInfoCtrl'
            }).
            when('/jns/:jnsId', {
                templateUrl: 'views/jnsInfo.html',
                controller: 'jnsInfoCtrl'
            }).
            when('/jnsvote/', {
                templateUrl: 'views/jnsVoteInfo.html',
                controller: 'jnsVoteInfoCtrl'
            }).
            otherwise({
                redirectTo: '/'
            });

        // use the HTML5 History API. needs base href and server-side rewrite.
        $locationProvider.html5Mode(false); // FIXME use # for pure static deployment
    })

// 3. 运行阶段
.run(function($rootScope, web3Initializer) {
	// 初始化 web3 并设置到全局
	web3Initializer.getWeb3().then(function(web3) {
		$rootScope.web3 = web3;
		window.web3 = web3; // 注入到全局供调试使用

		// 检查连接状态
		web3.eth.net.isListening()
			.then(function(isConnected) {
				if (!isConnected) {
					// 使用 $timeout 确保在 Angular 的 digest 周期内执行
					$timeout(function() {
						dialogModalShowTxt('无法连接到区块链网络', '无法连接到RPC服务，请检查你的网络连接是否畅通');
					});
				}
			});
	});

	// 单例模式
	var _web3 = null;

	Object.defineProperty($rootScope, 'web3', {
		get: function() {
			if (!_web3) {
				console.warn('web3 accessed before initialization');
				_web3 = web3Initializer.getWeb3(); // 惰性初始化
			}
			return _web3;
		},
		set: function(value) {
			_web3 = value;
			window.web3 = value; // 保持全局引用
		},
		configurable: true,
		enumerable: true
	});

});

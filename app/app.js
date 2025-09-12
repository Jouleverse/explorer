'use strict';

angular.module('jouleExplorer', ['ngRoute','ui.bootstrap'])

// 1. 使用factory在config阶段之前注册服务
.factory('web3Initializer', function() {
    // 同步加载.RPC文件
    var rpcConfig = null;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '.rpc.txt', false); // 同步请求
    xhr.send();

    if (xhr.status === 200) {
        try {
            rpcConfig = JSON.parse(xhr.responseText);
        } catch (e) {
            console.warn('Failed to parse .RPC file', e);
        }
    }

    var web3 = new Web3();
    var hostname = location.hostname;
    var PORT = 8503;
    var rpc_service = `https://rpc.jnsdao.com:${PORT}`;

    // 决定最终使用的RPC
    var finalRpc = rpc_service;
    if (rpcConfig) {
        if (Array.isArray(rpcConfig) && rpcConfig.length > 0) {
            finalRpc = rpcConfig[Math.floor(Math.random() * rpcConfig.length)];
        } else if (typeof rpcConfig === 'string') {
            finalRpc = rpcConfig;
        }
    }

    // 设置provider
    web3.setProvider(new web3.providers.HttpProvider(finalRpc));
    console.log('Selected RPC: ', finalRpc);
    return web3;
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
    $rootScope.web3 = web3Initializer;
    window.web3 = web3Initializer; //XXX inject it to console for debugging

    // 检查连接状态
    web3Initializer.eth.net.isListening()
        .then(function(isConnected) {
            if (!isConnected) {
                dialogModalShowTxt('无法连接到区块链网络', '无法连接到RPC服务，请检查你的网络连接是否畅通');
            }
        });

});

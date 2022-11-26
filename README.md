# 元码链区块浏览器

由blockcoach.com curated，基于etherparty/explorer。

## Original License

GPL (see LICENSE)

## Develop

前置准备：
- 运行本地geth节点，配置rpc服务（且允许CORS）监听127.0.0.1:8501

开始：
1. git clone the repo.
2. ./serve.sh
3. 浏览器打开 http://localhost:8000


## Change Log

blockcoach curated 2022

DONE:
1. 中文翻译，及一些信息的增删（比如废弃的miner信息）
2. /transaction 改为 /tx 以与metamask更好地兼容
3. 解决 # 和 html5Mode 问题
	- 旧的解决方法（无法适应更广泛的部署比如github pages）：打开html5Mode，通过nginx server-side rewrite来消除url中的#
	- 新的解决方法（可以适于github pages及独立服务器）：仍使用带有#的url形式，但是使用自定义404页面来完成对非# url（会触发404）自动加#跳转，以匹配metamask的使用
4. 添加浏览上一区块
5. 完全去除对外部js的依赖，尤其是一些访问不畅通的比如googleapis
6. 支持nginx proxy 8501 to 8502
7. Fixed: 打开tx/等页面时，仍然会执行mainController中的循环读取区块列表的代码，造成加载速度慢。Root Cause: searchbox在其他页面也出现，而它bind到了main controller. Fix: 重写searchbox.
8. 支持独立的JNS页面和url /#/jns/{name}.j
9. 在JNS页面支持连接metamask和give()
10. 在address info页面支持连接metamask，如果连接的是JNS owner，那么就会出现“🔨”图标来mint JNS

TODO:
1. 在区块信息插入clique的signer信息（以取代miner）
2. searchbox遗留问题：无法区分搜索 交易 和 区块哈希（都是0x...且无法通过长度区分？）



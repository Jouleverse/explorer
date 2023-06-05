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

...更多histroy待参考git log补充...

2023.2.7
- fix bug: +紫V输入npub地址后不能弹出metamask
- improve: 点击右上角已连接的地址可以直接跳转到该地址的钱包页面

2023.2.8
- fix: 一些文案，首页网络状态改为数据状态；钱包地址页改为燃料余额；网络可识别时不显示数字ID而是显示名称Joule Mainnet/Testnet
- improve: 把mintJNS从地址页移动到JNS信息页，流程优化为先查，不存在则直接mint所查询的名字，不需要再次输入（且避免输入错误）

2023.2.10
- improve: 已链接账户地址若绑定JNS会在右上角显示JNS域名而不是0x...地址了
- improve: 元码链网络不是显示数字或中英文（困惑），显示一个FlyingJ图标
- improve: +紫V 按钮 改成一个 紫色对勾，更美观些

2023.2.13
- improve: 燃料余额 => 能量余额

2023.2.20
- improve: use dweb.link to show ipfs content of JNSVote governance proposal.

2023.2.27
- fix: use w3s ipfs gateway instead of dweb.link.
- improve: 在JNSVote页面展示治理徽章
- fix: refresh jnsvote POAP
- improve: 增加投票进度展示

2023.3.2
- improve: jnsvote展示投票资格要求，以及倒计时

2023.3.13
- improve: jnsvote增加了当前已连接账户的显示，减少困惑（未连接时只能看到无POAP徽章）
- fix: jnsvote对账户切换的数据刷新显示问题
- improve: 投票资格要求，可以根据账户是否具备投票要求条件动态刷新，方便用户判断自己是否可以投票
- improve: 现在可以展示投票结果（通过/未通过）了，且区分V1规则和V2规则

2023.3.30
- fix: great refactoring work 3/13-3/30
```
/* refactored-20230330
 * 1. 全面重写web3调用，升级为兼容web3.js 1.x
 * 2. 使用selectedAddress作为connectedAccount
 * 3. if 先正常逻辑，后出错逻辑
 * 4. 使用 => for inline function handlers
 * 5. 写操作（send tx）先estimateGas（可以检查合约逻辑报错，相当于dry-run）再send
 * 6. 提交上链显示tx hash；tx成功显示receipt上链成功，流程闭环
 * 7. 采用h5 dialog替代alert，更好地兼容mobile浏览器
 * 8. 补齐错误处理逻辑分枝
 */
```
- improve: 完善搜索错误提示
- fix: jnsvote顶部展示当前连接地址的投票资格情况

2023.4.28
- fix ipfs gw & poap alignment

2023.5.24
- improve: 首页增加一键添加Jouleverse Mainnet的功能按钮，且优化了switch/add network的UX
- fix: Joule Mainnet => Jouleverse Mainnet
- fix: support another error.code for MetaMask mobile!

2023.5.25
- improve: 修改两处文案。钱包地址 改为 链地址

2023.6.6
- improve: 实现 /did/:jnsId ；搜索jns域名将跳转至该页面，而不是此前的 /jns/:jnsId （在profile页面点击jns会跳转/jns/:jnsId 只有这个入口）
- fix: search jns => /jns/:jnsId => 点击数字身份 => DID profile页。另一入口：右上角，当绑定JNS后，点击会跳转DID页，而不是地址页


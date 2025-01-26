# Jouleverse区块链浏览器

由blockcoach curated，基于etherparty/explorer。

## Original License

GPL (see LICENSE)

## Develop

前置准备：
- 安装bower

<!-- 运行本地geth节点，配置rpc服务（且允许CORS）监听127.0.0.1:8501 -->

开始：
1. git clone the repo
2. bower install 安装依赖包
3. git checkout core && git pull 拉取核心
4. ./serve.sh [A] 或者 http-server app/ [B]
5. 浏览器打开 http://localhost:8000 [A] 或者 :8080 [B]

分支说明：
```
-- core contribs (核心贡献) --> core --\
                                        +>===> master ===> 
-- ecosystem contribs (生态贡献) ------/

```
因此，core分支是master分支的子集。开发核心功能，需先发布到core分支后，再merge到master。

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

...更多history待参考git log补充...

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

2023.6.25
- improve: Jouleverse Mainnet => Joule Mainnet, inspired by Optimism => OP Mainnet

2023.6.28
- new feature: 支持wrapper Joule的显示以及unwrap操作

2023.6.29
- new feature: 支持显示well known地址的tag（区块详情页面 & 交易详情页面）

2023.7.3
- fix: wJ unwrap数字与持有量的比较问题 '2' > '100' 的问题
- improve: 仅在自己的页面能看到wJ 的unwrap按钮。查看他人页面看不到该按钮。

2023.7.18
- fix: 判断是否JTI admin比较错了

2023.9.26
- fix: logo; 使用文字，不用logo，区分主网/测试网；添加网络Joule Mainnet => Jouleverse Mainnet

2023.12.2
- improve: 增加合约工具 tools/contractx

2023.12.7
- fix: 更改options gas limit从区块limit 300万下调至100万，以使得领红包时评估gas低于新手空投0.017J
- improve: 给tools/contractx增加estimateGas和报错功能，方便调试错误

2023.12.23
- improve: tools/contractx增加 合约地址 显示和链接到explorer
- improve: tools/contractx增加 节点PoS（多签）

2023.12.29
- new: tools/contractx增加支持CryptoJunks
- fix: tools/contractx disable Value inputs
- fix: rpc 8502 (需要rpc防火墙开端口，方便本地调试)
- new: profile页面支持CryptoJunks显示
- fix: 删除页面输入地址和私钥，改为提示信息
- fix: footer
- new: /cryptojunks 新页面

2023.12.30
- fix: /cryptojunks 修改布局，优化分页，提升加载速度，且满足需求“查找未被mint的junk”
- fix: /cryptojunks 打坏的图片，固定宽高，保证排版正确
- improve: 在页面底部显示当前已连接的钱包地址，以方便手机版用户检查是否连接了正确的钱包
- improve: [?] 跳转到chainlist.org:3666
- improve: 【登记npub公钥】按钮文案缩短为【npub】

2024.1.1
- fix: broken junks display in profile page should keep in square

2024.1.2
- improve: /cryptojunks 增加“金色铭文”标记
- new: /cryptojunks 鉴赏功能增加 单独的铭文页 e.g. /page/10/id/1002
- improve: profile page 给cryptojunks增加了链接，直接跳转到对应铭文页，方便快速检查自己持仓是否是金色铭文
- improve: /cryptopunks 全加载前 提示 loading... ，告知用户耐心等待数据加载

2024.1.6
- improve: /cryptojunks 鉴定页，打坏的灰色铭文，除编号标灰外，背景色也改为棕红色，以示区分

2024.1.8
- improve: /cryptojunks 鉴定页，打金标方法优化提速
- new: profile 个人地址页也可以打金标（金色铭文标记）/坏标——只有打完不能burn之后才能做到
- new: profile页 & 鉴定页 头像右上角增加稀缺度标志：传奇(<= 9)；绝品(<= 24)；珍品(<= 88)。
- improve: /cryptojunks 增加 金标/灰标 注释
- new: statistics on 鉴定页

2024.1.9
- improve: refine some texts
- improve: DID profile页，藏品列表，如果没有，隐藏之。优化显示。而且JNS如果没有，则不会再加载JNSDAOV和JNSVote，节省网络开销。
- improve: 1. unwrap对话框：1.1 优化文案 1.2 扩大输入框 1.3 增加勾选是否保留输入框内容选项；2. 增加二次确认对话框，进行再次确认，避免误操作；3. 改进表述，对扣减WJ释放J进行更准确表达。

2024.1.10
- improve: rpc_service hostname自动取主机域名
- new: 新增错版铭文专页 1001-1003
- fix: fix some links lacking of '/#' prefix

2024.1.11
- new: add JNS contract to tools/contractx
- new: 新手加油 按钮。前置条件：1. 获得JTI认证；2. 地址gas余额为零。新手找组长给他加油。
- remove: 旧版本空投 0.017 J 入口

2024.1.13
- new: /cryptojunks 鉴定页 增加 三类稀缺款 专页

2024.1.17
- fix: JNSDAO V 在持有JNS时应该展示
- improve: WJ unwrap对话框：1. 增强警告信息；2. 限额100 WJ。提示超额操作请使用合约工具进行，慎重操作。

2024.1.21
- new: 合约工具增加源码下载功能

2024.1.21
- new: 链上红包

2024.3.1
- new: 向JNS打赏WJ

2024.3.11
- improve: 交易详情页，增加“交易哈希”字样，并把区块哈希下移，以免误将区块哈希当作交易哈希
- improve: 区块详情页，增加“区块哈希”字样
- improve: 增加若干well known合约地址的显示

2024.3.15
- improve: use wei(维) 作为最小能量单位

2024.3.19
- improve: 合约工具支持提示合约是否有唯一控制者
- new: 合约工具增加BoredApe (not in branch:core)

2024.3.21
- new: 合约工具增加CJDAO多签

2024.3.31
- merge contrib: 合并生态贡献：BoredApe在地址页的展示（负责人：楼兰渔夫） (not in branch:core)

2024.4.9
- use branch:core
- improve: README开发流程，增加切换为core。先开发core feature，然后再merge to master.
- improve: 地址页，wei energy 简化为 wei
- improve: nginx config example for standalone deployment
- fix: use Jouleverse instead of Jouleverse Mainnet, for better compatibility while click to add network (e.g. imtoken)
- use rev: @footer of index.html, starting from 0.10.100 from now on 每次发布都增加这个版本号（遵从semantic versioning）

2024.6.10
- new: contract/toolx, add timelock core and timelock eco
- release 0.10.101

2024.6.19
- new: tools/contractx: encode & show calldata
- new: tools/contractx: dryrun
- release 0.10.102

2024.6.29
- new: planet show in did page.
- new tools/contractx: planet & jti2config
- improve: did page, add planet to top. and, bound jns can be clicked to jump to did page.
- improve: did page, jns list to compact list show.
- release 0.10.103

2024.7.2
- fix: contract tool: owner address 修正
- improve: contract tool: ownertag 更好公示控制者身份
- release 0.10.104
- new: contract tool: jti2 identity support
- new: did page: jti2 show
- release 0.10.104

2024.7.23
- improve: new version of jti2
- release 0.10.105

2024.7.25
- improve: delete jti v1
- release 0.10.106

2025.1.24
- new: add support to show JVCore and POP Badge for on-chain checkin

2025.1.25
- fix: show JVCore #id
- release: 0.10.107

2025.1.26
- new: abi-decode tx input data. contributor: Jeff.
- release: 0.10.108


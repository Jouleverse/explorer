# EthExplorer (In Progress)

![EthExplorer Screenshot](http://i.imgur.com/NHFYq0x.png)

##License

GPL (see LICENSE)

##Installation

Install [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git "Git installation") if you haven't already

Clone the repo

`git clone https://github.com/etherparty/explorer`

Download [Nodejs and npm](https://docs.npmjs.com/getting-started/installing-node "Nodejs install") if you don't have them

Start the program. All dependencies will be automatically downloaded

`npm start`

Then visit http://localhost:8000 in your browser of choice. You might get an error message:

`geth --rpc --rpccorsdomain "http://localhost:8000"`

Install [geth](https://github.com/ethereum/go-ethereum/wiki/Building-Ethereum "Geth install") if you don't already have it, then run the above command.

Then refresh the page in your browser 

## Change Log

blockcoach curated 2022

DONE:
1. 中文翻译，及一些信息的增删（比如废弃的miner信息）
2. /transaction 改为 /tx 以与metamask更好地兼容
3. 解决 # 和 html5Mode 问题
4. 添加浏览上一区块
5. 完全去除对外部js的依赖，尤其是一些访问不畅通的比如googleapis
6. 支持nginx proxy 8501 to 8502

TODO:
1. 在区块信息插入clique的signer信息（以取代miner）
2. 打开tx/等页面时，仍然会执行mainController中的循环读取区块列表的代码，造成加载速度慢



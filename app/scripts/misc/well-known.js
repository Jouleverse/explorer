const __WELL_KNOWN_ADDRESSES = {
	"0xda143f617808db2e223a643104cceb91ec6e1c35": "空投合约",
	"0x045b997b5e05df9795985ab9e6720d94557255be": "Flying J 合约",
	"0xf8abf36bb2dc525b1e566d6b42f6fd1bb2035b89": "JNS 合约",
	"0x9f57e77585e05ca7def98f3171f448fc8eb13a83": "JNS DAO nostr加V登记合约",
	"0xef1f38e95dd7f4fb564535f9317ecb3bd419da50": "JNS DAO 投票合约",
	"0x4eF599b6E39D950D6Ddbd830fF5f95e06770C1B3": "JNSDAO多签合约",
	"0x826971d988d7d86fdc9062a3f63e7b18d32bc8eb": "JTI 合约",
	"0x7fba9bb966189db8c4fe33b7bf67bfa24203c6ad": "wJ 合约",
	"0x0dc46592ACf76e149B108BDe2E56D8429a2D6046": "红包合约",
	"0x3B717119878E2db1AA7df46F5AdcF9766A01706F": "创世金库",
	"0x50fe8f7cf122CFa689A634510C1b869E790f9760": "ecofund1",
	"0xDb11694Ed05Db4a6230BDFd0914094FE7CE73646": "节点PoS多签合约",
	"0xB17b6812f3Ed0eb0Df6e9F1D308C975B5daa8dC3": "投票权PoS多签合约",
};

function __getAddressTag(address) {
	if (address !== undefined) {
		const lc_address = address.toLowerCase();
		return __WELL_KNOWN_ADDRESSES[lc_address] === undefined ? address : __WELL_KNOWN_ADDRESSES[lc_address];
	}
}

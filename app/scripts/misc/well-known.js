const __WELL_KNOWN_ADDRESSES = {
	"0xda143f617808db2e223a643104cceb91ec6e1c35": "空投合约",
	"0x045b997b5e05df9795985ab9e6720d94557255be": "Flying J 合约",
	"0xf8abf36bb2dc525b1e566d6b42f6fd1bb2035b89": "JNS 合约",
	"0x9f57e77585e05ca7def98f3171f448fc8eb13a83": "JNS DAO nostr加V登记合约",
	"0xef1f38e95dd7f4fb564535f9317ecb3bd419da50": "JNS DAO 投票合约",
	"0x826971d988d7d86fdc9062a3f63e7b18d32bc8eb": "JTI 合约",
	"0x7fba9bb966189db8c4fe33b7bf67bfa24203c6ad": "wJ 合约",
};

function __getAddressTag(address) {
	if (address !== undefined) {
		const lc_address = address.toLowerCase();
		return __WELL_KNOWN_ADDRESSES[lc_address] === undefined ? address : __WELL_KNOWN_ADDRESSES[lc_address];
	}
}

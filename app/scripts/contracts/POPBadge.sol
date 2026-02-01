// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts@5.1.0/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts@5.1.0/utils/Base64.sol";
import "@openzeppelin/contracts@5.1.0/utils/Strings.sol";

contract POPBadge is ERC721Enumerable {
    using Strings for uint256;

    uint256 private _tokenIdCounter;

    struct POPInfo {
        uint256 jvCoreTokenId;       // 关联的 JVCore NFT ID
        uint256 checkInBlockNumber;  // 签到时的区块高度
        uint256 checkInTimestamp;    // 签到时的时间戳
    }

    mapping(uint256 => POPInfo) private _popInfo;

    constructor() ERC721("POPBadge", "POP") {}

    // Mint POP 徽章
    function mint(address to, uint256 jvCoreTokenId) public {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter += 1;
        _safeMint(to, tokenId);

        _popInfo[tokenId] = POPInfo(jvCoreTokenId, block.number, block.timestamp);
    }

    // 根据 tokenId 查询徽章信息
    function getPOPInfo(uint256 tokenId) public view returns (POPInfo memory) {
        _requireOwned(tokenId); // 使用 _requireOwned 检查 tokenId 是否存在
        return _popInfo[tokenId];
    }

    // 生成 Token URI
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId); // 使用 _requireOwned 检查 tokenId 是否存在

        string memory svg = _generateColorSVG(keccak256(abi.encodePacked(tokenId, _popInfo[tokenId].jvCoreTokenId.toString(), _popInfo[tokenId].checkInBlockNumber.toString(), _popInfo[tokenId].checkInTimestamp.toString())));

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "POP Badge #', tokenId.toString(), '",',
                        '"description": "Proof of Presence Badge",',
                        '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
                        '"coreId": ', _popInfo[tokenId].jvCoreTokenId.toString(), ',',
                        '"checkInBlockNumber": ', _popInfo[tokenId].checkInBlockNumber.toString(), ',',
                        '"checkInTimestamp": ', _popInfo[tokenId].checkInTimestamp.toString(),
                        '}'
        )
        )
        )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    // 生成彩色 SVG
    function _generateColorSVG(bytes32 random) private pure returns (string memory) {
        string memory color = string(abi.encodePacked("#", _toHexString(random[0]), _toHexString(random[1]), _toHexString(random[2])));

        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="', color, '"/></svg>'
        )
        );
    }

    // 将字节转换为十六进制字符串
    function _toHexString(bytes1 b) private pure returns (string memory) {
        return string(abi.encodePacked(_toHexChar(uint8(b) >> 4), _toHexChar(uint8(b) & 0x0f))); // 显式转换为 uint8
    }

    // 将半字节转换为十六进制字符
    function _toHexChar(uint8 b) private pure returns (bytes1) {
        if (b < 10) return bytes1(b + 0x30);
        else return bytes1(b + 0x57);
    }
}

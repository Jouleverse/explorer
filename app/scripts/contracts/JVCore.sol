// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts@5.1.0/access/Ownable.sol";
import "@openzeppelin/contracts@5.1.0/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts@5.1.0/utils/Base64.sol";
import "@openzeppelin/contracts@5.1.0/utils/Strings.sol";
import "./POPBadge.sol"; // 导入 POPBadge 合约

contract JVCore is ERC721Enumerable, Ownable {
    using Strings for uint256;

    uint256 public expireDuration; // 过期时长（以秒为单位）
    uint256 public minCheckInInterval; // 最小打卡间隔时间（以秒为单位）
    uint256 private _tokenIdCounter;
    POPBadge public popBadge; // POPBadge 合约实例

    struct CheckInInfo {
        uint256 lastCheckInTime;   // 最后一次签到的时间戳
        uint256 lastCheckInBlock;  // 最后一次签到的区块高度
        uint256 popCount;          // 签到次数
    }

    mapping(uint256 => CheckInInfo) private _checkInInfo;

    event CheckIn(uint256 indexed tokenId, uint256 timestamp, uint256 blockNumber);
    event Revoked(uint256 indexed tokenId, address indexed owner);
    event ExpireDurationUpdated(uint256 newDuration, uint256 updatedAt);
    event MinCheckInIntervalUpdated(uint256 newInterval, uint256 updatedAt);

    // 构造函数，初始化 POPBadge 合约地址
    constructor(uint256 initialExpireDuration, uint256 initialMinCheckInInterval, address popBadgeAddress) ERC721("JVCore", "JVC") Ownable(msg.sender) {
        expireDuration = initialExpireDuration; // 初始化过期时长
        minCheckInInterval = initialMinCheckInInterval; // 初始化最小打卡间隔时间
        popBadge = POPBadge(popBadgeAddress); // 初始化 POPBadge 合约
    }

    // Mint NFT，限制每个地址只能持有1枚
    function mint(address to) public onlyOwner {
        require(balanceOf(to) == 0, "Address already holds a JVCore NFT");
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter += 1;
        _safeMint(to, tokenId);
    }

    // 签到功能
    function checkIn(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner of the token");
        require(block.timestamp - _checkInInfo[tokenId].lastCheckInTime >= minCheckInInterval, "Check-in too soon");

        _checkInInfo[tokenId].lastCheckInTime = block.timestamp;
        _checkInInfo[tokenId].lastCheckInBlock = block.number; // 记录区块高度
        _checkInInfo[tokenId].popCount += 1;

        // Mint 一个 POP 徽章
        popBadge.mint(msg.sender, tokenId);

        emit CheckIn(tokenId, block.timestamp, block.number);
    }

    // 检查NFT的活性状态
    function isLiveness(uint256 tokenId) public view returns (bool) {
        return block.timestamp - _checkInInfo[tokenId].lastCheckInTime <= expireDuration;
    }

    // 生成Token URI
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId); // 使用 _requireOwned 检查 tokenId 是否存在

        string memory svg = isLiveness(tokenId) ? _generateColorfulSVG() : _generateGraySVG();
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "JVCore #', tokenId.toString(), '",',
                        '"description": "JVCore NFT for Jouleverse core contributors",',
                        '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
                        '"liveness": ', isLiveness(tokenId) ? 'true' : 'false', ',',
                        '"lastCheckInTime": ', _checkInInfo[tokenId].lastCheckInTime.toString(), ',',
                        '"lastCheckInBlock": ', _checkInInfo[tokenId].lastCheckInBlock.toString(),
                        '}'
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    // 撤销NFT（仅管理员可调用）
    function revoke(uint256 tokenId) public onlyOwner {
        address owner = ownerOf(tokenId);
        _burn(tokenId); // 销毁NFT
        delete _checkInInfo[tokenId]; // 清理签到信息
        emit Revoked(tokenId, owner);
    }

    // 设置过期时长（仅管理员可调用）
    function setExpireDuration(uint256 newDuration) public onlyOwner {
        require(newDuration > 0, "Expire duration must be greater than 0");
        expireDuration = newDuration;
        emit ExpireDurationUpdated(newDuration, block.timestamp);
    }

    // 设置最小打卡间隔时间（仅管理员可调用）
    function setMinCheckInInterval(uint256 newInterval) public onlyOwner {
        require(newInterval > 0, "Min check-in interval must be greater than 0");
        minCheckInInterval = newInterval;
        emit MinCheckInIntervalUpdated(newInterval, block.timestamp);
    }

    // 生成彩色Logo SVG
    function _generateColorfulSVG() private pure returns (string memory) {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 60"><rect x="1" y="1" rx="10" ry="10" width="478" height="58" style="fill:#fff;stroke:#ffd700;stroke-width:1"/><rect rx="10" ry="10" width="120" height="60" style="fill:#ffd700"/><path style="fill:#ffd700" d="M20 0h120v60H20z"/><text x="20" y="45" style="font:48px monospace;fill:#337ab7">core</text><text x="140" y="45" style="font:48px monospace;fill:#ffd700">contributor</text></svg>';
    }

    // 生成灰色Logo SVG
    function _generateGraySVG() private pure returns (string memory) {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 60"><rect x="1" y="1" rx="10" ry="10" width="478" height="58" style="fill:#fff;stroke:#ccc;stroke-width:1"/><rect rx="10" ry="10" width="120" height="60" style="fill:#ccc"/><path style="fill:#ccc" d="M20 0h120v60H20z"/><text x="20" y="45" style="font:48px monospace;fill:#666">core</text><text x="140" y="45" style="font:48px monospace;fill:#ccc">contributor</text></svg>';
    }
}

pragma solidity ^0.5.16;

import "./SafeMath.sol";

contract Timelock {
    using SafeMath for uint;

    event NewAdmin(address indexed newAdmin);
    event NewPendingAdmin(address indexed newPendingAdmin);
    event NewDelay(uint indexed newDelay);
    event IncUsage(uint delta);
    event CancelTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature,  bytes data, uint eta);
    event ExecuteTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature,  bytes data, uint eta);
    event QueueTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature, bytes data, uint eta);

    uint public constant GRACE_PERIOD = 14 days;
    uint public constant MINIMUM_DELAY = 2 days;
    uint public constant MAXIMUM_DELAY = 30 days;

    address public admin;
    address public pendingAdmin;
    uint public delay;

    mapping (bytes32 => bool) public queuedTransactions;

    // joule budget control
    // quota available = released - used. released = block_height / MONTHLY_BLOCKS * MONTHLY_BUDGET.
    uint public MONTHLY_BUDGET;
    uint public constant MONTHLY_BLOCKS = 175200;
    uint public used; // used quota of joule

    constructor(address admin_, uint delay_, uint monthly_budget_) public {
        require(delay_ >= MINIMUM_DELAY, "Timelock::constructor: Delay must exceed minimum delay.");
        require(delay_ <= MAXIMUM_DELAY, "Timelock::constructor: Delay must not exceed maximum delay.");

        admin = admin_;
        delay = delay_;
        // set once and only once
        MONTHLY_BUDGET = monthly_budget_;
    }

    function() external payable { }

    function setDelay(uint delay_) public {
        require(msg.sender == address(this), "Timelock::setDelay: Call must come from Timelock.");
        require(delay_ >= MINIMUM_DELAY, "Timelock::setDelay: Delay must exceed minimum delay.");
        require(delay_ <= MAXIMUM_DELAY, "Timelock::setDelay: Delay must not exceed maximum delay.");
        delay = delay_;

        emit NewDelay(delay);
    }

    function acceptAdmin() public {
        require(msg.sender == pendingAdmin, "Timelock::acceptAdmin: Call must come from pendingAdmin.");
        admin = msg.sender;
        pendingAdmin = address(0);

        emit NewAdmin(admin);
    }

    function setPendingAdmin(address pendingAdmin_) public {
        require(msg.sender == address(this), "Timelock::setPendingAdmin: Call must come from Timelock.");
        pendingAdmin = pendingAdmin_;

        emit NewPendingAdmin(pendingAdmin);
    }

    // increate usage for aligning data. NOTICE: cannot decrease it.
    function incUsage(uint delta) public {
        require(msg.sender == address(this), "Timelock::incUsage: Call must come from Timelock.");
        require(delta <= available(), "Timelock::incUsage: Cannot go beyond release schedule.");
        used = used.add(delta);

        emit IncUsage(delta);
    }

    function queueTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public returns (bytes32) {
        require(msg.sender == admin, "Timelock::queueTransaction: Call must come from admin.");
        require(eta >= getBlockTimestamp().add(delay), "Timelock::queueTransaction: Estimated execution block must satisfy delay.");
        require(value == 0 || value <= available(), "Timelock::queuedTransaction: Not enough quota.");

        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        bool status = queuedTransactions[txHash];
        // do NOT queue more than once
        require(status == false, "Timelock::queueTransaction: Already queued.");

        queuedTransactions[txHash] = true;
        //if (status == false)
        used = used.add(value);

        emit QueueTransaction(txHash, target, value, signature, data, eta);
        return txHash;
    }

    function cancelTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public {
        require(msg.sender == admin, "Timelock::cancelTransaction: Call must come from admin.");

        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        bool status = queuedTransactions[txHash];
        // ensure NOT to rollback quota more than once
        require(status == true, "Timelock::cancelTransaction: Already canceled.");

        queuedTransactions[txHash] = false;
        //if (status == true)
        used = used.sub(value);

        emit CancelTransaction(txHash, target, value, signature, data, eta);
    }

    function executeTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public payable returns (bytes memory) {
        require(msg.sender == admin, "Timelock::executeTransaction: Call must come from admin.");

        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        require(queuedTransactions[txHash], "Timelock::executeTransaction: Transaction hasn't been queued.");
        require(getBlockTimestamp() >= eta, "Timelock::executeTransaction: Transaction hasn't surpassed time lock.");
        require(getBlockTimestamp() <= eta.add(GRACE_PERIOD), "Timelock::executeTransaction: Transaction is stale.");

        // ensure we have enough joule before execution
        require(value <= address(this).balance, "Timelock::executeTransaction: Not enough Joule.");

        // set false before execution to prevent re-entrancy attack vector.
        queuedTransactions[txHash] = false;

        bytes memory callData;

        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
        }

        // solium-disable-next-line security/no-call-value
        (bool success, bytes memory returnData) = target.call.value(value)(callData);

        // NO NEED to rollback quota, like used = used.add(value) when execution failed,
        // because revert tx will rollback the whole function logic
        // including queuedTransactions[txHash] = false above,
        // so it can be tried to execute again.

        require(success, "Timelock::executeTransaction: Transaction execution reverted.");

        emit ExecuteTransaction(txHash, target, value, signature, data, eta);

        return returnData;
    }

    // helper to calculate transaction hash just queued
    function getTransactionHash(address target, uint value, string memory signature, bytes memory data, uint eta) public pure returns (bytes32) {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        return txHash;
    }

    function getBlockTimestamp() internal view returns (uint) {
        // solium-disable-next-line security/no-block-members
        return block.timestamp;
    }

    function getBlockHeight() internal view returns (uint) {
        return block.number;
    }

    // calculate released joule till now
    function released() public view returns (uint) {
        return getBlockHeight().div(MONTHLY_BLOCKS).mul(MONTHLY_BUDGET);
    }

    // calculate joule quota available for use
    function available() public view returns (uint) {
        return released().sub(used);
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import {IConnext} from "./connext/IConnext.sol";
import {IERC20} from "@oz/token/ERC20/IERC20.sol";
import {SafeERC20} from "@oz/token/ERC20/utils/SafeERC20.sol";

interface IAToken {
    function POOL() external returns (address);

    function UNDERLYING_ASSET_ADDRESS() external returns (address);
}

interface IAaveLendingPool {
    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external;
}

contract FlashBag {
    using SafeERC20 for IERC20;

    // The connext contract on the origin domain
    IConnext public immutable connext;

    IERC20 public immutable DAI;
    IERC20 public immutable aDAI;
    IAaveLendingPool public aaveLendingPool;

    FlashBag public flashBagTarget;

    address public owner;

    constructor(
        IConnext connext_,
        IERC20 DAI_,
        IERC20 aDAI_
    ) {
        connext = connext_;
        DAI = DAI_;
        aDAI = aDAI_;

        owner = msg.sender;
    }

    function setTargetFlashBag(FlashBag flashBagTarget_) external {
        require(msg.sender == owner, "Not owner");

        flashBagTarget = flashBagTarget_;
    }

    /**
     * @notice User should have approved this contract to spend their aDAI
     */
    function bridgeAave(uint256 amount, uint32 destination) external {
        // get aTokens from user
        aDAI.safeTransferFrom(msg.sender, address(this), amount);

        // withdraw baseToken from aTokens
        _burnADai(amount);

        // send baseToken to another chain
        // + mint aTokens to user on that chain via xCall
        DAI.safeApprove(address(connext), amount);
        connext.xcall{value: 0}({
            _destination: destination,
            _to: address(flashBagTarget),
            _asset: address(DAI),
            _delegate: msg.sender,
            _amount: amount,
            _slippage: 30,
            _callData: abi.encodeCall(FlashBag.mintADai, (amount, msg.sender))
        });
    }

    // TODO: add modifier to only allow connext relay to call this function
    function mintADai(uint256 amount, address to) external {
        _mintADai(amount, to);
    }

    function _mintADai(uint256 amount, address to) internal {
        DAI.safeApprove(address(aaveLendingPool), amount);
        aaveLendingPool.deposit(address(DAI), amount, to, 0);
    }

    function _burnADai(uint256 amount) internal {
        aaveLendingPool.withdraw(address(DAI), amount, address(this));
    }
}

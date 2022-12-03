// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import {IConnext} from "./connext/IConnext.sol";
import {IXReceiver} from "./connext/IXReceiver.sol";
import {IERC20} from "@oz/token/ERC20/IERC20.sol";
import {SafeERC20} from "@oz/token/ERC20/utils/SafeERC20.sol";
import {aToken} from "./mocks/aToken.sol";

contract FlashBagTestnet is IXReceiver {
    using SafeERC20 for IERC20;

    // The connext contract on the origin domain
    IConnext public immutable connext;

    IERC20 public immutable TEST;
    aToken public immutable aTEST;

    FlashBagTestnet public flashBagTarget;

    address public owner;

    constructor(
        IConnext connext_,
        IERC20 TEST_,
        aToken aTEST_
    ) {
        connext = connext_;
        TEST = TEST_;
        aTEST = aTEST_;

        owner = msg.sender;
    }

    function setTargetFlashBag(FlashBagTestnet flashBagTarget_) external {
        require(msg.sender == owner, "Not owner");

        flashBagTarget = flashBagTarget_;
    }

    /**
     * @notice User should have approved this contract to spend their aDAI
     */
    function bridgeAave(uint256 amount, uint32 destination) external {
        // get aTokens from user
        // TODO: for mainnet use safeTransferFrom
        aTEST.transferFrom(msg.sender, address(this), amount);

        // withdraw baseToken from aTokens
        _burnADai(amount);

        // send baseToken to another chain
        // + mint aTokens to user on that chain via xCall
        TEST.safeApprove(address(connext), amount);
        connext.xcall{value: 0}({
            _destination: destination,
            _to: address(flashBagTarget),
            _asset: address(TEST),
            _delegate: msg.sender,
            _amount: amount,
            _slippage: 30,
            _callData: abi.encode(msg.sender)
        });
    }

    // TODO: add modifier to only allow connext relay to call this function
    /** @notice The receiver function as required by the IXReceiver interface.
     * @dev The Connext bridge contract will call this function.
     */
    function xReceive(
        bytes32 _transferId,
        uint256 _amount,
        address _asset,
        address _originSender,
        uint32 _origin,
        bytes memory _callData
    ) external returns (bytes memory) {
        address to = abi.decode(_callData, (address));
        _mintADai(to);
    }

    function _mintADai(address to) internal {
        uint256 amount = TEST.balanceOf(address(this));
        TEST.safeApprove(address(aTEST), amount);
        aTEST.mint(amount, to);
    }

    function _burnADai(uint256 amount) internal {
        aTEST.burn(amount);
    }
}

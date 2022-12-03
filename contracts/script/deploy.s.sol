// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import {Script} from "forge-std/Script.sol";

import {FlashBag, IConnext, IERC20} from "@src/FlashBag.sol";

contract Deploy is Script {
    address goerli_connext = 0xb35937ce4fFB5f72E90eAD83c10D33097a4F18D2;
    address goerli_dai = 0x75Ab5AB1Eef154C0352Fc31D2428Cef80C7F8B33;
    address goerli_adai = 0x31f30d9A5627eAfeC4433Ae2886Cf6cc3D25E772;
    address goerli_fb = 0x018B36F90BaA4A8733FE6222DE1A37604DE92eFd;

    address mumbai_connext = 0xa2F2ed226d4569C8eC09c175DDEeF4d41Bab4627;
    address mumbai_dai = 0x001B3B4d0F3714Ca98ba10F6042DaEbF0B1B7b6F;
    address mumbai_adai = 0x639cB7b21ee2161DF9c882483C9D55c90c20Ca3e;
    address mumbai_fb = 0x85E7a5d08eA04852f545894DD3f1e915980dA1E8;

    function run() external {
        vm.startBroadcast();

        // _goerliDeploy();
        // _mumbaiDeploy();

        // _setFBOnGoerli();
        // _setFBOnMumbai();

        _approveAndBridgeFromGoerliToMumbai();

        vm.stopBroadcast();
    }

    function _goerliDeploy() internal {
        new FlashBag(
            IConnext(goerli_connext),
            IERC20(goerli_dai),
            IERC20(goerli_adai)
        );
    }

    function _mumbaiDeploy() internal {
        new FlashBag(
            IConnext(mumbai_connext),
            IERC20(mumbai_dai),
            IERC20(mumbai_adai)
        );
    }

    function _setFBOnGoerli() internal {
        FlashBag(goerli_fb).setTargetFlashBag(FlashBag(mumbai_fb));
    }

    function _setFBOnMumbai() internal {
        FlashBag(mumbai_fb).setTargetFlashBag(FlashBag(goerli_fb));
    }

    function _approveAndBridgeFromGoerliToMumbai() internal {
        uint256 balance = IERC20(goerli_adai).balanceOf(address(this));

        IERC20(goerli_adai).approve(goerli_fb, type(uint256).max);
        FlashBag(goerli_fb).bridgeAave(balance / 2, 9991);
    }
}

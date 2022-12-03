// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import {Script} from "forge-std/Script.sol";

import {FlashBagTestnet, IConnext, IERC20} from "@src/FlashBagTestnet.sol";
import {aToken} from "@src/mocks/aToken.sol";

interface ITest {
    function mint(address _to, uint256 _amnt) external;
}

contract Deploy is Script {
    // =========== GOERLI ===============
    address goerli_connext = 0xb35937ce4fFB5f72E90eAD83c10D33097a4F18D2;
    address goerli_dai = 0x75Ab5AB1Eef154C0352Fc31D2428Cef80C7F8B33;
    address goerli_adai = 0x31f30d9A5627eAfeC4433Ae2886Cf6cc3D25E772;
    address goerli_test = 0x7ea6eA49B0b0Ae9c5db7907d139D9Cd3439862a1;

    address goerli_atest = 0xB666B865EEBF83C6658E3f73EACFe3eC17e67275;
    address goerli_fb = 0xa9B274d28a02385230a65b41e1E58f86e6c62030;

    // =========== MUMBAI ===============
    address mumbai_connext = 0xa2F2ed226d4569C8eC09c175DDEeF4d41Bab4627;
    address mumbai_dai = 0x001B3B4d0F3714Ca98ba10F6042DaEbF0B1B7b6F;
    address mumbai_adai = 0x639cB7b21ee2161DF9c882483C9D55c90c20Ca3e;
    address mumbai_test = 0xeDb95D8037f769B72AAab41deeC92903A98C9E16;

    address mumbai_atest = 0x117E3343d9F77dd27C55fC0932121d0387527F5D;
    address mumbai_fb = 0x018B36F90BaA4A8733FE6222DE1A37604DE92eFd;

    function run() external {
        vm.startBroadcast();

        // _goerliDeploy();
        // _mumbaiDeploy();

        // _setFBOnGoerli();
        // _setFBOnMumbai();

        _mintApproveAndBridgeFromGoerliToMumbai();

        vm.stopBroadcast();
    }

    function _goerliDeploy() internal {
        aToken aTest = new aToken("aTEST", "aTEST", IERC20(goerli_test));
        new FlashBagTestnet(
            IConnext(goerli_connext),
            IERC20(goerli_test),
            aTest
        );
    }

    function _mumbaiDeploy() internal {
        aToken aTest = new aToken("aTEST", "aTEST", IERC20(mumbai_test));
        new FlashBagTestnet(
            IConnext(mumbai_connext),
            IERC20(mumbai_test),
            aTest
        );
    }

    function _setFBOnGoerli() internal {
        FlashBagTestnet(goerli_fb).setTargetFlashBag(
            FlashBagTestnet(mumbai_fb)
        );
    }

    function _setFBOnMumbai() internal {
        FlashBagTestnet(mumbai_fb).setTargetFlashBag(
            FlashBagTestnet(goerli_fb)
        );
    }

    function _mintApproveAndBridgeFromGoerliToMumbai() internal {
        uint256 toBridge = 100 ether;

        ITest(goerli_test).mint(msg.sender, toBridge);
        uint256 testBalance = IERC20(goerli_test).balanceOf(msg.sender);
        require(testBalance > 0, "zero test balance");

        IERC20(goerli_test).approve(address(goerli_atest), toBridge);
        aToken(goerli_atest).mint(toBridge, msg.sender);

        uint256 aTestBalance = IERC20(goerli_atest).balanceOf(msg.sender);
        require(aTestBalance > 0, "zero aTest balance");

        IERC20(goerli_atest).approve(goerli_fb, toBridge);
        FlashBagTestnet(goerli_fb).bridgeAave(toBridge, 9991); // 9991 = Domain Id for mumbai testnet
    }
}

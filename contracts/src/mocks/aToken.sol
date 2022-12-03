// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import {ERC20, IERC20} from "@oz/token/ERC20/ERC20.sol";

contract aToken is ERC20 {
    IERC20 public test;

    constructor(
        string memory name_,
        string memory symbol_,
        IERC20 test_
    ) ERC20(name_, symbol_) {
        test = test_;
    }

    /// @notice user should have given set TEST token approval
    function mint(uint256 amount, address to) external {
        test.transferFrom(msg.sender, address(this), amount);
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        test.transfer(msg.sender, amount);
    }
}

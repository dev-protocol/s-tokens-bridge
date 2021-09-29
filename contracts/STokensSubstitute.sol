// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity =0.8.4;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract STokensSubstitute is ERC20, Ownable {
	constructor() ERC20("sTokens Substitute V1", "STOKENS-SUBSTITUTE-V1") {}

	function mint(address account, uint256 amount) public onlyOwner {
		_mint(account, amount);
	}

	function burn(address account, uint256 amount) public onlyOwner {
		_burn(account, amount);
	}
}

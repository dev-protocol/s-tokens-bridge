// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.4;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract BridgeToken is ERC20, Ownable {

	constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
	}

	function mint(address account, uint256 amount) public onlyOwner {
		_mint(account, amount);
	}

	function burn(address account, uint256 amount) public onlyOwner {
		_burn(account, amount);
	}
}

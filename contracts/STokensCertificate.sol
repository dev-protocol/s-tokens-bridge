// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity =0.8.4;

import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";

import "hardhat/console.sol";

contract STokensCertificate is
	ERC721EnumerableUpgradeable,
	OwnableUpgradeable
{
	function initialize() external initializer {
		__ERC721_init("sTokens Certificate V1", "STOKENS-CERTIFICATE-V1");
		__Ownable_init();
	}

	function mint(address to, uint256 tokenId) public onlyOwner {
		_mint(to, tokenId);
	}

	function burn(uint256 tokenId) public onlyOwner {
		_burn(tokenId);
	}
}

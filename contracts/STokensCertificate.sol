// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity =0.8.4;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract STokensCertificate is ERC721Upgradeable, OwnableUpgradeable {
	function initialize() external initializer {
		__ERC721_init("sTokens Certificate V1", "STOKENS-CERTIFICATE-V1");
		__Ownable_init();
	}

	function mint(address to, uint256 _tokenId) public onlyOwner {
		_mint(to, _tokenId);
	}

	function burn(uint256 _tokenId) public onlyOwner {
		_burn(_tokenId);
	}
}

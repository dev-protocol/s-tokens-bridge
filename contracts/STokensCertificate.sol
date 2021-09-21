// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity =0.8.4;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";

import "hardhat/console.sol";

contract STokensCertificate is ERC721EnumerableUpgradeable, OwnableUpgradeable {
	uint256 public tokenId;

	mapping(address => mapping(uint256 => uint256)) public sTokensCertificateId;

	function initialize() external initializer {
		__ERC721_init("sTokens Certificate V1", "STOKENS-CERTIFICATE-V1");
		__Ownable_init();
	}

	function mint(address to, uint256 _tokenId) public onlyOwner {
		tokenId += 1;
		uint256 newTokenId = tokenId;
		_mint(to, _tokenId);
		sTokensCertificateId[to][_tokenId] = newTokenId;
	}

	function burn(address account, uint256 _tokenId) public onlyOwner {
		require(
			sTokensCertificateId[account][_tokenId] != 0,
			"You do not have Certificate"
		);
		_burn(_tokenId);
		sTokensCertificateId[account][_tokenId] = 0;
	}
}

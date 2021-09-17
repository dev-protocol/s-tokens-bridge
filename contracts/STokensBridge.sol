// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.4;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {ISTokensManager} from "@devprotocol/i-s-tokens/contracts/interface/ISTokensManager.sol";
import {IAddressConfig} from "@devprotocol/protocol/contracts/interface/IAddressConfig.sol";
import {BridgeToken} from "./BridgeToken.sol";
import {IBridgeToken} from "./interface/IBridgeToken.sol";

import "hardhat/console.sol";

contract STokensBridge is ReentrancyGuard, ERC721EnumerableUpgradeable {
	using SafeMath for uint256;
	uint256 public value = 0;

	mapping(address => address) public tokenAddress;

	function initialize() external {
		__ERC721_init("Dev Protocol sTokens certification", "DEV-STOKENS-CERT");
	}

	function depositSToken(address _sTokenContract, uint256 _sTokenId)
		public
		payable
		nonReentrant
	{
		(address _property, uint256 _amount, , , ) = ISTokensManager(
			_sTokenContract
		).positions(_sTokenId);

		IERC721Upgradeable(_sTokenContract).transferFrom(
			msg.sender,
			address(this),
			_sTokenId
		);

		_mint(msg.sender, _sTokenId);

		if (tokenAddress[_property] == address(0)) {
			BridgeToken bridgeToken = new BridgeToken("Bridge Token","BRD");
			tokenAddress[_property] = address(bridgeToken);
		}
		IBridgeToken(tokenAddress[_property]).mint(_msgSender(), _amount);
	}

	function redeemSToken(address _sTokenContract, uint256 _sTokenId)
		public
		payable
		nonReentrant
	{
		require(
			ownerOf(_sTokenId) == _msgSender(),
			"You do not have cert token"
		);

		IERC721Upgradeable(_sTokenContract).transferFrom(
			address(this),
			msg.sender,
			_sTokenId
		);

		_burn(_sTokenId);
	}
}

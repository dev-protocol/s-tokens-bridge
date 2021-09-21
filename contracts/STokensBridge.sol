// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.4;

import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISTokensManager} from "@devprotocol/i-s-tokens/contracts/interface/ISTokensManager.sol";
import {IAddressConfig} from "@devprotocol/protocol/contracts/interface/IAddressConfig.sol";
import {STokensCertificate20} from "./STokensCertificate20.sol";
import {ISTokensCertificate20} from "./interface/ISTokensCertificate20.sol";
import {STokensCertificate721} from "./STokensCertificate721.sol";
import {ISTokensCertificate721} from "./interface/ISTokensCertificate721.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "hardhat/console.sol";

contract STokensBridge is Initializable, ReentrancyGuard {
	address public sTokensAddress;
	address public sTokensCertificate721Address;

	mapping(address => address) public sTokensCertificate20Address;

	function initialize(address _sTokensAddress) external initializer {
		sTokensAddress = _sTokensAddress;
		STokensCertificate721 sTokensCertificate721 = new STokensCertificate721();
		sTokensCertificate721Address = address(sTokensCertificate721);
		sTokensCertificate721.initialize();
	}

	function depositSToken(uint256 _sTokenId) public nonReentrant {
		(address _property, uint256 _amount, , , ) = ISTokensManager(
			sTokensAddress
		).positions(_sTokenId);

		IERC721Upgradeable(sTokensAddress).transferFrom(
			msg.sender,
			address(this),
			_sTokenId
		);

		ISTokensCertificate721(sTokensCertificate721Address).mint(
			msg.sender,
			_sTokenId
		);

		if (sTokensCertificate20Address[_property] == address(0)) {
			STokensCertificate20 sTokensCertificate20 = new STokensCertificate20(
					"STokens Certificate20",
					"CERT20"
				);
			sTokensCertificate20Address[_property] = address(
				sTokensCertificate20
			);
		}
		ISTokensCertificate20(sTokensCertificate20Address[_property]).mint(
			msg.sender,
			_amount
		);
	}

	function redeemSToken(uint256 _sTokenId) public payable nonReentrant {
		require(
			IERC721Upgradeable(sTokensCertificate721Address).ownerOf(
				_sTokenId
			) == msg.sender,
			"You do not have Cert721 token"
		);

		(address _property, uint256 _amount, , , ) = ISTokensManager(
			sTokensAddress
		).positions(_sTokenId);

		IERC721Upgradeable(sTokensAddress).transferFrom(
			address(this),
			msg.sender,
			_sTokenId
		);

		ISTokensCertificate721(sTokensCertificate721Address).burn(_sTokenId);
		ISTokensCertificate20(sTokensCertificate20Address[_property]).burn(
			msg.sender,
			_amount
		);
	}
}

// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity =0.8.4;

import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISTokensManager} from "@devprotocol/i-s-tokens/contracts/interface/ISTokensManager.sol";
import {IAddressConfig} from "@devprotocol/protocol/contracts/interface/IAddressConfig.sol";
import {STokensSubstitute} from "./STokensSubstitute.sol";
import {ISTokensSubstitute} from "./interface/ISTokensSubstitute.sol";
import {STokensCertificate} from "./STokensCertificate.sol";
import {ISTokensCertificate} from "./interface/ISTokensCertificate.sol";
import {STokensBridgeProxy} from "./STokensBridgeProxy.sol";
import {STokensBridgeProxyAdmin} from "./STokensBridgeProxyAdmin.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "hardhat/console.sol";

contract STokensBridge is Initializable {
	address public sTokensAddress;
	address public sTokensCertificateAddress;
	address public sTokensCertificateProxyAddress;
	uint256 public certificateIdCounter;

	mapping(address => mapping(uint256 => uint256)) public sTokensCertificateId;
	mapping(address => address) public sTokensSubstituteAddress;

	event Deposit(
		address indexed _from,
		uint256 _sTokenId,
		uint256 _certificateId
	);
	event Redeem(
		address indexed _from,
		uint256 _sTokenId,
		uint256 _certificateId
	);

	function initialize(address _sTokensAddress) external initializer {
		sTokensAddress = _sTokensAddress;
		STokensBridgeProxyAdmin admin = new STokensBridgeProxyAdmin();
		STokensCertificate sTokensCertificate = new STokensCertificate();
		sTokensCertificateAddress = address(sTokensCertificate);
		STokensBridgeProxy proxy = new STokensBridgeProxy(
			sTokensCertificateAddress,
			address(admin),
			""
		);
		sTokensCertificateProxyAddress = address(proxy);
		STokensCertificate(sTokensCertificateProxyAddress).initialize();
	}

	function depositSToken(uint256 _sTokenId) public {
		(address _property, uint256 _amount, , , ) = ISTokensManager(
			sTokensAddress
		).positions(_sTokenId);

		IERC721Upgradeable(sTokensAddress).transferFrom(
			msg.sender,
			address(this),
			_sTokenId
		);

		certificateIdCounter += 1;
		ISTokensCertificate(sTokensCertificateProxyAddress).mint(
			msg.sender,
			certificateIdCounter
		);
		sTokensCertificateId[msg.sender][_sTokenId] = certificateIdCounter;

		if (sTokensSubstituteAddress[_property] == address(0)) {
			STokensSubstitute sTokensSubstitute = new STokensSubstitute();
			sTokensSubstituteAddress[_property] = address(sTokensSubstitute);
		}
		ISTokensSubstitute(sTokensSubstituteAddress[_property]).mint(
			msg.sender,
			_amount
		);
		emit Deposit(msg.sender, _sTokenId, certificateIdCounter);
	}

	function redeemSToken(uint256 _sTokenId) public {
		uint256 certificateId = sTokensCertificateId[msg.sender][_sTokenId];
		require(certificateId != 0, "You do not have Certificate");
		ISTokensCertificate(sTokensCertificateProxyAddress).burn(certificateId);
		sTokensCertificateId[msg.sender][_sTokenId] = 0;

		IERC721Upgradeable(sTokensAddress).transferFrom(
			address(this),
			msg.sender,
			_sTokenId
		);

		(address _property, uint256 _amount, , , ) = ISTokensManager(
			sTokensAddress
		).positions(_sTokenId);

		ISTokensSubstitute(sTokensSubstituteAddress[_property]).burn(
			msg.sender,
			_amount
		);
		emit Redeem(msg.sender, _sTokenId, certificateId);
	}
}

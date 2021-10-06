// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity =0.8.4;

import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISTokensManager} from "@devprotocol/i-s-tokens/contracts/interface/ISTokensManager.sol";
import {STokensSubstitute} from "./STokensSubstitute.sol";
import {ISTokensSubstitute} from "./interface/ISTokensSubstitute.sol";
import {ISTokensCertificate} from "./interface/ISTokensCertificate.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract STokensBridge is Initializable {
	address public sTokensAddress;
	address public sTokensCertificateAddress;
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

	function initialize(
		address _sTokensAddress,
		address _sTokensCertificateAddress
	) external initializer {
		sTokensAddress = _sTokensAddress;
		sTokensCertificateAddress = _sTokensCertificateAddress;
		ISTokensCertificate(sTokensCertificateAddress).initialize();
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
		ISTokensCertificate(sTokensCertificateAddress).mint(
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
		ISTokensCertificate(sTokensCertificateAddress).burn(certificateId);
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

// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity =0.8.4;

interface ISTokensCertificate {
	function initialize() external;

	function mint(address to, uint256 tokenId) external;

	function burn(uint256 tokenId) external;
}

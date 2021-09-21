// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity =0.8.4;

interface ISTokensCertificate721 {
	function mint(address to, uint256 tokenId) external;
	function burn(uint256 tokenId) external;
	function ownerOf(uint256 tokenId) external view returns (address owner);
}
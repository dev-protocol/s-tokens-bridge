// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.4;

interface ISTokensCertificate20 {
	function mint(address account, uint256 amount) external;
	function burn(address account, uint256 amount) external;
}
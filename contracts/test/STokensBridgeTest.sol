// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.4;

import {STokensBridge} from "../STokensBridge.sol";

contract STokensBridgeTest is STokensBridge {
	function dummyFunc() public pure returns (uint256) {
		return 1;
	}
}

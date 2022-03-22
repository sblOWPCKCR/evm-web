// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "ds-test/test.sol";

import "../Math.sol";


contract TestBase is DSTest {
    uint constant WAD = 10 ** 18;
    Math math = new Math();
    function testSanity(uint256 x, uint256 n) public {
        n = n % 25;
        x = x % 1e15;
        uint solmate = math.powSolmate(x, n);
        uint ds = math.powDs(x , n);
        uint yield = math.powYield(x, n);
        assertEq(solmate, ds);
        assertEq(ds, yield);
    }        
}

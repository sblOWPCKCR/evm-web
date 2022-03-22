// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "solmate/utils/FixedPointMathLib.sol";

contract Math {
    uint256 constant WAD = 10**18;

    function powSolmate(uint256 x, uint256 n) public pure returns (uint256) {
        return FixedPointMathLib.rpow(x, n, WAD);
    }

    // https://github.com/dapphub/ds-math/blob/master/src/math.sol

    function wmulDs(uint256 x, uint256 y) internal pure returns (uint256 z) {
        return (z = x * y + WAD / 2) / WAD;
    }

    function powDs(uint256 x, uint256 n) public pure returns (uint256 z) {
        z = n % 2 != 0 ? x : WAD;

        for (n /= 2; n != 0; n /= 2) {
            x = wmulDs(x, x);

            if (n % 2 != 0) {
                z = wmulDs(z, x);
            }
        }
    }

    // https://github.com/yieldprotocol/yield-utils-v2/blob/main/contracts/math/WPow.sol
    function powYield(uint256 x, uint256 n) public pure returns (uint256 z) {
        uint256 baseUnit = 1e18;
        assembly {
            switch x
            case 0 {
                switch n
                case 0 {
                    z := baseUnit
                }
                default {
                    z := 0
                }
            }
            default {
                switch mod(n, 2)
                case 0 {
                    z := baseUnit
                }
                default {
                    z := x
                }
                let half := div(baseUnit, 2)
                for {
                    n := div(n, 2)
                } n {
                    n := div(n, 2)
                } {
                    let xx := mul(x, x)
                    if iszero(eq(div(xx, x), x)) {
                        revert(0, 0)
                    }
                    let xxRound := add(xx, half)
                    if lt(xxRound, xx) {
                        revert(0, 0)
                    }
                    x := div(xxRound, baseUnit)
                    if mod(n, 2) {
                        let zx := mul(z, x)
                        if and(iszero(iszero(x)), iszero(eq(div(zx, x), z))) {
                            revert(0, 0)
                        }
                        let zxRound := add(zx, half)
                        if lt(zxRound, zx) {
                            revert(0, 0)
                        }
                        z := div(zxRound, baseUnit)
                    }
                }
            }
        }
    }
}

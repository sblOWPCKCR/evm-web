# evm-web

Running EVM code in browser.

Why? It's fun, and lets you have 100% parity between on-chain and off-chain computations.

The idea is simple: use [ethereumjs](https://github.com/ethereumjs/ethereumjs-monorepo) to run your contract locally.

## Step 1

Write a smart contract
```solidity
contract Math {
    uint256 constant WAD = 10**18;

    function powSolmate(uint256 x, uint256 n) public pure returns (uint256) {
        return FixedPointMathLib.rpow(x, n, WAD);
    }
}
```

## Step 2

Compile it and get the constructor's bytecode:

```
$ forge inspect Math bytecode
0x608060405234801561001057600080fd5b506103bf806100206000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c8...d4e84ca6369d0e125264787253ffffc1c4b301219a3704c926f7bd064736f6c634300080b0033
```

## Step 3

On to the browser land. Create an empty VM and deploy your contract:
```javascript
const vm = new VM()
const txData = {
}

const tx = Transaction.fromTxData({
    data: CONSTRUCTOR_BYTECODE,
    nonce: 0,
    gasLimit: 1_000_000, // We assume that 2M is enough,
    gasPrice: 1,
    value: 0
}).sign(senderPrivateKey)

const deploymentResult = await vm.runTx({ tx })
const deployedContractAddress = deploymentResult.createdAddress!
```

## Step 4

We can now call the contract
```javascript
    const sigHash = new Interface([
        "function powSolmate(uint256, uint256)"
    ]).getSighash(method);

    const result = await vm.runCall({
        to: deployedContractAddress,
        caller: Address.zero(),
        origin: Address.zero(),
        data: Buffer.from(sigHash.slice(2) + AbiCoder.encode(["uint256", "uint256"], [x, y]).slice(2), 'hex'),
    })

    if (result.execResult.exceptionError) {
        throw result.execResult.exceptionError
    }

    const results = AbiCoder.decode(['uint256'], result.execResult.returnValue);

    console.log("result: ", results[0]);
```

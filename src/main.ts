/*
 * Example - Running code on an ethereum-vm
 *
 *
 * To run this example in the browser, bundle this file
 * with browserify using `browserify index.js -o bundle.js`
 * and then load this folder onto a HTTP WebServer (e.g.
 * using node-static or `python -mSimpleHTTPServer`).
 */
// import "BigNumber"
// const BN = require('bn.js')
// const VM = require('../dist').default

import VM from "@ethereumjs/vm";
import { BigNumber } from "@ethersproject/bignumber";

import { defaultAbiCoder as AbiCoder, Interface } from '@ethersproject/abi';
import { BN, Account, Address } from "ethereumjs-util";
import { Transaction, TxData } from '@ethereumjs/tx'

const ctr_bytecode = require("./ctr_bytecode.json")["data"];

function buildTransaction(data: Partial<TxData>): TxData {
    const defaultData: Partial<TxData> = {
        nonce: new BN(0),
        gasLimit: 2_000_000, // We assume that 2M is enough,
        gasPrice: 1,
        value: 0,
        data: '0x',
    }

    return {
        ...defaultData,
        ...data,
    }
}


async function deployContract(
    vm: VM,
    senderPrivateKey: Buffer,
): Promise<Address> {
    // const ctr_bytecode = "0x608060405234801561001057600080fd5b50610210806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c80633adb191b14610030575b600080fd5b61004361003e366004610098565b610059565b6040516100509190610179565b60405180910390f35b60608160405160200161006c91906101ac565b6040516020818303038152906040529050919050565b634e487b7160e01b600052604160045260246000fd5b6000602082840312156100aa57600080fd5b813567ffffffffffffffff808211156100c257600080fd5b818401915084601f8301126100d657600080fd5b8135818111156100e8576100e8610082565b604051601f8201601f19908116603f0116810190838211818310171561011057610110610082565b8160405282815287602084870101111561012957600080fd5b826020860160208301376000928101602001929092525095945050505050565b60005b8381101561016457818101518382015260200161014c565b83811115610173576000848401525b50505050565b6020815260008251806020840152610198816040850160208701610149565b601f01601f19169190910160400192915050565b6503837b7339d160d51b8152600082516101cd816006850160208701610149565b919091016006019291505056fea2646970667358221220edb8100907a4e96299012afc89087ef87eb10b5549e32ec7e5cea009ff2ff38a64736f6c634300080b0033";
    const txData = {
        data: ctr_bytecode,
        nonce: 0,
    }

    const tx = Transaction.fromTxData(buildTransaction(txData)).sign(senderPrivateKey)

    const deploymentResult = await vm.runTx({ tx })

    if (deploymentResult.execResult.exceptionError) {
        throw deploymentResult.execResult.exceptionError
    }

    return deploymentResult.createdAddress!
}

async function pow(vm: VM, contractAddress: Address, method: string, x: BigNumber, y: BigNumber): Promise<BigNumber> {
    const sigHash = new Interface([
        "function powSolmate(uint256, uint256)",
        "function powDs(uint256, uint256)",
        "function powYield(uint256, uint256)",
    ])
        .getSighash(method);

    const result = await vm.runCall({
        to: contractAddress,
        caller: Address.zero(),
        origin: Address.zero(),
        data: Buffer.from(sigHash.slice(2) + AbiCoder.encode(["uint256", "uint256"], [x, y]).slice(2), 'hex'),
    })

    if (result.execResult.exceptionError) {
        throw result.execResult.exceptionError
    }

    const results = AbiCoder.decode(['uint256'], result.execResult.returnValue);

    return results[0]
}

async function insertAccount(vm: VM, address: Address) {
    const acctData = {
        nonce: 0,
        balance: new BN(10).pow(new BN(18)), // 1 eth
    }
    const account = Account.fromAccountData(acctData)

    await vm.stateManager.putAccount(address, account)
}

export function main() {
    const WAD = BigNumber.from(10).pow(BigNumber.from(18));
    const self = {
        _vm: null,
        _contractAddress: null,
        deploy: async function() {
            const accountPk = Buffer.from(
                'e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109',
                'hex'
            )
        
            const vm = new VM()
            const accountAddress = Address.fromPrivateKey(accountPk)
        
            console.log('Account: ', accountAddress.toString())
            await insertAccount(vm, accountAddress)
        
            const contractAddress = await deployContract(vm, accountPk);
            console.log('Contract address:', contractAddress.toString());
            self._vm = vm as any;
            self._contractAddress = contractAddress as any;
        },
        pow: async function(x: string, y: string) {
            return (await pow(
                self._vm! as VM, 
                self._contractAddress! as Address, "powSolmate", BigNumber.from(x), BigNumber.from(y)));
        },
        BigNumber: BigNumber
    };
    (window as any).WTF = self;
}
main()
import { Web3PluginBase, Web3 } from "web3";
import * as solc from "solc";

type IContractInfo = {
    address: `0x${string}`,
    abi: any[],
}


type IContractReceive = {
    abi?: any[];
    address?: string;
    key?: string
}

const rpcs = {
    "fuji-c": "https://api.avax-test.network/ext/bc/C/rpc",
    "dispatch": "https://subnets.avax.network/dispatch/testnet/rpc",
    "echo": "https://subnets.avax.network/echo/testnet/rpc",
    "local-c": "http://127.0.0.1:9650/ext/bc/C/rpc",
    "sepolia": "https://ethereum-sepolia-rpc.publicnode.com",
    "arbitrum": "https://arb1.arbitrum.io/rpc",
    "arbitrumSepolia": "https://sepolia-rollup.arbitrum.io/rpc"
}

/**
 * Class to initialize your contract instance quickly 😎.
 * @param {string} rpc - It could be and RPC, alias subnet and more.
 * 
 * 🚨 Example: const myInstance = new QuickContract("fuji-c")🚨
 * 
 * You can type one of below keys of your own RPC.
 * 
 * 🔺 "fuji-c" -> RPC for Fuji C-Chain,
 * 
 * 🔺 "dispatch" -> RPC for Dispatch subnet,
 * 
 * 🔺 "echo" -> RPC for Echo subnet,
 * 
 * 🔺 "local-c" -> RPC for local C-Chain (created when you run a local subnet),
 * 
 * 🔺 "sepolia" -> RPC for sepolia testnet,
 * 
 * 🔺 "arbitrum" -> RPC for Arbitrum One,
 * 
 * 🔺 "arbitrumSepolia" -> RPC for Arbitrum Sepolia
 * 
 * 🔺 "https://api.avax-test.network/ext/bc/C/rpc" -> Custom RPC
 * 
 * 🔺 "subnetA" -> Alias name for my local subnetA running in localhost
}
 */
export class QuickContract extends Web3PluginBase {
    public pluginNamespace = "quickContract";
    private web3InstanceRPC: Web3;
    private web3Account: any;
    private web3PrivateKey: string = "";
    private contractAddress: { [key: string]: IContractInfo } = {};
    public constructor(rpc: string = "C", ext = false) {
        super();
        let _rpc;
        if (rpcs[rpc.toLowerCase()])
            _rpc = rpcs[rpc.toLowerCase()];
        else if (rpc.slice(-4) == "/rpc" || ext)
            _rpc = rpc
        else
            _rpc = `http://127.0.0.1:9652/ext/bc/${rpc}/rpc`
        this.web3InstanceRPC = new Web3(new Web3.providers.HttpProvider(_rpc));
    }

    public getState = async () => {
        const blockNumber = Number(await this.web3InstanceRPC.eth.getBlockNumber());
        const blockTransactionCount = Number(await this.web3InstanceRPC.eth.getBlockTransactionCount(2));
        const chainId = Number(await this.web3InstanceRPC.eth.getChainId());
        return { blockNumber, blockTransactionCount, chainId }
    }

    public getGasFunctionsByABI = async (abi: any[], contract: `0x${string}`, args: any[], address: `0x${string}` = "0x1234567890123456789012345678901234567890") => {
        let functions: { [key: string]: number } = {}
        const _contractProxy = new this.web3InstanceRPC.eth.Contract(abi, contract)
        for (let i = 0; i < abi.length; i++) {
            let nameFunction = String(abi[i].name);
            if (!nameFunction && abi[i].type == "constructor") continue
            let estimate;
            try {
                estimate = await _contractProxy.methods[nameFunction](...args[i]).estimateGas({
                    from: address,
                });
                functions[nameFunction] = Number(estimate);
            } catch (e) {
                // console.log(e);
            }
        }
        console.log({ functions })
        return functions
    }

    public compile = async (contractName: string, contract: string) => {
        const input = {
            language: 'Solidity',
            sources: {
                'main': {
                    content: contract,
                },
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['*'],
                    },
                },
            },
        };
        const output = solc.compile(JSON.stringify(input));
        const artifact = JSON.parse(output).contracts.main[contractName];
        return {
            abi: artifact.abi,
            bytecode: artifact.evm.bytecode.object,
        };
    }

    public deploy = async (abi: any[], bytecode: string, contractKey: string, privateKey: string = "", args: any[] = []) => {
        const web3 = this.web3InstanceRPC;
        let signer = this.web3Account;
        if (privateKey != "") {
            signer = web3.eth.accounts.privateKeyToAccount(privateKey);
            this.web3Account = signer;
            this.web3PrivateKey = privateKey
        }
        web3.eth.accounts.wallet.add(signer);
        const contract = new web3.eth.Contract(abi);
        try {
            const deployTx = contract.deploy({
                data: bytecode,
                arguments: args,
            });
            const deployedContract = await deployTx
                .send({
                    from: signer.address,
                    gas: String(Number(await deployTx.estimateGas()) + 500000),
                })
            this.contractAddress[contractKey] = { address: deployedContract.options.address as `0x${string}`, abi };
            return deployedContract.options.address as `0x${string}`;
        } catch (ex) {
            console.log({ ex })
            return
        }
    }

    /**
     * Method to write in smart contracts quickly 😎.
     * @param {{ abi: any; address: string; key: string }} contractInfo - contractInfo Contains contract details where:
     *        
     * key is a specific key or identifier, you have one when you deploy locally a contract (optional).
     * 
     * abi is the contract's ABI (optional),
     * 
     * address is the contract's address (optional),
     * 
     * You have to set a key or you have to set abi and address, choose one.
     * @param { string } method - Method is the name of the method.
     * @param { any[] } args - Args is an array of inputs sending to method.
     * @param { string } privateKey - PrivateKey is the PrivateKey with funds in this Blockchain
     * 
     * 🚨 Example: const setText = await myInstance.write({ abi, address }, "setText", ["Hello!"], process.env.PRIVATE_KEY) 🚨
     */
    public write = async (contractInfo: IContractReceive, method: string, args: any[] = [], privateKey: string = "") => {
        const web3 = this.web3InstanceRPC;
        let signer = this.web3Account;
        if (privateKey != "") {
            signer = web3.eth.accounts.privateKeyToAccount(privateKey);
            this.web3Account = signer;
            this.web3PrivateKey = privateKey;
        }
        if (!signer) return "ACCOUNT_NOT_FOUND";
        const { address: userAddress } = signer;
        let balance;
        try {
            balance = await web3.eth.getBalance(userAddress);
        } catch (ex: any) {
            console.log("error del balance");
        }
        let estimate;
        let abi;
        let address;
        if (contractInfo.key) {
            abi = this.contractAddress[contractInfo.key].abi;
            address = this.contractAddress[contractInfo.key].address;
        } else {
            abi = contractInfo.abi;
            address = contractInfo.address;
        }
        let web3Contract: any = new web3.eth.Contract(abi, address);
        try {
            estimate = await web3Contract.methods[method](...args).estimateGas({
                from: userAddress,
            });
        } catch (e) {
            return "ERROR_ESTIMATING_GAS";
        }
        if (Number(estimate) > Number(balance)) {
            return "BALANCE_IS_NOT_ENOUGH";
        }
        const txObject = {
            from: userAddress,
            to: address,
            gas: estimate,
            gasPrice: web3.utils.toWei("25", "gwei"),
            data: web3Contract.methods[method](...args).encodeABI(),
        };
        const signedTrx = await web3.eth.accounts.signTransaction(
            txObject,
            this.web3PrivateKey
        );
        let receipt;
        try {
            receipt = await web3.eth.sendSignedTransaction(
                signedTrx.rawTransaction
            );
        } catch (ex: any) {
            console.log("ERROR_SENDING_TRANSACTION");
        }
        return receipt
    }

    public read = async (contractInfo: IContractReceive, method: string, args: any[] = []) => {
        let abi;
        let address;
        if (contractInfo.key) {
            abi = this.contractAddress[contractInfo.key].abi;
            address = this.contractAddress[contractInfo.key].address;
        } else {
            abi = contractInfo.abi;
            address = contractInfo.address;
        }
        const web3 = this.web3InstanceRPC;
        const contract = new web3.eth.Contract(abi, address);
        const message = await contract.methods[method](...args).call();
        return message
    }

    public getBlockchainId = async (receiver: string) => {
        const AWMAddress = "0x0200000000000000000000000000000000000005";
        const web3 = this.web3InstanceRPC;
        const contract = new web3.eth.Contract([{
            "inputs": [],
            "name": "getBlockchainID",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "blockchainID",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },

        ], AWMAddress);
        const message = await contract.methods.getBlockchainID().call();
        console.log(`BlockchainID ${receiver}: ${message}`)
        return message
    }
}
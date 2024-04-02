import { Web3PluginBase, Web3 } from "web3";
import solc from "solc";

type IContractInfo = {
    address: `0x${string}`,
    abi: any[],
}

const rpcs = {
    "dispatch": "https://subnets.avax.network/dispatch/testnet/rpc",
    "fuji-c": "https://api.avax-test.network/ext/bc/C/rpc",
    "c": "http://127.0.0.1:9650/ext/bc/C/rpc",
    "echo": "https://subnets.avax.network/echo/testnet/rpc"
}

export class Subnet extends Web3PluginBase {
    public pluginNamespace = "subnet";
    private web3InstanceRPC: Web3;
    private web3Account: any;
    private web3PrivateKey: string = "";
    private contractAddress: { [key: string]: IContractInfo } = {};
    public constructor(aliasNet: string = "C") {
        super();
        let rpc;
        if (rpcs[aliasNet.toLowerCase()])
            rpc = rpcs[aliasNet.toLowerCase()];
        else
            rpc = `http://127.0.0.1:9652/ext/bc/${aliasNet}/rpc`
        this.web3InstanceRPC = new Web3(new Web3.providers.HttpProvider(rpc));
    }

    public getSubnetState = async () => {
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
                // console.log({ nameFunction, args: args[i] })
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

    public compileSmartContract = async (contractName: string, contact: string) => {
        const input = {
            language: 'Solidity',
            sources: {
                'main': {
                    content: contact,
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

    public deploySmartContract = async (abi: any[], bytecode: string, contractKey: string, privateKey: string = "") => {
        const web3 = this.web3InstanceRPC;
        // process.env.PRIVATE_KEY
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
            });
            const deployedContract = await deployTx
                .send({
                    from: signer.address,
                    gas: String(Number(await deployTx.estimateGas()) + 500000),
                })
            this.contractAddress[contractKey] = { address: deployedContract.options.address as `0x${string}`, abi };
            return deployedContract.options.address as `0x${string}`;
        } catch (ex) {
            return
        }
    }

    public sendMessage = async (contractKey: string, method: string, args: any[] = [], privateKey: string = "") => {
        const web3 = this.web3InstanceRPC;
        let signer = this.web3Account;

        if (privateKey != "") {
            signer = web3.eth.accounts.privateKeyToAccount(privateKey);
            this.web3Account = signer;
            this.web3PrivateKey;
        }
        if (!signer) return "ACCOUNT_NOT_FOUND";
        const { address } = signer;
        let balance;
        try {
            balance = await web3.eth.getBalance(address);
        } catch (ex: any) {
            console.log("error del balance");
            // console.log({ error: ex.error });
        }
        // console.log({ balance });
        let estimate;
        let web3Contract: any = new web3.eth.Contract(this.contractAddress[contractKey].abi, this.contractAddress[contractKey].address);
        try {
            estimate = await web3Contract.methods[method](...args).estimateGas({
                from: address,
            });
        } catch (e) {
            // console.log(e);
            return "ERROR_ESTIMATING_GAS";
        }
        // console.log({ estimate });
        if (Number(estimate) > Number(balance)) {
            return "BALANCE_IS_NOT_ENOUGH";
        }
        const txObject = {
            from: address,
            to: this.contractAddress[contractKey].address,
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

    public readMessage = async (contractKey: string, method: string, args: any[] = [], caller: `0x${string}` = "0x777c79841a5926FB631d4D581f6A2c5AF5fe7792") => {
        const web3 = this.web3InstanceRPC;
        const contract = new web3.eth.Contract(this.contractAddress[contractKey].abi, this.contractAddress[contractKey].address);
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
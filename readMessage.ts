import { QuickContract } from "./src/quickContract";

const run = async () => {
    const sep = new QuickContract("sepolia")
    const text = await sep.read({
        address: "0x68ffc11AB256c096a17C05C462B85b03D2A6575F", abi: [
            {
                "inputs": [
                    {
                        "internalType": "string",
                        "name": "_myText",
                        "type": "string"
                    }
                ],
                "name": "setText",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "string",
                        "name": "_myText",
                        "type": "string"
                    }
                ],
                "name": "setTextPublic",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [],
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "inputs": [],
                "name": "countChanges",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getText",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "owner",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ]
    }, "getText")
    console.log(text)
}

run()
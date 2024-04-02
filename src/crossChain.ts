import { Web3PluginBase } from "web3";
import { Subnet } from "./subnet";
import fs from "fs/promises"

type IContract = {
    sender?: string;
    receiver?: string;
    privateKeyOrigin?: string
    privateKeyDestination?: string
}

export class CrossChain extends Web3PluginBase {
    public pluginNamespace = "crossChain";
    private originSubnet: string;
    private destinationSubnet: string;
    private web3InstanceOriginSubnet: Subnet;
    private web3InstanceDestinationSubnet: Subnet;
    private web3PrivateKeyGeneric = "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027";
    public constructor(originNet: string = "C", destinationNet: string = "C") {
        super();
        this.originSubnet = originNet;
        this.destinationSubnet = destinationNet;
        this.web3InstanceOriginSubnet = new Subnet(originNet);
        this.web3InstanceDestinationSubnet = new Subnet(destinationNet);
    }

    public sendMessageCrossChain = async (message: string = "hello web3js community", contract: IContract = { sender: "", receiver: "", privateKeyOrigin: this.web3PrivateKeyGeneric, privateKeyDestination: this.web3PrivateKeyGeneric }, showTrx: boolean = false) => {
        if (!contract.sender || contract.sender == "")
            contract.sender = await fs.readFile("contracts/sender.sol", "utf8")
        if (!contract.receiver || contract.receiver == "")
            contract.receiver = await fs.readFile("contracts/receiver.sol", "utf8")
        let senderInstance = this.web3InstanceOriginSubnet;
        let receiverInstance = this.web3InstanceDestinationSubnet;
        const compiledSender = await senderInstance.compileSmartContract("SenderMessage", contract.sender)
        const compiledReceiver = await receiverInstance.compileSmartContract("ReceiverMessage", contract.receiver)
        const { abi: abiSender, bytecode: bytecodeSender } = compiledSender;
        const { abi: abiReceiver, bytecode: bytecodeReceiver } = compiledReceiver;
        const addressSender = await senderInstance.deploySmartContract(abiSender, bytecodeSender, "sender", contract.privateKeyOrigin);
        if (!addressSender) {
            console.log("Error deploying Sender SmartContract")
            return
        }
        const addressReceiver = await receiverInstance.deploySmartContract(abiReceiver, bytecodeReceiver, "receiver", contract.privateKeyDestination);
        if (!addressReceiver) {
            console.log("Error deploying Receiver SmartContract")
            return
        }
        const lastMessage_1 = await receiverInstance.readMessage("receiver", "lastMessage")
        console.log(`The value of lastMessage at the beginning in ${this.destinationSubnet} Chain is: \n\n'${lastMessage_1}'\n`)
        const blockchainIDCChain = await receiverInstance.getBlockchainId(this.destinationSubnet);
        console.log(`Sending message in ${this.originSubnet} Chain`)
        const sender = await senderInstance.sendMessage("sender", "sendMessage", [addressReceiver, blockchainIDCChain, message]);
        await delay(2000);
        console.log(`requesting again in ${this.destinationSubnet} Chain`)
        const lastMessage_2 = await receiverInstance.readMessage("receiver", "lastMessage")
        console.log(`The value of lastMessage in ${this.destinationSubnet} Chain after sending a message from ${this.originSubnet} Chain is: \n\n'${lastMessage_2}'\n`)
        console.log(`Sender Contract: \n${addressSender}. \nReceiver Contract: \n${addressReceiver}`)
        if (showTrx)
            console.log(`Transaction Hash from message sent in ${this.originSubnet}: \n\nhttps://testnet.snowtrace.io/tx/${sender.transactionHash}`)
        return "OK"
    }
}

const delay = (milliseconds) => {
    return new Promise(resolve => {
        console.log(`Waiting ${milliseconds / 1000} seconds`)
        setTimeout(resolve, milliseconds);
    });
}
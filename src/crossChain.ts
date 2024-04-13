import { Web3PluginBase } from "web3";
import { QuickContract } from "./quickContract";
import { contracts } from "./constants";

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
    private web3InstanceOriginSubnet: QuickContract;
    private web3InstanceDestinationSubnet: QuickContract;
    private web3PrivateKeyGeneric = "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027";
    public constructor(originNet: string = "C", destinationNet: string = "C") {
        super();
        this.originSubnet = originNet;
        this.destinationSubnet = destinationNet;
        this.web3InstanceOriginSubnet = new QuickContract(originNet);
        this.web3InstanceDestinationSubnet = new QuickContract(destinationNet);
    }

    public sendMessageCrossChain = async (message: string = "hello web3js community", contract: IContract = { sender: "", receiver: "", privateKeyOrigin: this.web3PrivateKeyGeneric, privateKeyDestination: this.web3PrivateKeyGeneric }, showTrx: boolean = false) => {
        if (!contract.sender || contract.sender == "")
            contract.sender = contracts.sender;
        if (!contract.receiver || contract.receiver == "")
            contract.receiver = contracts.receiver;
        let senderInstance = this.web3InstanceOriginSubnet;
        let receiverInstance = this.web3InstanceDestinationSubnet;
        const compiledSender = await senderInstance.compile("SenderMessage", contract.sender)
        const compiledReceiver = await receiverInstance.compile("ReceiverMessage", contract.receiver)
        const { abi: abiSender, bytecode: bytecodeSender } = compiledSender;
        const { abi: abiReceiver, bytecode: bytecodeReceiver } = compiledReceiver;
        const addressSender = await senderInstance.deploy(abiSender, bytecodeSender, "sender", contract.privateKeyOrigin);
        if (!addressSender) {
            console.log("Error deploying Sender SmartContract")
            return
        }
        const addressReceiver = await receiverInstance.deploy(abiReceiver, bytecodeReceiver, "receiver", contract.privateKeyDestination);
        if (!addressReceiver) {
            console.log("Error deploying Receiver SmartContract")
            return
        }
        const lastMessage_1 = await receiverInstance.read({ key: "receiver" }, "lastMessage")
        console.log(`The value of lastMessage at the beginning in ${this.destinationSubnet} Chain is: \n\n'${lastMessage_1}'\n`)
        const blockchainIDCChain = await receiverInstance.getBlockchainId(this.destinationSubnet);
        console.log(`Sending message in ${this.originSubnet} Chain`)
        const sender = await senderInstance.write({ key: "sender" }, "sendMessage", [addressReceiver, blockchainIDCChain, message]);
        await delay(2000);
        console.log(`requesting again in ${this.destinationSubnet} Chain`)
        const lastMessage_2 = await receiverInstance.read({ key: "receiver" }, "lastMessage")
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
import { Web3PluginBase, Web3 } from "web3";
import { Subnet } from "./subnet";


export class CrossChain extends Web3PluginBase {
    public pluginNamespace = "crossChain";
    private mySubnet: string;
    private web3InstanceSubnetLocal: Subnet;
    private web3InstanceSubnetCChain: Subnet;
    private localOrigin: boolean = true;
    private web3PrivateKeyGeneric = "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027";
    public constructor(aliasNet: string, localOrigin: boolean = true) {
        super();
        this.mySubnet = aliasNet;
        this.web3InstanceSubnetLocal = new Subnet(this.mySubnet);
        this.web3InstanceSubnetCChain = new Subnet();
        if (!localOrigin)
            this.localOrigin = false
    }

    public sendMessageCrossChain = async (senderContract: string, receiverContract: string, privateKey: string = this.web3PrivateKeyGeneric) => {
        let senderInstance: Subnet;
        let receiverInstance: Subnet;
        if (this.localOrigin) {
            senderInstance = this.web3InstanceSubnetLocal;
            receiverInstance = this.web3InstanceSubnetCChain;
        } else {
            senderInstance = this.web3InstanceSubnetCChain;
            receiverInstance = this.web3InstanceSubnetLocal;
        }
        const compiledSender = await senderInstance.compileSmartContract("SenderMessage", senderContract)
        const compiledReceiver = await receiverInstance.compileSmartContract("ReceiverMessage", receiverContract)
        const { abi: abiSender, bytecode: bytecodeSender } = compiledSender;
        const { abi: abiReceiver, bytecode: bytecodeReceiver } = compiledReceiver;
        const addressSender = await senderInstance.deploySmartContract(abiSender, bytecodeSender, "sender", this.localOrigin ? privateKey : this.web3PrivateKeyGeneric);
        if (!addressSender) {
            console.log("Error deploying Sender SmartContract")
            return
        }
        const addressReceiver = await receiverInstance.deploySmartContract(abiReceiver, bytecodeReceiver, "receiver", this.localOrigin ? this.web3PrivateKeyGeneric : privateKey);
        if (!addressReceiver) {
            console.log("Error deploying Receiver SmartContract")
            return
        }
        const lastMessage_1 = await receiverInstance.readMessage("receiver", "lastMessage")
        console.log(`The value of lastMessage at the beginning in ${this.localOrigin ? "C" : this.mySubnet} Chain is: \n\n'${lastMessage_1}'\n`)
        const blockchainIDCChain = await receiverInstance.getBlockchainId(this.localOrigin ? "C" : this.mySubnet);
        console.log(`Sending message in ${this.localOrigin ? this.mySubnet : "C"} Chain`)
        await senderInstance.sendMessage("sender", "sendMessage", [addressReceiver, blockchainIDCChain, "hello web3js community"]);
        await delay(2000);
        console.log(`requesting again in ${this.localOrigin ? "C" : this.mySubnet} Chain`)
        const lastMessage_2 = await receiverInstance.readMessage("receiver", "lastMessage")
        console.log(`The value of lastMessage in ${this.localOrigin ? "C" : this.mySubnet} Chain after sending a message from ${this.localOrigin ? this.mySubnet : "C-Chain"} is: \n\n'${lastMessage_2}'\n`)
        return "OK"
    }
}

const delay = (milliseconds) => {
    return new Promise(resolve => {
        console.log(`Waiting ${milliseconds / 1000} seconds`)
        setTimeout(resolve, milliseconds);
    });
}

declare module 'web3' {
    interface Web3Context {
        crossChain: CrossChain;
    }
}
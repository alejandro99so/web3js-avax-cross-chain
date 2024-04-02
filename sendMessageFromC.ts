import fs from "fs/promises"
import { CrossChain } from "./src/crossChain";
require('dotenv').config()

const run = async (mySubnet: string) => {
    const crossChain = new CrossChain(mySubnet, false)
    const senderContract = await fs.readFile("contracts/sender.sol", "utf8")
    const receiverContract = await fs.readFile("contracts/receiver.sol", "utf8")
    await crossChain.sendMessageCrossChain(senderContract, receiverContract, process.env.PRIVATE_KEY)
}

run("web3js")
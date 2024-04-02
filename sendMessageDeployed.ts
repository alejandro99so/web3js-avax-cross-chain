import { CrossChain } from "./src/crossChain";
require('dotenv').config()

const run = async (origin: string, destination: string) => {
    const crossChain = new CrossChain(origin, destination)
    await crossChain.sendMessageCrossChain("Hello web3js community", {
        privateKeyOrigin: String(process.env.PRIVATE_KEY),
        privateKeyDestination: String(process.env.PRIVATE_KEY)
    }, true)
}

run("dispatch", "echo")
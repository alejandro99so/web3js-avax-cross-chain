import { CrossChain } from "./src/crossChain";

const run = async (origin: string, destination: string) => {
    const crossChain = new CrossChain(origin, destination)
    await crossChain.sendMessageCrossChain("Hello everyone!")
}

run("web3js", "c")
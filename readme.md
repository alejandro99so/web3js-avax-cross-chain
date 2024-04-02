## Library to Subnets and Communication Cross-Chain Using Teleporter

If you want to transfer information cross-chain using Teleporter and a local subnet, you can use this library. It is a plugin of web3js.

You can find an example in `sendMessageFromC.ts` and `sendMessageToC.ts` files.

The first step is to instantiate a new `CrossChain` class with the name of your local subnet. The second attribute is optional; you can send `false` if you want to send the message from C-Chain to your local subnet. If you leave this attribute empty, the default is from your local subnet to C-Chain. Next, you have to send a sender contract and a receiver contract. You can find examples of contracts in the path `contracts/sender.sol` and `contracts/receiver.sol`, respectively. You can follow the code below:

```
const  crossChain  =  new  CrossChain(mySubnet)
const  senderContract  =  await  fs.readFile("contracts/sender.sol", "utf8")
const  receiverContract  =  await  fs.readFile("contracts/receiver.sol", "utf8")
await  crossChain.sendMessageCrossChain(senderContract, receiverContract, process.env.PRIVATE_KEY)
```

At the end, you have to call the method `sendMessageCrossChain` with the contracts' information and the private key of the wallet with airdrops in your local subnet. If you don't have a custom wallet and are using the default wallet, you don't have to send a private key.

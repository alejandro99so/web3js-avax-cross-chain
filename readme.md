# Library to interact with Blockchains in general, subnets and Communication Cross-Chain Using Teleporter

Subnet: This class allows us to interact with various types of blockchains, including subnets of Avalanche. Among the interactions, we have smart contract compilation, contract deployment, gas value of some functions, current network state, calling a function that updates a state variable, calling a read-only function in the contract, and more.

CrossChain: This class is focused on cross-chain communication between two subnets of Avalanche.

## Subnet:

First, we need to instantiate our Blockchain, in this case, we do it with the Subnet class.

```js
const avaxInstance = new Subnet(originNet);
```

Once we have our instance, we can call methods like `compileSmartContract`, which is used to compile our contracts. This method takes the name of the contract we want to compile as the first argument and the contract to compile as the second argument. Here's an example:

```js
import fs from "fs/promises";
const contract = await fs.readFile("./myContractPath", "utf8");
const avaxInstance = new Subnet(originNet);
const { abi, bytecode } = await avaxInstance.compileSmartContract(
    "HelloWorld",
    contract
);
```

Once compiled, we have access to the ABI and bytecode. To deploy it, we must have access to a wallet with crypto on the network. In the case of an Avalanche subnet deployed locally, the private key provided in the Avalanche CLI documentation is used by default. An example of this is as follows:

```js
import fs from "fs/promises";
const contract = await fs.readFile("./myContractPath", "utf8");
const avaxInstance = new Subnet(originNet);
const { abi, bytecode } = await avaxInstance.compileSmartContract(
    "HelloWorld",
    contract
);
const addressMyContract = await avaxInstance.deploySmartContract(
    abi,
    bytecode,
    "sender",
    process.env.privateKey
);
if (!addressMyContract) {
    console.log("Error deploying SmartContract");
    return;
}
```

1. The first attribute sent is the ABI.
2. The second attribute sent is the bytecode.
3. The third attribute sent is a keyword to easily identify the contract in the future.
4. The fourth and final attribute is the private key from which the smart contract will be deployed.

If an address is not received, it means there was an error during deployment.

If we want to call a read function of the contract, we can do it as follows:

```js
import fs from "fs/promises";
const contract = await fs.readFile("./myContractPath", "utf8");
const avaxInstance = new Subnet(originNet);
const { abi, bytecode } = await avaxInstance.compileSmartContract(
    "HelloWorld",
    contract
);
const addressMyContract = await avaxInstance.deploySmartContract(
    abi,
    bytecode,
    "myContract",
    process.env.privateKey
);
if (!addressMyContract) {
    console.log("Error deploying SmartContract");
    return;
}
const lastMessage = await avaxInstance.readMessage(
    "myContract",
    "lastMessage",
    ["user1"]
);
```

1.  Where the first argument is the name of the contract within the instance we defined when deploying our contract.
2.  The second argument is the name of the read method we are calling.
3.  The third argument is an array with the arguments required when calling our method.

If we want to call a write function of the contract, we can do it as follows:

```js
import fs from "fs/promises";
const contract = await fs.readFile("./myContractPath", "utf8");
const avaxInstance = new Subnet(originNet);
const { abi, bytecode } = await avaxInstance.compileSmartContract(
    "HelloWorld",
    contract
);
const addressMyContract = await avaxInstance.deploySmartContract(
    abi,
    bytecode,
    "myContract",
    process.env.privateKey
);
if (!addressMyContract) {
    console.log("Error deploying SmartContract");
    return;
}
const sender = await avaxInstance.sendMessage(
    "myContract",
    "sendMessage",
    [addressReceiver, blockchainIDCChain, message],
    process.env.privateKey
);
```

1.  Where the first argument is the name of the contract within the instance we defined when deploying our contract.
2.  The second argument is the name of the read method we are calling.
3.  The third argument is an array with the arguments required when calling our method.
4.  The fourth argument is the private key that calls this payment method. It's worth noting that this must have tokens to pay for the transaction gas.

## CrossChain

f you want to transfer information between chains using Teleporter in the Avalanche ecosystem, you can use this library. It is a web3js plugin.

You can find an example in the files `sendMessage.ts` and `sendMessageDeployed.ts`.

### Step 1.

The first step is to create an instance of a new `CrossChain` class. The attributes to send are the name of the source network and the name of the destination network.

It is very important to note that both networks must be connected with a Relayer to function. Currently, this is fulfilled when we want to communicate information between our local subnet and the local C-Chain, or between the Dispatch, Echo, or C-Chain Fuji networks.

The names for the networks are: `dispatch` for Dispatch, `echo` for Echo, `fuji-c` for the Fuji C-Chain, `c` for the local C-Chain, and the name of your local subnet.

Example 1 between Fuji networks:

```js
const crossChain = new CrossChain("dispatch", "echo");
```

Example 2 between local networks:

```js
const crossChain = new CrossChain("web3js", "c");
```

In the second example, my local subnet is named web3js.

### Step 2.

After having instances of these networks, we can test the correct connection between them and send a message between them using the following code:

```js
await crossChain.sendMessageCrossChain("Hello everyone!");
```

This is a simplified version where we only send a message and use the default contracts and private keys of the local subnets. We can send as a second attribute an object with the following interface:

```js
{
	sender?: string;
	receiver?: string;
	privateKeyOrigin?: string;
	privateKeyDestination?: string;
}
```

Where:

1.  `sender` is the contract to send the Teleporter message.
2.  `receiver` is the contract to receive the Teleporter message.
3.  `privateKeyOrigin` is the private key to deploy contracts in the Origin subnet.
4.  `privateKeyDestination` is the private key to deploy contracts in the Destination subnet.

Finally, we can send `true` if we want to receive the transaction URL in a block explorer. This only works if we are testing between the networks deployed in Fuji (Dispatch, Echo, and C-Chain Fuji).

A more complex example with the last mentioned is:

```js
await crossChain.sendMessageCrossChain(
    "Hello web3js community",
    {
        privateKeyOrigin: String(process.env.PRIVATE_KEY),
        privateKeyDestination: String(process.env.PRIVATE_KEY),
    },
    true
);
```

## Library to Subnets and Communication Cross-Chain Using Teleporter

If you want to transfer information between chains using Teleporter in the Avalanche ecosystem, you can use this library. It is a web3js plugin.

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

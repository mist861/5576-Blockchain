# 5576-0001 Blockchain Fall 2024 Project

This directory contains the source files and documentation for the Fall 2024 Project:

* corpus_server.js: the node.js server configuration
* corpus_index.html: the primary HTML file provided by server.js
* corpus_interact.js: the interaction JavaScript, written to be called by the above HTML file.  PLEASE NOTE: this will not run on the command line.
* hardhat/hardhat.config.js: the hardhat configuration file
* hardhat/contracts/DocumentStore.sol: the custom corpus storage smart contract, written in Solidity
* hardhat/scripts/deploy.js: the JavaScript script that deploys the above contract to hardhat

## Execution:

From the assignment hardhat directory, run:

```
npm install hardhat
npm install '@nomicfoundation/hardhat-toolbox'
npx hardhat node
```

In a separate command line, in the hardhat directory, run:

```
npx hardhat run scripts/deploy.js --network localhost
```

Once the contract has been deployed take note of the contract's address (which can be found in the deployment block in first command line running hardhat node), update line 179 of corpus_interact.js with the new contract address:

```
this.contractAddress = '<NEW_CONTRACT_ADDRESS>'
```

After modifying interact.js, in the frontend directory run:

```
npm install express
node corpus_server.js
```

Which can then be accessed at:

```
http://localhost:8080
```

From any browser with MetaMask installed. PLEASE NOTE: the contract will be deployed by default to the first default hardhat account. This account will need to be imported to MetaMask to allow for most interactions.  To connect MetaMask to the local hardhat network, be sure to add a new network with the following:

```
RPC Url: http://127.0.0.1:8545
Chain ID: 31337
```

## Requirements:

* npm
* node.js with the following installed:
** express
** web3
* hardhat
* MetaMask browser extension


## Contributors:

Reed White

# 5576-0001 Blockchain Fall 2024 Project

This directory contains the source files and documentation for the Fall 2024 Project:

* corpus_server.js: the node.js server configuration
* corpus_index.html: the primary HTML file provided by server.js
* corpus_interact.js: the interaction JavaScript, written to be called by the above HTML file.  PLEASE NOTE: this will not run on the command line.
* hardhat/hardhat.config.js: the hardhat configuration file
* hardhat/contracts/DocumentStore.sol: the custom corpus storage smart contract, written in Solidity
* hardhat/scripts/deploy.js: the JavaScript script that deploys the above contract to hardhat

## Execution:

If not already installed, install Node in the /src (this) directory with:

```
curl -fsSL https://fnm.vercel.app/install | bash
source ~/.bashrc
fnm use --install-if-missing 22
```

For more information on installing Node, see https://nodejs.org/en/download/package-manager.

In the /src/hardhat directory, install Hardhat with:

```
npm install hardhat
npm install '@nomicfoundation/hardhat-toolbox'
npx hardhat node
```

For more information on install Hardhat, see: https://hardhat.org/hardhat-runner/docs/getting-started.

In a separate command line, in the /src/hardhat directory, run:

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

To run the RAG frontend, in the rag directory run:

```
python -m ensurepip --upgrade
pip install -r ./requirements.txt
python -m streamlit run rag_blockchain_streamlit.py
```

*Alternatively, to run the hashing version of this system, perform the following:*

Assuming that hardhat is running, in the hardhat directory run:

```
npx hardhat run scripts/hash_deploy.js --network localhost
```

Once the contract has been deployed take note of the contract's address (which can be found in the deployment block in first command line running hardhat node), update line 173 of corpus_hash_interact.js with the new contract address:

```
this.contractAddress = '<NEW_CONTRACT_ADDRESS>'
```

After modifying interact.js, in the hash_frontend directory run:

```
mkdir -p upload/corpus
npm install express
node corpus_hash_server.js
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

To run the RAG frontend, in the rag directory run:

```
python -m ensurepip --upgrade
pip install -r ./requirements.txt
python -m streamlit run rag_blockchain_hash_streamlit.py
```

Please note this will only load documents currently in the corpus in the blockchain. If additional documents are needed, stop streamlit and rerun the above RAG frontend commands.

## Requirements:

* python

The following are also required but have instructions provided:

* npm
  * express
  * web3
  * multer
* hardhat
  * hardhat-toolbox
* MetaMask browser extension

## Contributors:

Reed White

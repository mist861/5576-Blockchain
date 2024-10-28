import { Web3 } from 'https://cdn.jsdelivr.net/npm/web3@4.12.1/+esm' // Import the external Web3.js module. This single line took me like 4 hours. I didn't even know there were external CDNs until this, and there's quite a bit of conflicting information on what is considered best practice for imports.
import axios from 'https://cdn.jsdelivr.net/npm/axios@1.7.7/+esm'
import cryptoJs from 'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/+esm'

const abi = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "corpus",
		"outputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "metadata",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "hash",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "location",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "metadata",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "hash",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "location",
				"type": "string"
			}
		],
		"name": "insert",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "key",
				"type": "uint256"
			}
		],
		"name": "removeDocument",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "removeDocumentBySender",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "key",
				"type": "uint256"
			}
		],
		"name": "retrieveDocument",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "metadata",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "hash",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "location",
						"type": "string"
					}
				],
				"internalType": "struct HashCorpus.Document",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "retrieveDocumentKeysBySender",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "retrieveLatestKey",
		"outputs": [
			{
				"internalType": "int256",
				"name": "",
				"type": "int256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

export class CorpusApp {
	constructor() {
        this.web3Class = new Web3(window.ethereum); // Create a new web3 object instance, using the browser's ethereum settings (MetaMask)
		this.contractAddress = '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512'; // Set the static contract address in the LOCAL Hardhat development chain.  THIS MUST BE UPDATED TO A NEW CONTRACT ADDRESS FOR NEW DEPLOYMENTS.
		this.abi = abi;
    }

	async retrieveDocument() { // Define a function to get the current account's balance
		try {
			const contract = new this.web3Class.eth.Contract(this.abi, this.contractAddress); // Create a new contract using the above interface and address
			const key = document.getElementById('retrieveKey').value;
			let doc = await contract.methods.retrieveDocument(key).call();
			if (doc.hash.length > 0) {
				let location = doc.location;
				let file = await axios.get('/download', {
					params: {
					  filename: location
					}
				})
				file = new File([file.data], location);       
				const string = await this.readFileContent(file);
				const hash = cryptoJs.SHA256(string).toString();
				console.log("Original hash: "+doc.hash)
				console.log("Calculated hash: "+hash)
				if (hash == doc.hash) {
					let result = "Retrieved document "+key+" results displayed to the right"; // Create a result string
					console.log(result); // Display the result string in the log
					document.getElementById("retrieved").innerHTML = result; // Display the result string in the html browser window
					document.getElementById("file_metadata").value = doc.metadata;
					document.getElementById("textarea").value = string;
					// document.getElementById("file_location").value = doc.location;
				}
				else {
					let result = "Invalid hash found for document at "+key;
					console.log(result); // Display the result string in the log
					document.getElementById("retrieved").innerHTML = result; // Display the result string in the html browser window
					document.getElementById("file_metadata").value = "";
					document.getElementById("textarea").value = "";
				}
			}
			else {
				let result = "No results found for "+key;
				console.log(result); // Display the result string in the log
				document.getElementById("retrieved").innerHTML = result; // Display the result string in the html browser window
				document.getElementById("file_metadata").value = "";
				document.getElementById("textarea").value = "";
			}
			document.getElementById("error").style.opacity = 0.0; // If there was previously an error, clear it from the display
		}
		catch (err) {
			if (err.message.includes("JSON-RPC")) { // If the input isn't available or for some reason didn't pass web3 validation, ask for valid input
				const key = document.getElementById('retrieveKey').value;
				document.getElementById("retrieved").innerHTML = "Key "+key+" not found";
			}
			else {
				console.log(err)
				document.getElementById("error").innerHTML = err.message;
				document.getElementById("error").style.opacity = 1.0;
			}
			document.getElementById("file_metadata").value = "";
			document.getElementById("textarea").value = "";
		}
	}

	async retrieveDocumentKeysBySender() { // Define a function to get the current account's balance
		try {
			const contract = new this.web3Class.eth.Contract(this.abi, this.contractAddress); // Create a new contract using the above interface and address
			const sender = document.getElementById('retrieveSender').value;
			let sender_keys = await contract.methods.retrieveDocumentKeysBySender(sender).call();
			if (sender_keys.length > 0) {
				let result = "Retrieved keys: "+sender_keys; // Create a result string
				console.log(result); // Display the result string in the log
				document.getElementById("retrievedKeysBySender").innerHTML = result; // Display the result string in the html browser window
				document.getElementById("error").style.opacity = 0.0; // If there was previously an error, clear it from the display
			}
			else {
				let result = "No results found";
				console.log(result); // Display the result string in the log
				document.getElementById("retrievedKeysBySender").innerHTML = result; // Display the result string in the html browser window
				document.getElementById("error").style.opacity = 0.0; // If there was previously an error, clear it from the display
			}
		}
		catch (err) {
			console.log(err)
			document.getElementById("error").innerHTML = err.message;
			document.getElementById("error").style.opacity = 1.0;
		}
	}

	async retrieveLatestKey() { // Define a function to get the current account's balance
		try {
			const contract = new this.web3Class.eth.Contract(this.abi, this.contractAddress); // Create a new contract using the above interface and address
			let latest_key = await contract.methods.retrieveLatestKey().call();
			if (latest_key < 0) {
				latest_key = 0;
			}
			let result = "Retrieved: "+latest_key; // Create a result string
			console.log(result); // Display the result string in the log
			document.getElementById("latestKey").innerHTML = result; // Display the result string in the html browser window

		}
		catch (err) {
			console.log(err)
			document.getElementById("error").innerHTML = err.message;
			document.getElementById("error").style.opacity = 1.0;
		}
	}

	async inputFile() { // Define a function to get the current account's balance
		try {
			const contract = new this.web3Class.eth.Contract(this.abi, this.contractAddress); // Create a new contract using the above interface and address
			const metadata = document.getElementById('file_metadata').value;
			//const location = document.getElementById('file_location').value;
			const file = document.getElementById('input-file').files[0];
			const location = file.name;
			console.log("File name:"+location)
			const string = await this.readFileContent(file);
			const hash = cryptoJs.SHA256(string).toString();
			await contract.methods.insert(metadata, hash, location).send({ from: this.currentAccount }); // FIX THE ID ISSUE
			var formData = new FormData();
			formData.append('file', file, location);
			axios.post('upload', formData)
			let result = "String "+hash+" added"; // Create a result string
			console.log(result); // Display the result string in the log
			document.getElementById("inputted").innerHTML = result; // Display the result string in the html browser window
			document.getElementById("error").style.opacity = 0.0; // If there was previously an error, clear it from the display
		}
		catch (err) {
			console.log(err)
			document.getElementById("error").innerHTML = err.message;
			document.getElementById("error").style.opacity = 1.0;
		}
	}
	
	async displayFileContent() {
		const file = document.getElementById('input-file').files[0];
		const string = await window.corpusApp.readFileContent(file);
		document.getElementById("textarea").value = string;
	}

	readFileContent(file) {
		const reader = new FileReader()
		return new Promise((resolve, reject) => {
			reader.onload = event => resolve(event.target.result)
			reader.onerror = error => reject(error)
			reader.readAsText(file)
	  	})
	}

	async removeDocument() { // Define a function to get the current account's balance
		try {
			const contract = new this.web3Class.eth.Contract(this.abi, this.contractAddress); // Create a new contract using the above interface and address
			const key = document.getElementById('removeKey').value;
			await contract.methods.removeDocument(key).send({ from: this.currentAccount });
			let result = "Removed document: "+key; // Create a result string
			console.log(result); // Display the result string in the log
			document.getElementById("removedDocument").innerHTML = result; // Display the result string in the html browser window
		}
		catch (err) {
			console.log(err)
			document.getElementById("error").innerHTML = err.message;
			document.getElementById("error").style.opacity = 1.0;
		}
	}

	async removeDocumentBySender() { // Define a function to get the current account's balance
		try {
			const contract = new this.web3Class.eth.Contract(this.abi, this.contractAddress); // Create a new contract using the above interface and address
			const address = document.getElementById('removeAddress').value;
			let sender_keys = await contract.methods.removeDocumentBySender(address).send({ from: this.currentAccount });
			let result = "Removed documents for account: "+address; // Create a result string
			console.log(result); // Display the result string in the log
			document.getElementById("removedbySender").innerHTML = result; // Display the result string in the html browser window
			document.getElementById("error").style.opacity = 0.0; // If there was previously an error, clear it from the display
		}
		catch (err) {
			console.log(err)
			document.getElementById("error").innerHTML = err.message;
			document.getElementById("error").style.opacity = 1.0;
		}
	}

	async connectMetaMask() { // Default "init" function that connects the window to MetaMask
		if (typeof window.ethereum !== 'undefined') { // If MetaMask is installed and available, then: 
			await window.ethereum.request({ method: 'eth_requestAccounts' }); // Initialize the connection
			const account = await this.web3Class.eth.getAccounts(); // Get the accounts
			const currentAccount = account[0]; // Set the current account to the currently active account
			this.currentAccount = currentAccount; // Set the current account in the class object
			console.log("Current Account:", currentAccount); // Log the current account
			document.getElementById("yourAccount").innerHTML = this.currentAccount; // Display the current account in the browser window
		}
		else { // We're not using a try/catch here because there is realistically only one error: MetaMask is not installed
			console.log("Please install MetaMask");
			document.getElementById("yourAccount").innerHTML = "Please install MetaMask and configure your account";
		}
	}
}

window.onload = function () { // On browser window load: 
	window.corpusApp = new CorpusApp(); // Create a new class object and tie it to the window
	window.corpusApp.connectMetaMask(); // Call the connectMetaMask method
	document.getElementById('input-file').addEventListener('change', window.corpusApp.displayFileContent)
}
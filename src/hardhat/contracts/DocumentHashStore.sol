// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HashCorpus {

    struct Document {
        address sender;
        string metadata;
        string hash;
        string location;
    }
    
    Document[] public corpus;

    function insert(string memory metadata, string memory hash, string memory location) public {
        Document memory doc = Document({
            sender: msg.sender,
            metadata: metadata,
            hash: hash,
            location: location
        });
        corpus.push(doc);
    }
    
    function retrieveDocument(uint key) public view returns(Document memory) {
        Document memory doc = corpus[key];
        return doc;
    }

    function retrieveLatestKey() public view returns(int) {
        if (corpus.length > 0) {
            int key = int(corpus.length) - 1;
            while (key > -1) {
                Document memory latest_doc = corpus[uint(key)];
                bytes memory testString = bytes(latest_doc.hash);
                if (testString.length > 0) {
                    break;
                }
                key--;
            }
            return key;
        }
        else {
            int key = 0;
            return key;
        }
    }

    function retrieveDocumentKeysBySender(address sender) public view returns(uint[] memory) {
        uint[] memory all_keys = new uint[](corpus.length);
        uint index = 0;
        for (uint key; key < corpus.length; key++) {
            Document memory current_doc = corpus[key];
            if (current_doc.sender == sender) {
                all_keys[index] = key;
                index++;
            }
        }
        uint[] memory sender_keys = new uint[](index);
        index = 0;
        for (uint key; key < all_keys.length; key++) {
            if (all_keys[key] != 0) {
                sender_keys[index] = all_keys[key];
                index++;
            }
        }
        return sender_keys;
    }

    function removeDocument(uint key) public {
        delete corpus[key];
    }

    function removeDocumentBySender(address sender) public returns(uint[] memory) {
        uint[] memory sender_keys = retrieveDocumentKeysBySender(sender);
        if (sender_keys.length > 0) {
            for (uint key; key < sender_keys.length; key++) {
                if (sender_keys[key] > 0) {
                    delete corpus[sender_keys[key]];
                }
            }
        }
        return sender_keys;
    }
}




// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Corpus {

    struct Document {
        address sender;
        string metadata;
        uint[] ids;
        string[] chunks;
    }
    
    Document[] public corpus;

    constructor() {
        uint[] memory initID = new uint[](1);
        initID[0] = 1;
        string[] memory initChunk = new string[](1);
        initChunk[0] = 'init';
        insert(initID, "init", initChunk);
    }

    function insert(uint[] memory ids, string memory metadata, string[] memory chunks) public {
        
        Document memory doc = Document({
            sender: msg.sender,
            metadata: metadata,
            ids: ids,
            chunks: chunks
        });
       
        corpus.push(doc);
    }
    
    function retrieveDocument(uint key) public view returns(Document memory) {
        Document memory doc = corpus[key];
        return doc;
    }

    function retrieveLatestKey() public view returns(int) {
        int key = int(corpus.length) - 1;
        while (key > -1) {
            Document memory latest_doc = corpus[uint(key)];
            if (latest_doc.ids.length > 0) {
                break;
            }
            key--;
        }
        return key;
    }

    function retrieveLatestID() public view returns(uint) {
        int key = retrieveLatestKey();
        uint id = 0;
        if (key > -1) {
            Document memory latest_doc = corpus[uint(key)];
            uint index = latest_doc.ids.length - 1;
            id = latest_doc.ids[index];
        }
        return id;
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
        uint[] memory sender_keys = new uint[](corpus.length);
        uint index = 0;
        for (uint key; key < corpus.length; key++) {
            Document memory current_doc = corpus[key];
            if (current_doc.sender == sender) {
                sender_keys[index] = key;
                index++;
            }
        }
        for (uint key; key < sender_keys.length; key++) {
            if (sender_keys[key] > 0) {
                delete corpus[sender_keys[key]];
            }
        }
        return sender_keys;
    }
}




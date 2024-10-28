import streamlit as st
import streamlit_authenticator as stauth


import chromadb
from ragatouille import RAGPretrainedModel
import ollama
from typing import Optional
import os
from web3 import Web3
import pandas as pd
import requests
import hashlib
from langchain.text_splitter import TokenTextSplitter

abi = [
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

web3class = Web3(Web3.HTTPProvider('http://localhost:8545'))
contractAddress = web3class.to_checksum_address('0xe7f1725e7734ce288f8367e1bb143e90bb3f0512')

def retrieveDocument(key):
    contract = web3class.eth.contract(abi=abi, address=contractAddress)
    key = key
    doc = contract.functions.retrieveDocument(key).call()
    if (len(doc[0]) > 0):
        result = f'Retrieved document {key} results'
        print(result)
        return doc[1], doc[2], doc[3]
    else:
        result = f'No results found for {key}'
        print(result)
        return None, None, None
    
def downloadDocument(location):
    params = {'filename':f'{location}'}
    url = 'http://localhost:8080/download/'
    return requests.get(url, params).text
    
def retrieveHashCorpus():
    contract = web3class.eth.contract(abi=abi, address=contractAddress)
    latest_key = contract.functions.retrieveLatestKey().call();
    docs = []
    metadatas = []
    for key in range(latest_key+1):
        doc_metadata, doc_hash, doc_location = retrieveDocument(key)
        if doc_hash is not None:
            doc = downloadDocument(doc_location)
            sha256 = hashlib.sha256()
            hash_string = str.encode(doc)
            sha256.update(hash_string)
            calc_hash = sha256.hexdigest()
            if doc_hash == calc_hash:
                docs.append(doc)
                metadatas.append(doc_metadata)
                print(f'Valid hash found for document {key}, document retrieved')
            else:
                print(f'Invalid hash found for document {key}, document not retrieved')
                print(f'Blockchain hash: {doc_hash}')
                print(f'Calculated hash: {calc_hash}')
    return metadatas, docs

@st.cache_resource
def generate_vector_store():
	chunker = TokenTextSplitter(chunk_size=1000, chunk_overlap=100)
	raw_metadatas, raw_docs = retrieveHashCorpus()
	db_docs = []
	db_metadatas = []
	db_ids = []
	ids = 0
	for doc in range(len(raw_docs)):
		split = chunker.split_text(raw_docs[doc])
		for chunked_doc in range(len(split)):
			db_docs.append(split[chunked_doc])
			db_metadatas.append({'document_metadata': raw_metadatas[doc]})
			db_ids.append(f'{ids}')
			ids += 1
	chroma_client = chromadb.Client()
	collection = chroma_client.get_or_create_collection(name="blockchain_rag")
	collection.add(documents=db_docs, ids=db_ids, metadatas=db_metadatas)
	return collection

@st.cache_resource
def generate_reranker():
	llmreranker = RAGPretrainedModel.from_pretrained("colbert-ir/colbertv2.0")
	return llmreranker

def rag_query(
    question: str,
    llm: str,
    knowledge_index=generate_vector_store(),
    reranker: Optional[RAGPretrainedModel] = None,
    num_retrieved_docs: int = 10,
    num_docs_final: int = 5):
    print("=> Retrieving documents...")
    relevant_docs = knowledge_index.query(query_texts=question, n_results=num_retrieved_docs)
    relevant_docs = relevant_docs['documents'][0]

    if reranker:
        print("=> Reranking documents...")
        relevant_docs = reranker.rerank(question, relevant_docs, k=num_docs_final)

    relevant_docs = relevant_docs[:num_docs_final]

    final_prompt = f"""
        You are a helpful assistant. Use the provided context to answer the provided question. 
        
        CONTEXT: {relevant_docs}
        QUESTION: {question}
        
        """

    response = ollama.chat(model=llm, messages=[
        {
            'role': 'user',
            'content': final_prompt,
        },
    ])
    answer = response['message']['content']

    return answer

st.title("Blockchain RAG Bot") # Set the page title
st.caption("An example chatbot created for 5576-0001 Fall 2024 project") # Set the page caption

if "messages" not in st.session_state: # If there are no messages in the session state, display a default message
    st.session_state["messages"] = [{"role": "assistant", "content": "How can I help you?"}]

for msg in st.session_state.messages: # Display the messages in the session state (right now, just the above)
    st.chat_message(msg["role"]).write(msg["content"])

if prompt := st.chat_input(): # If anything is added to the prompt by the user
    st.session_state.messages.append({"role": "user", "content": prompt}) # Add it to the session state
    st.chat_message("user").write(prompt) # Show it in the chat log
    msg = rag_query(prompt, 'llama3.1', reranker=generate_reranker()) # Generate a message by calling the above function
    st.session_state.messages.append({"role": "assistant", "content": msg}) # Add the message to the session state
    st.chat_message("assistant").write(msg) # Write the message out in the UI

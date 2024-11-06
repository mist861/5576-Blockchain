import streamlit as st
import streamlit_authenticator as stauth


import chromadb
from ragatouille import RAGPretrainedModel
import ollama
from typing import Optional
import os
from web3 import Web3
import pandas as pd

abi = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
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
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256[]",
				"name": "ids",
				"type": "uint256[]"
			},
			{
				"internalType": "string",
				"name": "metadata",
				"type": "string"
			},
			{
				"internalType": "string[]",
				"name": "chunks",
				"type": "string[]"
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
						"internalType": "uint256[]",
						"name": "ids",
						"type": "uint256[]"
					},
					{
						"internalType": "string[]",
						"name": "chunks",
						"type": "string[]"
					}
				],
				"internalType": "struct Corpus.Document",
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
		"name": "retrieveLatestID",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
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
contractAddress = web3class.to_checksum_address('0x5fbdb2315678afecb367f032d93f642f64180aa3')

def retrieveDocument(key):
    contract = web3class.eth.contract(abi=abi, address=contractAddress)
    key = key
    doc = contract.functions.retrieveDocument(key).call()
    if (len(doc[2]) > 0):
        result = f'Retrieved document {key} results'
        print(result)
        return doc[1], doc[2], doc[3]
    else:
        result = f'No results found for {key}'
        print(result)
        return None, None, None
    
def retrieveCorpus():
    contract = web3class.eth.contract(abi=abi, address=contractAddress)
    latest_key = contract.functions.retrieveLatestKey().call();
    docs = []
    ids = []
    metadatas = []
    for key in range(latest_key+1):
        doc_metadata, doc_ids, doc_chunks = retrieveDocument(key)
        if doc_chunks is not None:
            for doc in range(len(doc_chunks)):
                docs.append(doc_chunks[doc])
                ids.append(str(doc_ids[doc]))
                metadatas.append({'doc_type':doc_metadata})
    return metadatas, ids, docs

@st.cache_resource
def generate_vector_store():
	db_metadatas, db_ids, db_docs = retrieveCorpus()
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
        Do not mention that you were provided context in your reply.
        If you do not know the answer or the answer is not in the provided, say that you don't know.
        Do not make up an answer.       

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

'use client'

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from "ethers";
import Web3 from 'web3';

export default function GetFileButton() {

    const [selectedFile, setSelectedFile] = useState();
    const { address, isConnected } = useAccount();
    const web3 = new Web3();

    const changeHandler = (event) => {
        setSelectedFile(event.target.value);
    };

    const handleSubmission = async (e) => {
        var res = await fetch(`http://127.0.0.1:5000/files/${selectedFile}`)
        var file = await res.json();

        var blob;

        if (file.signature) {
            let addr = web3.eth.accounts.recover(file.data, file.signature);
            if (isConnected && addr !== address) {
                return;
            }
        } else if (file.enc) {
            let privateKey = prompt("Enter private key");
            let publicKey = file.publicKey;
            let keyPair = new ethers.utils.SigningKey(privateKey);

            let symKey = keyPair.computeSharedSecret(publicKey).slice(2);

            let buff = new Uint8Array(symKey.match(/../g).map(h => parseInt(h, 16))).buffer

            let key = await window.crypto.subtle.importKey("raw", buff, "AES-GCM", true, [
                "decrypt"
            ]);

            let ciphertext = Buffer.from(file.data, "base64");

            let plaintext = await window.crypto.subtle.decrypt({
                name: "AES-GCM",
                iv: Buffer.from(file.iv, "base64").buffer
            }, key, ciphertext);
            let decoder = new TextDecoder();
            var bytes = Buffer.from(decoder.decode(plaintext), 'base64');

            blob = new Blob([bytes.buffer], { type: file.file_type });
        } else {
            var bytes = Buffer.from(file.data, "base64");
            blob = new Blob([bytes.buffer], { type: file.file_type });
        }
        let d = document.getElementById("download");
        d.href = window.URL.createObjectURL(blob)
        d.download = file.name;
        d.click();
    };

    return (
        <div class="flex flex-col place-items-center h-[250px] mt-6">
            <div class="flex">
                <input className="text-black" type="text" onChange={changeHandler}>
                </input>
            </div>

            <div>
                <button class="text-sm text-slate-500
            mr-4 py-2 mt-6 px-4
            rounded-full border-0
            text-sm font-semibold
            bg-blue-300
            hover:bg-blue-400"
                    onClick={handleSubmission}>
                    Get File
                </button>
                <a href="#" id="download"></a>
            </div>
        </div>
    )
}
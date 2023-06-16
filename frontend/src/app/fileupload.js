'use client'

import React, { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { ethers } from "ethers";
import Web3 from 'web3';
export default function FileUploadButton() {

    const [selectedFile, setSelectedFile] = useState();

    const [isFilePicked, setIsFilePicked] = useState(false);

    const [uploadProgress, setUploadProgress] = useState(-1);

    const [lastUploadCid, setlastUploadCid] = useState("");

    const { isConnected } = useAccount();

    const [prehashedData, setPreHashedData] = useState();

    const [isEncrypting, setIsEncrypting] = useState(false);

    var web3 = new Web3();

    const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
        onError(error) {
            console.log("Error signing message");
        },
        async onSuccess(data) {
            let requestBody = {
                name: selectedFile.name,
                data: null,
                file_type: selectedFile.type,
                enc: false,
            };

            if (isEncrypting) {
                let arrayify = ethers.utils.arrayify;
                let messageHash = arrayify(ethers.utils.hashMessage(prehashedData));

                // get the public key of the user
                let publicKey = ethers.utils.recoverPublicKey(messageHash, data);

                // create a new keypair 
                let newAccount = web3.eth.accounts.create();
                let newAccountKeyPair = new ethers.utils.SigningKey(newAccount.privateKey);

                // get the symmetric key using ECDH
                let symKey = newAccountKeyPair.computeSharedSecret(publicKey).slice(2);
                let buff = new Uint8Array(symKey.match(/../g).map(h => parseInt(h, 16))).buffer
                let key = await window.crypto.subtle.importKey("raw", buff, "AES-GCM", true, [
                    "encrypt"
                ]);

                // create IV for the file
                let iv = window.crypto.getRandomValues(new Uint8Array(16));
                let encoder = new TextEncoder();
                
                // encrypt the file
                let ciphertext = await window.crypto.subtle.encrypt({
                    name: "AES-GCM",
                    iv: iv
                }, key, encoder.encode(prehashedData));

                requestBody.enc = true;
                requestBody.data = Buffer.from(ciphertext).toString("base64");
                requestBody.iv = Buffer.from(iv).toString("base64");
                requestBody.publicKey = newAccountKeyPair.publicKey;

                setIsEncrypting(false);
                setPreHashedData(null);
            } else {
                requestBody.signature = data;
                requestBody.data = prehashedData;
            }

            let response = await fetch("http://3.13.253.48/files", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            handleFileUploadCompletion(await response.json());

        }
    })

    const changeHandler = (event) => {
        setSelectedFile(event.target.files[0]);
        setUploadProgress(-1);
        setIsFilePicked(true);
    };

    const handleFileUploadCompletion = ({ cid }) => {
        setUploadProgress(-1);
        setlastUploadCid(cid);
    }

    const handleSubmission = () => {
        if (!isFilePicked) {
            return;
        }
        var reader = new FileReader();

        reader.onload = function (e) {
            // using xhr since it was easy to track progress, but i was never really able to test this out.
            // my upload speed is too fast and the site slows down with big files since they take a while to read
            xhr.open("POST", "http://3.13.253.48/files", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            var binary = '';
            var bytes = new Uint8Array(e.target.result);
            const data = {
                name: selectedFile.name,
                data: Buffer.from(bytes).toString("base64"),
                file_type: selectedFile.type,
                enc: false,
            }
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    handleFileUploadCompletion(JSON.parse(xhr.response));
                }
            };
            xhr.send(JSON.stringify(data));
        };

        reader.readAsArrayBuffer(selectedFile);

        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
                console.log("upload progress:", event.loaded / event.total);
                setUploadProgress((event.loaded / event.total) * 100);
                // uploadProgress.value = event.loaded / event.total;
            }
        });
    };

    const handleSignature = () => {
        if (!isFilePicked) {
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            var bytes = new Uint8Array(e.target.result);
            var message = Buffer.from(bytes).toString("base64");
            setPreHashedData(message);
            signMessage({ message: message });
        };

        reader.readAsArrayBuffer(selectedFile);
    };

    const handleEncryption = () => {
        if (!isFilePicked) {
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            var bytes = new Uint8Array(e.target.result);
            var message = Buffer.from(bytes).toString("base64");
            setPreHashedData(message);
            signMessage({ message: message });
        };

        setIsEncrypting(true);
        reader.readAsArrayBuffer(selectedFile);
    };

    return (
        <div class="flex flex-col place-items-center h-[250px] mt-6">
            <div class="flex">
                <div>
                    <img class="h-16 w-16 object-cover rounded-full" src="https://images.freeimages.com/fic/images/icons/2813/flat_jewels/512/file.png" alt="File icon" />
                </div>
                <label class="block">
                    <span class="sr-only text-sky-400">Choose a file to upload</span>
                    <input type="file" class="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-grey-500
            hover:file:bg-grey-600 file:mt-4
          " onChange={changeHandler} />
                </label>
            </div>

            <div>
                <button class="text-sm text-slate-500
            mr-4 py-2 px-4
            rounded-full border-0
            text-sm font-semibold
            bg-green-300
            hover:bg-green-400"
                    onClick={handleSubmission}>
                    Submit
                </button>
                {isConnected &&
                    <>
                        <button class="text-sm text-slate-500
                mr-4 py-2 px-4
                rounded-full border-0
                text-sm font-semibold
                bg-green-300
                hover:bg-green-400"
                            onClick={handleSignature}>
                            Sign
                        </button>
                        <button class="text-sm text-slate-500
                    mr-4 py-2 px-4
                    rounded-full border-0
                    text-sm font-semibold
                    bg-green-300
                    hover:bg-green-400"
                            onClick={handleEncryption}>
                            Encrypt
                        </button>
                    </>

                }
            </div>

            {!isConnected &&
                <div className="group px-5 py-4">
                    <h3 className="mb-3 text-2xl font-semibold">
                        Connect wallet to sign & encrypt files
                    </h3>
                </div>

            }

            {/* {uploadProgress >= 0 && uploadProgress < 100 &&
                <CircularProgressWithLabel className="mt-6" value={uploadProgress} />
            } */}

            {lastUploadCid !== "" &&
                <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
                    {/* <a href={`ipfs://${lastUploadCid}`}> */}
                    <h2 className="mb-3 text-2xl font-semibold">
                        Cid: {lastUploadCid}
                    </h2>
                    {/* </a> */}
                </div>
            }

        </div>
    )
}
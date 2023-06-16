"use client"

import FileUploadButton from './fileupload.js'
import GetFileButton from './retrievefile.js'
import Web3Connection from './wallet.js'

export default function Page() {

  return (

    <main>
      <FileUploadButton />
      <GetFileButton />
      <Web3Connection />
    </main >

  )
}

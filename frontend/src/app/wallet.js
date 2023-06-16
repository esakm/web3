'use client'
import { Web3Button, Web3Modal } from '@web3modal/react'

export default function Web3Connection() {
    return (

        <div className="flex-col flex place-items-center space-y-5">
            <Web3Button icon="show" label="Connect Wallet" balance="show" />
        </div>

    )
}
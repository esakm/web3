'use client'

import { Web3Modal } from '@web3modal/react'
import * as React from 'react'
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { arbitrum, mainnet, polygon } from 'wagmi/chains'


export default function Provider({ children }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const chains = [arbitrum, mainnet, polygon]
  const projectId = '1981d7e6c8a123f8866749fd6965e76c'
  const { publicClient } = configureChains(chains, [w3mProvider({ projectId })])
  const wagmiConfig = createConfig({
    autoConnect: true,
    connectors: w3mConnectors({ projectId, version: 1, chains }),
    publicClient
  })
  const ethereumClient = new EthereumClient(wagmiConfig, chains)
  return (
    <WagmiConfig config={wagmiConfig}>
      {mounted && children}
      <Web3Modal
        Web3Modal projectId={projectId} ethereumClient={ethereumClient}
      />
    </WagmiConfig>
  )
}

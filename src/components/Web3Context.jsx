

"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { ethers } from "ethers"

const Web3Context = createContext()

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider")
  }
  return context
}

// This now reads from your .env.local file for better stability
const SUPPORTED_NETWORKS = {
  11155111: {
    name: "Ethereum Sepolia",
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
    chainId: "0xaa36a7",
    symbol: "ETH",
    explorer: "https://sepolia.etherscan.io",
    selector: "16015286601757825753",
  },
  80002: {
    name: "Polygon Amoy",
    rpcUrl: process.env.NEXT_PUBLIC_AMOY_RPC_URL,
    chainId: "0x13882",
    symbol: "MATIC",
    explorer: "https://amoy.polygonscan.com",
    selector: "16281711391670634445",
  },
  43113: {
    name: "Avalanche Fuji",
    rpcUrl: process.env.NEXT_PUBLIC_FUJI_RPC_URL,
    chainId: "0xa869",
    symbol: "AVAX",
    explorer: "https://testnet.snowtrace.io",
    selector: "14767482510784806043",
  },
}

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    if (window.ethereum?.selectedAddress) {
      connectWallet();
    }
    setupEventListeners()
  }, [])
  
  const setupEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => window.location.reload())
      window.ethereum.on("chainChanged", () => window.location.reload())
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask.")
      return
    }
    setIsConnecting(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()
      setProvider(provider)
      setSigner(signer)
      setAccount(address)
      setChainId(Number(network.chainId))
    } catch (error) {
      console.error("Error connecting wallet:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setChainId(null)
  }

   const switchNetwork = async (targetChainId) => {
    if (!window.ethereum) return

    const network = SUPPORTED_NETWORKS[targetChainId]
    if (!network) return

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      })
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: network.chainId,
                chainName: network.name,
                nativeCurrency: {
                  name: network.symbol,
                  symbol: network.symbol,
                  decimals: 18,
                },
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.explorer],
              },
            ],
          })
        } catch (addError) {
          console.error("Error adding network:", addError)
        }
      }
    }
  }

  // This is for WRITING to the blockchain (requires a connected wallet)
  const getContract = (address, abi) => {
    if (!signer) return null
    return new ethers.Contract(address, abi, signer)
  }

  // ** THIS IS THE NEW, IMPORTANT FUNCTION **
  // This is for READING from ANY blockchain (does not require a wallet)
  const getContractForNetwork = (networkId, address, abi) => {
    const network = SUPPORTED_NETWORKS[networkId];
    if (!network?.rpcUrl) {
      console.error(`No RPC URL configured for network ID ${networkId}`);
      return null;
    }
    try {
      const readOnlyProvider = new ethers.JsonRpcProvider(network.rpcUrl);
      return new ethers.Contract(address, abi, readOnlyProvider);
    } catch (error) {
      console.error(`Error creating read-only contract for network ${networkId}:`, error);
      return null;
    }
  }

  const value = {
    account,
    provider,
    signer,
    chainId,
    isConnecting,
    supportedNetworks: SUPPORTED_NETWORKS,
    connectWallet,
    disconnect,
    switchNetwork,
    getContract,
    getContractForNetwork, // <-- Make sure it's included here!
    isConnected: !!account,
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}
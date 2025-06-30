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

const SUPPORTED_NETWORKS = {
  11155111: {
    name: "Ethereum Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    chainId: "0xaa36a7",
    symbol: "ETH",
    explorer: "https://sepolia.etherscan.io",
  },
  80002: {
    name: "Polygon Amoy",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    chainId: "0x13882",
    symbol: "MATIC",
    explorer: "https://amoy.polygonscan.com",
  },
  43113: {
    name: "Avalanche Fuji",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    chainId: "0xa869",
    symbol: "AVAX",
    explorer: "https://testnet.snowtrace.io",
  },
}

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    checkConnection()
    setupEventListeners()
  }, [])

  const checkConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        if (accounts.length > 0) {
          const signer = await provider.getSigner()
          const network = await provider.getNetwork()
          setProvider(provider)
          setSigner(signer)
          setAccount(accounts[0].address)
          setChainId(Number(network.chainId))
        }
      } catch (error) {
        console.error("Error checking connection:", error)
      }
    }
  }

  const setupEventListeners = () => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
    }
  }

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnect()
    } else {
      setAccount(accounts[0])
    }
  }

  const handleChainChanged = (chainId) => {
    setChainId(Number.parseInt(chainId, 16))
    window.location.reload()
  }

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask or another Web3 wallet")
      return
    }

    setIsConnecting(true)
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" })
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
      alert("Failed to connect wallet")
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

  const getContract = (address, abi) => {
    if (!signer) return null
    return new ethers.Contract(address, abi, signer)
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
    isConnected: !!account,
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}

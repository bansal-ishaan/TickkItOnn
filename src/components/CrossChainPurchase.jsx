"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWeb3 } from "./Web3Context"
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract"

const CrossChainPurchase = ({ event, quantity, onBack, onClose }) => {
  const { chainId, account, getContract } = useWeb3()
  const [selectedNetwork, setSelectedNetwork] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [feeEstimate, setFeeEstimate] = useState(null)

  const networks = [
    {
      id: 11155111,
      name: "Ethereum Sepolia",
      icon: "⟠",
      color: "bg-blue-500",
      selector: "16015286601757825753",
    },
    {
      id: 80002,
      name: "Polygon Amoy",
      icon: "⬟",
      color: "bg-purple-500",
      selector: "16281711391670634445",
    },
    {
      id: 43113,
      name: "Avalanche Fuji",
      icon: "🔺",
      color: "bg-red-500",
      selector: "14767482510784806043",
    },
  ]

  useEffect(() => {
    if (selectedNetwork) {
      estimateFee()
    }
  }, [selectedNetwork])

  const estimateFee = async () => {
    try {
      const contract = getContract(CONTRACT_ADDRESS, CONTRACT_ABI)
      if (!contract || !selectedNetwork) return

      const estimate = await contract.estimateCrossChainFee(
        BigInt(selectedNetwork.selector),
        CONTRACT_ADDRESS,
        event.eventId,
        BigInt(quantity),
      )
      setFeeEstimate(estimate)
    } catch (error) {
      console.error("Error estimating fee:", error)
    }
  }

  const handleCrossChainPurchase = async () => {
    if (!account || !selectedNetwork || !feeEstimate) {
      alert("Please select a network and ensure fee estimation is loaded")
      return
    }

    setIsLoading(true)

    try {
      const contract = getContract(CONTRACT_ADDRESS, CONTRACT_ABI)
      if (!contract) {
        throw new Error("Contract not available")
      }

      const tx = await contract.buyTicketsCrossChain(
        BigInt(selectedNetwork.selector),
        CONTRACT_ADDRESS,
        event.eventId,
        BigInt(quantity),
        {
          value: feeEstimate[2], // total cost (fee + ticket cost)
        },
      )

      await tx.wait()
      alert("Cross-chain ticket purchase initiated! Please wait for confirmation.")
      onClose()
    } catch (error) {
      console.error("Error with cross-chain purchase:", error)
      alert("Error with cross-chain purchase. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const currentNetwork = networks.find((n) => n.id === chainId)
  const otherNetworks = networks.filter((n) => n.id !== chainId)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-gray-900">Cross-Chain Purchase</h3>
      </div>

      {/* Current Network Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-blue-900 mb-2">🌐 Cross-Chain Purchase</h4>
        <p className="text-sm text-blue-700 mb-2">
          Event is hosted on <strong>{currentNetwork?.name}</strong>, but you can purchase tickets from any supported
          network.
        </p>
        <p className="text-sm text-blue-600">
          Purchasing {quantity} ticket{quantity > 1 ? "s" : ""} for <strong>{event.name}</strong>
        </p>
      </div>

      {/* Network Selection */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Select Purchase Network</h4>
        <div className="grid grid-cols-1 gap-3">
          {otherNetworks.map((network) => (
            <button
              key={network.id}
              onClick={() => setSelectedNetwork(network)}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedNetwork?.id === network.id
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`w-4 h-4 rounded-full ${network.color}`}></span>
                  <span className="font-medium">{network.name}</span>
                </div>
                {selectedNetwork?.id === network.id && (
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Fee Breakdown */}
      {selectedNetwork && feeEstimate && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Cost Breakdown</h4>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Ticket Cost ({quantity} tickets)</span>
                <span className="font-medium">{ethers.formatEther(feeEstimate[1])} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Cross-Chain Fee (CCIP)</span>
                <span className="font-medium">{ethers.formatEther(feeEstimate[0])} ETH</span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total Cost</span>
                  <span>{ethers.formatEther(feeEstimate[2])} ETH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cross-Chain Info */}
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">⚡ Cross-Chain Process</h4>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>1. Pay ticket cost + CCIP fee on {selectedNetwork?.name}</p>
          <p>2. Chainlink CCIP transfers your payment to {currentNetwork?.name}</p>
          <p>3. Tickets are minted to your address on {currentNetwork?.name}</p>
          <p>4. You can view your tickets in the dashboard</p>
        </div>
      </div>

      {/* Purchase Button */}
      <button
        onClick={handleCrossChainPurchase}
        disabled={isLoading || !selectedNetwork || !feeEstimate || !account}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing Cross-Chain Purchase...
          </div>
        ) : !selectedNetwork ? (
          "Select a Network"
        ) : !feeEstimate ? (
          "Loading Fee Estimate..."
        ) : (
          `Purchase via ${selectedNetwork.name} (${ethers.formatEther(feeEstimate[2])} ETH)`
        )}
      </button>
    </div>
  )
}

export default CrossChainPurchase

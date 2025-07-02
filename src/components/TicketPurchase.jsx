"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWeb3 } from "./Web3Context"
// IMPORTANT: Import the object with all addresses, not the single one
import { CONTRACT_ADDRESSES, CONTRACT_ABI } from "./contract"

// This is now our single, intelligent purchase component
const TicketPurchase = ({ event, onClose, onPurchaseSuccess }) => {
  // Get all the tools we need from our context
  const { chainId, account, getContract, getContractForNetwork, supportedNetworks } = useWeb3()

  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [cost, setCost] = useState(null) // Will hold cost object for same-chain or cross-chain

  // Determine if this is a cross-chain operation
  const isCrossChain = event.networkId !== chainId
  const sourceNetworkName = supportedNetworks[chainId]?.name

  // This useEffect hook is the "brain". It calculates the cost, whether same-chain or cross-chain.
  useEffect(() => {
    const calculateCost = async () => {
      // Don't run if we don't have the necessary info
      if (!event || !account || !chainId) return

      setIsLoading(true)
      setCost(null) // Reset cost on quantity change

      try {
        if (isCrossChain) {
          // --- CROSS-CHAIN COST CALCULATION ---
          // We need to call the contract on the SOURCE chain (where the user's wallet is)
          const sourceContractAddress = CONTRACT_ADDRESSES[chainId]
          if (!sourceContractAddress) throw new Error(`Contract not deployed on your connected network (${sourceNetworkName}).`)
          
          const contract = getContract(sourceContractAddress, CONTRACT_ABI)
          if (!contract) return

          const estimate = await contract.estimateCrossChainFee(
            supportedNetworks[event.networkId].selector, // Destination chain selector
            event.contractAddress, // Destination contract address
            event.eventId,
            BigInt(quantity)
          )
          // The result from estimateCrossChainFee is an array: [fee, ticketCost, total]
          setCost({
            fee: ethers.formatEther(estimate[0]),
            ticketCost: ethers.formatEther(estimate[1]),
            total: ethers.formatEther(estimate[2]),
            totalInWei: estimate[2]
          })

        } else {
          // --- SAME-CHAIN COST CALCULATION ---
          // We can read directly from the event's contract
          const contract = getContractForNetwork(event.networkId, event.contractAddress, CONTRACT_ABI)
          if (!contract) return
          
          const totalInWei = await contract.calculateCrossChainTicketCost(event.eventId, BigInt(quantity))
          setCost({
            total: ethers.formatEther(totalInWei),
            totalInWei: totalInWei
          })
        }
      } catch (error) {
        console.error("Error calculating cost:", error)
        // Optionally display this error to the user
      } finally {
        setIsLoading(false)
      }
    }

    calculateCost()
  }, [quantity, event, chainId, account, isCrossChain])

  // This is the single "Purchase" function that handles both cases
  const handlePurchase = async () => {
    if (!cost) {
      alert("Cost has not been calculated yet. Please wait.")
      return
    }

    setIsLoading(true)
    
    try {
      if (isCrossChain) {
        // --- CROSS-CHAIN PURCHASE EXECUTION ---
        const sourceContractAddress = CONTRACT_ADDRESSES[chainId]
        const contract = getContract(sourceContractAddress, CONTRACT_ABI)
        
        const tx = await contract.buyTicketsCrossChain(
          supportedNetworks[event.networkId].selector,
          event.contractAddress,
          event.eventId,
          BigInt(quantity),
          { value: cost.totalInWei }
        )
        await tx.wait()
        alert("Cross-chain purchase initiated! It may take a few minutes to confirm on the destination chain.")

      } else {
        // --- SAME-CHAIN PURCHASE EXECUTION ---
        const contract = getContract(event.contractAddress, CONTRACT_ABI)
        
        const tx = await contract.buyTickets(
          event.eventId,
          BigInt(quantity),
          { value: cost.totalInWei }
        )
        await tx.wait()
        alert("Tickets purchased successfully!")
      }

      if (onPurchaseSuccess) {
        onPurchaseSuccess(event, quantity, cost.total)
      }
      onClose()

    } catch (error) {
      console.error("Purchase failed:", error)
      alert(`Transaction failed. Check console for details.`)
    } finally {
      setIsLoading(false)
    }
  }

  const availableTickets = Number(event.totalTickets) - Number(event.ticketsSold)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {isCrossChain ? "Cross-Chain Purchase" : "Purchase Tickets"}
            </h2>
            <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-gray-600">×</button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
            <p><strong>Event:</strong> {event.name}</p>
            <p><strong>Location:</strong> {event.venue}</p>
            <p><strong>Event Chain:</strong> {event.networkName}</p>
            {isCrossChain && <p><strong>Your Chain:</strong> {sourceNetworkName}</p>}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Tickets</label>
            <div className="flex items-center space-x-4">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-1 bg-gray-200 rounded">-</button>
                <span className="text-xl font-bold">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(availableTickets, q + 1))} className="px-3 py-1 bg-gray-200 rounded">+</button>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Cost Breakdown</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2 text-sm">
              {!cost ? (
                <p>Calculating cost...</p>
              ) : isCrossChain ? (
                <>
                  <div className="flex justify-between"><span>Ticket(s) Cost</span><span>{cost.ticketCost} ETH</span></div>
                  <div className="flex justify-between"><span>Cross-Chain Fee</span><span>{cost.fee} ETH</span></div>
                  <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between font-bold"><span>Total</span><span>{cost.total} ETH</span></div>
                </>
              ) : (
                <div className="flex justify-between font-bold"><span>Total Cost</span><span>{cost.total} ETH</span></div>
              )}
            </div>
          </div>

          <button
            onClick={handlePurchase}
            disabled={isLoading || !cost || availableTickets < quantity}
            className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-all disabled:opacity-50 disabled:cursor-wait ${
              isCrossChain 
                ? "bg-gradient-to-r from-orange-500 to-red-500" 
                : "bg-gradient-to-r from-purple-600 to-blue-600"
            }`}
          >
            {isLoading ? "Processing..." : `Confirm Purchase (${cost?.total || '...'} ETH)`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TicketPurchase
"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWeb3 } from "./Web3Context"
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract"
import CrossChainPurchase from "./CrossChainPurchase"

const TicketPurchase = ({ event, onClose, onPurchaseSuccess }) => {
  const { chainId, account, getContract } = useWeb3()
  const [quantity, setQuantity] = useState(1)
  const [showCrossChain, setShowCrossChain] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [ticketCost, setTicketCost] = useState(0n)

  useEffect(() => {
    calculateTicketCost()
  }, [quantity, event])

  const calculateTicketCost = async () => {
    try {
      const contract = getContract(CONTRACT_ADDRESS, CONTRACT_ABI)
      if (!contract) return

      const cost = await contract.calculateCrossChainTicketCost(event.eventId, BigInt(quantity))
      setTicketCost(cost)
    } catch (error) {
      console.error("Error calculating ticket cost:", error)
    }
  }

  const handlePurchase = async () => {
    if (!account) {
      alert("Please connect your wallet")
      return
    }

    setIsLoading(true)

    try {
      const contract = getContract(CONTRACT_ADDRESS, CONTRACT_ABI)
      if (!contract) {
        throw new Error("Contract not available")
      }

      const tx = await contract.buyTickets(event.eventId, BigInt(quantity), {
        value: ticketCost,
      })

      await tx.wait()

      // Store purchase info for dashboard display
      if (onPurchaseSuccess) {
        onPurchaseSuccess(event, quantity, totalCost)
      }

      alert("Tickets purchased successfully!")
      onClose()
    } catch (error) {
      console.error("Error purchasing tickets:", error)
      alert("Error purchasing tickets. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateDynamicPrices = () => {
    const prices = []
    const basePrice = Number(ethers.formatEther(event.basePrice))

    for (let i = 0; i < quantity; i++) {
      const ticketNumber = Number(event.ticketsSold) + i
      const increment = basePrice * (ticketNumber * 0.001) // 0.1% increment per ticket
      prices.push(basePrice + increment)
    }

    return prices
  }

  const dynamicPrices = calculateDynamicPrices()
  const totalCost = dynamicPrices.reduce((sum, price) => sum + price, 0)
  const availableTickets = Number(event.totalTickets) - Number(event.ticketsSold)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Purchase Tickets</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Event Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-lg mb-2">{event.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="mr-2">📍</span>
                <span>{event.venue}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📅</span>
                <span>{new Date(Number(event.eventDate) * 1000).toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🎫</span>
                <span>{availableTickets} tickets available</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">💰</span>
                <span>Base Price: {ethers.formatEther(event.basePrice)} ETH</span>
              </div>
            </div>
          </div>

          {!showCrossChain ? (
            <>
              {/* Quantity Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Tickets</label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(availableTickets, quantity + 1))}
                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                  <input
                    type="range"
                    min="1"
                    max={Math.min(availableTickets, 10)}
                    value={quantity}
                    onChange={(e) => setQuantity(Number.parseInt(e.target.value))}
                    className="flex-1 ml-4"
                  />
                </div>
              </div>

              {/* Dynamic Pricing Breakdown */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Price Breakdown</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="space-y-2">
                    {dynamicPrices.map((price, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>Ticket #{Number(event.ticketsSold) + index + 1}</span>
                        <span className="font-medium">{price.toFixed(6)} ETH</span>
                      </div>
                    ))}
                    <div className="border-t border-blue-300 pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total Cost</span>
                        <span>{totalCost.toFixed(6)} ETH</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Options */}
              <div className="space-y-4">
                <button
                  onClick={handlePurchase}
                  disabled={isLoading || !account || availableTickets === 0}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `Buy ${quantity} Ticket${quantity > 1 ? "s" : ""} on Current Network`
                  )}
                </button>

                <button
                  onClick={() => setShowCrossChain(true)}
                  className="w-full bg-white border-2 border-purple-600 text-purple-600 py-3 px-6 rounded-lg font-medium hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all"
                >
                  🌐 Buy from Another Network
                </button>
              </div>

              {/* Dynamic Pricing Info */}
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">📈 Dynamic Pricing</h4>
                <p className="text-sm text-yellow-700">
                  Ticket prices increase by 0.1% for each ticket sold. Buy early to get the best price!
                </p>
              </div>
            </>
          ) : (
            <CrossChainPurchase
              event={event}
              quantity={quantity}
              onBack={() => setShowCrossChain(false)}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default TicketPurchase

"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { useWeb3 } from "./Web3Context"
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract"

const EventCreation = () => {
  const { chainId, account, getContract } = useWeb3()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    venue: "",
    eventDate: "",
    totalTickets: "",
    basePrice: "",
    metadataURI: "",
    stake: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const getMinimumStake = () => {
    if (!chainId) return "0"
    switch (chainId) {
      case 11155111: // Sepolia
        return "0.1"
      case 43113: // Avalanche Fuji
        return "0.000634"
      case 80002: // Polygon Amoy
        return "0.063"
      default:
        return "0"
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
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

      const eventDateTimestamp = Math.floor(new Date(formData.eventDate).getTime() / 1000)
      const stakeAmount = ethers.parseEther(formData.stake || getMinimumStake())

      const tx = await contract.createEvent(
        formData.name,
        formData.description,
        formData.venue,
        BigInt(eventDateTimestamp),
        BigInt(formData.totalTickets),
        ethers.parseEther(formData.basePrice),
        formData.metadataURI || `https://api.tickiton.com/metadata/${formData.name}`,
        {
          value: stakeAmount,
        },
      )

      await tx.wait()
      alert("Event created successfully!")
      setFormData({
        name: "",
        description: "",
        venue: "",
        eventDate: "",
        totalTickets: "",
        basePrice: "",
        metadataURI: "",
        stake: "",
      })
    } catch (error) {
      console.error("Error creating event:", error)
      alert("Error creating event. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const minStake = getMinimumStake()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h2>
          <p className="text-gray-600">Create a new event and start selling tickets across multiple blockchains</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter event name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Describe your event"
            />
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Venue *</label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Event venue"
            />
          </div>

          {/* Event Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Date & Time *</label>
            <input
              type="datetime-local"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Total Tickets & Base Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Tickets *</label>
              <input
                type="number"
                name="totalTickets"
                value={formData.totalTickets}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (ETH) *</label>
              <input
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleInputChange}
                required
                min="0"
                step="0.001"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.01"
              />
            </div>
          </div>

          {/* Organizer Stake */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Organizer Stake (ETH)</label>
            <input
              type="number"
              name="stake"
              value={formData.stake}
              onChange={handleInputChange}
              min={minStake}
              step="0.001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={`Minimum: ${minStake} ETH`}
            />
            <p className="text-sm text-gray-500 mt-1">Minimum stake for current network: {minStake} ETH</p>
          </div>

          {/* Metadata URI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Metadata URI (Optional)</label>
            <input
              type="url"
              name="metadataURI"
              value={formData.metadataURI}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://your-metadata-uri.com"
            />
          </div>

          {/* Dynamic Pricing Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">📈 Dynamic Pricing</h4>
            <p className="text-sm text-blue-700">
              Ticket prices will increase by 0.1% for each ticket sold. The first ticket will cost{" "}
              {formData.basePrice || "0"} ETH, and prices will gradually increase with demand.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !account}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Event...
              </div>
            ) : (
              "Create Event"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default EventCreation

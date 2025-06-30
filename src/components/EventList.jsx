"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWeb3 } from "./Web3Context"
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract"
import TicketPurchase from "./TicketPurchase"

const EventList = () => {
  const { getContract, chainId, account } = useWeb3()
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [chainId])

  const fetchEvents = async () => {
    try {
      const contract = getContract(CONTRACT_ADDRESS, CONTRACT_ABI)
      if (!contract) {
        setIsLoading(false)
        return
      }

      const activeEvents = await contract.getActiveEvents(0, 20)
      setEvents(activeEvents || [])
    } catch (error) {
      console.error("Error fetching events:", error)
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const calculateCurrentPrice = (basePrice, ticketsSold) => {
    const basePriceNum = Number(ethers.formatEther(basePrice))
    const increment = basePriceNum * (Number(ticketsSold) * 0.001) // 0.1% increment
    return basePriceNum + increment
  }

  const getAvailableTickets = (totalTickets, ticketsSold) => {
    return Number(totalTickets) - Number(ticketsSold)
  }

  const storePurchaseInfo = (eventData, quantity, totalCost) => {
    const purchaseInfo = {
      eventId: Number(eventData.eventId),
      eventName: eventData.name,
      eventVenue: eventData.venue,
      eventDate: Number(eventData.eventDate),
      quantity: quantity,
      totalCost: totalCost,
      purchaseDate: Date.now(),
      userAddress: account,
    }

    console.log("Storing purchase info:", purchaseInfo) // Debug log

    // Store in localStorage for demo (in production, this would be handled by the smart contract)
    const existingPurchases = JSON.parse(localStorage.getItem("ticketPurchases") || "[]")
    existingPurchases.push(purchaseInfo)
    localStorage.setItem("ticketPurchases", JSON.stringify(existingPurchases))

    console.log("All purchases:", existingPurchases) // Debug log
  }

  const handlePurchaseClick = (event) => {
    setSelectedEvent(event)
    setShowPurchaseModal(true)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Active Events</h2>
        <p className="text-gray-600">Discover and purchase tickets for events across multiple blockchains</p>
      </div>

      {!events || events.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Active Events</h3>
          <p className="text-gray-500">Be the first to create an event!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => {
            const currentPrice = calculateCurrentPrice(event.basePrice, event.ticketsSold)
            const availableTickets = getAvailableTickets(event.totalTickets, event.ticketsSold)
            const isEventPast = Number(event.eventDate) * 1000 < Date.now()

            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{event.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isEventPast
                          ? "bg-red-100 text-red-800"
                          : availableTickets > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {isEventPast ? "Past" : availableTickets > 0 ? "Available" : "Sold Out"}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{event.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-2">📍</span>
                      <span>{event.venue}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-2">📅</span>
                      <span>{formatDate(event.eventDate)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-2">🎫</span>
                      <span>
                        {availableTickets} / {Number(event.totalTickets)} available
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Current Price</p>
                        <p className="text-2xl font-bold text-purple-600">{currentPrice.toFixed(4)} ETH</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Base Price</p>
                        <p className="text-lg font-medium text-gray-900">{ethers.formatEther(event.basePrice)} ETH</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>Tickets Sold</span>
                        <span>
                          {Number(event.ticketsSold)} / {Number(event.totalTickets)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(Number(event.ticketsSold) / Number(event.totalTickets)) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePurchaseClick(event)}
                      disabled={isEventPast || availableTickets === 0}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isEventPast ? "Event Ended" : availableTickets === 0 ? "Sold Out" : "Buy Tickets"}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedEvent && (
        <TicketPurchase
          event={selectedEvent}
          onClose={() => {
            setShowPurchaseModal(false)
            setSelectedEvent(null)
            fetchEvents()
          }}
          onPurchaseSuccess={storePurchaseInfo}
        />
      )}
    </div>
  )
}

export default EventList

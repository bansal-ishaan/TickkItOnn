"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "./Web3Context"

const ResaleMarketplace = () => {
  const { account, getContract } = useWeb3()
  const [isLoading, setIsLoading] = useState(false)
  const [resaleListings, setResaleListings] = useState([])

  useEffect(() => {
    fetchResaleListings()
  }, [])

  const fetchResaleListings = () => {
    try {
      const listings = JSON.parse(localStorage.getItem("resaleListings") || "[]")
      const activeListings = listings.filter((listing) => listing.status === "active")
      setResaleListings(activeListings)
      console.log("Fetched resale listings:", activeListings) // Debug log
    } catch (error) {
      console.error("Error fetching resale listings:", error)
      setResaleListings([])
    }
  }

  const handleBuyResaleTicket = async (listing) => {
    if (!account) {
      alert("Please connect your wallet")
      return
    }

    if (listing.sellerAddress?.toLowerCase() === account?.toLowerCase()) {
      alert("You cannot buy your own ticket!")
      return
    }

    setIsLoading(true)
    try {
      // For demo purposes, we'll simulate the blockchain transaction
      console.log("Buying resale ticket:", listing)

      // Update listing status to sold
      const allListings = JSON.parse(localStorage.getItem("resaleListings") || "[]")
      const updatedListings = allListings.map((l) =>
        l.resaleId === listing.resaleId ? { ...l, status: "sold", buyerAddress: account, soldDate: Date.now() } : l,
      )
      localStorage.setItem("resaleListings", JSON.stringify(updatedListings))

      // Add ticket to buyer's collection
      const purchaseInfo = {
        eventId: listing.eventId,
        eventName: listing.eventName,
        eventVenue: listing.eventVenue,
        eventDate: listing.eventDate,
        quantity: 1,
        totalCost: Number.parseFloat(listing.resalePrice),
        purchaseDate: Date.now(),
        userAddress: account,
        isResalePurchase: true,
        originalTicketId: listing.originalTicketId,
      }

      const existingPurchases = JSON.parse(localStorage.getItem("ticketPurchases") || "[]")
      existingPurchases.push(purchaseInfo)
      localStorage.setItem("ticketPurchases", JSON.stringify(existingPurchases))

      console.log("Added purchase to buyer:", purchaseInfo) // Debug log

      alert("Resale ticket purchased successfully!")
      fetchResaleListings() // Refresh listings
    } catch (error) {
      console.error("Error buying resale ticket:", error)
      alert("Error buying resale ticket. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Resale Marketplace</h2>
            <p className="text-gray-600">Buy and sell tickets from other users</p>
          </div>
        </div>
      </div>

      {/* Resale Rules Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="font-bold text-blue-900 mb-4">📋 Resale Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <h4 className="font-medium mb-2">For Sellers:</h4>
            <ul className="space-y-1">
              <li>• You receive 90% of your original purchase price</li>
              <li>• Tickets can be listed at current market price</li>
              <li>• No fixed price caps - market determines value</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">For Buyers:</h4>
            <ul className="space-y-1">
              <li>• Pay current dynamic market price</li>
              <li>• 70% of profit goes to platform</li>
              <li>• 30% of profit goes to event organizer</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Resale Listings */}
      {resaleListings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Tickets for Resale</h3>
          <p className="text-gray-500">Check back later for available tickets!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resaleListings.map((listing) => (
            <div
              key={listing.resaleId}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Listing Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold mb-1">{listing.eventName}</h3>
                    <p className="text-orange-100 text-sm">Resale Ticket</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    For Sale
                  </span>
                </div>
              </div>

              {/* Listing Details */}
              <div className="p-6">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📍</span>
                    <span>{listing.eventVenue}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📅</span>
                    <span>{formatDate(listing.eventDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">🕒</span>
                    <span>Listed: {formatDateTime(listing.listingDate)}</span>
                  </div>
                </div>

                {/* Price Info */}
                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Original Price</span>
                    <span className="text-sm font-medium text-gray-900">{listing.originalPrice} ETH</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Resale Price</span>
                    <span className="text-2xl font-bold text-orange-600">{listing.resalePrice} ETH</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleBuyResaleTicket(listing)}
                  disabled={isLoading || listing.sellerAddress?.toLowerCase() === account?.toLowerCase()}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : listing.sellerAddress?.toLowerCase() === account?.toLowerCase() ? (
                    "Your Listing"
                  ) : (
                    `Buy for ${listing.resalePrice} ETH`
                  )}
                </button>

                {/* Seller Info */}
                <div className="mt-3 text-xs text-gray-500 text-center">
                  Seller: {listing.sellerAddress?.slice(0, 6)}...{listing.sellerAddress?.slice(-4)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ResaleMarketplace

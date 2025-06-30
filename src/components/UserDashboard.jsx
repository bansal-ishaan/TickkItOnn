"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWeb3 } from "./Web3Context"
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract"

const UserDashboard = () => {
  const { account, getContract } = useWeb3()
  const [activeTab, setActiveTab] = useState("tickets")
  const [userTickets, setUserTickets] = useState(0)
  const [pendingRefunds, setPendingRefunds] = useState(0n)
  const [isLoading, setIsLoading] = useState(false)
  const [userTicketsDetails, setUserTicketsDetails] = useState([])
  const [showResaleModal, setShowResaleModal] = useState(false)
  const [selectedTicketForResale, setSelectedTicketForResale] = useState(null)
  const [resalePrice, setResalePrice] = useState("")

  useEffect(() => {
    if (account) {
      fetchUserData()
    }
  }, [account])

  const fetchUserData = async () => {
    try {
      const contract = getContract(CONTRACT_ADDRESS, CONTRACT_ABI)
      if (!contract) return

      const [balance, refunds] = await Promise.all([contract.balanceOf(account), contract.pendingRefunds(account)])

      setUserTickets(Number(balance))
      setPendingRefunds(refunds)

      // Fetch detailed ticket information
      await fetchUserTicketDetails(contract, Number(balance))
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const fetchUserTicketDetails = async (contract, ticketCount) => {
    try {
      // Get purchases from localStorage for demo
      const allPurchases = JSON.parse(localStorage.getItem("ticketPurchases") || "[]")
      const resaleListings = JSON.parse(localStorage.getItem("resaleListings") || "[]")

      console.log("All purchases from storage:", allPurchases) // Debug log
      console.log("Resale listings:", resaleListings) // Debug log

      const userPurchases = allPurchases.filter(
        (purchase) => purchase.userAddress?.toLowerCase() === account?.toLowerCase(),
      )

      console.log("User purchases:", userPurchases) // Debug log

      const ticketDetails = []
      let ticketIdCounter = 1

      userPurchases.forEach((purchase) => {
        for (let i = 0; i < purchase.quantity; i++) {
          const ticketId = ticketIdCounter++

          // Check if this ticket is listed for resale
          const isListed = resaleListings.some(
            (listing) =>
              listing.originalTicketId === ticketId &&
              listing.sellerAddress?.toLowerCase() === account?.toLowerCase() &&
              listing.status === "active",
          )

          const ticket = {
            ticketId: ticketId,
            eventId: purchase.eventId,
            eventName: purchase.eventName,
            eventVenue: purchase.eventVenue,
            eventDate: purchase.eventDate,
            purchasePrice: ethers.parseEther(((purchase.totalCost || 0) / purchase.quantity).toFixed(6)),
            purchaseDate: purchase.purchaseDate,
            isUsed: false,
            canResale: !isListed,
            isListed: isListed,
          }
          ticketDetails.push(ticket)
        }
      })

      console.log("Processed ticket details:", ticketDetails) // Debug log
      setUserTicketsDetails(ticketDetails)
      setUserTickets(ticketDetails.length)
    } catch (error) {
      console.error("Error fetching ticket details:", error)
    }
  }

  const handleWithdrawRefund = async () => {
    if (!account) return

    setIsLoading(true)
    try {
      const contract = getContract(CONTRACT_ADDRESS, CONTRACT_ABI)
      if (!contract) return

      const tx = await contract.withdrawRefund()
      await tx.wait()
      alert("Refund withdrawn successfully!")
      fetchUserData()
    } catch (error) {
      console.error("Error withdrawing refund:", error)
      alert("Error withdrawing refund. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResaleTicket = async () => {
    if (!selectedTicketForResale || !resalePrice) {
      alert("Please enter a resale price")
      return
    }

    setIsLoading(true)
    try {
      // For demo purposes, we'll simulate the blockchain transaction
      // In a real app, this would call the smart contract
      console.log("Listing ticket for resale:", selectedTicketForResale, resalePrice)

      // Store resale listing info
      const resaleListing = {
        resaleId: Date.now(), // Simple ID for demo
        originalTicketId: selectedTicketForResale.ticketId,
        eventId: selectedTicketForResale.eventId,
        eventName: selectedTicketForResale.eventName,
        eventVenue: selectedTicketForResale.eventVenue,
        eventDate: selectedTicketForResale.eventDate,
        originalPrice: ethers.formatEther(selectedTicketForResale.purchasePrice),
        resalePrice: resalePrice,
        sellerAddress: account,
        listingDate: Date.now(),
        status: "active",
      }

      const existingListings = JSON.parse(localStorage.getItem("resaleListings") || "[]")
      existingListings.push(resaleListing)
      localStorage.setItem("resaleListings", JSON.stringify(existingListings))

      console.log("Stored resale listing:", resaleListing) // Debug log

      alert("Ticket listed for resale successfully!")
      setShowResaleModal(false)
      setSelectedTicketForResale(null)
      setResalePrice("")
      fetchUserData() // Refresh data
    } catch (error) {
      console.error("Error listing ticket for resale:", error)
      alert("Error listing ticket for resale. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔐</div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-500">Please connect your wallet to view your dashboard</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h2>
        <p className="text-gray-600">Manage your tickets, view transaction history, and handle refunds</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">🎫</div>
            <div>
              <p className="text-sm text-gray-500">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{userTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">💰</div>
            <div>
              <p className="text-sm text-gray-500">Pending Refunds</p>
              <p className="text-2xl font-bold text-gray-900">{ethers.formatEther(pendingRefunds)} ETH</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">🔄</div>
            <div>
              <p className="text-sm text-gray-500">Active Listings</p>
              <p className="text-2xl font-bold text-gray-900">
                {userTicketsDetails.filter((ticket) => ticket.isListed).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Refunds */}
      {pendingRefunds && Number(pendingRefunds) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-yellow-900">Pending Refund Available</h4>
              <p className="text-sm text-yellow-700">
                You have {ethers.formatEther(pendingRefunds)} ETH available for withdrawal
              </p>
            </div>
            <button
              onClick={handleWithdrawRefund}
              disabled={isLoading}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Withdraw"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "tickets", label: "My Tickets", icon: "🎫" },
              { id: "history", label: "Transaction History", icon: "📋" },
              { id: "listings", label: "Resale Listings", icon: "🏪" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "tickets" && (
            <MyTickets
              userTickets={userTickets}
              userTicketsDetails={userTicketsDetails}
              onResaleClick={(ticket) => {
                setSelectedTicketForResale(ticket)
                setShowResaleModal(true)
              }}
            />
          )}
          {activeTab === "history" && <TransactionHistory />}
          {activeTab === "listings" && <ResaleListings userTicketsDetails={userTicketsDetails} />}
        </div>

        {/* Resale Modal */}
        {showResaleModal && selectedTicketForResale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">List Ticket for Resale</h3>
                  <button
                    onClick={() => {
                      setShowResaleModal(false)
                      setSelectedTicketForResale(null)
                      setResalePrice("")
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Ticket Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">{selectedTicketForResale.eventName}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Ticket #{selectedTicketForResale.ticketId}</p>
                    <p>Venue: {selectedTicketForResale.eventVenue}</p>
                    <p>Original Price: {ethers.formatEther(selectedTicketForResale.purchasePrice)} ETH</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Resale Price (ETH)</label>
                    <input
                      type="number"
                      value={resalePrice}
                      onChange={(e) => setResalePrice(e.target.value)}
                      min="0"
                      step="0.001"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.01"
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">💡 Pricing Guidelines</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• You'll receive 90% of the resale price</li>
                      <li>• Consider current market demand</li>
                      <li>• Price competitively for quick sale</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleResaleTicket}
                    disabled={!resalePrice || isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Listing...
                      </div>
                    ) : (
                      "List Ticket for Resale"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// My Tickets Component
const MyTickets = ({ userTickets, userTicketsDetails, onResaleClick }) => {
  if (userTickets === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🎫</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Tickets Yet</h3>
        <p className="text-gray-500">Purchase tickets to see them here</p>
      </div>
    )
  }

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-600">You have {userTickets} ticket(s) in your wallet.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {userTicketsDetails.map((ticket) => (
          <div
            key={ticket.ticketId}
            className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            {/* Ticket Header */}
            <div
              className={`text-white p-4 ${ticket.isListed ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gradient-to-r from-purple-600 to-blue-600"}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold mb-1">{ticket.eventName}</h3>
                  <p className={`text-sm ${ticket.isListed ? "text-orange-100" : "text-purple-100"}`}>
                    Ticket #{ticket.ticketId}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      ticket.isListed
                        ? "bg-orange-100 text-orange-800"
                        : ticket.isUsed
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {ticket.isListed ? "Listed for Resale" : ticket.isUsed ? "Used" : "Valid"}
                  </span>
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📍</span>
                  <span>{ticket.eventVenue}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📅</span>
                  <span>{formatDate(ticket.eventDate)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">💰</span>
                  <span>Purchased for: {ethers.formatEther(ticket.purchasePrice)} ETH</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">🕒</span>
                  <span>Purchased: {formatDateTime(ticket.purchaseDate)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onResaleClick(ticket)}
                    disabled={ticket.isUsed || !ticket.canResale || ticket.isListed}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                  >
                    {ticket.isListed ? "Already Listed" : ticket.isUsed ? "Ticket Used" : "List for Resale"}
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          Your tickets are stored as NFTs on the blockchain. You can view them in your wallet or on NFT marketplaces.
        </p>
      </div>
    </div>
  )
}

// Transaction History Component
const TransactionHistory = () => {
  return (
    <div className="text-center py-8">
      <div className="text-4xl mb-4">📋</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Transaction History</h3>
      <p className="text-gray-500">Your transaction history will appear here</p>
    </div>
  )
}

// Resale Listings Component
const ResaleListings = ({ userTicketsDetails }) => {
  const listedTickets = userTicketsDetails.filter((ticket) => ticket.isListed)

  if (listedTickets.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🏪</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Listings</h3>
        <p className="text-gray-500">List your tickets for resale to see them here</p>
      </div>
    )
  }

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  // Get resale listings from localStorage to show actual prices
  const resaleListings = JSON.parse(localStorage.getItem("resaleListings") || "[]")

  return (
    <div className="space-y-6">
      <p className="text-gray-600">You have {listedTickets.length} ticket(s) listed for resale.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {listedTickets.map((ticket) => {
          // Find the corresponding resale listing
          const resaleListing = resaleListings.find(
            (listing) => listing.originalTicketId === ticket.ticketId && listing.status === "active",
          )

          return (
            <div
              key={ticket.ticketId}
              className="bg-white border border-orange-200 rounded-xl shadow-lg overflow-hidden"
            >
              {/* Listing Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold mb-1">{ticket.eventName}</h3>
                    <p className="text-orange-100 text-sm">Listed for Resale</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Active
                  </span>
                </div>
              </div>

              {/* Listing Details */}
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📍</span>
                    <span>{ticket.eventVenue}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📅</span>
                    <span>{formatDate(ticket.eventDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">💰</span>
                    <span>Original Price: {ethers.formatEther(ticket.purchasePrice)} ETH</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Listing Price</span>
                    <span className="text-lg font-bold text-orange-600">
                      {resaleListing ? `${resaleListing.resalePrice} ETH` : "-- ETH"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default UserDashboard

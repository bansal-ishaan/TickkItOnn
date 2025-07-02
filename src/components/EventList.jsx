


"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWeb3 } from "./Web3Context"
import { CONTRACT_ADDRESSES, CONTRACT_ABI } from "./contract"
import TicketPurchase from "./TicketPurchase"

const EventList = () => {
  const { chainId, account, getContractForNetwork, supportedNetworks } = useWeb3()
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  const fetchEventsSequentially = async () => {
    if (!supportedNetworks) return;
    setIsLoading(true);

    const allEvents = [];
    const networkIds = Object.keys(supportedNetworks);

    for (const id of networkIds) {
      const networkId = Number(id);
      const networkName = supportedNetworks[networkId]?.name || `Network ${networkId}`;
      const contractAddress = CONTRACT_ADDRESSES[networkId];

      if (!contractAddress) continue;

      try {
        const contract = getContractForNetwork(networkId, contractAddress, CONTRACT_ABI);
        if (!contract) continue;

        const networkEvents = await contract.getActiveEvents(0, 20);
        console.log(`Raw data from ${networkName}:`, networkEvents); // DEBUG: See what the contract returns

        const eventsWithNetworkInfo = networkEvents
          // **FIX #1: DATA CLEANING**
          // Filter out any "event" that doesn't have a valid basePrice.
          .filter(event => event.basePrice !== null && typeof event.basePrice !== 'undefined' && event.name)
          .map(event => ({
            // It's safer to explicitly destructure properties from the ethers Result object
            eventId: event.eventId,
            organizer: event.organizer,
            name: event.name,
            description: event.description,
            venue: event.venue,
            eventDate: event.eventDate,
            totalTickets: event.totalTickets,
            basePrice: event.basePrice,
            ticketsSold: event.ticketsSold,
            // Now add our own metadata
            networkId: networkId,
            networkName: networkName,
            contractAddress: contractAddress,
            networkIcon: networkName.includes("Sepolia") ? "⟠" : networkName.includes("Amoy") ? "⬟" : "🔺",
            networkColor: networkName.includes("Sepolia") ? "bg-blue-500" : networkName.includes("Amoy") ? "bg-purple-500" : "bg-red-500",
          }));
        
        allEvents.push(...eventsWithNetworkInfo);

      } catch (error) {
        console.error(`Failed to fetch events from ${networkName}:`, error);
      }
    }
    
    allEvents.sort((a, b) => Number(b.eventDate) - Number(a.eventDate));
    
    setEvents(allEvents);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEventsSequentially();
  }, []);

  // **FIX #2: DEFENSIVE RENDERING**
  // This function will no longer crash if basePrice is null.
  const calculateCurrentPrice = (basePrice, ticketsSold) => {
    // Guard Clause: If basePrice is not valid, return a default value.
    if (basePrice === null || typeof basePrice === 'undefined') {
      return 0; 
    }
    const basePriceNum = Number(ethers.formatEther(basePrice));
    const increment = basePriceNum * (Number(ticketsSold) * 0.001);
    return basePriceNum + increment;
  };

  // --- The rest of your functions and JSX are fine ---
  
  const formatDate = (timestamp) => new Date(Number(timestamp) * 1000).toLocaleString();
  const getAvailableTickets = (totalTickets, ticketsSold) => Number(totalTickets) - Number(ticketsSold);
  const handlePurchaseClick = (event) => {
    setSelectedEvent(event);
    setShowPurchaseModal(true);
  };
  const storePurchaseInfo = (eventData, quantity, totalCost) => {
    const purchaseInfo = {
      eventId: Number(eventData.eventId),
      eventName: eventData.name,
      networkId: eventData.networkId,
      networkName: eventData.networkName,
      quantity: quantity,
      totalCost: totalCost,
      purchaseDate: Date.now(),
      userAddress: account,
    };
    const existingPurchases = JSON.parse(localStorage.getItem("ticketPurchases") || "[]");
    existingPurchases.push(purchaseInfo);
    localStorage.setItem("ticketPurchases", JSON.stringify(existingPurchases));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // I am using the full JSX from our previous correct answer
  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Active Events</h2>
          <p className="text-gray-600">Discover events across Sepolia, Amoy, and Fuji</p>
        </div>
        <button 
          onClick={fetchEventsSequentially} 
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          title="Refresh events"
        >
          🔄 Refresh
        </button>
      </div>

      {!events || events.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Active Events Found</h3>
          <p className="text-gray-500">Be the first to create an event, or check the console for errors.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const currentPrice = calculateCurrentPrice(event.basePrice, event.ticketsSold);
            const availableTickets = getAvailableTickets(event.totalTickets, event.ticketsSold);
            const isEventPast = Number(event.eventDate) * 1000 < Date.now();
            const isSameNetwork = chainId === event.networkId;

            return (
              <div key={`${event.networkId}-${event.eventId}`} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow">
                {/* Network Badge */}
                <div className={`${event.networkColor} text-white px-4 py-2 flex items-center justify-between`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{event.networkIcon}</span>
                    <span className="text-sm font-medium">{event.networkName}</span>
                  </div>
                  {!isSameNetwork && (
                    <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">Cross-Chain</span>
                  )}
                </div>

                <div className="p-6 flex-grow flex flex-col">
                  {/* Card Body */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{event.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${isEventPast ? "bg-red-100 text-red-800" : availableTickets > 0 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {isEventPast ? "Past" : availableTickets > 0 ? "Available" : "Sold Out"}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{event.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">📍<span className="ml-2">{event.venue}</span></div>
                    <div className="flex items-center text-sm text-gray-500">📅<span className="ml-2">{formatDate(event.eventDate)}</span></div>
                    <div className="flex items-center text-sm text-gray-500">🎫<span className="ml-2">{availableTickets} / {Number(event.totalTickets)} available</span></div>
                  </div>

                  {/* Card Footer with Pricing and Button */}
                  <div className="border-t pt-4 mt-auto">
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
                    
                    {/* Dynamic Purchase Button */}
                    <button
                      onClick={() => handlePurchaseClick(event)}
                      disabled={isEventPast || availableTickets === 0}
                      className={`w-full py-2 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                        isSameNetwork
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 focus:ring-purple-500"
                          : "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 focus:ring-orange-500"
                      }`}
                    >
                      {isEventPast ? "Event Ended" : availableTickets === 0 ? "Sold Out" : (isSameNetwork ? "Buy Tickets" : "Buy Cross-Chain")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showPurchaseModal && selectedEvent && (
        <TicketPurchase
          event={selectedEvent}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedEvent(null);
            fetchEventsSequentially(); 
          }}
          onPurchaseSuccess={storePurchaseInfo}
        />
      )}
    </div>
  );
};

export default EventList;
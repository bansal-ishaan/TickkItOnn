"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWeb3 } from "./Web3Context"
// Correctly import the object with all addresses
import { CONTRACT_ADDRESSES, CONTRACT_ABI } from "./contract"

// Main Dashboard Component
const UserDashboard = () => {
  // Get all necessary tools from the Web3 context for multi-chain operations
  const { account, getContract, getContractForNetwork, supportedNetworks, chainId } = useWeb3()

  const [activeTab, setActiveTab] = useState("tickets")
  const [userTickets, setUserTickets] = useState(0) // Aggregated from all chains
  const [pendingRefunds, setPendingRefunds] = useState(0n) // Aggregated from all chains
  const [isLoading, setIsLoading] = useState(true)
  const [userTicketsDetails, setUserTicketsDetails] = useState([]) // From localStorage
  const [showResaleModal, setShowResaleModal] = useState(false)
  const [selectedTicketForResale, setSelectedTicketForResale] = useState(null)
  const [resalePrice, setResalePrice] = useState("")

  // This is the new multi-chain data fetching function
  const fetchUserDataFromAllChains = async () => {
    if (!account || !supportedNetworks) return;
    setIsLoading(true);

    let totalBalance = 0;
    let totalRefunds = 0n;

    // Create a promise for each network to fetch data in parallel
    const promises = Object.keys(supportedNetworks).map(async (networkId) => {
      const contractAddress = CONTRACT_ADDRESSES[networkId];
      if (!contractAddress) return { balance: 0, refunds: 0n }; // Skip if no contract

      try {
        const contract = getContractForNetwork(networkId, contractAddress, CONTRACT_ABI);
        if (!contract) return { balance: 0, refunds: 0n };

        const [balance, refunds] = await Promise.all([
          contract.balanceOf(account),
          contract.pendingRefunds(account)
        ]);
        return { balance: Number(balance), refunds: refunds };
      } catch (error) {
        console.error(`Could not fetch data from ${supportedNetworks[networkId].name}:`, error);
        return { balance: 0, refunds: 0n }; // Return zero on error
      }
    });

    // Wait for all network fetches to complete and aggregate the results
    const results = await Promise.all(promises);
    results.forEach(result => {
      totalBalance += result.balance;
      totalRefunds += result.refunds;
    });

    // Update state with the aggregated on-chain data
    setUserTickets(totalBalance);
    setPendingRefunds(totalRefunds);

    // Fetch off-chain details from localStorage
    fetchUserTicketDetailsFromStorage();
    setIsLoading(false);
  };
  
  // This function is fine as it reads from localStorage, which is already global
  const fetchUserTicketDetailsFromStorage = () => {
    const allPurchases = JSON.parse(localStorage.getItem("ticketPurchases") || "[]");
    const userPurchases = allPurchases.filter(p => p.userAddress?.toLowerCase() === account?.toLowerCase());

    const ticketDetails = userPurchases.map(purchase => ({
      ticketId: `${purchase.networkId}-${purchase.eventId}-${purchase.purchaseDate}`, // A more unique ID
      eventId: purchase.eventId,
      eventName: purchase.eventName,
      eventVenue: purchase.eventVenue,
      eventDate: purchase.eventDate,
      purchasePrice: ethers.parseEther(((purchase.totalCost || 0) / purchase.quantity).toFixed(18)),
      purchaseDate: purchase.purchaseDate,
      networkName: purchase.networkName, // Crucial for display
      isUsed: false,
      canResale: true,
      isListed: false, // You can enhance this with resale logic from localStorage
    }));
    
    setUserTicketsDetails(ticketDetails);
  };

  useEffect(() => {
    if (account) {
      fetchUserDataFromAllChains();
    }
  }, [account]);

  // Withdraw is a single-chain action on the currently connected network
  const handleWithdrawRefund = async () => {
    setIsLoading(true);
    try {
      const currentContractAddress = CONTRACT_ADDRESSES[chainId];
      if (!currentContractAddress) throw new Error("Refunds are not supported on this network.");

      const contract = getContract(currentContractAddress, CONTRACT_ABI);
      if (!contract) throw new Error("Could not connect to contract.");
      
      const tx = await contract.withdrawRefund();
      await tx.wait();
      alert("Refund withdrawn successfully!");
      fetchUserDataFromAllChains(); // Refresh all data
    } catch (error) {
      console.error("Error withdrawing refund:", error);
      alert(`Error withdrawing refund: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResaleTicket = async () => { /* Your localStorage resale logic is fine for a demo */ };

  if (!account) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔐</div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-500">Please connect your wallet to view your dashboard</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h2>
        <p className="text-gray-600">Manage your tickets, view transaction history, and handle refunds across all chains.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">🎫</div>
            <div>
              <p className="text-sm text-gray-500">Total Tickets (All Chains)</p>
              <p className="text-2xl font-bold text-gray-900">{userTickets}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">💰</div>
            <div>
              <p className="text-sm text-gray-500">Pending Refunds (All Chains)</p>
              <p className="text-2xl font-bold text-gray-900">{ethers.formatEther(pendingRefunds)} ETH</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">🔄</div>
            <div>
              <p className="text-sm text-gray-500">Active Listings</p>
              <p className="text-2xl font-bold text-gray-900">{userTicketsDetails.filter(t => t.isListed).length}</p>
            </div>
          </div>
        </div>
      </div>

      {pendingRefunds > 0n && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-yellow-900">Pending Refund Available</h4>
              <p className="text-sm text-yellow-700">You have {ethers.formatEther(pendingRefunds)} ETH available for withdrawal on one or more chains. Withdrawals must be done on each specific chain.</p>
            </div>
            <button onClick={handleWithdrawRefund} disabled={isLoading} className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50">
              {isLoading ? "Processing..." : "Withdraw from Current Chain"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[{ id: "tickets", label: "My Tickets" }, { id: "history", label: "Transaction History" }, { id: "listings", label: "Resale Listings" }].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? "border-purple-500 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "tickets" && <MyTickets userTicketsDetails={userTicketsDetails} onResaleClick={(ticket) => { setSelectedTicketForResale(ticket); setShowResaleModal(true); }} />}
          {activeTab === "history" && <TransactionHistory />}
          {activeTab === "listings" && <ResaleListings userTicketsDetails={userTicketsDetails} />}
        </div>

        {showResaleModal && selectedTicketForResale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">List Ticket for Resale</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Resale Price (ETH)</label>
                    <input type="number" value={resalePrice} onChange={(e) => setResalePrice(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
                  </div>
                  <button onClick={handleResaleTicket} disabled={!resalePrice || isLoading} className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50">
                    {isLoading ? "Listing..." : "List Ticket for Resale"}
                  </button>
                  <button onClick={() => setShowResaleModal(false)} className="w-full text-center py-2 text-gray-600">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-Component for displaying tickets with network info
const MyTickets = ({ userTicketsDetails, onResaleClick }) => {
  if (!userTicketsDetails || userTicketsDetails.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🎫</div>
        <h3 className="text-lg font-medium text-gray-900">No Tickets Yet</h3>
        <p className="text-gray-500">Your purchased tickets from all chains will appear here.</p>
      </div>
    );
  }

  const formatDate = (timestamp) => new Date(Number(timestamp) * 1000).toLocaleDateString();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {userTicketsDetails.map((ticket) => (
        <div key={ticket.ticketId} className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">{ticket.eventName}</h3>
                <p className="text-sm text-purple-100">Network: {ticket.networkName}</p>
              </div>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Valid</span>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3 text-sm text-gray-600">
              <p>📍 {ticket.eventVenue}</p>
              <p>📅 {formatDate(ticket.eventDate)}</p>
              <p>💰 Purchased for: {ethers.formatEther(ticket.purchasePrice)} ETH</p>
            </div>
            <div className="mt-4 pt-4 border-t">
              <button onClick={() => onResaleClick(ticket)} className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-purple-700">
                List for Resale
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Placeholder Sub-Components
const TransactionHistory = () => (
  <div className="text-center py-8 text-gray-500">Transaction history feature coming soon.</div>
);
const ResaleListings = () => (
  <div className="text-center py-8 text-gray-500">Your active resale listings will appear here.</div>
);

export default UserDashboard;
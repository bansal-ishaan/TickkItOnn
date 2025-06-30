"use client"

import { useState } from "react"
import "./App.css"

import EventCreation from "./components/EventCreation"
import EventList from "./components/EventList"
import UserDashboard from "./components/UserDashboard"
import ResaleMarketplace from "./components/ResaleMarketplace"
import NetworkSelector from "./components/NetworkSelector"
import WalletConnect from "./components/WalletConnect"
import { Web3Provider } from "./components/Web3Context"

function App() {
  const [activeTab, setActiveTab] = useState("events")

  const tabs = [
    { id: "events", label: "Browse Events", icon: "🎫" },
    { id: "create", label: "Create Event", icon: "➕" },
    { id: "dashboard", label: "My Tickets", icon: "👤" },
    { id: "resale", label: "Resale Market", icon: "🔄" },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case "events":
        return <EventList />
      case "create":
        return <EventCreation />
      case "dashboard":
        return <UserDashboard />
      case "resale":
        return <ResaleMarketplace />
      default:
        return <EventList />
    }
  }

  return (
    <Web3Provider>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  TickItOn
                </h1>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Cross-Chain Ticketing</span>
              </div>
              <div className="flex items-center space-x-4">
                <NetworkSelector />
                <WalletConnect />
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
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
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderContent()}</main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-gray-400">TickItOn - Powered by Chainlink CCIP for seamless cross-chain ticketing</p>
            </div>
          </div>
        </footer>
      </div>
    </Web3Provider>
  )
}

export default App

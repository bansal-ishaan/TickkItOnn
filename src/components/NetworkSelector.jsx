"use client"
import { useWeb3 } from "./Web3Context"

const NetworkSelector = () => {
  const { chainId, switchNetwork } = useWeb3()

  const networkList = [
    {
      id: 11155111,
      name: "Ethereum Sepolia",
      icon: "⟠",
      color: "bg-blue-500",
    },
    {
      id: 80002,
      name: "Polygon Amoy",
      icon: "⬟",
      color: "bg-purple-500",
    },
    {
      id: 43113,
      name: "Avalanche Fuji",
      icon: "🔺",
      color: "bg-red-500",
    },
  ]

  const currentNetwork = networkList.find((n) => n.id === chainId)

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
        {currentNetwork ? (
          <>
            <span className={`w-3 h-3 rounded-full ${currentNetwork.color}`}></span>
            <span className="text-sm font-medium">{currentNetwork.name}</span>
          </>
        ) : (
          <span className="text-sm text-gray-500">Select Network</span>
        )}
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-1">
          {networkList.map((network) => (
            <button
              key={network.id}
              onClick={() => switchNetwork(network.id)}
              className={`w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                chainId === network.id ? "bg-purple-50 text-purple-600" : "text-gray-700"
              }`}
            >
              <span className={`w-3 h-3 rounded-full ${network.color}`}></span>
              <span>{network.name}</span>
              {chainId === network.id && (
                <svg className="w-4 h-4 ml-auto text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NetworkSelector

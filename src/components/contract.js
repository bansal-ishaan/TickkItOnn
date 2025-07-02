export const CONTRACT_ADDRESSES = {
  11155111: "0x7a0066C9EfCFbCea21EEb24C46Df0Edde682d269", // Ethereum Sepolia
  80002: "0x236Cd08389789A7b5C36472CD687726C4df8e16F",    // Polygon Amoy
  43113: "0xfFE204B6a6982A21f118da6a9fDc49ebc47b9a0f",    // Avalanche Fuji
};

export const CONTRACT_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_ccipRouter",
        type: "address",
      },
      {
        internalType: "address",
        name: "_vrfCoordinator",
        type: "address",
      },
      {
        internalType: "address",
        name: "_linkToken",
        type: "address",
      },
      {
        internalType: "uint64",
        name: "_vrfSubscriptionId",
        type: "uint64",
      },
      {
        internalType: "bytes32",
        name: "_vrfKeyHash",
        type: "bytes32",
      },
      {
        internalType: "uint64",
        name: "_chainSelector",
        type: "uint64",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_description",
        type: "string",
      },
      {
        internalType: "string",
        name: "_venue",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_eventDate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_totalTickets",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_basePrice",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_metadataURI",
        type: "string",
      },
    ],
    name: "createEvent",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_offset",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_limit",
        type: "uint256",
      },
    ],
    name: "getActiveEvents",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "eventId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "organizer",
            type: "address",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "description",
            type: "string",
          },
          {
            internalType: "string",
            name: "venue",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "eventDate",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalTickets",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "basePrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "ticketsSold",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "organizerStake",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "isCompleted",
            type: "bool",
          },
          {
            internalType: "string",
            name: "metadataURI",
            type: "string",
          },
        ],
        internalType: "struct TickItOn.Event[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_eventId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_quantity",
        type: "uint256",
      },
    ],
    name: "buyTickets",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint64",
        name: "_destinationChainSelector",
        type: "uint64",
      },
      {
        internalType: "address",
        name: "_destinationContract",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_eventId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_quantity",
        type: "uint256",
      },
    ],
    name: "buyTicketsCrossChain",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_eventId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_quantity",
        type: "uint256",
      },
    ],
    name: "calculateCrossChainTicketCost",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint64",
        name: "_destinationChainSelector",
        type: "uint64",
      },
      {
        internalType: "address",
        name: "_destinationContract",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_eventId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_quantity",
        type: "uint256",
      },
    ],
    name: "estimateCrossChainFee",
    outputs: [
      {
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "ticketCost",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "total",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "pendingRefunds",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_ticketId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_listingPrice",
        type: "uint256",
      },
    ],
    name: "listTicketForResale",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_resaleId",
        type: "uint256",
      },
    ],
    name: "buyResaleTicket",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
]

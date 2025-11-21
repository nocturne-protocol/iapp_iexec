// Mock contract configuration for Arbitrum Sepolia
export const MOCK_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";

// ABI for 2 view functions
export const MOCK_CONTRACT_ABI = [
  {
    name: "getBalance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getTotalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
];

// Mock data for testing
export const MOCK_DATA = {
  getBalance: "1000000000000000000", // 1 ETH in wei
  getTotalSupply: "1000000000000000000000", // 1000 ETH in wei
};


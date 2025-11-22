import { arbitrumSepolia, baseSepolia, sepolia } from "viem/chains";

// Chain ID to contract address mapping
const CHAIN_CONTRACTS = {
  421614: "0x3b3C98D7AfF91b7032d81fC25dfe8d8ECFe546CC", // Arbitrum Sepolia
  84532: "0x0000000000000000000000000000000000000000", // Base Sepolia - placeholder (to be updated)
  11155111: "0x0000000000000000000000000000000000000000", // Sepolia - placeholder (to be updated)
};

// Chain ID to RPC URL mapping
const CHAIN_RPC_URLS = {
  421614: "https://sepolia-rollup.arbitrum.io/rpc", // Arbitrum Sepolia
  84532: "https://sepolia.base.org", // Base Sepolia - placeholder (to be updated)
  11155111: "https://rpc.sepolia.org", // Sepolia - placeholder (to be updated)
};

// Chain ID to viem chain object mapping
const CHAIN_OBJECTS = {
  421614: arbitrumSepolia,
  84532: baseSepolia,
  11155111: sepolia,
};

/**
 * Get contract address for a given chain ID
 * @param {number} chainId - Chain ID (421614 for Arbitrum Sepolia, 84532 for Base Sepolia, 11155111 for Sepolia)
 * @returns {string} Contract address
 * @throws {Error} If chain ID is not supported
 */
export function getContractAddress(chainId) {
  const address = CHAIN_CONTRACTS[chainId];
  if (!address) {
    throw new Error(
      `Unsupported chain ID: ${chainId}. Supported chains: ${Object.keys(
        CHAIN_CONTRACTS
      ).join(", ")}`
    );
  }
  return address;
}

/**
 * Get RPC URL for a given chain ID
 * @param {number} chainId - Chain ID
 * @returns {string} RPC URL
 * @throws {Error} If chain ID is not supported
 */
export function getRpcUrl(chainId) {
  const rpcUrl = CHAIN_RPC_URLS[chainId];
  if (!rpcUrl) {
    throw new Error(
      `Unsupported chain ID: ${chainId}. Supported chains: ${Object.keys(
        CHAIN_RPC_URLS
      ).join(", ")}`
    );
  }
  return rpcUrl;
}

/**
 * Get viem chain object for a given chain ID
 * @param {number} chainId - Chain ID
 * @returns {Chain} viem chain object
 * @throws {Error} If chain ID is not supported
 */
export function getChainObject(chainId) {
  const chain = CHAIN_OBJECTS[chainId];
  if (!chain) {
    throw new Error(
      `Unsupported chain ID: ${chainId}. Supported chains: ${Object.keys(
        CHAIN_OBJECTS
      ).join(", ")}`
    );
  }
  return chain;
}

/**
 * Get all supported chain IDs
 * @returns {number[]} Array of supported chain IDs
 */
export function getSupportedChainIds() {
  return Object.keys(CHAIN_CONTRACTS).map(Number);
}

// Export default/legacy values for backward compatibility (Arbitrum Sepolia)
export const CONTRACT_ADDRESS = CHAIN_CONTRACTS[421614];
export const RPC_URL = CHAIN_RPC_URLS[421614];

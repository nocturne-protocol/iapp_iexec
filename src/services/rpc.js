import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";
import {
  MOCK_CONTRACT_ADDRESS,
  MOCK_CONTRACT_ABI,
  MOCK_DATA,
} from "../contracts/mock-contract.js";

// RPC endpoint
const RPC_ENDPOINT = "https://arbitrum-sepolia.gateway.tenderly.co";

// Check if we should use mock data
// Use mock data if explicitly set, or if in test environment, or if no network access
const USE_MOCK_DATA =
  process.env.USE_MOCK_DATA === "true" ||
  process.env.NODE_ENV === "test" ||
  !process.env.ENABLE_REAL_RPC;

// Create viem public client
const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(RPC_ENDPOINT),
});

/**
 * Fetch balance from contract
 * @param {string} accountAddress - Address to check balance for
 * @returns {Promise<string>} Balance in wei
 */
export async function getBalance(accountAddress) {
  if (USE_MOCK_DATA) {
    console.log("📦 Using mock data for getBalance");
    return MOCK_DATA.getBalance;
  }

  try {
    const balance = await publicClient.readContract({
      address: MOCK_CONTRACT_ADDRESS,
      abi: MOCK_CONTRACT_ABI,
      functionName: "getBalance",
      args: [accountAddress],
    });

    return balance.toString();
  } catch (error) {
    console.error("❌ Error fetching balance:", error.message);
    // Fallback to mock data on error
    console.log("📦 Falling back to mock data for getBalance");
    return MOCK_DATA.getBalance;
  }
}

/**
 * Fetch total supply from contract
 * @returns {Promise<string>} Total supply in wei
 */
export async function getTotalSupply() {
  if (USE_MOCK_DATA) {
    console.log("📦 Using mock data for getTotalSupply");
    return MOCK_DATA.getTotalSupply;
  }

  try {
    const totalSupply = await publicClient.readContract({
      address: MOCK_CONTRACT_ADDRESS,
      abi: MOCK_CONTRACT_ABI,
      functionName: "getTotalSupply",
    });

    return totalSupply.toString();
  } catch (error) {
    console.error("❌ Error fetching total supply:", error.message);
    // Fallback to mock data on error
    console.log("📦 Falling back to mock data for getTotalSupply");
    return MOCK_DATA.getTotalSupply;
  }
}

/**
 * Fetch both data points from the contract
 * @param {string} accountAddress - Address to check balance for
 * @returns {Promise<{balance: string, totalSupply: string}>}
 */
export async function fetchContractData(accountAddress) {
  console.log("🔗 Fetching contract data from Arbitrum Sepolia...");
  console.log(`📍 Contract address: ${MOCK_CONTRACT_ADDRESS}`);
  console.log(`👤 Account address: ${accountAddress}`);

  const [balance, totalSupply] = await Promise.all([
    getBalance(accountAddress),
    getTotalSupply(),
  ]);

  return {
    balance,
    totalSupply,
  };
}


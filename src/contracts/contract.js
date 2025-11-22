// PrivateERC20 contract configuration for Arbitrum Sepolia
import { CONTRACT_ADDRESS } from "../config.js";

// Re-export for backward compatibility
export { CONTRACT_ADDRESS };

// Contract ABI (minimal, only the functions we need)
export const CONTRACT_ABI = [
  {
    name: "encryptionPublicKey",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes" }],
  },
  {
    name: "updateBalance",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sender", type: "address" },
      { name: "receiver", type: "address" },
      { name: "senderNewBalance", type: "bytes" },
      { name: "receiverNewBalance", type: "bytes" },
    ],
    outputs: [],
  },
];

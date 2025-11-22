import {
  createPublicClient,
  createWalletClient,
  http,
  getContract,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ABI } from "../contracts/contract.js";
import { PublicKey, encrypt } from "eciesjs";
import {
  getContractAddress,
  getRpcUrl,
  getChainObject,
} from "../utils/chains.js";

// Helper to convert bytes to hex string
function bytesToHex(bytes) {
  return (
    "0x" +
    Array.from(bytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

// Helper to convert hex string to Uint8Array
function hexToUint8Array(hex) {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Read the encryption public key from the contract
 * @param {number} chainId - Chain ID (421614 for Arbitrum Sepolia, 84532 for Base Sepolia, 11155111 for Sepolia)
 * @returns {Promise<string>} Encryption public key as hex string
 */
export async function readEncryptionPublicKey(chainId) {
  try {
    const contractAddress = getContractAddress(chainId);
    const rpcUrl = getRpcUrl(chainId);
    const chain = getChainObject(chainId);

    // Create a public client for this specific chain
    const publicClient = createPublicClient({
      chain: chain,
      transport: http(rpcUrl),
    });

    const contract = getContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      client: publicClient,
    });

    const publicKey = await contract.read.encryptionPublicKey();
    console.log("✅ Encryption Public Key retrieved from contract");

    // viem returns bytes as hex string already, return directly
    if (typeof publicKey === "string") {
      return publicKey.startsWith("0x") ? publicKey : `0x${publicKey}`;
    }

    // If it's a Uint8Array or other format, convert it
    return bytesToHex(publicKey);
  } catch (error) {
    console.error("❌ Error reading encryption public key:", error.message);
    throw error;
  }
}

/**
 * Call updateBalance on the contract
 * @param {number} chainId - Chain ID (421614 for Arbitrum Sepolia, 84532 for Base Sepolia, 11155111 for Sepolia)
 * @param {string} privateKeyHex - Private key for signing (from app secret)
 * @param {string} senderAddress - Sender address
 * @param {string} receiverAddress - Receiver address
 * @param {string} senderNewBalanceEncrypted - Encrypted sender balance (hex)
 * @param {string} receiverNewBalanceEncrypted - Encrypted receiver balance (hex)
 * @returns {Promise<string>} Transaction hash
 */
export async function callUpdateBalance(
  chainId,
  privateKeyHex,
  senderAddress,
  receiverAddress,
  senderNewBalanceEncrypted,
  receiverNewBalanceEncrypted
) {
  try {
    // Get chain-specific configuration
    const contractAddress = getContractAddress(chainId);
    const rpcUrl = getRpcUrl(chainId);
    const chain = getChainObject(chainId);

    // Ensure private key has 0x prefix for viem
    const normalizedPrivateKey = privateKeyHex.startsWith("0x")
      ? privateKeyHex
      : `0x${privateKeyHex}`;

    const account = privateKeyToAccount(normalizedPrivateKey);

    const walletClient = createWalletClient({
      chain: chain,
      transport: http(rpcUrl),
      account,
    });

    const contract = getContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      client: walletClient,
    });

    console.log("📝 Calling updateBalance on contract...");
    console.log(`  Sender: ${senderAddress}`);
    console.log(`  Receiver: ${receiverAddress}`);

    // viem expects hex strings for bytes type parameters
    const hash = await contract.write.updateBalance([
      senderAddress,
      receiverAddress,
      senderNewBalanceEncrypted,
      receiverNewBalanceEncrypted,
    ]);

    console.log("✅ Transaction hash:", hash);
    return hash;
  } catch (error) {
    console.error("❌ Error calling updateBalance:", error.message);
    throw error;
  }
}

/**
 * Encrypt balance using contract's encryption public key
 * @param {string} balance - Balance as string
 * @param {string} encryptionPublicKeyHex - Contract's encryption public key (hex)
 * @returns {Promise<string>} Encrypted balance as hex string
 */
export async function encryptBalance(balance, encryptionPublicKeyHex) {
  try {
    // Convert public key hex to PublicKey object
    const publicKeyBytes = hexToUint8Array(encryptionPublicKeyHex);
    const publicKey = new PublicKey(publicKeyBytes);

    // Encrypt the balance
    const encoder = new TextEncoder();
    const balanceBytes = encoder.encode(balance);
    const encrypted = encrypt(publicKey.toBytes(), balanceBytes);

    return bytesToHex(encrypted);
  } catch (error) {
    console.error("❌ Error encrypting balance:", error.message);
    throw error;
  }
}

/**
 * Read the encrypted balance from the contract
 * @param {number} chainId - Chain ID (421614 for Arbitrum Sepolia, 84532 for Base Sepolia, 11155111 for Sepolia)
 * @param {string} address - Address to read balance for
 * @returns {Promise<string>} Encrypted balance as hex string
 */
export async function readEncryptedBalance(chainId, address) {
  try {
    const contractAddress = getContractAddress(chainId);
    const rpcUrl = getRpcUrl(chainId);
    const chain = getChainObject(chainId);

    // Create a public client for this specific chain
    const publicClient = createPublicClient({
      chain: chain,
      transport: http(rpcUrl),
    });

    const contract = getContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      client: publicClient,
    });

    const encryptedBalance = await contract.read.balanceOf([address]);
    console.log(`✅ Encrypted balance retrieved for ${address}`);

    // viem returns bytes as hex string already, return directly
    if (typeof encryptedBalance === "string") {
      return encryptedBalance.startsWith("0x")
        ? encryptedBalance
        : `0x${encryptedBalance}`;
    }

    // If it's a Uint8Array or other format, convert it
    return bytesToHex(encryptedBalance);
  } catch (error) {
    console.error("❌ Error reading encrypted balance:", error.message);
    throw error;
  }
}

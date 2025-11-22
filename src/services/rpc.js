import {
  createPublicClient,
  createWalletClient,
  http,
  getContract,
} from "viem";
import { arbitrumSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contracts/contract.js";
import { PublicKey, encrypt } from "eciesjs";
import { RPC_URL } from "../config.js";

// Create viem public client for reading
const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(RPC_URL),
});

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
 * @returns {Promise<string>} Encryption public key as hex string
 */
export async function readEncryptionPublicKey() {
  try {
    const contract = getContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      client: publicClient,
    });

    const publicKey = await contract.read.encryptionPublicKey();
    console.log("✅ Encryption Public Key retrieved from contract");
    return bytesToHex(publicKey);
  } catch (error) {
    console.error("❌ Error reading encryption public key:", error.message);
    throw error;
  }
}

/**
 * Call updateBalance on the contract
 * @param {string} privateKeyHex - Private key for signing (from app secret)
 * @param {string} senderAddress - Sender address
 * @param {string} receiverAddress - Receiver address
 * @param {string} senderNewBalanceEncrypted - Encrypted sender balance (hex)
 * @param {string} receiverNewBalanceEncrypted - Encrypted receiver balance (hex)
 * @returns {Promise<string>} Transaction hash
 */
export async function callUpdateBalance(
  privateKeyHex,
  senderAddress,
  receiverAddress,
  senderNewBalanceEncrypted,
  receiverNewBalanceEncrypted
) {
  try {
    const account = privateKeyToAccount(privateKeyHex);

    const walletClient = createWalletClient({
      chain: arbitrumSepolia,
      transport: http(RPC_URL),
      account,
    });

    const contract = getContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      client: walletClient,
    });

    console.log("📝 Calling updateBalance on contract...");
    console.log(`  Sender: ${senderAddress}`);
    console.log(`  Receiver: ${receiverAddress}`);

    const hash = await contract.write.updateBalance([
      senderAddress,
      receiverAddress,
      hexToUint8Array(senderNewBalanceEncrypted),
      hexToUint8Array(receiverNewBalanceEncrypted),
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

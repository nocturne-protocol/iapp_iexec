import fs from "node:fs/promises";
import { PrivateKey, PublicKey, decrypt } from "eciesjs";
import {
  readEncryptionPublicKey,
  encryptBalance,
  callUpdateBalance,
} from "./services/rpc.js";
import { DECRYPTION_PRIVATE_KEY } from "./config.js";

// Helper function to convert hex string to Uint8Array
function hexToUint8Array(hex) {
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const length = cleanHex.length;
  const bytes = new Uint8Array(length / 2);
  for (let i = 0; i < length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

const main = async () => {
  const { IEXEC_OUT } = process.env;

  let computedJsonObj = {};

  try {
    // Get app secret (private key) from environment
    const { IEXEC_APP_DEVELOPER_SECRET } = process.env;
    if (!IEXEC_APP_DEVELOPER_SECRET) {
      throw new Error("IEXEC_APP_DEVELOPER_SECRET is not set");
    }

    const redactedAppSecret = IEXEC_APP_DEVELOPER_SECRET.replace(/./g, "*");
    console.log(`Got an app secret (${redactedAppSecret})!`);

    // Create private key for decryption from config
    const decryptionPrivateKey = PrivateKey.fromHex(DECRYPTION_PRIVATE_KEY);
    const decryptionPublicKey = decryptionPrivateKey.publicKey;
    console.log(`Decryption Public key: ${decryptionPublicKey.toHex()}`);

    // Create private key from app secret for signing transactions
    const signingPrivateKey = PrivateKey.fromHex(IEXEC_APP_DEVELOPER_SECRET);

    // Parse command line arguments
    // Expected: [encryptedAmount, senderWallet, receiverWallet]
    const args = process.argv.slice(2);
    console.log(`Received ${args.length} args`);

    if (args.length < 3) {
      throw new Error(
        "Expected 3 arguments: encryptedAmount, senderWallet, receiverWallet"
      );
    }

    const [encryptedAmountHex, senderWallet, receiverWallet] = args;

    // Validate hex string format
    const cleanHex = encryptedAmountHex.startsWith("0x")
      ? encryptedAmountHex.slice(2)
      : encryptedAmountHex;

    if (cleanHex.length % 2 !== 0) {
      throw new Error("Invalid hex string: length must be even");
    }

    console.log(
      `Encrypted amount hex length: ${encryptedAmountHex.length} chars`
    );
    console.log(
      `Encrypted amount hex (first 100 chars): ${encryptedAmountHex.substring(
        0,
        100
      )}...`
    );

    // Convert hex string to Uint8Array for decryption
    const encryptedAmount = hexToUint8Array(encryptedAmountHex);
    console.log(
      `Encrypted amount bytes length: ${encryptedAmount.length} bytes`
    );

    // ECIES encrypted data should be at least 65 bytes (uncompressed ephemeral key) + nonce + tag
    // Minimum: 65 (ephemeral pk) + 12 (nonce) + 16 (tag) = 93 bytes for secp256k1
    if (encryptedAmount.length < 93) {
      throw new Error(
        `Invalid encrypted data: too short (${encryptedAmount.length} bytes, expected at least 93 bytes)`
      );
    }

    // Decrypt the amount using the decryption private key from config
    // decrypt expects: decrypt(privateKey, encryptedData)
    const decryptedAmountBytes = decrypt(
      decryptionPrivateKey.secret,
      encryptedAmount
    );
    const decryptedAmount = new TextDecoder().decode(decryptedAmountBytes);

    console.log(`Decrypted amount: ${decryptedAmount}`);
    console.log(`Sender wallet: ${senderWallet}`);
    console.log(`Receiver wallet: ${receiverWallet}`);

    // Interact with real contract
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔗 Interacting with PrivateERC20 contract...");

    // 1. Read encryption public key from contract
    const encryptionPublicKeyHex = await readEncryptionPublicKey();
    console.log(
      `✅ Encryption Public Key: ${encryptionPublicKeyHex.substring(0, 20)}...`
    );

    // 2. Calculate new balances (simplified: assume sender sends full amount to receiver)
    // TODO: You may want to read current balances from contract first
    const senderNewBalance = "0"; // After sending, sender balance becomes 0
    const receiverNewBalance = decryptedAmount; // Receiver receives the amount

    console.log(`📊 Calculated balances:`);
    console.log(`  Sender new balance: ${senderNewBalance}`);
    console.log(`  Receiver new balance: ${receiverNewBalance}`);

    // 3. Encrypt the new balances using contract's encryption public key
    console.log("🔐 Encrypting balances...");
    const senderNewBalanceEncrypted = await encryptBalance(
      senderNewBalance,
      encryptionPublicKeyHex
    );
    const receiverNewBalanceEncrypted = await encryptBalance(
      receiverNewBalance,
      encryptionPublicKeyHex
    );
    console.log("✅ Balances encrypted");

    // 4. Call updateBalance on the contract
    const transactionHash = await callUpdateBalance(
      IEXEC_APP_DEVELOPER_SECRET, // Use app secret as private key for signing
      senderWallet,
      receiverWallet,
      senderNewBalanceEncrypted,
      receiverNewBalanceEncrypted
    );

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Log the results
    console.log("📊 Contract Interaction Results:");
    console.log(`  Transaction Hash: ${transactionHash}`);
    console.log(
      `  Sender New Balance (encrypted): ${senderNewBalanceEncrypted.substring(
        0,
        20
      )}...`
    );
    console.log(
      `  Receiver New Balance (encrypted): ${receiverNewBalanceEncrypted.substring(
        0,
        20
      )}...`
    );

    // Write result to IEXEC_OUT
    const resultText = `Encrypted Amount: ${encryptedAmountHex}\nSender Wallet: ${senderWallet}\nReceiver Wallet: ${receiverWallet}\nDecrypted Amount: ${decryptedAmount}\n\nContract Interaction:\nTransaction Hash: ${transactionHash}\nEncryption Public Key: ${encryptionPublicKeyHex}\nSender New Balance (encrypted): ${senderNewBalanceEncrypted}\nReceiver New Balance (encrypted): ${receiverNewBalanceEncrypted}`;
    await fs.writeFile(`${IEXEC_OUT}/result.txt`, resultText);

    // Build the "computed.json" object
    computedJsonObj = {
      "deterministic-output-path": `${IEXEC_OUT}/result.txt`,
    };
  } catch (e) {
    // Handle errors
    console.log(e);

    // Build the "computed.json" object with an error message
    computedJsonObj = {
      "deterministic-output-path": IEXEC_OUT,
      "error-message": "Oops something went wrong",
    };
  } finally {
    // Save the "computed.json" file
    await fs.writeFile(
      `${IEXEC_OUT}/computed.json`,
      JSON.stringify(computedJsonObj)
    );
  }
};

main();

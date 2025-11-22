import fs from "node:fs/promises";
import { PrivateKey, PublicKey, decrypt } from "eciesjs";
import {
  readEncryptionPublicKey,
  encryptBalance,
  callUpdateBalance,
  readEncryptedBalance,
} from "./services/rpc.js";

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
    const privateKey = PrivateKey.fromHex(IEXEC_APP_DEVELOPER_SECRET);
    const decryptionPublicKey = privateKey.publicKey;
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
      privateKey.secret,
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

    // 2. Read and decrypt current balances
    console.log("📖 Reading encrypted balances from contract...");
    const senderBalanceEncrypted = await readEncryptedBalance(senderWallet);
    const receiverBalanceEncrypted = await readEncryptedBalance(receiverWallet);
    
    console.log(`  Sender encrypted balance: ${senderBalanceEncrypted.substring(0, 20)}...`);
    console.log(`  Receiver encrypted balance: ${receiverBalanceEncrypted.substring(0, 20)}...`);

    // Decrypt balances using the app's private key
    console.log("🔓 Decrypting balances...");
    const senderBalanceBytes = hexToUint8Array(senderBalanceEncrypted);
    const receiverBalanceBytes = hexToUint8Array(receiverBalanceEncrypted);

    let senderBalance = 0;
    let receiverBalance = 0;

    // Decrypt sender balance (handle empty balance case)
    if (senderBalanceBytes.length > 0) {
      try {
        const decryptedSenderBytes = decrypt(privateKey.secret, senderBalanceBytes);
        senderBalance = parseFloat(new TextDecoder().decode(decryptedSenderBytes));
        console.log(`  Sender current balance: ${senderBalance}`);
      } catch (error) {
        console.log(`  Sender balance is empty or uninitialized (0)`);
        senderBalance = 0;
      }
    } else {
      console.log(`  Sender balance is empty (0)`);
    }

    // Decrypt receiver balance (handle empty balance case)
    if (receiverBalanceBytes.length > 0) {
      try {
        const decryptedReceiverBytes = decrypt(privateKey.secret, receiverBalanceBytes);
        receiverBalance = parseFloat(new TextDecoder().decode(decryptedReceiverBytes));
        console.log(`  Receiver current balance: ${receiverBalance}`);
      } catch (error) {
        console.log(`  Receiver balance is empty or uninitialized (0)`);
        receiverBalance = 0;
      }
    } else {
      console.log(`  Receiver balance is empty (0)`);
    }

    // 3. Parse and validate transfer amount
    const transferAmount = parseFloat(decryptedAmount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      throw new Error(`Invalid transfer amount: ${decryptedAmount}`);
    }
    console.log(`💸 Transfer amount: ${transferAmount}`);

    // 4. Check if sender has sufficient balance
    if (senderBalance < transferAmount) {
      throw new Error(
        `Insufficient balance: sender has ${senderBalance} but trying to send ${transferAmount}`
      );
    }

    // 5. Calculate new balances
    const senderNewBalance = senderBalance - transferAmount;
    const receiverNewBalance = receiverBalance + transferAmount;

    console.log(`📊 Calculated balances:`);
    console.log(`  Sender: ${senderBalance} -> ${senderNewBalance}`);
    console.log(`  Receiver: ${receiverBalance} -> ${receiverNewBalance}`);

    // Validate new balances
    if (senderNewBalance < 0) {
      throw new Error(`Invalid calculation: sender balance would be negative (${senderNewBalance})`);
    }
    if (receiverNewBalance < 0) {
      throw new Error(`Invalid calculation: receiver balance would be negative (${receiverNewBalance})`);
    }

    // 6. Encrypt the new balances using contract's encryption public key
    console.log("🔐 Encrypting new balances...");
    const senderNewBalanceEncrypted = await encryptBalance(
      senderNewBalance.toString(),
      encryptionPublicKeyHex
    );
    const receiverNewBalanceEncrypted = await encryptBalance(
      receiverNewBalance.toString(),
      encryptionPublicKeyHex
    );
    console.log("✅ New balances encrypted successfully");

    // 7. Call updateBalance on the contract
    console.log("📤 Sending transaction to blockchain...");
    const transactionHash = await callUpdateBalance(
      IEXEC_APP_DEVELOPER_SECRET, // Use app secret as private key for signing
      senderWallet,
      receiverWallet,
      senderNewBalanceEncrypted,
      receiverNewBalanceEncrypted
    );

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Log the results
    console.log("📊 Transaction Summary:");
    console.log(`  ✅ Transaction Hash: ${transactionHash}`);
    console.log(`  💸 Transfer Amount: ${transferAmount}`);
    console.log(`  👤 Sender: ${senderWallet}`);
    console.log(`     Balance: ${senderBalance} -> ${senderNewBalance}`);
    console.log(`  👤 Receiver: ${receiverWallet}`);
    console.log(`     Balance: ${receiverBalance} -> ${receiverNewBalance}`);

    // Write result to IEXEC_OUT
    const resultText = `Transfer Details:
==================
Transfer Amount: ${transferAmount}
Sender Wallet: ${senderWallet}
  - Previous Balance: ${senderBalance}
  - New Balance: ${senderNewBalance}
Receiver Wallet: ${receiverWallet}
  - Previous Balance: ${receiverBalance}
  - New Balance: ${receiverNewBalance}

Contract Interaction:
=====================
Transaction Hash: ${transactionHash}
Encryption Public Key: ${encryptionPublicKeyHex}
Sender New Balance (encrypted): ${senderNewBalanceEncrypted}
Receiver New Balance (encrypted): ${receiverNewBalanceEncrypted}

Raw Encrypted Input:
====================
Encrypted Amount: ${encryptedAmountHex}
Decrypted Amount: ${decryptedAmount}`;
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

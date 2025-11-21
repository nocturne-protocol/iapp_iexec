import fs from "node:fs/promises";
import { PrivateKey, decrypt } from "eciesjs";

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

    // Create private key from app secret
    const privateKey = PrivateKey.fromHex(IEXEC_APP_DEVELOPER_SECRET);

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

    // Convert hex string to Uint8Array for decryption
    const encryptedAmount = hexToUint8Array(encryptedAmountHex);

    // Decrypt the amount using the private key
    const decryptedAmountBytes = decrypt(privateKey.secret, encryptedAmount);
    const decryptedAmount = new TextDecoder().decode(decryptedAmountBytes);

    console.log(`Decrypted amount: ${decryptedAmount}`);
    console.log(`Sender wallet: ${senderWallet}`);
    console.log(`Receiver wallet: ${receiverWallet}`);

    // Write result to IEXEC_OUT
    const resultText = `Encrypted Amount: ${encryptedAmountHex}\nSender Wallet: ${senderWallet}\nReceiver Wallet: ${receiverWallet}\nDecrypted Amount: ${decryptedAmount}`;
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

import fs from "node:fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { PrivateKey, encrypt } from "eciesjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Convert Uint8Array to hex string
function uint8ArrayToHex(bytes) {
  return "0x" + Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function encryptAmount() {
  try {
    // Read iapp.config.json to get appSecret
    const configPath = join(__dirname, "iapp.config.json");
    const configContent = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(configContent);
    const appSecret = config.appSecret;

    if (!appSecret) {
      console.error("❌ Error: appSecret not found in iapp.config.json");
      process.exit(1);
    }

    // Get amount from command line
    const args = process.argv.slice(2);
    if (args.length < 1) {
      console.error("❌ Usage: node encrypt-amount.js <amount>");
      console.error("   Example: node encrypt-amount.js '100'");
      process.exit(1);
    }

    const amount = args[0];

    // Create private key from app secret
    const privateKey = PrivateKey.fromHex(appSecret);
    const publicKey = privateKey.publicKey;

    // Encrypt the amount
    const encoder = new TextEncoder();
    const amountBytes = encoder.encode(amount);
    const encrypted = encrypt(publicKey.uncompressed, amountBytes);
    const encryptedHex = uint8ArrayToHex(encrypted);

    console.log("✅ Encrypted Amount:");
    console.log(encryptedHex);
    console.log("\n💡 Use this in your test command:");
    console.log(`   npm test args "${encryptedHex} <senderWallet> <receiverWallet>"`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

encryptAmount();


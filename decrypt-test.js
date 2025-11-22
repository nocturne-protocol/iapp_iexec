import { PrivateKey, decrypt } from "eciesjs";

const privateKeyHex = "abb483444a79c9e62776e2c8707939426791663abba76a1272f1bf3d4bd901f1";
const encryptedHex = "0x0435d429f4b2e7ec7371e4ba1f7c9466abddba418b9f0424e1c9cc1c02033ffdd9ab1e3ef97f6856e023c06f6e48cd3dd391ab7482f06e4720f099adc7385b5ca50d3ac7a596976871eecb6de0281cae38a2c04871a1165ea1d8af6c3719d9459b76c961";

// Convert hex string to Uint8Array
function hexToUint8Array(hex) {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

try {
  // Create private key
  const privateKey = PrivateKey.fromHex(privateKeyHex);
  
  // Convert encrypted hex to Uint8Array
  const encryptedBytes = hexToUint8Array(encryptedHex);
  
  console.log(`Encrypted data length: ${encryptedBytes.length} bytes`);
  
  // Decrypt
  const decryptedBytes = decrypt(privateKey.secret, encryptedBytes);
  
  // Decode to string
  const decrypted = new TextDecoder().decode(decryptedBytes);
  
  console.log("✅ Decrypted Value:");
  console.log(decrypted);
} catch (error) {
  console.error("❌ Decryption error:", error.message);
  process.exit(1);
}


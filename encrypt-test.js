import { PrivateKey, encrypt } from "eciesjs";

const privateKeyHex =
  "abb483444a79c9e62776e2c8707939426791663abba76a1272f1bf3d4bd901f1";
const privateKey = PrivateKey.fromHex(privateKeyHex);
const publicKey = privateKey.publicKey;

const encoder = new TextEncoder();
const amountBytes = encoder.encode("100");
const encrypted = encrypt(publicKey.toBytes(), amountBytes);

const encryptedHex =
  "0x" +
  Array.from(encrypted)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

console.log("✅ Encrypted Amount:");
console.log(encryptedHex);

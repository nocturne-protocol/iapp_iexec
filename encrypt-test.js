import { PrivateKey, encrypt } from "eciesjs";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("iapp.config.json", "utf8"));
const privateKeyHex = config.appSecret;
const privateKey = PrivateKey.fromHex(privateKeyHex);
const publicKey = privateKey.publicKey;

const encoder = new TextEncoder();
const amountBytes = encoder.encode("100");
const encrypted = encrypt(publicKey.uncompressed, amountBytes);

const encryptedHex =
  "0x" +
  Array.from(encrypted)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

console.log("✅ Encrypted Amount:");
console.log(encryptedHex);

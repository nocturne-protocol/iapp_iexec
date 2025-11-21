import fs from "node:fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate a random Ethereum wallet address
function generateRandomWallet() {
  const chars = "0123456789abcdef";
  let address = "0x";
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

async function runTest() {
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

    // Get command line arguments
    const args = process.argv.slice(2);

    if (args.length < 1 || args[0] !== "args") {
      console.error(
        "❌ Usage: node test.js args '<amount> [senderWallet] [receiverWallet]'"
      );
      console.error("   Example: node test.js args '100 0x123... 0x456...'");
      console.error(
        "   Example: node test.js args '100' (random wallets will be generated)"
      );
      process.exit(1);
    }

    // Parse the arguments string
    const testArgs = args
      .slice(1)
      .join(" ")
      .split(/\s+/)
      .filter(arg => arg.length > 0);

    if (testArgs.length < 1) {
      console.error("❌ Error: At least 1 argument required: <amount>");
      console.error(
        "   Usage: node test.js args '<amount> [senderWallet] [receiverWallet]'"
      );
      console.error(
        "   If wallets are not provided, random ones will be generated"
      );
      process.exit(1);
    }

    const amount = testArgs[0];
    const senderWallet = testArgs[1] || generateRandomWallet();
    const receiverWallet = testArgs[2] || generateRandomWallet();
    const senderIsRandom = !testArgs[1];
    const receiverIsRandom = !testArgs[2];

    console.log("🧪 Testing iExec App");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📝 Amount: ${amount}`);
    console.log(
      `👤 Sender Wallet: ${senderWallet}${senderIsRandom ? " (random)" : ""}`
    );
    console.log(
      `👤 Receiver Wallet: ${receiverWallet}${
        receiverIsRandom ? " (random)" : ""
      }`
    );
    console.log(`🔐 App Secret: ${appSecret.replace(/./g, "*")}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Create output directory
    const outputDir = join(__dirname, "test-output");
    await fs.mkdir(outputDir, { recursive: true });

    // Set up environment variables
    const env = {
      ...process.env,
      IEXEC_APP_DEVELOPER_SECRET: appSecret,
      IEXEC_OUT: outputDir,
      IEXEC_IN: join(__dirname, "input"),
      IEXEC_INPUT_FILES_NUMBER: "0",
    };

    // Run the app
    const appPath = join(__dirname, "src", "app.js");
    const appArgs = [amount, senderWallet, receiverWallet];

    console.log(`🚀 Running: node ${appPath} ${appArgs.join(" ")}\n`);

    const childProcess = spawn("node", [appPath, ...appArgs], {
      env,
      stdio: "inherit",
      cwd: __dirname,
    });

    childProcess.on("close", async code => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      if (code === 0) {
        console.log("✅ Test completed successfully!");

        // Read and display results
        try {
          const resultPath = join(outputDir, "result.txt");
          const computedPath = join(outputDir, "computed.json");

          if (
            await fs
              .access(resultPath)
              .then(() => true)
              .catch(() => false)
          ) {
            const result = await fs.readFile(resultPath, "utf-8");
            console.log("\n📄 Result (result.txt):");
            console.log(result);
          }

          if (
            await fs
              .access(computedPath)
              .then(() => true)
              .catch(() => false)
          ) {
            const computed = await fs.readFile(computedPath, "utf-8");
            console.log("\n📋 Computed JSON:");
            console.log(computed);
          }
        } catch (error) {
          console.log("⚠️  Could not read output files");
        }
      } else {
        console.log(`❌ Test failed with exit code ${code}`);
      }
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      process.exit(code);
    });

    childProcess.on("error", error => {
      console.error(`❌ Error running app: ${error.message}`);
      process.exit(1);
    });
  } catch (error) {
    console.error(`❌ Test setup error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

runTest();

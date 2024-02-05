import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import fs from "fs";
import path from "path";
import * as bs58 from "bs58";

async function greetUser() {
  console.log("Hello, User!");
}

async function displayDate() {
  console.log("Current Date: ", new Date().toLocaleDateString());
}

async function sumNumbers(a: number, b: number) {
  console.log(`The sum of ${a} and ${b} is ${a + b}`);
}

async function generateKeypair() {
  console.log("Generating new keys!");
  let keypair = Keypair.generate();

  const walletData = {
    publicKey: keypair.publicKey.toString(),
    // Convert the secret key (Uint8Array) to an array of numbers for JSON serialization
    secretKey: Array.from(keypair.secretKey),
    balance: 0,
  };

  // Define the path to the JSON file
  const filePath = path.join(__dirname, "wallet.json");

  // Write the wallet data to the JSON file
  fs.writeFileSync(filePath, JSON.stringify(walletData, null, 1));

  const copiedKey = keypair.publicKey;
  const copiedKeypair = Keypair.fromSecretKey(
    Uint8Array.from(keypair.secretKey)
  );

  console.log(
    `let's compare! this is generated publickey ${keypair.publicKey.toBase58()}, here's the copied publickey ${copiedKeypair.publicKey.toBase58()}`
  );

  //console.log(keypair.publicKey.toBase58() === importedKey.toBase58());
  console.log(
    "Public keys match after copy:",
    keypair.publicKey.toBase58() === copiedKey.toBase58()
  );

  console.log("-------------let's import from file now--------");

  const importedKeypairFunction = importWallet();

  // Correctly formatted comparison log
  console.log(
    `let's compare! this is generated publickey ${keypair.publicKey.toBase58()}, here's the imported publickey ${importedKeypairFunction.publicKey.toBase58()}`
  );

  // Ensure you're comparing public keys correctly; the provided implementation should work as expected
  console.log(
    "Public keys match after import:",
    keypair.publicKey.toBase58() ===
      importedKeypairFunction.publicKey.toBase58()
  );
}

async function airdropToken() {
  const connection = new Connection("https://api.devnet.solana.com");
  const keypair = importWallet();

  (async () => {
    // 1e9 lamports = 10^9 lamports = 1 SOL
    let txhash = await connection.requestAirdrop(keypair.publicKey, 1e9);
    console.log(`we are lucky today! here's the txhash: ${txhash}`);
  })();
}

function importWallet(): Keypair {
  try {
    const filePath = path.join(__dirname, "wallet.json");
    // Read the JSON file synchronously
    const rawData = fs.readFileSync(filePath, { encoding: "utf8" });
    //console.log(rawData);

    // Parse the JSON data
    const walletData = JSON.parse(rawData);

    // Create a new Keypair from the secret key
    const keypair = Keypair.fromSecretKey(new Uint8Array(walletData.secretKey));

    // Return the Keypair object
    return keypair;
  } catch (err) {
    console.error("Failed to import wallet:", err);
    throw err; // Rethrow the error to handle it outside or to indicate failure
  }
}

// Process command line arguments
function processArgs() {
  const args = process.argv.slice(2);

  switch (args[0]) {
    case "greet":
      greetUser();
      break;
    case "new":
      generateKeypair();
      break;
    case "airdrop":
      airdropToken();
      break;
    case "sum":
      if (args.length < 3) {
        console.log("Please provide two numbers to sum.");
      } else {
        const num1 = parseFloat(args[1]);
        const num2 = parseFloat(args[2]);
        if (!isNaN(num1) && !isNaN(num2)) {
          sumNumbers(num1, num2);
        } else {
          console.log("Invalid numbers provided.");
        }
      }
      break;
    default:
      console.log(
        "Command not recognized. Available commands: greet, date, sum"
      );
  }
}

processArgs();

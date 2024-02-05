import {
  clusterApiUrl,
  PublicKey,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import fs from "fs";
import path from "path";
import readline from "readline";
import { promisify } from "util";

// Create a readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

async function checkFileAndConfirmOverride(filePath: string): Promise<boolean> {
  try {
    // Check if the file exists
    await fs.promises.access(filePath, fs.constants.F_OK);

    // File exists, ask for confirmation
    console.log(`The file "${filePath}" already exists.`);
    const answer = await question(
      "Are you sure you want to override the existing file? (y/n): "
    );

    // Close the readline interface after getting the answer
    rl.close();

    // Check the user's answer
    return answer.toLowerCase() === "y";
  } catch (error) {
    // If the file doesn't exist, no need to ask for confirmation
    rl.close(); // Ensure readline is closed in case of error
    return true;
  }
}

async function getBalance() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const keypair = importWallet();

  const wallet = keypair.publicKey;

  // Get the current balance
  const balance = await connection.getBalance(wallet);

  // Convert balance from lamports to SOL
  const balanceInSol = balance / LAMPORTS_PER_SOL;
  console.log(`${balanceInSol} SOL`);

  const filePath = path.join(__dirname, "wallet.json");
  let walletData = JSON.parse(fs.readFileSync(filePath, "utf8"));

  // Update the balance field
  walletData.balance = balanceInSol;

  //Updating the json file with new balance
  fs.writeFileSync(filePath, JSON.stringify(walletData, null, 2), "utf8");
}

async function transferSOL(to: PublicKey, amount: number) {
  const senderWallet = importWallet();
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );
  const transferTransaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: senderWallet.publicKey,
      toPubkey: to,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  let transferSignature = await sendAndConfirmTransaction(
    connection,
    transferTransaction,
    [senderWallet]
  );
  console.log("Transfer sent! Here's a signature: ", transferSignature);
  console.log("Here's the new balance");
  await getBalance();
}

async function generateKeypair() {
  console.log("Generating a new wallet!");
  let keypair = Keypair.generate();

  const walletData = {
    publicKey: keypair.publicKey.toString(),
    // Convert the secret key (Uint8Array) to an array of numbers for JSON serialization
    secretKey: Array.from(keypair.secretKey),
    balance: 0,
  };

  // Define the path to the JSON file
  const filePath = path.join(__dirname, "wallet.json");
  const canOverride = await checkFileAndConfirmOverride(filePath);

  if (canOverride) {
    fs.writeFileSync(filePath, JSON.stringify(walletData, null, 1));

    console.log("Generated wallet Pubkey: ", keypair.publicKey.toString());
  }
  // Write the wallet data to the JSON file
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
    case "new":
      generateKeypair();
      break;
    case "airdrop":
      airdropToken();
      break;
    case "balance":
      getBalance();
      break;
    case "transfer":
      if (args.length > 3) {
        console.log(
          "Please use the following format: 'npm start transfer [address] [amount]' "
        );
      } else {
        const address = args[1].toString();
        const amount = parseFloat(args[2]);

        console.log("Entered address:", address);
        console.log("Entered value:", amount);

        try {
          const key = new PublicKey(address);
          console.log(
            "it is a valid address",
            PublicKey.isOnCurve(key.toBytes())
          );
          transferSOL(key, amount);
        } catch (error) {
          console.log(
            "Entered address is not a valid wallet address: ",
            address
          );
          console.log(
            "Please use the following format: 'npm start transfer [address] [amount]' "
          );
        }
      }
      break;
    default:
      console.log(
        "Command not recognized. Available commands: new, balance, airdrop, and transfer [address] [value]"
      );
  }
}

processArgs();

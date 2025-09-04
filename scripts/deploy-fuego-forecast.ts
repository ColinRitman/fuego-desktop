import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FuegoForecast } from "../target/types/fuego_forecast";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
  Connection,
  clusterApiUrl 
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
} from "@solana/spl-token";

async function main() {
  // Configure the client to use the specified cluster
  const network = process.env.ANCHOR_NETWORK || "localnet";
  let connection: Connection;
  
  if (network === "mainnet") {
    connection = new Connection(clusterApiUrl("mainnet-beta"));
  } else if (network === "devnet") {
    connection = new Connection(clusterApiUrl("devnet"));
  } else {
    connection = new Connection("http://localhost:8899");
  }

  const wallet = anchor.AnchorProvider.env().wallet;
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);

  const program = anchor.workspace.FuegoForecast as Program<FuegoForecast>;

  console.log("🚀 Deploying FuegoForecast to", network);
  console.log("📍 Program ID:", program.programId.toString());
  console.log("👤 Deployer:", provider.wallet.publicKey.toString());

  // Configuration
  const EPOCH_DURATION = 8 * 60 * 60; // 8 hours
  const FEE_BPS = 500; // 5%
  const PRICE_BUFFER_BPS = 50; // 0.5% buffer (50 basis points)

  // Find PDA for forecast config
  const [forecastConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("forecast_config")],
    program.programId
  );

  console.log("📋 Forecast Config PDA:", forecastConfig.toString());

  // Check if already initialized
  try {
    const existingConfig = await program.account.forecastConfig.fetch(forecastConfig);
    console.log("✅ FuegoForecast already initialized!");
    console.log("📊 Current epoch:", existingConfig.currentEpoch.toString());
    console.log("⏰ Epoch duration:", existingConfig.epochDuration.toString(), "seconds");
    console.log("💰 Fee:", existingConfig.feeBps, "bps");
    console.log("🏛️ Treasury:", existingConfig.treasury.toString());
    console.log("🪙 Token mint:", existingConfig.tokenMint.toString());
    return;
  } catch (error) {
    console.log("🔧 FuegoForecast not yet initialized, proceeding with setup...");
  }

  // For demo purposes, create a new token mint
  // In production, you'd use an existing token like COLD
  let tokenMint: PublicKey;
  
  if (network === "localnet") {
    console.log("🪙 Creating demo token mint for local testing...");
    const mintKeypair = Keypair.generate();
    tokenMint = await createMint(
      connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      null,
      9, // 9 decimals
      mintKeypair
    );
    console.log("✅ Demo token mint created:", tokenMint.toString());
  } else {
    // For devnet/mainnet, you'd specify the actual COLD token mint
    // This is a placeholder - replace with actual COLD token mint address
    tokenMint = new PublicKey("YOUR_COLD_TOKEN_MINT_ADDRESS_HERE");
    console.log("🪙 Using existing token mint:", tokenMint.toString());
  }

  // Derive PDAs required by the program
  const [programTokenAccount] = anchor.utils.publicKey.findProgramAddressSync(
    [Buffer.from("token_vault"), forecastConfig.toBuffer()],
    program.programId
  );
  const [bondingVault] = anchor.utils.publicKey.findProgramAddressSync(
    [Buffer.from("bonding"), forecastConfig.toBuffer()],
    program.programId
  );

  // Initialize the FuegoForecast prediction market
  console.log("🎯 Initializing FuegoForecast prediction market...");
  console.log(`📊 Configuration: ${EPOCH_DURATION/3600}h epochs, ${FEE_BPS/100}% fee, ${PRICE_BUFFER_BPS/100}% buffer`);
  const tx = await program.methods
    .initializeForecast(new anchor.BN(EPOCH_DURATION), FEE_BPS, PRICE_BUFFER_BPS)
    .accounts({
      forecastConfig,
      tokenMint,
      authority: provider.wallet.publicKey,
      programTokenAccount,
      bondingVault,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log("✅ FuegoForecast initialized!");
  console.log("📝 Transaction signature:", tx);

  // Verify the initialization
  const configAccount = await program.account.forecastConfig.fetch(forecastConfig);
  console.log("\n📊 Deployment Summary:");
  console.log("=".repeat(50));
  console.log("🏛️ Authority:", configAccount.authority.toString());
  console.log("🏦 Treasury:", configAccount.treasury.toString());
  console.log("📈 Current epoch:", configAccount.currentEpoch.toString());
  console.log("⏰ Epoch duration:", configAccount.epochDuration.toString(), "seconds");
  console.log("💰 Fee:", configAccount.feeBps, "bps");
  console.log("📊 Price buffer:", configAccount.priceBufferBps, "bps");
  console.log("🪙 Token mint:", configAccount.tokenMint.toString());
  console.log("💼 Program token vault:", programTokenAccount.toString());
  console.log("🎁 Bonding vault:", bondingVault.toString());
  console.log("🔄 Market active:", configAccount.isActive);
  console.log("=".repeat(50));

  if (network === "localnet") {
    console.log("\n🎮 Demo Setup:");
    console.log("To start testing, you can:");
    console.log("1. Run: anchor test");
    console.log("2. Or manually start an epoch with start_new_epoch instruction");
    console.log("3. Users can then deposit into UP/DOWN vaults");
    console.log("4. After epoch ends, resolve with actual price data");
    console.log("5. Winners can claim their rewards!");
  }

  console.log("\n🎉 Deployment complete!");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
}); 
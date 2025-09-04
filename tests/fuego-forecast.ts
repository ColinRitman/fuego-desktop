import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FuegoForecast } from "../target/types/fuego_forecast";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { expect } from "chai";

describe("fuego-forecast", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.FuegoForecast as Program<FuegoForecast>;
  const provider = anchor.getProvider();

  // Test accounts
  let authority: Keypair;
  let user1: Keypair;
  let user2: Keypair;
  let user3: Keypair;
  
  // Token accounts
  let tokenMint: PublicKey;
  let authorityTokenAccount: PublicKey;
  let user1TokenAccount: PublicKey;
  let user2TokenAccount: PublicKey;
  let user3TokenAccount: PublicKey;
  let programTokenAccount: PublicKey;
  
  // Program accounts
  let forecastConfig: PublicKey;
  let epoch1: PublicKey;
  
  // Constants
  const EPOCH_DURATION = 8 * 60 * 60; // 8 hours
  const FEE_BPS = 500; // 5%
  const PRICE_BUFFER_BPS = 50; // 0.5% buffer (50 basis points)
  const INITIAL_PRICE = new anchor.BN(2000_00000000); // $2000 with 8 decimals
  const DEPOSIT_AMOUNT = new anchor.BN(100_000000000); // 100 tokens with 9 decimals

  before(async () => {
    // Generate test keypairs
    authority = Keypair.generate();
    user1 = Keypair.generate();
    user2 = Keypair.generate();
    user3 = Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(authority.publicKey, 2 * LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user1.publicKey, 2 * LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user2.publicKey, 2 * LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user3.publicKey, 2 * LAMPORTS_PER_SOL)
    );

    // Create token mint (representing COLD tokens)
    tokenMint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      9 // 9 decimals
    );

    // Create token accounts
    authorityTokenAccount = await createAccount(
      provider.connection,
      authority,
      tokenMint,
      authority.publicKey
    );

    user1TokenAccount = await createAccount(
      provider.connection,
      user1,
      tokenMint,
      user1.publicKey
    );

    user2TokenAccount = await createAccount(
      provider.connection,
      user2,
      tokenMint,
      user2.publicKey
    );

    user3TokenAccount = await createAccount(
      provider.connection,
      user3,
      tokenMint,
      user3.publicKey
    );

    // Find PDA for forecast config
    [forecastConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("forecast_config")],
      program.programId
    );

    // Create program token account (owned by the forecast config PDA)
    programTokenAccount = await createAccount(
      provider.connection,
      authority,
      tokenMint,
      forecastConfig
    );

    // Mint tokens to users for testing
    const mintAmount = new anchor.BN(1000_000000000); // 1000 tokens
    await mintTo(
      provider.connection,
      authority,
      tokenMint,
      user1TokenAccount,
      authority,
      mintAmount.toNumber()
    );
    await mintTo(
      provider.connection,
      authority,
      tokenMint,
      user2TokenAccount,
      authority,
      mintAmount.toNumber()
    );
    await mintTo(
      provider.connection,
      authority,
      tokenMint,
      user3TokenAccount,
      authority,
      mintAmount.toNumber()
    );
  });

  it("Initialize FuegoForecast", async () => {
    const tx = await program.methods
      .initializeForecast(
        new anchor.BN(EPOCH_DURATION),
        FEE_BPS,
        PRICE_BUFFER_BPS
      )
      .accounts({
        authority: authority.publicKey,
        forecastConfig: forecastConfig,
        tokenMint: tokenMint,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    console.log("Initialize transaction signature", tx);

    // Verify the forecast config
    const config = await program.account.forecastConfig.fetch(forecastConfig);
    expect(config.authority.toString()).to.equal(authority.publicKey.toString());
    expect(config.epochDuration.toNumber()).to.equal(EPOCH_DURATION);
    expect(config.feeBps).to.equal(FEE_BPS);
    expect(config.priceBufferBps).to.equal(PRICE_BUFFER_BPS);
    expect(config.isActive).to.be.true;
  });

  it("Start a new prediction epoch", async () => {
    // Find PDA for epoch 1
    [epoch1] = PublicKey.findProgramAddressSync(
      [Buffer.from("epoch"), new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const tx = await program.methods
      .startNewEpoch(INITIAL_PRICE)
      .accounts({
        forecastConfig,
        epoch: epoch1,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    console.log("Start epoch transaction signature", tx);

    // Verify epoch was created correctly
    const epochAccount = await program.account.forecastEpoch.fetch(epoch1);
    expect(epochAccount.epochId.toNumber()).to.equal(1);
    expect(epochAccount.startPrice.toString()).to.equal(INITIAL_PRICE.toString());
    expect(epochAccount.upVaultTotal.toNumber()).to.equal(0);
    expect(epochAccount.downVaultTotal.toNumber()).to.equal(0);
    expect(epochAccount.isResolved).to.be.false;

    // Verify forecast config was updated
    const configAccount = await program.account.forecastConfig.fetch(forecastConfig);
    expect(configAccount.currentEpoch.toNumber()).to.equal(1);
  });

  it("Users can deposit into UP and DOWN vaults", async () => {
    // User 1 deposits into UP vault
    const [user1Position] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("position"),
        user1.publicKey.toBuffer(),
        new anchor.BN(1).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    const tx1 = await program.methods
      .depositForecast({ up: {} }, DEPOSIT_AMOUNT)
      .accounts({
        forecastConfig,
        epoch: epoch1,
        userPosition: user1Position,
        userTokenAccount: user1TokenAccount,
        programTokenAccount,
        user: user1.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    console.log("User 1 deposit transaction signature", tx1);

    // User 2 deposits into UP vault
    const [user2Position] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("position"),
        user2.publicKey.toBuffer(),
        new anchor.BN(1).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    const tx2 = await program.methods
      .depositForecast({ up: {} }, DEPOSIT_AMOUNT.mul(new anchor.BN(2))) // 200 tokens
      .accounts({
        forecastConfig,
        epoch: epoch1,
        userPosition: user2Position,
        userTokenAccount: user2TokenAccount,
        programTokenAccount,
        user: user2.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user2])
      .rpc();

    console.log("User 2 deposit transaction signature", tx2);

    // User 3 deposits into DOWN vault
    const [user3Position] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("position"),
        user3.publicKey.toBuffer(),
        new anchor.BN(1).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    const tx3 = await program.methods
      .depositForecast({ down: {} }, DEPOSIT_AMOUNT) // 100 tokens
      .accounts({
        forecastConfig,
        epoch: epoch1,
        userPosition: user3Position,
        userTokenAccount: user3TokenAccount,
        programTokenAccount,
        user: user3.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user3])
      .rpc();

    console.log("User 3 deposit transaction signature", tx3);

    // Verify epoch totals
    const epochAccount = await program.account.forecastEpoch.fetch(epoch1);
    expect(epochAccount.upVaultTotal.toString()).to.equal(
      DEPOSIT_AMOUNT.mul(new anchor.BN(3)).toString() // 100 + 200 = 300
    );
    expect(epochAccount.downVaultTotal.toString()).to.equal(
      DEPOSIT_AMOUNT.toString() // 100
    );
    expect(epochAccount.totalAmount.toString()).to.equal(
      DEPOSIT_AMOUNT.mul(new anchor.BN(4)).toString() // 400 total
    );

    // Verify user positions
    const user1PositionAccount = await program.account.userPosition.fetch(user1Position);
    expect(user1PositionAccount.amount.toString()).to.equal(DEPOSIT_AMOUNT.toString());
    expect(user1PositionAccount.position).to.deep.equal({ up: {} });

    const user3PositionAccount = await program.account.userPosition.fetch(user3Position);
    expect(user3PositionAccount.amount.toString()).to.equal(DEPOSIT_AMOUNT.toString());
    expect(user3PositionAccount.position).to.deep.equal({ down: {} });
  });

  it("Resolve epoch with UP vault winning", async () => {
    // Wait for epoch to end (simulate time passing)
    // In a real test, you'd need to manipulate the clock or wait
    
    const closePrice = INITIAL_PRICE.add(new anchor.BN(100_00000000)); // Price goes up by $100
    
    const tx = await program.methods
      .resolveEpoch(closePrice)
      .accounts({
        forecastConfig,
        epoch: epoch1,
        programTokenAccount,
        treasuryTokenAccount: authorityTokenAccount, // Authority is treasury
        authority: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([authority])
      .rpc();

    console.log("Resolve epoch transaction signature", tx);

    // Verify epoch was resolved correctly
    const epochAccount = await program.account.forecastEpoch.fetch(epoch1);
    expect(epochAccount.isResolved).to.be.true;
    expect(epochAccount.closePrice.toString()).to.equal(closePrice.toString());
    expect(epochAccount.winningPosition).to.deep.equal({ up: {} });

    // Check that treasury received fee
    const treasuryBalance = await getAccount(provider.connection, authorityTokenAccount);
    const expectedFee = DEPOSIT_AMOUNT.mul(new anchor.BN(FEE_BPS)).div(new anchor.BN(10000)); // 5% of losing vault (100 tokens)
    expect(treasuryBalance.amount.toString()).to.equal(expectedFee.toString());
  });

  it("Winners can claim their rewards", async () => {
    // User 1 claims (winner)
    const [user1Position] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("position"),
        user1.publicKey.toBuffer(),
        new anchor.BN(1).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    const user1BalanceBefore = await getAccount(provider.connection, user1TokenAccount);

    const tx1 = await program.methods
      .claimRewards()
      .accounts({
        forecastConfig,
        epoch: epoch1,
        userPosition: user1Position,
        userTokenAccount: user1TokenAccount,
        programTokenAccount,
        user: user1.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user1])
      .rpc();

    console.log("User 1 claim transaction signature", tx1);

    // Verify user 1 received their stake + winnings
    const user1BalanceAfter = await getAccount(provider.connection, user1TokenAccount);
    const user1Gained = new anchor.BN(user1BalanceAfter.amount.toString())
      .sub(new anchor.BN(user1BalanceBefore.amount.toString()));

    // User 1 should get their 100 tokens back + their share of the prize pool
    // Prize pool = 100 tokens (losing vault) - 5 tokens (fee) = 95 tokens
    // User 1's share = (100/300) * 95 = ~31.67 tokens
    // Total claim = 100 + 31.67 = ~131.67 tokens
    expect(user1Gained.toNumber()).to.be.greaterThan(DEPOSIT_AMOUNT.toNumber());

    // Verify position is marked as claimed
    const user1PositionAccount = await program.account.userPosition.fetch(user1Position);
    expect(user1PositionAccount.hasClaimed).to.be.true;
  });

  it("Losers get nothing when they try to claim", async () => {
    // User 3 tries to claim (loser)
    const [user3Position] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("position"),
        user3.publicKey.toBuffer(),
        new anchor.BN(1).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    const user3BalanceBefore = await getAccount(provider.connection, user3TokenAccount);

    const tx3 = await program.methods
      .claimRewards()
      .accounts({
        forecastConfig,
        epoch: epoch1,
        userPosition: user3Position,
        userTokenAccount: user3TokenAccount,
        programTokenAccount,
        user: user3.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user3])
      .rpc();

    console.log("User 3 claim transaction signature", tx3);

    // Verify user 3 received nothing (they lost)
    const user3BalanceAfter = await getAccount(provider.connection, user3TokenAccount);
    expect(user3BalanceAfter.amount.toString()).to.equal(user3BalanceBefore.amount.toString());

    // Verify position is marked as claimed
    const user3PositionAccount = await program.account.userPosition.fetch(user3Position);
    expect(user3PositionAccount.hasClaimed).to.be.true;
  });

  it("Cannot claim rewards twice", async () => {
    const [user1Position] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("position"),
        user1.publicKey.toBuffer(),
        new anchor.BN(1).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    try {
      await program.methods
        .claimRewards()
        .accounts({
          forecastConfig,
          epoch: epoch1,
          userPosition: user1Position,
          userTokenAccount: user1TokenAccount,
          programTokenAccount,
          user: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();
      
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).to.include("AlreadyClaimed");
    }
  });

  it("Handle neutral outcome when price stays within buffer", async () => {
    // Start a new epoch
    const startPrice = new anchor.BN(2000_00000000); // $2000
    await program.methods
      .startNewEpoch(startPrice)
      .accounts({
        authority: authority.publicKey,
        forecastConfig: forecastConfig,
        epoch: epoch1,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Users deposit on both sides
    const userAAmount = new anchor.BN(100_000000000); // 100 tokens
    const userBAmount = new anchor.BN(200_000000000); // 200 tokens

    // User A bets UP
    await program.methods
      .depositForecast(userAAmount, { up: {} })
      .accounts({
        user: user1.publicKey,
        forecastConfig: forecastConfig,
        epoch: epoch1,
        userPosition: user1Position,
        userTokenAccount: user1TokenAccount,
        programTokenAccount: programTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    // User B bets DOWN
    await program.methods
      .depositForecast(userBAmount, { down: {} })
      .accounts({
        user: user3.publicKey,
        forecastConfig: forecastConfig,
        epoch: epoch1,
        userPosition: user3Position,
        userTokenAccount: user3TokenAccount,
        programTokenAccount: programTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user3])
      .rpc();

    // Fast forward time to after epoch end
    const currentTime = Math.floor(Date.now() / 1000);
    const endTime = currentTime + EPOCH_DURATION + 1;
    
    // Set close price within buffer zone (0.5% = 50 bps)
    // Buffer = 2000 * 50 / 10000 = 1 USD
    // So neutral zone is $1999 - $2001
    const neutralPrice = new anchor.BN(2000_50000000); // $2000.50 (within buffer)

    await program.methods
      .resolveEpoch(neutralPrice)
      .accounts({
        authority: authority.publicKey,
        forecastConfig: forecastConfig,
        epoch: epoch1,
        programTokenAccount: programTokenAccount,
        treasuryTokenAccount: authorityTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([authority])
      .rpc();

    // Check epoch was resolved as neutral
    const epochAccount = await program.account.forecastEpoch.fetch(epoch1);
    expect(epochAccount.isResolved).to.be.true;
    expect(epochAccount.winningPosition).to.deep.equal({ neutral: {} });
    expect(epochAccount.feeCollected.toNumber()).to.equal(0); // No fee in neutral

    // Both users should be able to claim their original stakes back
    const userABalanceBefore = await getAccount(provider.connection, user1TokenAccount);
    await program.methods
      .claimRewards()
      .accounts({
        user: user1.publicKey,
        forecastConfig: forecastConfig,
        epoch: epoch1,
        userPosition: user1Position,
        userTokenAccount: user1TokenAccount,
        programTokenAccount: programTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user1])
      .rpc();

    const userABalanceAfter = await getAccount(provider.connection, user1TokenAccount);
    expect(userABalanceAfter - userABalanceBefore).to.equal(userAAmount.toNumber());

    const userBBalanceBefore = await getAccount(provider.connection, user3TokenAccount);
    await program.methods
      .claimRewards()
      .accounts({
        user: user3.publicKey,
        forecastConfig: forecastConfig,
        epoch: epoch1,
        userPosition: user3Position,
        userTokenAccount: user3TokenAccount,
        programTokenAccount: programTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user3])
      .rpc();

    const userBBalanceAfter = await getAccount(provider.connection, user3TokenAccount);
    expect(userBBalanceAfter - userBBalanceBefore).to.equal(userBAmount.toNumber());
  });
}); 
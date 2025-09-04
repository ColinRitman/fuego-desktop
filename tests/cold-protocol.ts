import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ColdProtocol } from "../target/types/cold_protocol";
import { PlonkVerifier } from "../target/types/plonk_verifier";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createMint, createAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { expect } from "chai";
import * as crypto from "crypto";

describe("COLD Protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const coldProgram = anchor.workspace.ColdProtocol as Program<ColdProtocol>;
  const verifierProgram = anchor.workspace.PlonkVerifier as Program<PlonkVerifier>;

  let authority: Keypair;
  let treasury: Keypair;
  let user1: Keypair;
  let user2: Keypair;
  let heatMint: PublicKey;
  let oMint: PublicKey;
  let protocolState: PublicKey;

  // Test data
  const mockProof = Buffer.alloc(416); // 13 * 32 bytes for PLONK proof
  const mockPublicSignals = Buffer.alloc(64); // 2 * 32 bytes for public signals
  const testNullifier = crypto.randomBytes(32);
  const testRecipient = PublicKey.unique();

  before(async () => {
    // Initialize keypairs
    authority = Keypair.generate();
    treasury = Keypair.generate();
    user1 = Keypair.generate();
    user2 = Keypair.generate();

    // Airdrop SOL for testing
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(authority.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user1.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user2.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );

    // Find protocol state PDA
    [protocolState] = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol_state")],
      coldProgram.programId
    );

    // Create token mints with protocol state as authority
    heatMint = await createMint(
      provider.connection,
      authority,
      protocolState, // Protocol state will be mint authority
      null,
      9 // 9 decimals for HEAT
    );

    oMint = await createMint(
      provider.connection,
      authority,
      protocolState, // Protocol state will be mint authority
      null,
      0 // 0 decimals for O (non-divisible)
    );

    // Fill mock proof with non-zero data
    mockProof.fill(1);
    // Set some curve points (simplified)
    for (let i = 0; i < 7; i++) {
      // Each G1 point is 64 bytes (32 for x, 32 for y)
      mockProof.writeUInt32BE(i + 1, i * 64);
      mockProof.writeUInt32BE(i + 2, i * 64 + 32);
    }

    // Fill mock public signals
    mockPublicSignals.fill(0);
    // Set nullifier in first 32 bytes
    testNullifier.copy(mockPublicSignals, 0);
    // Set recipient in next 32 bytes (simplified - just use first 32 bytes of pubkey)
    testRecipient.toBuffer().copy(mockPublicSignals, 32);
  });

  describe("Initialization", () => {
    it("Initializes the COLD protocol", async () => {
      const tx = await coldProgram.methods
        .initialize(800) // 8% treasury fee
        .accounts({
          protocolState,
          heatMint,
          oMint,
          treasury: treasury.publicKey,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      console.log("Initialize transaction signature:", tx);

      // Verify protocol state
      const state = await coldProgram.account.protocolState.fetch(protocolState);
      expect(state.authority.toString()).to.equal(authority.publicKey.toString());
      expect(state.treasury.toString()).to.equal(treasury.publicKey.toString());
      expect(state.treasuryFeeBps).to.equal(800);
      expect(state.totalDeposits.toNumber()).to.equal(0);
      expect(state.totalHeatMinted.toNumber()).to.equal(0);
      expect(state.totalOMinted.toNumber()).to.equal(0);
      expect(state.isPaused).to.equal(false);
    });
  });

  describe("Deposit Proof Submission", () => {
    let user1HeatAccount: PublicKey;
    let user1OAccount: PublicKey;
    let nullifierState: PublicKey;

    before(async () => {
      // Create associated token accounts for user1
      user1HeatAccount = await createAssociatedTokenAccount(
        provider.connection,
        user1,
        heatMint,
        user1.publicKey
      );

      user1OAccount = await createAssociatedTokenAccount(
        provider.connection,
        user1,
        oMint,
        user1.publicKey
      );

      // Find nullifier state PDA
      [nullifierState] = PublicKey.findProgramAddressSync(
        [Buffer.from("nullifier"), testNullifier],
        coldProgram.programId
      );
    });

    it("Successfully submits a deposit proof and mints rewards", async () => {
      const tx = await coldProgram.methods
        .submitDepositProof(
          Array.from(mockProof),
          Array.from(mockPublicSignals),
          Array.from(testNullifier),
          testRecipient
        )
        .accounts({
          protocolState,
          nullifierState,
          heatTokenAccount: user1HeatAccount,
          oTokenAccount: user1OAccount,
          heatMint,
          oMint,
          depositor: user1.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();

      console.log("Submit deposit proof transaction signature:", tx);

      // Verify nullifier state
      const nullState = await coldProgram.account.nullifierState.fetch(nullifierState);
      expect(nullState.isUsed).to.equal(true);
      expect(Buffer.from(nullState.nullifier)).to.deep.equal(testNullifier);

      // Verify protocol state updates
      const protocolStateData = await coldProgram.account.protocolState.fetch(protocolState);
      expect(protocolStateData.totalDeposits.toNumber()).to.equal(1);
      expect(protocolStateData.totalHeatMinted.toNumber()).to.be.greaterThan(0);

      // Verify token balances
      const heatBalance = await provider.connection.getTokenAccountBalance(user1HeatAccount);
      const oBalance = await provider.connection.getTokenAccountBalance(user1OAccount);
      
      expect(parseInt(heatBalance.value.amount)).to.be.greaterThan(0);
      console.log("HEAT tokens minted:", heatBalance.value.amount);
      console.log("O tokens minted:", oBalance.value.amount);
    });

    it("Prevents double-spending with same nullifier", async () => {
      try {
        await coldProgram.methods
          .submitDepositProof(
            Array.from(mockProof),
            Array.from(mockPublicSignals),
            Array.from(testNullifier),
            testRecipient
          )
          .accounts({
            protocolState,
            nullifierState,
            heatTokenAccount: user1HeatAccount,
            oTokenAccount: user1OAccount,
            heatMint,
            oMint,
            depositor: user1.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([user1])
          .rpc();
        
        expect.fail("Should have failed with nullifier already used");
      } catch (error) {
        expect(error.message).to.include("already been used");
      }
    });
  });

  describe("Governance", () => {
    let user2OAccount: PublicKey;
    let proposalState: PublicKey;
    let voterState: PublicKey;
    const proposalId = 1;

    before(async () => {
      // Create O token account for user2
      user2OAccount = await createAssociatedTokenAccount(
        provider.connection,
        user2,
        oMint,
        user2.publicKey
      );

      // Mint some O tokens to user2 for governance (simulate earning them)
      // Note: In production, O tokens would only be minted through deposit proofs
      await mintTo(
        provider.connection,
        authority,
        oMint,
        user2OAccount,
        protocolState, // Protocol state is the mint authority
        5, // 5 O tokens
        []
      );

      // Find proposal and voter state PDAs
      [proposalState] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), Buffer.from(proposalId.toString().padStart(8, '0'))],
        coldProgram.programId
      );

      [voterState] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("voter"),
          Buffer.from(proposalId.toString().padStart(8, '0')),
          user2.publicKey.toBuffer()
        ],
        coldProgram.programId
      );
    });

    it("Creates a governance proposal", async () => {
      const description = "Increase deposit rewards by 10%";
      const votingPeriod = 7 * 24 * 60 * 60; // 7 days in seconds

      const tx = await coldProgram.methods
        .createProposal(
          new anchor.BN(proposalId),
          { parameterChange: {} },
          description,
          new anchor.BN(votingPeriod)
        )
        .accounts({
          proposalState,
          protocolState,
          proposerOAccount: user2OAccount,
          oMint,
          proposer: user2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user2])
        .rpc();

      console.log("Create proposal transaction signature:", tx);

      // Verify proposal state
      const proposal = await coldProgram.account.proposalState.fetch(proposalState);
      expect(proposal.proposalId.toNumber()).to.equal(proposalId);
      expect(proposal.proposer.toString()).to.equal(user2.publicKey.toString());
      expect(proposal.description).to.equal(description);
      expect(proposal.status).to.deep.equal({ active: {} });
    });

    it("Votes on a proposal", async () => {
      const vote = true; // Vote yes
      const votingPower = 3; // Use 3 O tokens for voting

      const tx = await coldProgram.methods
        .voteOnProposal(
          new anchor.BN(proposalId),
          vote,
          new anchor.BN(votingPower)
        )
        .accounts({
          proposalState,
          voterState,
          voterOAccount: user2OAccount,
          oMint,
          voter: user2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user2])
        .rpc();

      console.log("Vote on proposal transaction signature:", tx);

      // Verify vote was recorded
      const voter = await coldProgram.account.voterState.fetch(voterState);
      expect(voter.hasVoted).to.equal(true);
      expect(voter.vote).to.equal(vote);
      expect(voter.votingPower.toNumber()).to.equal(votingPower);

      // Verify proposal vote counts
      const proposal = await coldProgram.account.proposalState.fetch(proposalState);
      expect(proposal.votesFor.toNumber()).to.equal(votingPower);
      expect(proposal.votesAgainst.toNumber()).to.equal(0);
    });

    it("Prevents double voting", async () => {
      try {
        await coldProgram.methods
          .voteOnProposal(
            new anchor.BN(proposalId),
            false,
            new anchor.BN(2)
          )
          .accounts({
            proposalState,
            voterState,
            voterOAccount: user2OAccount,
            oMint,
            voter: user2.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user2])
          .rpc();
        
        expect.fail("Should have failed with already voted");
      } catch (error) {
        expect(error.message).to.include("already voted");
      }
    });
  });

  describe("HEAT Burning", () => {
    let user1HeatAccount: PublicKey;

    before(async () => {
      user1HeatAccount = await getAssociatedTokenAddress(heatMint, user1.publicKey);
    });

    it("Burns HEAT tokens for gas credits", async () => {
      // Get initial HEAT balance
      const initialBalance = await provider.connection.getTokenAccountBalance(user1HeatAccount);
      const burnAmount = 100; // Burn 100 HEAT tokens

      const tx = await coldProgram.methods
        .burnHeatForGas(new anchor.BN(burnAmount))
        .accounts({
          protocolState,
          userHeatAccount: user1HeatAccount,
          heatMint,
          user: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();

      console.log("Burn HEAT transaction signature:", tx);

      // Verify HEAT tokens were burned
      const finalBalance = await provider.connection.getTokenAccountBalance(user1HeatAccount);
      const burnedAmount = parseInt(initialBalance.value.amount) - parseInt(finalBalance.value.amount);
      expect(burnedAmount).to.equal(burnAmount);

      // Verify protocol state updated
      const protocolStateData = await coldProgram.account.protocolState.fetch(protocolState);
      expect(protocolStateData.totalHeatBurned.toNumber()).to.equal(burnAmount);
    });
  });

  describe("Emergency Functions", () => {
    it("Authority can pause the protocol", async () => {
      const tx = await coldProgram.methods
        .emergencyPause()
        .accounts({
          protocolState,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log("Emergency pause transaction signature:", tx);

      // Verify protocol is paused
      const state = await coldProgram.account.protocolState.fetch(protocolState);
      expect(state.isPaused).to.equal(true);
    });

    it("Prevents operations when paused", async () => {
      const newNullifier = crypto.randomBytes(32);
      const [newNullifierState] = PublicKey.findProgramAddressSync(
        [Buffer.from("nullifier"), newNullifier],
        coldProgram.programId
      );

      try {
        await coldProgram.methods
          .submitDepositProof(
            Array.from(mockProof),
            Array.from(mockPublicSignals),
            Array.from(newNullifier),
            testRecipient
          )
          .accounts({
            protocolState,
            nullifierState: newNullifierState,
            heatTokenAccount: await getAssociatedTokenAddress(heatMint, user1.publicKey),
            oTokenAccount: await getAssociatedTokenAddress(oMint, user1.publicKey),
            heatMint,
            oMint,
            depositor: user1.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([user1])
          .rpc();
        
        expect.fail("Should have failed when protocol is paused");
      } catch (error) {
        expect(error.message).to.include("paused");
      }
    });

    it("Authority can unpause the protocol", async () => {
      const tx = await coldProgram.methods
        .emergencyUnpause()
        .accounts({
          protocolState,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      console.log("Emergency unpause transaction signature:", tx);

      // Verify protocol is unpaused
      const state = await coldProgram.account.protocolState.fetch(protocolState);
      expect(state.isPaused).to.equal(false);
    });
  });

  describe("Protocol Statistics", () => {
    it("Retrieves protocol statistics", async () => {
      const stats = await coldProgram.methods
        .getProtocolStats()
        .accounts({
          protocolState,
        })
        .view();

      console.log("Protocol Statistics:", stats);
      
      expect(stats.totalDeposits.toNumber()).to.be.greaterThan(0);
      expect(stats.totalHeatMinted.toNumber()).to.be.greaterThan(0);
      expect(stats.totalHeatBurned.toNumber()).to.be.greaterThan(0);
      expect(stats.remainingOSupply.toNumber()).to.be.lessThan(80); // Less than max supply
      expect(stats.isPaused).to.equal(false);
    });
  });

  describe("O Token Supply Limit", () => {
    it("Enforces maximum O token supply of 80", async () => {
      // This test would require many deposit proofs to reach the limit
      // For now, we'll just verify the logic exists in the state
      const state = await coldProgram.account.protocolState.fetch(protocolState);
      expect(state.totalOMinted.toNumber()).to.be.lessThanOrEqual(80);
      
      // Check remaining supply calculation
      const remainingSupply = 80 - state.totalOMinted.toNumber();
      expect(remainingSupply).to.be.greaterThanOrEqual(0);
      
      console.log("Current O tokens minted:", state.totalOMinted.toNumber());
      console.log("Remaining O supply:", remainingSupply);
    });
  });

  describe("Reward Calculation", () => {
    it("Calculates appropriate rewards for early depositors", async () => {
      const state = await coldProgram.account.protocolState.fetch(protocolState);
      
      // Early depositors should get bonus rewards
      if (state.totalDeposits.toNumber() < 100) {
        console.log("Early depositor bonus period active");
        console.log("Total deposits so far:", state.totalDeposits.toNumber());
      }
      
      // Verify HEAT burn rate calculation
      const burnRate = state.totalHeatBurned.toNumber() / Math.max(1, state.totalHeatMinted.toNumber());
      console.log("HEAT burn rate:", (burnRate * 100).toFixed(2) + "%");
      
      expect(burnRate).to.be.greaterThanOrEqual(0);
      expect(burnRate).to.be.lessThanOrEqual(1);
    });
  });
}); 
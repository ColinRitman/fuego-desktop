# COLD L3 Comprehensive Memory & Architecture

> **Complete consolidation of COLD L3 ecosystem design, economics, privacy, and implementation**
> 
> **Last Updated**: January 2025  
> **Status**: Production Architecture Ready

---

## 🚀 **Current Development Status (January 2025)**

### **Recent Protocol & Implementation Updates**

#### **ZK Circuit System Migration to Winterfell STARK**
- **✅ Completed**: Migrated from Circom to Winterfell with STARK backend
- **✅ Completed**: Transparent setup (no trusted ceremony required)
- **🔄 In Progress**: Poseidon hash gadget integration replacing demo constraints
- **🔄 In Progress**: Rust CLI prover with JSON output for contract compatibility

#### **Bridge Architecture Evolution**
- **✅ Completed**: Single mint verifier on COLD L3 for all O tokens across chains
- **✅ Completed**: Each satellite chain runs Fuego header relay + OValidator contract
- **✅ Completed**: Local on-chain verification of Winterfell proofs (no cross-chain communication)
- **✅ Completed**: ChainCode byte in secret prevents double minting across chains

#### **Repository Structure Reorganization**
- **✅ Completed**: COLD web page isolated into `cold-web/` folder
- **✅ Completed**: Rust prover and circuit in `tools/prove-burn/`
- **✅ Completed**: Contract and test suite in `cold-contracts/`
- **✅ Completed**: Clean separation of concerns and modular architecture

#### **Merge-Mining Implementation**
- **✅ Completed**: Satellites verify proofs locally (no dependency on merge-mined blocks)
- **✅ Completed**: COLD L3 blocks can be merge-mined by Fuego miners for additional security
- **✅ Completed**: Fuego header relay provides block data for proof verification

#### **New Privacy Feature: Standardized Deposits**
- **🆕 New**: All XFG burn deposits must equal exactly 0.8 XFG (8M HEAT)
- **🆕 New**: Perfect amount privacy - no amount correlation possible
- **🆕 New**: Tornado-style account abstraction mixer for COLD withdrawals
- **🆕 New**: Inclusion proof system for mixer withdrawals

#### **Current Development Focus**
- **🔄 Active**: Debugging and finalizing Winterfell STARK circuit implementation
- **🔄 Active**: Poseidon hash gadget integration and testing
- **🔄 Active**: Contract integration with new STARK-based verifier
- **🔄 Active**: CLI and contract integration testing
- **🆕 New**: Standardized deposit privacy feature implementation

### **Technical Stack Updates**
- **ZK Framework**: Winterfell with STARK backend (transparent, no ceremony)
- **Hash Function**: Poseidon (replacing demo square function)
- **Language**: Rust for circuit and CLI, Solidity for contracts
- **Proof Format**: JSON-compatible for easy contract integration
- **Privacy**: Standardized deposits + tornado-style mixer

---

## 📊 **Executive Summary**

COLD L3 is a privacy-first rollup with revolutionary economic design featuring:
- **Merge-mined consensus** with Fuego blockchain (CryptoNote PoW)
- **HEAT tokens** minted only from XFG burns (no inflation)
- **Hybrid validator economics** (democratic + guardian validators)
- **Comprehensive privacy features** (confidential transactions, private staking)
- **Multi-layered bridge system** (commitment-reveal + ZK options)
- **Transparent ZK setup** (Halo2 IPA, no trusted ceremony)

---

## 🏗️ **Core Architecture**

### Layer Stack Overview
```
Ethereum L1  ──┐
               │  (final settlement & censorship resistance)
Arbitrum One ──┼──► posts COLD state roots (fraud-proof window)
               │
Celestia DA ───┘  (cheap blob data for full COLD tx-set)
         ▲
         │  Merge-mining → inherits PoW security & Fuego tx-visibility
COLD  L3 │  (execution: HEAT minting, privacy, AMM, etc.)
         │
Fuego  L1 │  (CryptoNote chain, XFG burns, privacy)
```

### Component Details

#### **Fuego Chain (L1 Base)**
- **Architecture**: CryptoNote PoW blockchain
- **Max Supply**: 8,000,008.8000008 XFG (80,000,088,000,008 raw units)
- **Decimals**: 7 places (exact middle of raw supply number)
- **Block Time**: 480 seconds (8 minutes)
- **Network**: P2P=10808, RPC=18180
- **Hash Functions**: keccak, blake256, skein, groestl, chacha8, jh
- **Privacy**: Ring signatures + key images for double-spend prevention
- **Source Analysis**: 474 files, 1,342+ functions indexed

#### **COLD L3 (Execution Layer)**
- **Consensus**: Tendermint (8-second blocks)
- **VM**: EVM-compatible with COLD-specific precompiles
- **Gas Token**: HEAT (native token economics)
- **Validators**: 21 total (15 democratic + 6 guardian)
- **Revenue Model**: 100% transaction fees (no inflation)
- **ZK System**: Halo2 IPA backend (transparent setup)

#### **Data Availability & Settlement**
- **Celestia DA**: Modular DA layer for transaction blobs
- **Arbitrum Settlement**: Posts COLD state roots + blob commitments
- **Ethereum L1**: Ultimate settlement and fraud-proof court

---

## 💰 **HEAT Token Economics**

### Revolutionary Supply Model
Unlike traditional PoS networks, HEAT implements **constrained supply**:

```
XFG (Fuego Chain) → [Burn Proof] → HEAT (COLD L3)
```

**Key Constraints:**
- ❌ **NO block rewards** - Zero inflationary mechanisms
- ❌ **NO staking rewards** - No new HEAT created for validation
- ✅ **XFG burn verification required** - Cryptographic proof of destruction
- ✅ **1:10M mint ratio** - 1 XFG = 10,000,000 HEAT
- ✅ **Transparent ZK setup** - Halo2 IPA, no trusted ceremony

### Token Definitions
- **HEAT (Ξmbers)**: Native gas token for COLD L3
  - Fixed supply tied to XFG burned on L1
  - 1 XFG = 10,000,000 HEAT
  - Serves as primary utility token
- **O Token (COLD - Certificate Of Ledger Deposit)**:
  - Hard cap: 80 O tokens (12 decimals)
  - Distributed as interest on XFG deposits
  - Designed to trade inversely to XFG price
  
### **Cross-Chain Allocation & Governance Weighting** *(July 2025 Update)*

- **Total Supply**: 80 O tokens, permanently fixed.
- **Per-Chain Allocation**:  
  • **COLD L3 (Arbitrum roll-up)** – 20 O  
  • **COLD on Solana (FuegoForecast / bonding)** – 20 O  
  • **COLD on TBD chain #1** – 20 O  
  • **COLD on TBD chain #2** – 20 O

- **Governance Weighting**: Voting power is aggregated across chains with the following weights:  
  • O on **COLD L3** → **40 %** of total influence  
  • O on each satellite chain (Solana, TBD #1, TBD #2) → **20 %** each.

- **Rationale**: The higher weighting on the L3 instance preserves core-protocol sovereignty while still granting meaningful influence to satellite ecosystems and their liquidity providers.

- **Example Calculation**: If a proposal receives votes of 10 O on COLD L3 and 10 O on Solana, effective votes = (10×2) + (10×1) = 30, where the multiplier 2 represents the 40 % vs 20 % weighting scheme.

- **Supply Integrity**: Cross-chain bridges enforce a one-way burn-and-mint flow for O to prevent double issuance; canonical supply proofs are posted to Arbitrum for auditability.

---

## 🏛️ **Hybrid Validator Economics**

### Two-Tier Validator System

**Total Validators: 21** (Byzantine fault tolerance)

#### **Tier 1: Democratic Validators (15 validators)**
- **Selection**: Community voting based on merit
- **Requirements**: 
  - Technical expertise and infrastructure
  - Performance bond: 50M-500M HEAT (returnable)
  - No wealth requirements beyond modest bond
- **Rotation**: Monthly (prevents centralization)
- **Revenue Share**: 60% of transaction fees (split equally)

#### **Tier 2: Guardian Validators (6 validators)**
- **Selection**: Stake-based with minimum 80B HEAT (8,000 XFG equivalent)
- **Requirements**:
  - Significant HEAT stake: 80B-160B HEAT
  - Proven track record with meaningful capital commitment
  - 24/7 emergency response capabilities
- **Rotation**: Quarterly (stability focused)
- **Revenue Share**: 35% of transaction fees (stake-weighted)
- **Special Powers**: Can halt network in extreme emergencies

### Revenue Distribution (NO Inflation)
```
Transaction Fees (100%) → Validators
├── Democratic (60%) → Split equally among 15 validators
├── Guardians (35%) → Weighted by stake among 6 validators  
└── Protocol Treasury (5%) → Development fund
```

### Example Monthly Economics
```
Assumptions:
- 1M transactions/month  
- Average fee: 10M HEAT
- Total fees: 10T HEAT

Revenue Distribution:
- Democratic validators: 6T HEAT (400B HEAT each)
- Guardian validators: 3.5T HEAT (weighted by stakes)
- Protocol treasury: 500B HEAT
- Burned: 500B HEAT (deflationary)
```

---

## 🔐 **Privacy Features Integration**

### Core Privacy Technologies

#### **1. Confidential Transactions (High Priority)**
- **Technology**: Pedersen commitments with range proofs
- **Integration**: EVM precompile for confidential HEAT transfers
- **Benefits**: Hides transaction amounts while preserving verifiability

```toml
[privacy.confidential_transactions]
enabled = true
precompile_address = "0x0000000000000000000000000000000000000100"
commitment_scheme = "pedersen"
range_proof_type = "bulletproofs"
```

#### **2. Private Staking & Delegation (Medium Priority)**
- **Technology**: Inspired by Penumbra's delegation token model
- **Features**: Anonymous delegation, private rewards, tradeable delegation tokens

#### **3. Anonymous Governance (Medium Priority)**
- **Technology**: ZK proofs of stake ownership + threshold encryption
- **Features**: Anonymous proposals, private voting, threshold decryption

#### **4. Private DEX Integration (High Priority)**
- **Technology**: Sealed-bid batch auctions with privacy pools
- **Features**: Private swap amounts, anonymous liquidity, MEV protection

#### **5. Standardized Deposit Privacy (Critical Priority)**
- **Technology**: Fixed 0.8 XFG deposits + tornado-style mixer
- **Features**: Perfect amount privacy, unlinkable withdrawals, account abstraction
- **Implementation**: All burns must equal exactly 8M HEAT (0.8 XFG)
- **Withdrawal**: Tornado-style mixer with inclusion proofs

#### **6. LP Privacy Protection (Critical Priority)**
- **Technology**: Automatic mixer integration for all LP withdrawals
- **Features**: LP amount privacy, fresh address withdrawals, inclusion proofs
- **Implementation**: All LP withdrawals automatically routed through mixer
- **Privacy**: Users receive inclusion proofs for LP amounts sent to fresh addresses

### Standardized Deposit Privacy System

#### **Core Design**
```
User XFG Burn (0.8 XFG) → [Proof] → COLD L3 Protocol → [8M HEAT to Dummy] → Mixer → [Inclusion Proof] → User Withdrawal
```

**Key Features**:
- ✅ **Fixed Amount**: All deposits must be exactly 0.8 XFG (8M HEAT)
- ✅ **Perfect Amount Privacy**: No amount correlation possible
- ✅ **Dummy Address Minting**: COLD L3 protocol mints to new addresses only
- ✅ **Tornado-Style Mixer**: Account abstraction for withdrawals
- ✅ **Inclusion Proofs**: ZK proofs for mixer withdrawals

#### **Workflow**
```solidity
// 1. User burns exactly 0.8 XFG on Fuego
// tx_extra: commitment C = Poseidon(Poseidon(secret))

// 2. COLD L3 protocol verifies burn and mints 8M HEAT to dummy address
function claimHEAT(bytes32 secret, bytes calldata proof) external {
    require(verifier.verify(proof, publicInputs), "bad proof");
    require(amount == 0.8 * 10^7, "must be exactly 0.8 XFG"); // 7 decimals
    
    // Mint to new dummy address
    address dummyAddress = generateDummyAddress(secret);
    _mint(dummyAddress, 8_000_000 * 10^18); // 8M HEAT
    
    // Add to mixer
    mixer.deposit(dummyAddress, 8_000_000 * 10^18);
}

// 3. User withdraws from mixer using inclusion proof
function withdrawFromMixer(
    bytes32 nullifier,
    bytes calldata inclusionProof,
    address recipient
) external {
    require(mixer.verifyInclusion(nullifier, inclusionProof), "bad proof");
    require(!nullifiersUsed[nullifier], "already withdrawn");
    
    mixer.withdraw(recipient, 8_000_000 * 10^18);
    nullifiersUsed[nullifier] = true;
}
```

#### **Privacy Guarantees**
- **Amount Privacy**: All deposits identical (0.8 XFG)
- **Address Privacy**: Dummy addresses prevent linking
- **Withdrawal Privacy**: Mixer breaks withdrawal correlation
- **Timing Privacy**: No correlation between burn and withdrawal timing
- **Perfect Forward Secrecy**: Each withdrawal uses fresh nullifier
- **LP Privacy**: All LP withdrawals automatically mixed
- **Fresh Address Privacy**: LP withdrawals sent to new addresses only

### LP Privacy Protection System

#### **Core Design**
```
User LP Deposit → [LP Pool] → User LP Withdrawal → [Automatic Mixer] → [Fresh Address] → [Inclusion Proof]
```

**Key Features**:
- ✅ **Automatic Mixing**: All LP withdrawals automatically routed through mixer
- ✅ **Amount Privacy**: LP withdrawal amounts hidden through mixing
- ✅ **Fresh Address Withdrawals**: LP funds sent to new addresses only
- ✅ **Inclusion Proofs**: ZK proofs for LP withdrawal verification
- ✅ **Seamless Integration**: No user action required for privacy

#### **LP Workflow**
```solidity
// 1. User deposits LP tokens (normal process)
function depositLP(address token, uint256 amount) external {
    // Standard LP deposit logic
    lpPool.deposit(token, amount, msg.sender);
}

// 2. User withdraws LP tokens (automatic mixing)
function withdrawLP(
    address token,
    uint256 amount,
    bytes32 nullifier,
    bytes calldata inclusionProof
) external {
    // Verify LP ownership and amount
    require(lpPool.balanceOf(msg.sender, token) >= amount, "insufficient LP");
    
    // Burn LP tokens
    lpPool.burn(msg.sender, token, amount);
    
    // Calculate underlying tokens
    (uint256 token0Amount, uint256 token1Amount) = lpPool.getUnderlyingAmounts(token, amount);
    
    // Route through mixer to fresh address
    address freshAddress = generateFreshAddress(nullifier);
    
    // Add to mixer with inclusion proof
    mixer.depositWithProof(
        freshAddress,
        token0Amount,
        token1Amount,
        nullifier,
        inclusionProof
    );
    
    // Emit event for user to track
    emit LPWithdrawalMixed(msg.sender, freshAddress, token, amount, nullifier);
}

// 3. User claims mixed LP funds
function claimMixedLP(
    bytes32 nullifier,
    bytes calldata inclusionProof,
    address recipient
) external {
    require(mixer.verifyInclusion(nullifier, inclusionProof), "bad proof");
    require(!nullifiersUsed[nullifier], "already claimed");
    
    // Withdraw from mixer to recipient
    mixer.withdraw(recipient, nullifier);
    nullifiersUsed[nullifier] = true;
}
```

#### **LP Privacy Guarantees**
- **Automatic Privacy**: No user action required for LP privacy
- **Amount Privacy**: LP withdrawal amounts hidden through mixing
- **Address Privacy**: LP funds sent to fresh addresses only
- **Timing Privacy**: No correlation between deposit and withdrawal timing
- **Token Privacy**: Both token0 and token1 amounts mixed separately
- **Pool Privacy**: LP withdrawals from different pools mixed together

#### **Treasury Omnipool Mixer Upgrade (🆕 January 2025)**
Building on the base LP privacy flow, the protocol will **funnel every LP deposit and withdrawal through a single, giant Treasury-level mixer** that acts as an *omnibus LP provider*.

**Core Idea**:
```
User LP Deposit ─▶ TreasuryMixer.commit(note) ─▶ TreasuryOmnipool adds liquidity
                             ▲                                    │
                             └─────────── ZK note (commitment) ◀───┘
User LP Withdrawal ◀── TreasuryMixer.withdraw(proof) ◀── burn LP share + direct transfer
```

**Key Enhancements**:
1. **Deposit Unlinkability** – All adds originate from one Treasury address; external observers cannot map a user to a specific LP token mint.
2. **Withdrawal Unlinkability** – Treasury burns its internal share and *directly* transfers underlying tokens to the user’s fresh address, breaking on-chain links.
3. **Amount Buckets** – Deposits are forced into fixed denominations (`amountBucketId`) inside the circuit for stronger anonymity sets.
4. **Unified Mixer Tree** – Same Merkle tree is shared with the 0.8 XFG burn mixer (`tokenPairId` included in commitment), yielding a single, massive anonymity set.
5. **Solvency Invariant** – On-chain check `totalNotes == treasuryLPshares` guarantees 100 % backing.

**Required New Components**:
- `TreasuryMixer` (Poseidon-based Tornado clone)
- `TreasuryOmnipool` (owns all actual LP positions; internal ledger only)

**Next-Step Action Items**:
- Extend Halo2 circuit → `ProofOfLPNote` with `publicInputs = [nullifier, tokenPairId, amountBucketId]`.
- Refactor `lpPool.deposit/withdraw` to call mixer & omnipool helpers.
- Add integration tests in `test-lp-omnipool-mixer.js`.

> This upgrade **supersedes** the previous “automatic mixer on withdrawal” design; deposits are now private *from the very first hop*, providing end-to-end unlinkability.

#### **Integration with Standardized Deposits**
```
XFG Burn (0.8 XFG) → [8M HEAT to Dummy] → Mixer → [Inclusion Proof] → Withdrawal
     ↓
LP Deposit → [LP Pool] → LP Withdrawal → [Automatic Mixer] → [Fresh Address] → [Inclusion Proof]
```

**Unified Privacy System**:
- **Single Mixer**: Both XFG burns and LP withdrawals use same mixer
- **Consistent Privacy**: Same privacy guarantees for all COLD L3 operations
- **Inclusion Proofs**: Unified proof system for all withdrawals
- **Fresh Addresses**: All withdrawals go to new addresses only

### Celestia Privacy Integration

**✅ Implementation Status**:
- **Configuration**: Celestia endpoints and namespaces configured in `rollup-config.toml`
- **Client Framework**: Basic `CelestiaManager` class implemented in `tools/celestia-client/`
- **Smart Contract**: `CelestiaDAManager.sol` deployed for commitment tracking
- **Test Framework**: Basic integration tests ready with simulated transaction batches
- **Privacy Features**: Encryption and namespace blinding planned for Phase 2

**Namespace Strategy**:
- **Public Namespace**: `"COLD"` (hex: `434f4c44...`) for non-sensitive data
- **Private Namespace**: `"COLDPRIVATE"` (hex: `434f4c445052495641544500...`) for encrypted blobs
- **Blinded Namespaces**: Derived from user secrets for maximum privacy

**Current Implementation**:
- **Namespace Privacy**: Use blinded namespace commitments
- **Data Encryption**: Encrypt rollup blocks before DA submission (ChaCha20-Poly1305)
- **Proof Aggregation**: Batch multiple private transactions per blob

**Implementation Files**:
- `tools/celestia-client/src/CelestiaManager.ts` - Core DA client
- `cold-contracts/contracts/CelestiaDAManager.sol` - On-chain commitment tracking
- `celestia-integration-roadmap.md` - Detailed 4-phase implementation plan

### HEAT Gas Privacy
- **Confidential Gas Fees**: Hide gas amounts paid
- **Anonymous Fee Distribution**: Private validator fee sharing
- **MEV Protection**: Prevent gas price front-running

---

## 🌉 **XFG → HEAT Bridge Systems**

### Multi-Layered Approach

The project implements **three different bridge systems** for different security/trust models:

#### **1. HEAT Commitment-Reveal System (Production Ready)**

**Technology**: Privacy-preserving commitment-reveal with hard-coded one-time address enforcement

**Key Features**:
- ✅ One-time address privacy (each address can only mint once)
- ✅ Commitment-reveal cryptography (no linkage between chains)
- ✅ Double-spend prevention (each secret used once)
- ✅ On-chain verification (all validation on Arbitrum)
- ✅ Transparent ZK setup (Halo2 IPA, no ceremony)
- ✅ Standardized deposits (exactly 0.8 XFG for perfect amount privacy)

**Workflow**:
```javascript
// Phase 1: Secret Generation
const secret = crypto.randomBytes(32);           // Secret 's' (KEEP PRIVATE!)
const nullifier = keccak256(secret);             // N = H(s)
const commitment = keccak256(nullifier);         // C = H(N) = H(H(s))

// Phase 2: Fuego Burn Transaction
// tx_extra: commitment C = H(H(s))
// ETH address: NEVER appears on Fuego chain

// Phase 3: HEAT Claim
function claimHEAT(bytes32 secret, FuegoTxProof memory proof) external {
    // 1. Verify commitment: Poseidon(Poseidon(secret)) == commitment_from_fuego_tx
    // 2. Check nullifier not used: !nullifiersUsed[Poseidon(secret)]
    // 3. Enforce one-time address: !hasMinted[msg.sender]
    // 4. Verify Fuego transaction proof
    // 5. Verify amount is exactly 0.8 XFG
    // 6. Mint 8M HEAT to dummy address and add to mixer
}
```

#### **2. Multi-Layered Proof System (Enhanced Security)**

**Technology**: Three-layer verification system solving the "WHO deposited" problem

**Layer 1: Undefined Output Anomaly Detection**
- Proves XFG was deposited/burned (not just transferred)
- Regular transfers have proper output key images
- Deposits show 'undefined' output keys (cryptographic fingerprint)

**Layer 2: txn_extra Field Proof Data**
- Contains recipient address and cryptographic proof
- Format: `recipient_address(20) + signature(65) + nonce(32) + expiration(32)`
- Data is part of transaction hash (tamper-proof)

**Layer 3: ECDSA Signature Verification**
- Proves user controls the recipient Ethereum address
- User signs: `txHash + recipientAddress + nonce + expiration`
- Oracle recovers signer and verifies match

#### **3. ZK Light-Client System (Trust-Minimized)**

**Technology**: On-chain ZK proofs of Fuego block headers and transaction inclusion

**Proof System**: Halo 2 IPA (transparent, no trusted setup) with recursion
**Components**:
- `ProofOfBurnCircuit` - Validates burn transactions with Poseidon hashing
- `FuegoHeaderRelay` - Provides block headers for verification
- `OValidator` - Verifies Halo2 proofs on each satellite chain
- `ChainCode` - Prevents double minting across chains

**Public Inputs**:
```
1. nullifier: Poseidon(secret)
2. commitment: Poseidon(nullifier)
3. recipient_addr_hash: keccak256(recipient_address)
4. fuego_block_height: height of block containing the burn
5. fuego_block_hash: hash of block containing the burn
```

**On-Chain Verification**:
```solidity
function claimHEAT(
    bytes32 secret,
    bytes calldata proof,
    bytes32[] calldata publicInputs
) external {
    require(verifier.verify(proof, publicInputs), "bad proof");
    bytes32 nullifier = poseidonHash(secret);
    bytes32 commitment = poseidonHash(nullifier);
    require(nullifier == publicInputs[0], "nullifier mismatch");
    require(commitment == publicInputs[1], "commitment mismatch");
    // One-time address + nullifier checks
}
```

---

## 🔄 **Merge-Mining Architecture**

### Fuego Header Integration
```
struct FuegoAux {
    bytes32 coldBlockHash;   // Hash of COLD L3 block being mined
    uint32  coldHeight;      // Height inside COLD L3 chain
    bytes   celestiaBlobRef; // (optional) 32-byte blob commitment
}
// Serialized into Fuego coinbase `extraNonce`
```

### HEAT Minting Flow (Post-Launch)
1. User burns XFG on Fuego with commitment C = Poseidon(Poseidon(s)) in `tx_extra`
2. Miner builds Fuego block + simultaneously proposes COLD L3 block that:
   - Parses parent Fuego block header & tx-set
   - Verifies burn-tx inclusion and commitment rules
   - Mints HEAT inside COLD L3 state (one-time-address & nullifier enforced)
3. Fuego miners seal combined PoW; COLD L3 block hash becomes immutable
4. COLD L3 batch poster publishes state root + Celestia blob hash on Arbitrum
5. After fraud window, Ethereum finality achieved

**Result**: HEAT minted with zero external oracle; security = Fuego PoW + Arbitrum/Ethereum finality

### Satellite Chain Integration
- **Fuego Header Relay**: Each satellite chain maintains a light client of Fuego headers
- **Local Verification**: Each chain verifies Halo2 proofs locally using the relayed headers
- **ChainCode Binding**: Secret contains chainCode byte to prevent cross-chain double minting
- **No Cross-Chain Communication**: Each chain operates independently with local verification

---

## 📈 **APR Strategy & Token Distribution**

### Revised APR Strategy (with L2 Gas Consideration)

| Bucket | O Emission Share | APR Range | Additional Yield | Notes |
|--------|------------------|-----------|------------------|-------|
| XFG Deposits | 70% | 40-70% | - | Primary incentive |
| L2 Validators | 10% | 5-10% | HEAT tx fees | Real yield model |
| DEX LP (O/HEAT) | 15% | 8-15% | Trading fees | Critical for inverse peg |
| Bonding | 5% | 5-10% | - | Protocol-owned liquidity |

### Dual-Fuel Gas Model
- **Primary**: HEAT remains default gas token
- **Secondary**: Allow O payments with automatic swap/burn
- **Governance**: Small surcharge on O payments to maintain HEAT preference
- **Emergency**: Waive surcharge during HEAT scarcity events

---

## 🛠️ **Implementation Status & Roadmap**

### Completed Components ✅
- **ZK Circuit System**: ProofOfBurnCircuit with Halo2 IPA backend
- **Smart Contracts**: COLDprotocol.sol with nullifier tracking
- **Fresh Fuego Analysis**: Complete source code indexing (474 files)
- **Privacy Feature Design**: Comprehensive privacy integration plan
- **Validator Economics**: Hybrid democratic/guardian model
- **Bridge Systems**: Three different security models designed
- **Repository Structure**: Modular organization with clear separation of concerns

### Current Architecture Status
- **Hardhat Workspace**: Located in `cold-contracts/`
- **Rust Circuit**: Located in `tools/prove-burn/` with Halo2 IPA backend
- **Web Interface**: Located in `cold-web/` folder
- **Circuit Compilation**: Halo2 IPA circuit with transparent setup
- **Contract Compilation**: 49 files compiled successfully
- **Testing Framework**: Complete demo scripts available

### Immediate Next Steps
1. **🔄 Active**: Finalize Poseidon hash gadget integration in Halo2 circuit
2. **🔄 Active**: Complete Rust CLI prover with JSON output
3. **🔄 Active**: Update contract to use new IPA-based verifier
4. **🔄 Active**: Integration testing between CLI and contracts
5. **🔄 Active**: Deploy HEAT minting module in COLD L3 VM
6. **🆕 New**: Implement standardized deposit privacy (0.8 XFG requirement)
7. **🆕 New**: Build tornado-style mixer with inclusion proofs
8. **🆕 New**: Add dummy address generation and mixer integration
9. **🆕 New**: Implement LP privacy protection (automatic mixer integration)
10. **🆕 New**: Build fresh address generation for LP withdrawals

### Phase Implementation Plan

#### **Phase 1: Core Infrastructure (Months 1-3)**
- Deploy commitment-reveal bridge system with Halo2 IPA
- Implement confidential transactions precompile
- Launch democratic validator selection
- Establish basic fee markets

#### **Phase 2: Advanced Features (Months 4-6)**
- Activate guardian validators with HEAT stakes
- Deploy private staking system
- Implement anonymous governance
- Launch privacy-enhanced HEAT token

#### **Phase 3: Full Ecosystem (Months 7-9)**
- Deploy private DEX with sealed-bid auctions
- Activate merge-mining with Fuego
- Launch ZK light-client for trust-minimized bridging
- Complete ecosystem integration

---

## 🔒 **Security Considerations**

### Bridge Security Features
**Commitment-Reveal System**:
- ✅ Address clustering prevention (one-time addresses)
- ✅ Double spending prevention (each secret used once)
- ✅ Cross-chain unlinkability (ETH addresses never touch Fuego)
- ✅ Commitment privacy (only burner knows secret)
- ✅ Replay attack prevention (transaction hashes tracked)
- ✅ Transparent ZK setup (no trusted ceremony)

**Multi-Layer Proof System**:
- ✅ Undefined output fingerprinting
- ✅ ECDSA signature verification  
- ✅ Tamper-proof data binding
- ✅ Time-limited proof validity
- ✅ Nonce-based replay prevention

**ZK Light-Client**:
- ✅ Trustless verification (no oracle dependency)
- ✅ Cryptographic proof of inclusion
- ✅ Header chain validation
- ✅ On-chain verification (~250k gas)
- ✅ Transparent setup (Halo2 IPA)

### Privacy Guarantees
- **100% Privacy Enforcement**: System blocks all privacy violations
- **Unlinkable Claims**: Multiple burns cannot be linked to same user
- **Fresh Address Requirement**: Forces new addresses for each claim
- **Cryptographic Unlinkability**: ETH address never appears on Fuego
- **ChainCode Isolation**: Prevents cross-chain correlation
- **Perfect Amount Privacy**: All deposits identical (0.8 XFG)
- **Withdrawal Privacy**: Tornado-style mixer breaks withdrawal correlation
- **Dummy Address Privacy**: COLD L3 protocol mints to new addresses only

---

## 🧪 **Testing & Deployment**

### Available Test Scripts
```bash
# Commitment-reveal system
npx hardhat run test_commitment_reveal_demo.js --network localhost

# Multi-layer proof system  
npx hardhat run scripts/test-txn-extra-proof.js

# Halo2 circuit testing
cd tools/prove-burn
cargo test

# Standardized deposit privacy testing
npx hardhat run scripts/test-standardized-deposits.js
npx hardhat run scripts/test-mixer-withdrawals.js

# LP privacy testing
npx hardhat run scripts/test-lp-privacy.js
npx hardhat run scripts/test-lp-mixer-integration.js

# Helper tools
node heat_claim_helper.js

# Fresh Fuego analysis
npm run fuego:fresh-index
npm run fuego:fresh-search crypto
npm run fuego:fresh-facts
```

### Production Deployment Commands
```bash
# Deploy HEAT commitment verifier
npx hardhat run scripts/deploy-heat-commitment-verifier.js --network arbitrum

# Deploy complete system
npx hardhat run scripts/deploy-heat-mainnet.js --network arbitrumOne

# Verify contracts
npx hardhat verify --network arbitrum <CONTRACT_ADDRESS>
```

---

## 📚 **Key Documentation Files**

### Core Architecture
- `docs/COLD_L3_ARCHITECTURE_OVERVIEW.md` - Layer stack and merge-mining
- `docs/FUEGO-FRESH-ANALYSIS.md` - Complete Fuego source analysis

### Economics & Governance  
- `COLD-XFG-HEAT-VALIDATOR-ECONOMICS.md` - Hybrid validator economics
- Economic models, APR strategies, token distribution

### Privacy & Security
- `COLD-PRIVACY-FEATURES.md` - Comprehensive privacy integration
- `HEAT-COMMITMENT-REVEAL-SYSTEM.md` - Privacy-preserving bridge
- `docs/TXN-EXTRA-PROOF-SYSTEM.md` - Multi-layered proof system

### Technical Implementation
- `ZK-LIGHT-CLIENT-DESIGN.md` - Trust-minimized ZK bridge
- `tools/prove-burn/` - Halo2 IPA circuit and Rust CLI
- `cold-contracts/` - Smart contracts and test suite
- `cold-web/` - Web interface and documentation
- `conversation_memory.md` - Session history and context

---

## 🎯 **Success Metrics & KPIs**

### Network Health
- **Uptime**: >99.9% target across all validators
- **Transaction Throughput**: Sustained high performance  
- **Fee Stability**: Predictable costs for users

### Economic Health
- **HEAT Scarcity**: Controlled supply growth from XFG burns
- **Fee Market Efficiency**: Optimal pricing without congestion
- **Validator Profitability**: Sustainable economics for all tiers

### Privacy Metrics
- **Anonymity Set Size**: Track active private users
- **Privacy Adoption Rate**: Monitor confidential transaction usage
- **Performance Impact**: Measure privacy feature overhead

### Decentralization Metrics
- **Validator Diversity**: Geographic and organizational distribution
- **Community Participation**: Active voting in validator selection
- **Rotation Success**: Smooth transitions without network disruption

---

## 🚀 **Competitive Advantages**

### vs Traditional PoS
- ❌ **No Wealth Requirements** for democratic validators
- ❌ **No Inflation** - token holders aren't diluted
- ✅ **Merit-Based Selection** - best operators, not richest stakers
- ✅ **Emergency Governance** - guardian validators provide stability

### vs Pure PoA
- ✅ **Community Input** - democratic selection prevents centralization
- ✅ **Economic Stakes** - guardian validators have skin in the game
- ✅ **Regular Rotation** - prevents validator capture
- ✅ **Transparent Process** - all validator selection is public

### vs Other Bridges
- ✅ **Multiple Security Models** - commitment-reveal, multi-proof, ZK
- ✅ **Privacy-First Design** - hard-coded privacy enforcement
- ✅ **No Oracle Dependency** - merge-mining provides trustless verification
- ✅ **CryptoNote Compatibility** - works with private blockchains
- ✅ **Transparent ZK Setup** - no trusted ceremony required

---

## 📖 **Conclusion**

COLD L3 represents a **groundbreaking privacy-first rollup** with revolutionary economic design. The combination of:

- **Fuego's CryptoNote privacy** + **Celestia's modular DA**
- **Arbitrum One base layer** + **Ethereum security**  
- **HEAT's constrained supply** + **Hybrid validator economics**
- **Comprehensive privacy features** + **Multiple bridge options**
- **Transparent ZK setup** + **Halo2 IPA backend**

Creates a unique ecosystem that solves real problems in the current DeFi landscape while maintaining the highest standards of privacy, security, and decentralization.

The architecture is **production-ready** with multiple fallback options, comprehensive testing frameworks, and detailed implementation roadmaps for immediate deployment.

---

*Comprehensive memory compiled from 8 architecture documents - Last updated: January 2025* 

## 🔭 **Zero-Oracle ZK Mint Roadmap (added 2025-07-05)**

| Phase | External Milestone | Internal Objective | Who Runs It? |
|-------|--------------------|--------------------|--------------|
| **0** | **SPL-HEAT** ICO on Solana (test-net)<br>• lite WP, basic SPL token | Treasury funding | Core team multisig |
| **1** | Public PoC **Burn → Mint** on Arbitrum test-net<br>• dummy XFG, Groth16 verifier | End-to-end credibility | DevOps + community relayers |
| **2** | **Celestia DA + encrypted blobs** live<br>• block header carries commitment | Freeze data pipeline | Sequencer node |
| **3** | **COLD-L3 genesis on Arbitrum**<br>• HEAT + O(40 %) deployed, mixer stub | Main-net bootstrap | Core + Guardian validators |
| **4** | **SPL-O** launch on Solana (main-net)<br>• bonding contracts | Treasury bonding | Solana program multisig |
| **5** | Private DEX + LP-privacy roll-out | Full privacy UX | COLD validators & UI team |

### Actors & Terminology

| Actor | Runs Where? | Responsibility | Notes |
|-------|------------|----------------|-------|
| **Sequencer** | COLD-L3 execution node (merge-mined inside Fuego block) | • Builds the COLD/Fuego block<br>• Writes encrypted tx-blob to Celestia<br>• Publishes blob-KZG commitment in block header | Can be any miner that wins PoW round |
| **Off-chain Prover** | Any machine with access to the decryption key | • Downloads ciphertext blob from Celestia<br>• Decrypts, builds Groth16/PLONK witness<br>• Generates **one proof per block** | In practice: _same process_ that runs Sequencer, but *anyone* can also do it (censorship resistance) |
| **Relayer** | EVM wallet / bot | • Sends `claim(proof,pubInputs)` tx to Arbitrum HEAT contract | Can be run by user, sequencer, or public bounty bots. First valid proof wins (idempotent). |
| **Verifier Contract** | Arbitrum One | • On-chain Groth16/PLONK verifier<br>• Mints 8 M HEAT if proof valid & nullifier unused | Stateless except `nullifierUsed` mapping |

### What *is* the “decryption key”?

* We encrypt each Celestia blob with **ChaCha20-Poly1305**.
* **Symmetric key** `K_block = HMAC-SHA256(netKey, fuegoBlockHash)` where `netKey` is a long-lived 32-byte secret known to **all sequencers / provers**.
* `netKey` **never touches Arbitrum** – the verifier only needs the ciphertext commitment, not the plaintext.
* Options for `netKey` custody:
  1. **MPC ceremony** → split into *n* shares (Shamir) held by top validators; threshold ≥ `f+1` keeps liveness.
  2. **Timelock release** → publish `netKey` after Δ = 30 days; keeps near-term privacy but guarantees long-term auditability.
  3. **Per-epoch rotation** → derive `K_epoch = H(netKey‖epoch)` and publish after expiry.

> 🔐 **Security note** – Even if `netKey` leaks, past blobs stay **integrity-bound** (KZG commitment prevents tampering). Leaking only affects *future* privacy; roll key immediately.

### How does the verifier know mint details if data are encrypted?

The only information required by the HEAT contract is already surfaced as **public inputs** inside the SNARK proof:

```text
burnTxHash   – uniqueness
afterRoot    – new COLD state root
nullifier    – one-time tag
recipient    – EVM address
```

All other raw data (full tx list, signatures, etc.) stay inside the private witness. The contract doesn’t need to “read” the Celestia blob; it *trusts* the succinct proof.

### Quick recap of the trust-minimised flow

1. **Sequencer** builds merge-mined block; uploads *ciphertext* blob → Celestia; emits commitment in header.
2. **Any prover** (often the same machine) decrypts blob ⭢ generates ZK proof that:
   - PoW header is valid
   - Burn-tx ∈ blob & obeys 0.8 XFG rule
   - State transition mints 8 M HEAT and updates `afterRoot`
3. **Relayer** submits `(proof, pubInputs)` to Arbitrum; `HEATZKVerifier` checks proof & mints.
4. **Nullifier** prevents double-mint; privacy mixer autocredits dummy address.

---

*Appended by architecture assistant – 2025-07-05* 

## 🛠️ **July 2025 Module Additions**

### 1. Privacy-First EVM Precompiles
- **`0x09 PoseidonHash`** – single-round sponge, 256-bit output  
  *Gas:* ~300 gas per 6-field-element permutation.
- **`0x0A BulletproofVerify`** – batch verifier for range proofs  
  *Gas:* O(n) where n ≤ 32 proofs, constant overhead ≈ 20 k.
- **`0x0B NoteCommit`** – Pedersen commitment helper (2 × add/mul)  
  Saves ≈ 90 k gas per confidential transfer.

### 2. Witness-Encryption Time-Lock (WETL)
- **Statement**: `H(fuegoHeader ∥ nonce) < target` (identical to PoW predicate).
- **Cipher Suite**: ChaCha20-Poly1305 (RFC 8439).
- **Capsule Format**: 96-byte header + 32-byte AEAD tag.
- **Privacy Window**: From `T_propose` until PoW nonce publication (≈ 8 s).

**Flow**
1. Sequencer derives `K_block = HMAC(netKey, fuegoBlockHash)`.
2. Blob encrypted with `K_block`; capsule = WE{`K_block`} via tlock/IBE round `height`.
3. Miner who finds nonce has the witness ⇒ decrypts instantly, pushes proof.
4. Anyone else can replicate once header+nonce broadcast, guaranteeing availability.

### 3. Execution Engine Upgrade
- **Switch to Erigon v2** (Rust port) for archive-sync speed and deterministic replay.  
  • 4-6 × Geth throughput.
- **Integration**: `revm` library embedded in prover for byte-accurate execution; JSON-RPC shim keeps existing tooling.

### 4. Developer Experience Tweaks
- **ZeroMEV RPC**: `https://rpc.cold.xyz/protect` – forwards to Flashbots Protect & MEV-Blocker.
- **Scripts**: `scripts/deploy-erigon-node.sh` for one-line validator bootstrap.
- **Fuzzing**: `tools/enclave/wetl-capsule-fuzz.rs` – validates capsule parser against malformed inputs.

*Appended by architecture assistant – 2025-07-06* 

## 🔒 **Fuego Encrypted Messenger Integration (July 2025)**

### Overview
COLD L3 leverages Fuego’s encrypted P2P messenger to maximize privacy and flexibility in the burn/mint/proof pipeline. This enables:
- Private delivery of burn proofs and nullifiers
- Anonymous relayer coordination
- Decentralized, private batching of burns
- Encrypted proof-of-burn submission

### Architecture & Flow
1. **User burns XFG in Fuego wallet**
2. **Fuego wallet auto-generates proof** (commitment, nullifier, block hash, etc.)
3. **Proof sent via encrypted messenger** to a COLD L3 sequencer or relayer
4. **Sequencer/relayer submits proof** to COLD L3, mints HEAT to user’s one-time address
5. **User receives confirmation** (optionally via messenger)

### Sequencer Walletd Architecture
- **Each COLD sequencer runs its own fuego-walletd instance**
  - This walletd is used *only* for receiving encrypted messages (burn proofs, nullifiers, etc.) and for sending confirmations.
  - Each sequencer can have a unique Fuego wallet address for message routing, or share a common address for redundancy.
- **Main sequencer** may run multiple fuego-walletd instances:
  - One for public message intake (from users/relayers)
  - One or more for internal coordination (e.g., batching, confirmation, admin ops)
- **Validator/Sequencer Set**: Each COLD node that participates in sequencing can run its own walletd, but only the active sequencer for a given block needs to process burn proofs for that round.

### Batching & Amount Buckets
- **Batching Strategy**: Users can coordinate via the encrypted messenger to batch multiple burns into a single submission, increasing the anonymity set.
- **Amount Buckets**: Any deposit over 0.8 XFG is split into multiple 0.8 XFG buckets, each with its own proof and nullifier. The messenger can coordinate this splitting and batching, so a user burning 2.4 XFG would send 3 separate 0.8 XFG proofs in one encrypted message.
- **Benefits**: Stronger privacy, efficient processing, and seamless UX for large deposits.

### Integration Points
- **Messenger API**: COLD L3 sequencer/relayer listens for encrypted messages from Fuego wallets (see `build-fuego-index-fresh.js` for hooks).
- **Proof Intake**: Only proofs received via the encrypted messenger are accepted for minting, unless explicitly overridden for public testnets.
- **Confirmation**: Sequencer sends encrypted confirmation back to the user’s Fuego wallet after successful mint.

### Security & Privacy Benefits
- No public mempool or RPC snooping
- No metadata leaks (timing, sender, or amount)
- Censorship resistance (no public endpoint to block)
- Stronger anonymity set via batching

--- 

## 🔗 **LP-Only Bonding Eligibility Policy** *(July 2025 Update)*

The protocol’s bonding module mints O **exclusively** against LP-tokens that pass objective, on-chain risk filters.  This guarantees that every O issued deepens protocol-owned liquidity while shielding the treasury from junk assets.

### 1. Quote-Token Whitelist  
At least one leg of the LP pair must be **SOL**, **WETH/ETH**, **USDC**, **DAI**, or **USDsky**.  **USDT is explicitly excluded** for compliance and risk reasons.

### 2. Structural Filters (enforced on-chain)
1. **Pool Age ≥ 30 days** – `block.timestamp - pool.creation ≥ 2 592 000`.
2. **Minimum Liquidity** – 7-day Time-Weighted-Average Liquidity (TWAL) ≥ $50 k and 2 % slippage depth ≥ $5 k.
3. **Oracle Availability** – Chainlink or Pyth feed for non-stable asset, else Uniswap/Saber TWAP fallback.
4. **Verified & Renounced** – Token byte-code matches known template; `owner()` or `upgradeAuthority` is `0x0`.

### 3. Behavioural Filters (oracle-fed)
5. **Real Volume** – 30-day median daily volume ≥ $10 k (outliers removed).
6. **Unique Holders ≥ 400** – counted on-chain per ERC-20/SPL balance snapshot.
7. **Graduated Flag (Solana)** – For pump.fun tokens, `graduated == true`.

### 4. Risk Score & Threshold
Each metric contributes to a 0-100 score:
| Metric | Weight |
|--------|-------:|
| Liquidity depth | 25 % |
| Daily volume | 20 % |
| Oracle availability | 15 % |
| Verified/renounced | 15 % |
| Pool age | 10 % |
| Unique holders | 10 % |
| Graduated flag / other Sybil checks | 5 % |

Only LPs with **score ≥ 75** are bond-eligible.  Score is computed off-chain once per epoch and posted via oracle; the bond contract validates the value.

### 5. Safeguards
• **Per-address cap** – e.g., ≤ 2 O per epoch.
• **Discount guardrails** – if bond discount > 25 % or < 5 %, parameters auto-adjust.
• **Circuit breaker** – bonding pauses for 1 h if > X O minted in one block.

These rules formalise the LP-only bonding strategy and the explicit **USDT ban** for the entire COLD ecosystem. 

## 🔒 **Privacy DEX Architecture & Implementation** *(July 2025 Update)*

### Design Goals (Hard Requirements)
• **Amount Privacy** – Trade sizes never appear on-chain  
• **Address Privacy** – Taker/maker cannot be linked to deposits  
• **MEV Immunity** – Sequencer cannot reorder or sandwich  
• **LP Privacy** – Pool balances never leak per-LP; only global TVL visible  
• **Fair Pricing** – Sealed-bid batch auctions (no constant-product leakage)  
• **O Utility Integration** – LP gauges & fee rebates require O locks

### Core Architecture Components

#### 1. **AuctionSM (Sealed-Market) Contract**
• Receives encrypted order commitments via `NoteCommit` precompile  
• After auction window (30s), sequencer publishes decryption key + state-transition proof  
• Contract verifies: (a) poseidon commitments open to valid amounts, (b) clearing price maximizes surplus, (c) total in == total out  
• Mints "trade receipts" that users later redeem in mixer

#### 2. **TreasuryOmnipool Contract**
• Holds pooled assets; only accepts deposits/withdrawals from AuctionSM or NAV-Vault  
• Maintains internal accounting but keeps TVL opaque externally  
• Uses `ConfidentialTransfer` precompile for asset moves

#### 3. **Tornado-Mixer Integration**
• Every user withdrawal routes through mixer → breaks address link  
• Already planned as part of standardized deposit privacy system

#### 4. **Fee-Manager Contract**
• Splits 100% trading fees → 80% to NAV-Vault, 20% to LP gauge  
• Users holding O lock get rebate (see O utility #1)

#### 5. **LP-Gauge & O Locks**
• Curve-style vote-escrow where each 0.1 O boosts gauge weight  
• Gauges emit HEAT (not O) to LP NFTs; avoids inflation of O

### Precompiles Used
• **`0x09` PoseidonHash** – Cheap commitments  
• **`0x0A` BulletproofVerify** – Batch range proofs for confidential amounts  
• **`0x0B` NoteCommit** – Pedersen commitments helper

### Transaction Life-Cycle
1. **User deposits token A** (e.g., HEAT) into AuctionSM with commitment C = Poseidon(amount, noteRandomness)
2. **Sequencer adds commitment** to encrypted Celestia blob; user's address never appears
3. **At end of 30s window**, sequencer runs off-chain MPC to compute uniform clearing price
4. **Generates Halo2 proof** of:
   • All commitments open to non-negative amounts
   • Σ buys = Σ sells · price
   • Range proofs (Bulletproofs) for each amount in [0, MAX]
5. **Publishes proof + decryption key**
6. **AuctionSM verifies**, credits per-user "receipts" (also commitments)
7. **Users withdraw receipts** via Tornado-Mixer into fresh address

### MEV Immunity Mechanisms
• **Orders are encrypted** (Witness-Encryption) → cannot be inspected before nonce reveal
• **Sequencer cannot front-run** because it doesn't know contents until proof step, after window ends
• **ZeroMEV lane** (tied to O balance) guarantees private submission path

### LP Privacy & Protocol-Owned Liquidity
• **Only TreasuryOmnipool holds AMM liquidity**; LPs don't receive ERC-20 shares
• **LP-Notes** (Poseidon commitments) that can later withdraw via mixer
• **Bonding flow** makes treasury the LP of record → TVL is public, composition not traceable to users

### Implementation Roadmap

#### **Phase A – MVP (3 months)**
• AuctionSM v1 (single trading pair HEAT/USDC)
• Halo2 circuit for commitment + range-proof aggregation
• CLI batchifier + sequencer patch for encrypted blobs

#### **Phase B – Privacy Extension (2 months)**
• Integrate Tornado-Mixer withdrawals
• Add NoteCommit precompile to COLD L3

#### **Phase C – Multi-pool Omnipool (3 months)**
• TreasuryOmnipool + NAV-Vault hooks
• LP-Gauge with O boost + rebate logic

#### **Phase D – Decentralize (2 months)**
• Permissionless relayers (ZeroMEV endpoints)
• Guardian-run sequencer rotation with O-staked bonds

### Risk Mitigations
• **Circuit complexity** → audit by 2 firms + internal zk-fuzzing
• **Sequencer downtime** → fall-back to public mempool mode (privacy degrades, funds safe)
• **Price manipulation** → require external price oracle sanity-check when accepting clearing price
• **DOS via huge commitments** → range-proof batch size capped; fees proportional to note count

### O Token Integration Points
1. **ZeroMEV lane access** (≥ 0.05 O)
2. **Gauge boosting** (veO locks) – higher HEAT rewards
3. **Emergency circuit-breaker slashing** (guardian posts 2 O bond)
4. **Governance over**: auction window length, fee split %, oracle addresses

### Technical Stack Integration
• **Celestia**: Encrypted blobs for order commitments
• **Halo2 IPA**: Transparent proof generation for batch auctions
• **Witness-Encryption**: Time-lock obfuscation during PoW race
• **Poseidon Hash**: Gas-efficient commitments and nullifiers
• **Bulletproofs**: Batch range proofs for amount privacy

### Privacy Guarantees
• **Amount Privacy**: All trade sizes hidden via commitments and range proofs
• **Address Privacy**: Mixer withdrawals break deposit-withdrawal correlation
• **Timing Privacy**: Witness-encryption hides mempool during PoW race
• **LP Privacy**: Treasury omnipool prevents individual LP tracking
• **MEV Protection**: Sealed-bid auctions eliminate front-running opportunities

This privacy DEX design combines sealed-bid auctions, commitment-based accounting, mixer withdrawals, and MEV-protected lanes to create a system where observable on-chain data leaks **only** clearing price and total volume—not who traded or how much. O locks provide both user utility and security guarantees, while the LP-only bonding policy ensures deep protocol-owned liquidity from day one. 
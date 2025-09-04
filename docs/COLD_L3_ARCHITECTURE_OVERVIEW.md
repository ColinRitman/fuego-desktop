# COLD L3 – Architecture Snapshot (June 2025)

> **Source**: Internal dev-chat notes consolidated by AI assistant.

---

## 1. Layer Stack
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

* **Fuego**: CryptoNote PoW chain (visible amounts).  Carries the *aux-field* that embeds a COLD block hash → provides **merge-mined consensus**.
* **COLD L3**: Rollup whose blocks are embedded in Fuego headers; executes smart-contract logic (HEAT, privacy, AMM).
* **Celestia**: Data-availability layer for the full COLD transaction blobs.
* **Arbitrum One**: Posts compressed COLD state roots + Celestia blob commitment; inherits Ethereum security.
* **Ethereum L1**: Ultimate settlement / fraud-proof court.

---

## 2. HEAT Minting Flow (Post-Launch)
1. User burns XFG on Fuego with commitment \(C = H(H(s))\) in `tx_extra`.
2. Miner builds next Fuego block and, *simultaneously*, proposes a COLD block that:
   * parses parent Fuego block header & tx-set;
   * verifies burn‐tx inclusion and commitment rules;
   * mints HEAT inside COLD state (one-time-address & nullifier enforced).
3. Fuego miners seal the combined PoW; the COLD block hash is now immutable inside the canonical Fuego chain.
4. COLD batch poster publishes the updated COLD state root + Celestia blob hash on Arbitrum.
5. After fraud window, Ethereum finality is achieved.

👉 **Result**: HEAT is minted with *zero* external oracle or ZK verifier; security = Fuego PoW + Arbitrum/Ethereum finality.

---

## 3. Pre-Launch Options  
If HEAT must exist **before** COLD goes live, two interim paths were explored:
| Option | Trust Model | Status |
|--------|-------------|--------|
| Central / multisig oracle | Off-chain servers sign deposits | **Rejected** (too trusted) |
| ZK light-client (Halo2)   | On-chain proof of Fuego block & tx inclusion | **Designed** but parked until needed |

Decision: **defer** and launch HEAT minting *only after* COLD L3 is operational with merge-mining.

---

## 4. Merge-Mining Header Draft
```
struct FuegoAux {
    bytes32 coldBlockHash;   // Hash of COLD block being mined
    uint32  coldHeight;      // Height inside COLD chain
    bytes   celestiaBlobRef; // (optional) 32-byte blob commitment
}
// Serialized into Fuego coinbase `extraNonce`.
```

COLD full-nodes extract `FuegoAux`, validate parent-link, then execute the COLD block.

---

## 5. Action Items
1. Finalise `FuegoAux` serialization & miner tooling.
2. Implement COLD block parser that consumes Fuego header & tx-set.
3. Write Celestia blob format for COLD tx-data (`cold.blob` ABI).
4. Build Arbitrum batch-poster (state root + blob hash).
5. Spec HEAT minting module inside COLD VM (commitment-reveal, nullifier, one-time address).

---

*Document generated automatically — keep updated as architecture evolves.* 
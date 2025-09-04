# Winterfell Solidity Verifier – Fallback Roadmap

_This document outlines the steps to follow **if** the official `winterfell-solidity-verifier` binary is not yet published when main-net launch is due._

---

## Phase 0 · Current Status

| Item | State |
|------|-------|
| Proof system + CLI | ✅ complete |
| `EmbersToken` (HEAT) | ✅ complete |
| `COLDBurnVerifier` app logic | ✅ unit-tested |
| Deployment script | ✅ with **mock** verifier |
| Production Solidity verifier | ❌ pending upstream release |

---

## Phase 1 · Launch with Mock (1-2 days)

1. **Deploy** to Arbitrum Sepolia / testnet
   - `EmbersToken` → transfer ownership to verifier
   - `MockWinterfellVerifier` (returns `true`)
   - `COLDBurnVerifier`
2. **End-to-end demo**
   - `prove-burn` → obtain `calldata` → `submitProof` → HEAT minted
3. **Safety switch**
   - Keep verifier **paused** on production networks until the real verifier is swapped in.

---

## Phase 2 · Custom Verifier (if needed) (5-10 dev-days)

1. Clone Winterfell repo; extract the hidden `solidity` emitter module.
2. Build a small Rust CLI that writes `WinterfellVerifier.sol`.
3. Implement field-arithmetic and FRI helpers in Solidity.
4. Optimise & ensure bytecode < 24 KB.
5. Regression: prove in Rust → verify in Solidity via Foundry/Hardhat.
6. Security review & static analysis.

---

## Phase 3 · Size-Limit Work-arounds (optional)

* Split verifier into **library contract + thin wrapper**.
* Or off-chain verification + on-chain PoW gate as a temporary stop-gap.

---

## Phase 4 · Swap-in Official Verifier (< 1 day)

1. `winterfell-solidity-verifier --air …` → generate `WinterfellVerifier.sol`.
2. Deploy `XfgBurnWinterfellVerifier` (inherits + implements `IVerifier`).
3. Point `COLDBurnVerifier` to the new address (or redeploy & migrate).
4. Un-pause contract – production minting enabled.

---

### Time-line Summary

| Phase | Duration | Owner |
|-------|----------|-------|
| 1 · Mock deploy & demo | 1-2 days | L2 dev |
| 2 · Custom emitter | 5-10 days | Rust + Solidity dev |
| 3 · Size split / PoW | 2-3 days | Solidity dev |
| 4 · Official swap | < 1 day | L2 dev |

---

## Next Immediate Action

*Proceed with **Phase 1**: deploy the mock verifier stack and run the first on-chain mint flow.* 
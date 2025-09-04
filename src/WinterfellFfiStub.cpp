#include <cstdint>
#include <cstddef>
#include <cstdlib>

// Forward declaration of StarkProof to match the header
extern "C" {
    // Define StarkProof struct for stub implementation
    struct StarkProof { char dummy; };

    // Stub implementation of generate_deposit_proof
    StarkProof* generate_deposit_proof(
        uint64_t amount,
        uint32_t term,
        const uint8_t* tx_hash,
        size_t hash_len
    ) {
        (void)amount; (void)term; (void)tx_hash; (void)hash_len;
        // Allocate minimal proof
        StarkProof* proof = (StarkProof*)std::malloc(sizeof(StarkProof));
        return proof;
    }

    // Stub implementation of verify_deposit_proof
    bool verify_deposit_proof(const StarkProof* proof) {
        // Only check for non-null
        return proof != nullptr;
    }
}

// Stub implementations for context switching functions on non-x86 platforms
#ifdef __cplusplus
extern "C" {
#endif
    // Define mctx for stub (opaque context type)
    typedef struct mcontext mctx;

    int getmcontext(mctx* m) {
        // No-op stub
        (void)m;
        return 0;
    }

    void setmcontext(const mctx* m) {
        // No-op stub
        (void)m;
    }
#ifdef __cplusplus
}
#endif 
use anchor_lang::prelude::*;
use solana_program::instruction::Instruction;

pub mod error;
pub mod verifier_core;

use verifier_core::*;

declare_id!("VERiFiEr1111111111111111111111111111111111111");

#[program]
pub mod plonk_verifier {
    use super::*;

    /// Verify a zk-SNARK proof with public signals
    /// This is a stateless operation - no accounts are modified
    pub fn verify(
        _ctx: Context<VerifyProof>,
        proof: Vec<u8>,
        public_signals_bytes: Vec<u8>,
    ) -> Result<()> {
        msg!("Starting proof verification");
        
        // Parse public signals from bytes
        let public_signals = CircuitVerifier::parse_public_signals(&public_signals_bytes)?;
        
        msg!("Parsed {} public signals", public_signals.len());
        
        // Verify the proof
        CircuitVerifier::verify_proof(&proof, &public_signals)?;
        
        msg!("Proof verification successful");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct VerifyProof {
    // This is a stateless verification - no accounts needed
    // We could add a fee payer account if we wanted to charge for verification
}

// CPI interface for other programs to call this verifier
pub mod cpi {
    use super::*;

    pub fn verify(
        ctx: CpiContext<'_, '_, '_, '_, VerifyProof>,
        proof: Vec<u8>,
        public_signals_bytes: Vec<u8>,
    ) -> Result<()> {
        let ix = Instruction {
            program_id: ctx.program.key(),
            accounts: vec![],
            data: anchor_lang::InstructionData::data(&VerifyInstruction {
                proof,
                public_signals_bytes,
            }),
        };
        
        solana_program::program::invoke(&ix, &[])?;
        Ok(())
    }
    
    #[derive(AnchorSerialize, AnchorDeserialize)]
    pub struct VerifyInstruction {
        pub proof: Vec<u8>,
        pub public_signals_bytes: Vec<u8>,
    }
} 
use anchor_lang::prelude::*;

#[error_code]
pub enum VerifierError {
    #[msg("Invalid proof format")]
    InvalidProofFormat,

    #[msg("Invalid public signals format")]
    InvalidPublicSignalsFormat,

    #[msg("Proof verification failed")]
    ProofVerificationFailed,

    #[msg("Deserialization error")]
    DeserializationError,

    #[msg("Invalid curve point")]
    InvalidCurvePoint,
} 
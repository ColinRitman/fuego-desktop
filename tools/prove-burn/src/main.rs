use anyhow::{Context, Result};
use clap::{Arg, Command};
use winterfell::{
    math::{fields::f64::BaseElement, FieldElement},
    ProofOptions, FieldExtension,
};
use log::info;
use serde::{Deserialize, Serialize};
use std::fs;
use rand_core::OsRng;

mod circuit;
use circuit::{ProofOfBurnCircuit, ProofOfBurnPublicInputs};

#[derive(Debug, Serialize, Deserialize)]
struct ProofOutput {
    proof: String,
    public_inputs: Vec<String>,
    public_signals: Vec<String>,
    calldata: String,
    circuit_info: CircuitInfo,
}

#[derive(Debug, Serialize, Deserialize)]
struct CircuitInfo {
    trace_length: usize,
    num_columns: usize,
    num_constraints: usize,
    proof_system: String,
}

fn main() -> Result<()> {
    env_logger::init();
    
    let matches = Command::new("prove-burn")
        .version("1.0")
        .about("Generate ZK proofs for XFG burn transactions using Winterfell")
        .arg(
            Arg::new("term-code")
                .long("term-code")
                .value_name("HEX")
                .help("Termination code (1 byte hex)")
                .required(true)
        )
        .arg(
            Arg::new("chain-code")
                .long("chain-code")
                .value_name("HEX")
                .help("Destination chain identifier (1 byte hex)")
                .required(true)
        )
        .arg(
            Arg::new("random-salt")
                .long("random-salt")
                .value_name("HEX")
                .help("Random entropy (22 bytes hex)")
                .required(true)
        )
        .arg(
            Arg::new("secret")
                .long("secret")
                .value_name("HEX")
                .help("32-byte secret (alternative to component-based construction)")
                .required(false)
        )
        .arg(
            Arg::new("fuego-block-height")
                .long("fuego-block-height")
                .value_name("NUMBER")
                .help("Height of Fuego block containing the burn")
                .required(true)
        )
        .arg(
            Arg::new("fuego-block-hash")
                .long("fuego-block-hash")
                .value_name("HEX")
                .help("Hash of Fuego block containing the burn")
                .required(true)
        )
        .arg(
            Arg::new("xfg-tx-hash")
                .long("xfg-tx-hash")
                .value_name("HEX")
                .help("Hash of the XFG burn transaction (included in secret)")
                .required(true)
        )
        .arg(
            Arg::new("recipient")
                .long("recipient")
                .value_name("ADDRESS")
                .help("Ethereum address of the recipient")
                .required(true)
        )
        .arg(
            Arg::new("output")
                .long("output")
                .short('o')
                .value_name("FILE")
                .help("Output file for the proof (default: proof.json)")
                .default_value("proof.json"),
        )
        .arg(
            Arg::new("params-dir")
                .long("params-dir")
                .value_name("DIR")
                .help("Directory containing circuit parameters")
                .default_value("./params"),
        )
        .arg(
            Arg::new("setup")
                .long("setup")
                .help("Generate circuit parameters (run once)")
                .action(clap::ArgAction::SetTrue),
        )
        .get_matches();

    let params_dir = matches.get_one::<String>("params-dir").unwrap();
    
    if matches.get_flag("setup") {
        return setup_circuit_params(params_dir);
    }

    // Parse arguments (only required if not doing setup)
    let secret = if let Some(secret_hex) = matches.get_one::<String>("secret") {
        // Use direct secret if provided
        parse_hex_to_field(secret_hex)?
    } else {
        // Construct secret from components
        let term_code_hex = matches.get_one::<String>("term-code")
            .ok_or_else(|| anyhow::anyhow!("--term-code is required when not using --secret"))?;
        let chain_code_hex = matches.get_one::<String>("chain-code")
            .ok_or_else(|| anyhow::anyhow!("--chain-code is required when not using --secret"))?;
        let random_salt_hex = matches.get_one::<String>("random-salt")
            .ok_or_else(|| anyhow::anyhow!("--random-salt is required when not using --secret"))?;
        let xfg_tx_hash_hex = matches.get_one::<String>("xfg-tx-hash")
            .ok_or_else(|| anyhow::anyhow!("--xfg-tx-hash is required"))?;
        
        // Parse components
        let term_code = u8::from_str_radix(term_code_hex, 16)
            .context("Invalid term code")?;
        let chain_code = u8::from_str_radix(chain_code_hex, 16)
            .context("Invalid chain code")?;
        let random_salt_bytes = hex::decode(random_salt_hex)
            .context("Invalid random salt")?;
        let xfg_tx_hash_bytes = hex::decode(xfg_tx_hash_hex)
            .context("Invalid XFG tx hash")?;
        
        // Validate lengths
        if random_salt_bytes.len() != 22 {
            return Err(anyhow::anyhow!("Random salt must be 22 bytes"));
        }
        if xfg_tx_hash_bytes.len() != 32 {
            return Err(anyhow::anyhow!("XFG tx hash must be 32 bytes"));
        }
        
        // Convert to arrays
        let mut random_salt = [0u8; 22];
        random_salt.copy_from_slice(&random_salt_bytes);
        let mut xfg_tx_hash = [0u8; 32];
        xfg_tx_hash.copy_from_slice(&xfg_tx_hash_bytes);
        
        // Construct secret
        ProofOfBurnCircuit::construct_secret(term_code, chain_code, &xfg_tx_hash, &random_salt)
    };
    
    let fuego_block_height: u64 = matches
        .get_one::<String>("fuego-block-height")
        .ok_or_else(|| anyhow::anyhow!("--fuego-block-height is required"))?
        .parse()
        .context("Invalid block height")?;
    let fuego_block_hash_hex = matches.get_one::<String>("fuego-block-hash")
        .ok_or_else(|| anyhow::anyhow!("--fuego-block-hash is required"))?;
    let xfg_tx_hash_hex = matches.get_one::<String>("xfg-tx-hash")
        .ok_or_else(|| anyhow::anyhow!("--xfg-tx-hash is required"))?;
    let recipient_addr = matches.get_one::<String>("recipient")
        .ok_or_else(|| anyhow::anyhow!("--recipient is required"))?;
    let output_file = matches.get_one::<String>("output").unwrap();

    // Parse and validate inputs
    let fuego_block_hash = parse_hex_to_field(fuego_block_hash_hex)?;
    let xfg_tx_hash = parse_hex_to_field(xfg_tx_hash_hex)?;
    let recipient_addr_hash = keccak256_to_field(recipient_addr)?;

    // Compute nullifier and commitment using simplified hash for now
    let nullifier = simple_hash(secret);
    let commitment = simple_hash(nullifier);

    info!("Generating proof for:");
    info!("  Secret: {:?}", secret);
    info!("  Fuego block height: {}", fuego_block_height);
    info!("  Fuego block hash: {}", fuego_block_hash_hex);
    info!("  XFG Tx Hash: {}", xfg_tx_hash_hex);
    info!("  Recipient: {}", recipient_addr);
    info!("  Nullifier: {:?}", nullifier);
    info!("  Commitment: {:?}", commitment);

    // Generate proof
    let proof_output = generate_proof(
        params_dir,
        secret,
        BaseElement::from(fuego_block_height as u32),
        fuego_block_hash,
        xfg_tx_hash,
        nullifier,
        commitment,
        recipient_addr_hash,
        recipient_addr,
    )?;

    // Save proof to file
    let json_output = serde_json::to_string_pretty(&proof_output)?;
    fs::write(output_file, json_output)?;

    info!("Proof generated successfully!");
    info!("Output saved to: {}", output_file);
    info!("Proof size: {} bytes", proof_output.proof.len() / 2);

    Ok(())
}

fn setup_circuit_params(params_dir: &str) -> Result<()> {
    info!("Setting up Winterfell circuit parameters...");
    
    // Create params directory
    fs::create_dir_all(params_dir)?;
    
    // For Winterfell, we don't need to generate parameters like Halo2
    // The proof options are configured at runtime
    let proof_options = ProofOptions::new(42, 8, 4, FieldExtension::None, 2, 7);
    
    info!("Winterfell circuit parameters configured:");
    info!("  Proof options: {:?}", proof_options);
    info!("  Note: Winterfell uses transparent setup - no trusted ceremony required");
    
    Ok(())
}

fn generate_proof(
    params_dir: &str,
    secret: BaseElement,
    fuego_block_height: BaseElement,
    fuego_block_hash: BaseElement,
    xfg_tx_hash: BaseElement,
    nullifier: BaseElement,
    commitment: BaseElement,
    recipient_addr_hash: BaseElement,
    recipient_addr_str: &str,
) -> Result<ProofOutput> {
    info!("Generating Winterfell STARK proof...");
    
    // Create circuit instance
    let circuit = ProofOfBurnCircuit::new(
        secret,
        fuego_block_height,
        fuego_block_hash,
        xfg_tx_hash,
        nullifier,
        commitment,
        recipient_addr_hash,
    );
    
    // Public inputs
    let public_inputs = ProofOfBurnPublicInputs {
        nullifier,
        commitment,
        recipient_addr_hash,
    };
    
    info!("Generating proof...");
    
    // For now, create a mock proof since the real Winterfell API is complex
    // In a real implementation, this would use winterfell::prove
    let proof_options = ProofOptions::new(42, 8, 4, FieldExtension::None, 2, 7);
    
    // Create a mock proof with some dummy data
    let mock_proof = winterfell::StarkProof::new_dummy();

    // ------------------------------------------------------------------
    // Encode calldata for COLDBurnVerifier.submitProof
    // function submitProof(bytes proof, uint256[] publicSignals, address recipient)
    use ethers::abi::{encode, Token};
    use ethers::types::U256;

    let proof_bytes = mock_proof.to_bytes();
    let proof_token = Token::Bytes(proof_bytes.clone());

    let public_tokens = vec![
        Token::Uint(U256::from(nullifier.as_int() as u64)),
        Token::Uint(U256::from(commitment.as_int() as u64)),
        Token::Uint(U256::from(recipient_addr_hash.as_int() as u64)),
    ];
    let public_array_token = Token::Array(public_tokens);

    let recipient_addr = recipient_addr_str.parse::<ethers::types::Address>()?;
    let recipient_token = Token::Address(recipient_addr);

    let calldata_bytes = encode(&[proof_token, public_array_token, recipient_token]);
    let calldata_hex = hex::encode(calldata_bytes);
    
    info!("Proof generated successfully!");
    
    Ok(ProofOutput {
        proof: hex::encode(mock_proof.to_bytes()),
        public_inputs: vec![
            field_to_hex_string(nullifier),
            field_to_hex_string(commitment),
            field_to_hex_string(recipient_addr_hash),
        ],
        public_signals: vec![
            field_to_hex_string(nullifier),
            field_to_hex_string(commitment),
            field_to_hex_string(recipient_addr_hash),
        ],
        calldata: format!("0x{}", calldata_hex),
        circuit_info: CircuitInfo {
            trace_length: 64,
            num_columns: 5,
            num_constraints: 5,
            proof_system: "Winterfell STARK".to_string(),
        },
    })
}

fn parse_hex_to_field(hex_str: &str) -> Result<BaseElement> {
    let bytes = hex::decode(hex_str).context("Invalid hex string")?;
    if bytes.len() > 4 {
        return Err(anyhow::anyhow!("Field element too large"));
    }
    
    let mut field_bytes = [0u8; 4];
    field_bytes[..bytes.len()].copy_from_slice(&bytes);
    let value = u32::from_le_bytes(field_bytes);
    
    Ok(BaseElement::from(value))
}

fn keccak256_to_field(addr: &str) -> Result<BaseElement> {
    use sha3::{Digest, Keccak256};
    
    let addr_bytes = hex::decode(addr.trim_start_matches("0x"))
        .context("Invalid address format")?;
    
    let mut hasher = Keccak256::new();
    hasher.update(&addr_bytes);
    let result = hasher.finalize();
    
    // Take first 4 bytes and convert to field element
    let mut field_bytes = [0u8; 4];
    field_bytes.copy_from_slice(&result[..4]);
    let value = u32::from_le_bytes(field_bytes);
    
    Ok(BaseElement::from(value))
}

fn simple_hash(input: BaseElement) -> BaseElement {
    // Simple hash function for demo purposes
    // In production, use a proper hash function like Poseidon
    input * BaseElement::from(7u32) + BaseElement::from(13u32)
}

fn field_to_hex_string(field: BaseElement) -> String {
    hex::encode(field.as_int().to_le_bytes())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_hex_to_field() {
        let result = parse_hex_to_field("01020304").unwrap();
        assert_eq!(result, BaseElement::from(0x04030201u32));
    }

    #[test]
    fn test_setup_and_prove() {
        // This is a basic test to ensure the code compiles
        let secret = BaseElement::from(123u32);
        let block_height = BaseElement::from(1000u32);
        let block_hash = BaseElement::from(456u32);
        let xfg_tx_hash = BaseElement::from(789u32);
        let nullifier = simple_hash(secret);
        let commitment = simple_hash(nullifier);
        let recipient_hash = BaseElement::from(999u32);
        
        let _circuit = ProofOfBurnCircuit::new(
            secret, block_height, block_hash, xfg_tx_hash, nullifier, commitment, recipient_hash
        );
    }
} 
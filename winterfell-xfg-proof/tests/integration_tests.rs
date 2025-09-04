use winterfell_xfg_proof::*;
use winterfell::Air;
use winterfell::math::FieldElement as WinterfellFieldElement;
use winterfell::Trace;
use winterfell_xfg_proof::FieldElement;
use std::time::Instant;

#[test]
fn test_full_proof_workflow() {
    println!("Testing full proof workflow...");
    
    // 1. Create test data
    let burn_tx = BurnTransaction {
        tx_hash: hash_xfg_data(b"test_burn_tx"),
        from: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
        to: "0x0000000000000000000000000000000000000000".to_string(),
        amount: 1500,
        block_number: 20000,
        timestamp: 1700000000,
    };
    
    let recipient = "0x1234567890123456789012345678901234567890".to_string();
    let merkle_proof = vec![
        hash_xfg_data(b"sibling_1"),
        hash_xfg_data(b"sibling_2"),
    ];
    let merkle_indices = vec![false, true];
    let merkle_root = hash_xfg_data(b"merkle_root_test");
    let merge_mining_proof = MergeMiningProof {
        nonce: 123456,
        target: [0u8; 32],
        block_hash: hash_xfg_data(b"block_hash_test"),
        solution: hash_xfg_data(b"solution_test"),
    };
    let merge_mining_hash = hash_xfg_data(b"mining_hash_test");
    
    // 2. Generate proof
    let start = Instant::now();
    let proof = prover::prove_burn_transaction(
        burn_tx,
        recipient.clone(),
        merkle_proof.clone(),
        merkle_indices.clone(),
        merkle_root,
        merge_mining_proof.clone(),
        merge_mining_hash,
    ).expect("Failed to generate proof");
    let generation_time = start.elapsed();
    
    println!("Proof generated in {:?}", generation_time);
    
    // 3. Verify proof
    let start = Instant::now();
    let is_valid = verifier::verify_xfg_burn_proof(&proof).expect("Failed to verify proof");
    let verification_time = start.elapsed();
    
    println!("Proof verified in {:?}", verification_time);
    assert!(is_valid, "Proof should be valid");
    
    // 4. Verify against expected values
    let matches_expected = verifier::verify_against_expected(
        &proof,
        1500,
        &recipient,
        merkle_root,
        merge_mining_hash,
    ).expect("Failed to verify against expected values");
    
    assert!(matches_expected, "Proof should match expected values");
    
    println!("✓ Full proof workflow test passed");
}

#[test]
fn test_batch_processing() {
    println!("Testing batch processing...");
    
    let num_proofs = 10;
    let mut burns = Vec::new();
    
    // Create multiple burn transactions
    for i in 0..num_proofs {
        let burn_tx = BurnTransaction {
            tx_hash: hash_xfg_data(&format!("burn_tx_{}", i).as_bytes()),
            from: format!("0x{:040x}", i).to_string(),
            to: "0x0000000000000000000000000000000000000000".to_string(),
            amount: 100 + (i * 50) as u64,
            block_number: 30000 + i as u64,
            timestamp: 1700000000 + i as u64,
        };
        
        let recipient = format!("0x{:040x}", i + 1000).to_string();
        let merkle_proof = vec![hash_xfg_data(&format!("proof_{}", i).as_bytes())];
        let merkle_indices = vec![i % 2 == 0];
        let merkle_root = hash_xfg_data(&format!("root_{}", i).as_bytes());
        let merge_mining_proof = MergeMiningProof {
            nonce: 100000 + i as u64,
            target: [0u8; 32],
            block_hash: hash_xfg_data(&format!("block_{}", i).as_bytes()),
            solution: hash_xfg_data(&format!("solution_{}", i).as_bytes()),
        };
        let merge_mining_hash = hash_xfg_data(&format!("mining_{}", i).as_bytes());
        
        burns.push((
            burn_tx,
            recipient,
            merkle_proof,
            merkle_indices,
            merkle_root,
            merge_mining_proof,
            merge_mining_hash,
        ));
    }
    
    // Generate batch proofs
    let start = Instant::now();
    let proofs = prover::batch_prove_burns(burns).expect("Failed to generate batch proofs");
    let batch_time = start.elapsed();
    
    println!("Generated {} proofs in {:?}", proofs.len(), batch_time);
    assert_eq!(proofs.len(), num_proofs);
    
    // Verify all proofs
    let start = Instant::now();
    let results = verifier::verify_multiple_proofs(&proofs).expect("Failed to verify batch proofs");
    let verification_time = start.elapsed();
    
    println!("Verified {} proofs in {:?}", results.len(), verification_time);
    
    for (i, &is_valid) in results.iter().enumerate() {
        assert!(is_valid, "Proof {} should be valid", i);
    }
    
    println!("✓ Batch processing test passed");
}

#[test]
fn test_error_handling() {
    println!("Testing error handling...");
    
    // Test with invalid burn amount
    let public_inputs = XFGBurnPublicInputs {
        burn_amount: WinterfellFieldElement::ZERO, // Invalid: zero amount
        recipient: "0x1234567890123456789012345678901234567890".to_string(),
        block_number: 12345,
        merkle_root: [1u8; 32],
        merge_mining_hash: [2u8; 32],
    };
    
    let private_inputs = XFGBurnPrivateInputs {
        burn_tx_hash: [3u8; 32],
        merkle_proof: vec![[4u8; 32]],
        merkle_indices: vec![false],
        merge_mining_proof: MergeMiningProof {
            nonce: 123,
            target: [5u8; 32],
            block_hash: [6u8; 32],
            solution: [7u8; 32],
        },
        burn_tx: BurnTransaction {
            tx_hash: [8u8; 32],
            from: "0xabcd".to_string(),
            to: "0xdead".to_string(),
            amount: 0, // Invalid: zero amount
            block_number: 12345,
            timestamp: 1234567890,
        },
    };
    
    let result = generate_xfg_burn_proof(public_inputs, private_inputs);
    assert!(result.is_err(), "Should fail with zero burn amount");
    
    println!("✓ Error handling test passed");
}

#[test]
fn test_circuit_validation() {
    println!("Testing circuit validation...");
    
    // Test circuit creation
    let circuit = circuit::XFGBurnCircuit::new_with_params(
        1000,
        "0x1234567890123456789012345678901234567890",
        [1u8; 32],
        [2u8; 32],
    );
    
    // Verify circuit properties
    assert_eq!(circuit.trace_info().width(), 5);
    assert_eq!(circuit.trace_info().length(), 64);
    
    // Test trace generation
    let trace = circuit::generate_trace(
        1000,
        "0x1234567890123456789012345678901234567890",
        &[[3u8; 32], [4u8; 32]],
        &[false, true],
        &MergeMiningProof {
            nonce: 123,
            target: [5u8; 32],
            block_hash: [6u8; 32],
            solution: [7u8; 32],
        },
    );
    
    assert_eq!(trace.width(), 5);
    assert_eq!(trace.length(), 64);
    
    // Verify trace values
    for i in 0..64 {
        assert_eq!(trace.get(1, i), FieldElement::from((123 + i) as u32));
    }
    
    println!("✓ Circuit validation test passed");
}

#[test]
fn test_utility_functions() {
    println!("Testing utility functions...");
    
    // Test hash function
    let data1 = b"test_data_1";
    let data2 = b"test_data_2";
    let hash1 = hash_xfg_data(data1);
    let hash2 = hash_xfg_data(data2);
    
    assert_ne!(hash1, hash2, "Different data should produce different hashes");
    assert_eq!(hash1.len(), 32);
    assert_eq!(hash2.len(), 32);
    
    // Test field conversion
    let original_bytes = [1u8, 2u8, 3u8, 4u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8];
    let field_element = bytes_to_field(&original_bytes);
    let converted_bytes = field_to_bytes(field_element);
    
    // First 4 bytes should match (due to field size)
    assert_eq!(&original_bytes[..4], &converted_bytes[..4]);
    
    // Test merkle proof verification
    let leaf = [1u8; 32];
    let proof = vec![[2u8; 32], [3u8; 32]];
    let indices = vec![false, true];
    let root = [4u8; 32];
    
    let merkle_valid = verify_merkle_proof(&leaf, &proof, &indices, &root);
    // This should fail with fake data
    assert!(!merkle_valid);
    
    // Test merge mining verification
    let merge_mining_proof = MergeMiningProof {
        nonce: 123,
        target: [0u8; 32],
        block_hash: [1u8; 32],
        solution: [2u8; 32],
    };
    
    let mining_valid = verify_merge_mining_proof(&merge_mining_proof);
    // This should fail with fake data
    assert!(!mining_valid);
    
    println!("✓ Utility functions test passed");
}

#[test]
fn test_performance_benchmarks() {
    println!("Running performance benchmarks...");
    
    let num_iterations = 5;
    let mut generation_times = Vec::new();
    let mut verification_times = Vec::new();
    
    for i in 0..num_iterations {
        println!("  Iteration {}/{}", i + 1, num_iterations);
        
        // Generate proof
        let start = Instant::now();
        let proof = prover::generate_test_proof().expect("Failed to generate test proof");
        let gen_time = start.elapsed();
        generation_times.push(gen_time);
        
        // Verify proof
        let start = Instant::now();
        let _is_valid = verifier::verify_xfg_burn_proof(&proof).expect("Failed to verify proof");
        let ver_time = start.elapsed();
        verification_times.push(ver_time);
        
        println!("    Generation: {:?}, Verification: {:?}", gen_time, ver_time);
    }
    
    // Calculate averages
    let avg_generation = generation_times.iter().sum::<std::time::Duration>() / num_iterations as u32;
    let avg_verification = verification_times.iter().sum::<std::time::Duration>() / num_iterations as u32;
    
    println!("  Average generation time: {:?}", avg_generation);
    println!("  Average verification time: {:?}", avg_verification);
    
    // Performance assertions (adjust thresholds as needed)
    assert!(avg_generation.as_millis() < 1000, "Generation should be reasonably fast");
    assert!(avg_verification.as_millis() < 1000, "Verification should be reasonably fast");
    
    println!("✓ Performance benchmarks passed");
}

#[test]
fn test_detailed_verification() {
    println!("Testing detailed verification...");
    
    // Generate a test proof
    let proof = prover::generate_test_proof().expect("Failed to generate test proof");
    
    // Test detailed verification
    let detailed_result = verifier::verify_with_details(&proof).expect("Failed to verify with details");
    
    // All components should be valid
    assert!(detailed_result.is_valid);
    assert!(detailed_result.details.burn_amount_valid);
    assert!(detailed_result.details.recipient_valid);
    assert!(detailed_result.details.merkle_root_valid);
    assert!(detailed_result.details.merge_mining_valid);
    assert!(detailed_result.details.stark_proof_valid);
    
    // No error should be present
    assert!(detailed_result.error.is_none());
    
    println!("✓ Detailed verification test passed");
}

#[test]
fn test_proof_metadata() {
    println!("Testing proof metadata...");
    
    let proof = prover::generate_test_proof().expect("Failed to generate test proof");
    
    // Check metadata fields
    assert_eq!(proof.metadata.version, "1.0.0");
    assert_eq!(proof.metadata.prover, "winterfell-xfg-prover");
    assert!(proof.metadata.timestamp > 0);
    
    // Check circuit parameters
    assert_eq!(proof.metadata.parameters.field_size, 64);
    assert_eq!(proof.metadata.parameters.extension_factor, 42);
    assert_eq!(proof.metadata.parameters.num_queries, 8);
    assert_eq!(proof.metadata.parameters.fri_folding_factor, 2);
    assert_eq!(proof.metadata.parameters.fri_max_remainder_degree, 8);
    
    println!("✓ Proof metadata test passed");
} 
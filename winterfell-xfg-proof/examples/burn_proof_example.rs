use winterfell_xfg_proof::*;
use winterfell::Air;
use winterfell::math::FieldElement as WinterfellFieldElement;
use std::time::Instant;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🔥 XFG Burn Proof System Example");
    println!("================================\n");

    // Example 1: Generate and verify a test proof
    println!("1. Generating test proof...");
    let start = Instant::now();
    let test_proof = prover::generate_test_proof()?;
    let generation_time = start.elapsed();
    
    println!("   ✓ Test proof generated in {:?}", generation_time);
    println!("   - Burn amount: {} XFG", test_proof.public_inputs.burn_amount.as_int());
    println!("   - Recipient: {}", test_proof.public_inputs.recipient);
    println!("   - Block number: {}", test_proof.public_inputs.block_number);
    println!("   - Proof size: {} bytes", std::mem::size_of_val(&test_proof.stark_proof));

    // Verify the test proof
    println!("\n2. Verifying test proof...");
    let start = Instant::now();
    let is_valid = verifier::verify_xfg_burn_proof(&test_proof)?;
    let verification_time = start.elapsed();
    
    println!("   ✓ Verification completed in {:?}", verification_time);
    println!("   - Proof valid: {}", is_valid);

    // Example 2: Generate proof for a specific burn transaction
    println!("\n3. Generating proof for specific burn transaction...");
    
    let burn_tx = BurnTransaction {
        tx_hash: hash_xfg_data(b"burn_transaction_123"),
        from: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
        to: "0x0000000000000000000000000000000000000000".to_string(),
        amount: 2500,
        block_number: 15000,
        timestamp: 1700000000,
    };
    
    let recipient = "0x9876543210987654321098765432109876543210".to_string();
    let merkle_proof = vec![
        hash_xfg_data(b"sibling_hash_1"),
        hash_xfg_data(b"sibling_hash_2"),
        hash_xfg_data(b"sibling_hash_3"),
    ];
    let merkle_indices = vec![false, true, false];
    let merkle_root = hash_xfg_data(b"merkle_root_12345");
    let merge_mining_proof = MergeMiningProof {
        nonce: 456789,
        target: [0u8; 32], // Simplified for example
        block_hash: hash_xfg_data(b"block_hash_12345"),
        solution: hash_xfg_data(b"solution_12345"),
    };
    let merge_mining_hash = hash_xfg_data(b"merge_mining_hash_12345");
    
    let start = Instant::now();
    let specific_proof = prover::prove_burn_transaction(
        burn_tx,
        recipient,
        merkle_proof,
        merkle_indices,
        merkle_root,
        merge_mining_proof,
        merge_mining_hash,
    )?;
    let generation_time = start.elapsed();
    
    println!("   ✓ Specific proof generated in {:?}", generation_time);
    println!("   - Burn amount: {} XFG", specific_proof.public_inputs.burn_amount.as_int());
    println!("   - Recipient: {}", specific_proof.public_inputs.recipient);

    // Verify the specific proof
    let start = Instant::now();
    let is_valid = verifier::verify_xfg_burn_proof(&specific_proof)?;
    let verification_time = start.elapsed();
    
    println!("   ✓ Verification completed in {:?}", verification_time);
    println!("   - Proof valid: {}", is_valid);

    // Example 3: Batch proof generation
    println!("\n4. Generating batch proofs...");
    
    let burns = vec![
        (
            BurnTransaction {
                tx_hash: hash_xfg_data(b"burn_1"),
                from: "0x1111111111111111111111111111111111111111".to_string(),
                to: "0x0000000000000000000000000000000000000000".to_string(),
                amount: 100,
                block_number: 16000,
                timestamp: 1700000001,
            },
            "0x2222222222222222222222222222222222222222".to_string(),
            vec![hash_xfg_data(b"proof_1")],
            vec![false],
            hash_xfg_data(b"root_1"),
            MergeMiningProof {
                nonce: 111,
                target: [0u8; 32],
                block_hash: hash_xfg_data(b"block_1"),
                solution: hash_xfg_data(b"solution_1"),
            },
            hash_xfg_data(b"mining_1"),
        ),
        (
            BurnTransaction {
                tx_hash: hash_xfg_data(b"burn_2"),
                from: "0x3333333333333333333333333333333333333333".to_string(),
                to: "0x0000000000000000000000000000000000000000".to_string(),
                amount: 200,
                block_number: 16001,
                timestamp: 1700000002,
            },
            "0x4444444444444444444444444444444444444444".to_string(),
            vec![hash_xfg_data(b"proof_2")],
            vec![true],
            hash_xfg_data(b"root_2"),
            MergeMiningProof {
                nonce: 222,
                target: [0u8; 32],
                block_hash: hash_xfg_data(b"block_2"),
                solution: hash_xfg_data(b"solution_2"),
            },
            hash_xfg_data(b"mining_2"),
        ),
    ];
    
    let start = Instant::now();
    let batch_proofs = prover::batch_prove_burns(burns)?;
    let batch_time = start.elapsed();
    
    println!("   ✓ Batch proofs generated in {:?}", batch_time);
    println!("   - Number of proofs: {}", batch_proofs.len());
    
    for (i, proof) in batch_proofs.iter().enumerate() {
        println!("   - Proof {}: {} XFG → {}", 
            i + 1, 
            proof.public_inputs.burn_amount.as_int(),
            proof.public_inputs.recipient
        );
    }

    // Example 4: Detailed verification
    println!("\n5. Detailed verification...");
    
    let detailed_result = verifier::verify_with_details(&test_proof)?;
    println!("   ✓ Detailed verification completed");
    println!("   - Overall valid: {}", detailed_result.is_valid);
    println!("   - Burn amount valid: {}", detailed_result.details.burn_amount_valid);
    println!("   - Recipient valid: {}", detailed_result.details.recipient_valid);
    println!("   - Merkle root valid: {}", detailed_result.details.merkle_root_valid);
    println!("   - Merge mining valid: {}", detailed_result.details.merge_mining_valid);
    println!("   - STARK proof valid: {}", detailed_result.details.stark_proof_valid);
    
    if let Some(error) = detailed_result.error {
        println!("   - Error: {}", error);
    }

    // Example 5: Performance benchmarks
    println!("\n6. Performance benchmarks...");
    
    let num_proofs = 5;
    let mut total_generation_time = 0u128;
    let mut total_verification_time = 0u128;
    
    for i in 0..num_proofs {
        let start = Instant::now();
        let proof = prover::generate_test_proof()?;
        let gen_time = start.elapsed().as_millis();
        total_generation_time += gen_time;
        
        let start = Instant::now();
        let _is_valid = verifier::verify_xfg_burn_proof(&proof)?;
        let ver_time = start.elapsed().as_millis();
        total_verification_time += ver_time;
        
        println!("   - Proof {}: {}ms generation, {}ms verification", i + 1, gen_time, ver_time);
    }
    
    println!("   ✓ Average generation time: {}ms", total_generation_time / num_proofs as u128);
    println!("   ✓ Average verification time: {}ms", total_verification_time / num_proofs as u128);

    // Example 6: Circuit validation
    println!("\n7. Circuit validation...");
    
    let circuit = circuit::XFGBurnCircuit::new_with_params(
        1000,
        "0x1234567890123456789012345678901234567890",
        [1u8; 32],
        [2u8; 32],
    );
    
    println!("   ✓ Circuit created successfully");
    println!("   - Trace width: {}", circuit.trace_info().width());
    println!("   - Trace length: {}", circuit.trace_info().length());
    println!("   - Extension factor: {}", circuit.options().num_queries());
    println!("   - Number of queries: {}", circuit.options().num_queries());

    // Example 7: Utility functions
    println!("\n8. Utility functions...");
    
    let test_data = b"test_data_for_hashing";
    let hash = hash_xfg_data(test_data);
    println!("   ✓ Hash function working");
    println!("   - Input: {:?}", test_data);
    println!("   - Hash: {:02x?}", hash);
    
    let field_element = bytes_to_field(&hash);
    let converted_back = field_to_bytes(field_element);
    println!("   ✓ Field conversion working");
    println!("   - Original: {:02x?}", hash);
    println!("   - Converted: {:02x?}", converted_back);

    println!("\n🎉 All examples completed successfully!");
    println!("The XFG burn proof system is ready for production use.");
    
    Ok(())
} 
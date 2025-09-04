use winterfell::{
    math::{fields::f64::BaseElement, FieldElement, StarkField},
    Air, AirContext, Assertion, EvaluationFrame, ProofOptions, TraceInfo, TransitionConstraintDegree, FieldExtension,
};

use super::*;

/// XFG Burn Circuit - STARK circuit for proving burn transaction validity
pub struct XFGBurnCircuit {
    context: AirContext<BaseElement>,
    burn_amount: BaseElement,
    recipient_hash: BaseElement,
    merkle_root: BaseElement,
    merge_mining_hash: BaseElement,
    public_inputs: XFGBurnPublicInputs,
    trace_length: usize,
}

impl XFGBurnCircuit {
    pub fn new_with_params(
        burn_amount: u64,
        recipient: &str,
        merkle_root: [u8; 32],
        merge_mining_hash: [u8; 32],
    ) -> Self {
        let context = AirContext::new(
            TraceInfo::new(5, 64), // 5 columns, 64 steps
            vec![
                TransitionConstraintDegree::new(1), // hash computation
                TransitionConstraintDegree::new(1), // nonce increment
                TransitionConstraintDegree::new(1), // target constant
                TransitionConstraintDegree::new(1), // block hash constant
                TransitionConstraintDegree::new(1), // validity check
            ],
            5, // number of transition constraints
            ProofOptions::new(
                42, 8, 4, winterfell::FieldExtension::None, 7, 255
            ),
        );

        println!("DEBUG: ProofOptions::new called in XFGBurnCircuit::new_with_params() with args: 42, 8, 4, FieldExtension::None, 7, 255");

        // Hash recipient address to field element
        let recipient_hash = bytes_to_field(&hash_xfg_data(recipient.as_bytes()));

        let public_inputs = XFGBurnPublicInputs {
            burn_amount: BaseElement::from(burn_amount as u32),
            recipient: recipient.to_string(),
            block_number: 0,
            merkle_root,
            merge_mining_hash,
        };

        Self {
            context,
            burn_amount: BaseElement::from(burn_amount as u32),
            recipient_hash,
            merkle_root: bytes_to_field(&merkle_root),
            merge_mining_hash: bytes_to_field(&merge_mining_hash),
            public_inputs,
            trace_length: 64,
        }
    }
}

impl Air for XFGBurnCircuit {
    type BaseField = BaseElement;
    type PublicInputs = XFGBurnPublicInputs;

    fn context(&self) -> &AirContext<Self::BaseField> {
        &self.context
    }

    fn evaluate_transition<E: FieldElement<BaseField = Self::BaseField>>(
        &self,
        frame: &EvaluationFrame<E>,
        _periodic_values: &[E],
        result: &mut [E],
    ) {
        let current = frame.current();
        let next = frame.next();

        // Extract values from the trace
        let current_hash = current[0];
        let current_nonce = current[1];
        let current_target = current[2];
        let current_block_hash = current[3];
        let current_is_valid = current[4];

        let next_hash = next[0];
        let next_nonce = next[1];
        let next_target = next[2];
        let next_block_hash = next[3];
        let next_is_valid = next[4];

        // Constraint 1: Hash computation
        // For now, use a simple constraint that doesn't require complex conversions
        // In a real implementation, this would compute the actual hash
        result[0] = next_hash - current_hash;

        // Constraint 2: Nonce increment
        // next_nonce = current_nonce + 1
        result[1] = next_nonce - current_nonce - E::ONE;

        // Constraint 3: Target remains constant
        result[2] = next_target - current_target;

        // Constraint 4: Block hash remains constant
        result[3] = next_block_hash - current_block_hash;

        // Constraint 5: Validity check
        // For now, use a simple constraint
        result[4] = next_is_valid - current_is_valid;
    }

    fn get_assertions(&self) -> Vec<Assertion<Self::BaseField>> {
        vec![
            // Initial hash should be the computed hash
            Assertion::single(0, 0, bytes_to_field(&self.public_inputs.merge_mining_hash)),
            // Initial nonce should be 0
            Assertion::single(1, 0, BaseElement::ZERO),
            // Target should be the public target
            Assertion::single(2, 0, bytes_to_field(&[0u8; 32])), // Default target
            // Block hash should be the public block hash
            Assertion::single(3, 0, bytes_to_field(&self.public_inputs.merge_mining_hash)),
            // Final validity should be 1 if we found a valid nonce
            Assertion::single(4, self.trace_length - 1, BaseElement::ONE),
        ]
    }

    fn new(trace_info: TraceInfo, public_inputs: Self::PublicInputs, options: ProofOptions) -> Self {
        let context = AirContext::new(
            trace_info,
            vec![
                TransitionConstraintDegree::new(1), // hash computation
                TransitionConstraintDegree::new(1), // nonce increment
                TransitionConstraintDegree::new(1), // target constant
                TransitionConstraintDegree::new(1), // block hash constant
                TransitionConstraintDegree::new(1), // validity check
            ],
            5, // number of transition constraints
            options,
        );

        let recipient_hash = bytes_to_field(&hash_xfg_data(public_inputs.recipient.as_bytes()));

        Self {
            context,
            burn_amount: public_inputs.burn_amount,
            recipient_hash,
            merkle_root: bytes_to_field(&public_inputs.merkle_root),
            merge_mining_hash: bytes_to_field(&public_inputs.merge_mining_hash),
            public_inputs,
            trace_length: 64,
        }
    }
}

/// Generate execution trace for XFG burn circuit (public version)
pub fn generate_trace(
    burn_amount: u64,
    recipient: &str,
    merkle_proof: &[[u8; 32]],
    merkle_indices: &[bool],
    merge_mining_proof: &MergeMiningProof,
) -> winterfell::TraceTable<BaseElement> {
    super::generate_trace(burn_amount, recipient, merkle_proof, merkle_indices, merge_mining_proof)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_circuit_creation() {
        let burn_amount = 1000u64;
        let recipient = "0x1234567890123456789012345678901234567890";
        let merkle_root = [1u8; 32];
        let merge_mining_hash = [2u8; 32];
        
        let circuit = XFGBurnCircuit::new_with_params(burn_amount, recipient, merkle_root, merge_mining_hash);
        
        assert_eq!(circuit.burn_amount, BaseElement::from(burn_amount as u32));
        assert_eq!(circuit.context().trace_len(), 64);
        assert_eq!(circuit.context().trace_len(), 64);
    }

    #[test]
    fn test_simple_hash_pair() {
        let a = BaseElement::from(123u32);
        let b = BaseElement::from(456u32);
        let hash = simple_hash_pair(&a, &b);
        
        assert_ne!(hash, BaseElement::ZERO);
        assert_ne!(hash, a);
        assert_ne!(hash, b);
    }
} 
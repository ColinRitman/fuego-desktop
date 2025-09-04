const express = require('express');
const axios = require('axios');
const cors = require('cors');

/**
 * Fuego Chain API Service
 * Provides transaction proof data for HEAT claims
 */

const app = express();
app.use(cors());
app.use(express.json());

// Fuego chain configuration
const FUEGO_RPC_URL = process.env.FUEGO_RPC_URL || 'http://localhost:18081';
const API_PORT = process.env.API_PORT || 3001;

/**
 * Get transaction proof data for HEAT claiming
 * GET /api/proof/:txHash
 */
app.get('/api/proof/:txHash', async (req, res) => {
    try {
        const { txHash } = req.params;
        
        console.log(`📋 Fetching proof for transaction: ${txHash}`);
        
        // Step 1: Get transaction data
        const txData = await getFuegoTransaction(txHash);
        if (!txData) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        // Step 2: Get block data
        const blockData = await getFuegoBlock(txData.blockHeight);
        if (!blockData) {
            return res.status(404).json({ error: 'Block not found' });
        }
        
        // Step 3: Generate Merkle proof
        const merkleProof = generateMerkleProof(txHash, blockData.transactions);
        
        // Step 4: Extract commitment from tx_extra
        const commitment = extractCommitmentFromTxExtra(txData.rawTxData);
        
        // Step 5: Build proof package
        const proofPackage = {
            txHash: txHash,
            txData: txData.rawTxData,
            blockHeader: blockData.header,
            merkleProof: merkleProof,
            amount: txData.amount,
            blockHeight: txData.blockHeight,
            commitment: commitment,
            timestamp: txData.timestamp,
            confirmations: await getConfirmations(txData.blockHeight)
        };
        
        console.log(`✅ Proof package generated for ${txHash}`);
        res.json(proofPackage);
        
    } catch (error) {
        console.error(`❌ Error generating proof: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get Fuego chain status
 * GET /api/status
 */
app.get('/api/status', async (req, res) => {
    try {
        const status = await getFuegoChainStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// FUEGO CHAIN INTERACTION FUNCTIONS
// =====================================================

/**
 * Get transaction data from Fuego chain
 */
async function getFuegoTransaction(txHash) {
    try {
        // Call Fuego RPC to get transaction
        const response = await axios.post(FUEGO_RPC_URL + '/json_rpc', {
            jsonrpc: '2.0',
            id: '0',
            method: 'get_transactions',
            params: {
                txs_hashes: [txHash],
                decode_as_json: true
            }
        });
        
        if (!response.data.result || !response.data.result.txs[0]) {
            return null;
        }
        
        const tx = response.data.result.txs[0];
        
        return {
            hash: txHash,
            rawTxData: tx.as_hex,
            amount: parseTransactionAmount(tx.as_json),
            blockHeight: tx.block_height,
            timestamp: tx.block_timestamp,
            confirmations: tx.confirmations
        };
        
    } catch (error) {
        console.error(`Error fetching transaction ${txHash}:`, error.message);
        return null;
    }
}

/**
 * Get block data from Fuego chain
 */
async function getFuegoBlock(blockHeight) {
    try {
        const response = await axios.post(FUEGO_RPC_URL + '/json_rpc', {
            jsonrpc: '2.0',
            id: '0',
            method: 'get_block',
            params: {
                height: blockHeight
            }
        });
        
        if (!response.data.result) {
            return null;
        }
        
        const block = response.data.result.block_header;
        
        return {
            height: blockHeight,
            header: block.hash,
            timestamp: block.timestamp,
            transactions: response.data.result.tx_hashes || []
        };
        
    } catch (error) {
        console.error(`Error fetching block ${blockHeight}:`, error.message);
        return null;
    }
}

/**
 * Generate Merkle proof for transaction inclusion
 */
function generateMerkleProof(txHash, transactions) {
    // Find transaction index
    const txIndex = transactions.indexOf(txHash);
    if (txIndex === -1) {
        throw new Error('Transaction not found in block');
    }
    
    // Generate Merkle tree and proof
    const merkleTree = buildMerkleTree(transactions);
    const proof = getMerkleProof(merkleTree, txIndex);
    
    return proof;
}

/**
 * Build Merkle tree from transaction list
 */
function buildMerkleTree(transactions) {
    if (transactions.length === 0) return [];
    
    let currentLevel = [...transactions];
    const tree = [currentLevel];
    
    while (currentLevel.length > 1) {
        const nextLevel = [];
        
        for (let i = 0; i < currentLevel.length; i += 2) {
            const left = currentLevel[i];
            const right = currentLevel[i + 1] || left; // Duplicate if odd
            
            const combined = left + right;
            const hash = require('crypto').createHash('sha256').update(combined, 'hex').digest('hex');
            nextLevel.push(hash);
        }
        
        currentLevel = nextLevel;
        tree.push(currentLevel);
    }
    
    return tree;
}

/**
 * Get Merkle proof path for transaction
 */
function getMerkleProof(tree, txIndex) {
    const proof = [];
    let currentIndex = txIndex;
    
    for (let level = 0; level < tree.length - 1; level++) {
        const currentLevel = tree[level];
        const isRightNode = currentIndex % 2 === 1;
        
        if (isRightNode) {
            proof.push(currentLevel[currentIndex - 1]);
        } else {
            const rightSibling = currentLevel[currentIndex + 1];
            if (rightSibling) {
                proof.push(rightSibling);
            }
        }
        
        currentIndex = Math.floor(currentIndex / 2);
    }
    
    return proof.map(hash => '0x' + hash);
}

/**
 * Extract commitment from transaction tx_extra field
 */
function extractCommitmentFromTxExtra(rawTxData) {
    try {
        // Parse CryptoNote transaction structure
        const txBuffer = Buffer.from(rawTxData, 'hex');
        
        // Find tx_extra field (simplified parsing)
        const extraOffset = findTxExtraOffset(txBuffer);
        if (extraOffset === -1) {
            throw new Error('tx_extra field not found');
        }
        
        // Look for commitment tag (0xFF)
        for (let i = extraOffset; i < txBuffer.length - 32; i++) {
            if (txBuffer[i] === 0xFF) {
                // Found commitment tag, extract next 32 bytes
                const commitment = txBuffer.slice(i + 1, i + 33);
                return '0x' + commitment.toString('hex');
            }
        }
        
        throw new Error('Commitment not found in tx_extra');
        
    } catch (error) {
        console.error('Error extracting commitment:', error.message);
        return null;
    }
}

/**
 * Find tx_extra offset in transaction data
 */
function findTxExtraOffset(txBuffer) {
    // Simplified CryptoNote transaction parsing
    let offset = 0;
    
    // Skip version (varint)
    offset += readVarint(txBuffer, offset).length;
    
    // Skip unlock_time (varint)  
    offset += readVarint(txBuffer, offset).length;
    
    // Skip inputs
    const inputCount = readVarint(txBuffer, offset);
    offset += inputCount.length;
    offset += inputCount.value * 68; // Approximate input size
    
    // Skip outputs
    const outputCount = readVarint(txBuffer, offset);
    offset += outputCount.length;
    offset += outputCount.value * 40; // Approximate output size
    
    return offset < txBuffer.length ? offset : -1;
}

/**
 * Read varint from buffer
 */
function readVarint(buffer, offset) {
    let value = 0;
    let length = 0;
    let byte;
    
    do {
        if (offset + length >= buffer.length) break;
        byte = buffer[offset + length];
        value |= (byte & 0x7F) << (length * 7);
        length++;
    } while (byte & 0x80);
    
    return { value, length };
}

/**
 * Parse transaction amount from JSON
 */
function parseTransactionAmount(txJson) {
    try {
        const tx = JSON.parse(txJson);
        let totalAmount = 0;
        
        if (tx.vout) {
            for (const output of tx.vout) {
                totalAmount += output.amount || 0;
            }
        }
        
        return totalAmount;
        
    } catch (error) {
        console.error('Error parsing transaction amount:', error.message);
        return 0;
    }
}

/**
 * Get Fuego chain status
 */
async function getFuegoChainStatus() {
    try {
        const response = await axios.post(FUEGO_RPC_URL + '/json_rpc', {
            jsonrpc: '2.0',
            id: '0',
            method: 'get_info'
        });
        
        return {
            height: response.data.result.height,
            difficulty: response.data.result.difficulty,
            networkType: response.data.result.nettype,
            version: response.data.result.version,
            status: 'online'
        };
        
    } catch (error) {
        return {
            status: 'offline',
            error: error.message
        };
    }
}

/**
 * Get confirmation count for block
 */
async function getConfirmations(blockHeight) {
    try {
        const status = await getFuegoChainStatus();
        return Math.max(0, status.height - blockHeight);
    } catch (error) {
        return 0;
    }
}

// Start the API server
app.listen(API_PORT, () => {
    console.log(`🔥 Fuego API Service running on port ${API_PORT}`);
    console.log(`📡 Connected to Fuego RPC: ${FUEGO_RPC_URL}`);
    console.log(`🔗 API endpoints:`);
    console.log(`   GET  /api/proof/:txHash - Get transaction proof`);
    console.log(`   GET  /api/status - Chain status`);
});

module.exports = app; 
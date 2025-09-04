#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class FuegoIndexBuilder {
    constructor() {
        this.indexDir = 'docs/fuego_index';
        this.codeChunksDir = path.join(this.indexDir, 'code_chunks');
        this.summariesDir = path.join(this.indexDir, 'summaries');
        this.masterIndex = {
            generated: new Date().toISOString(),
            total_files: 0,
            total_chunks: 0,
            priority_files: [],
            file_hashes: {},
            categories: {},
            memory_optimized: true
        };
        
        // Configuration - hardcoded for simplicity
        this.config = {
            max_file_size_kb: 500,
            chunk_size_lines: 100,
            priority_files: [
                "cryptonote/src/CryptoNoteConfig.h",
                "cryptonote/include/CryptoNote.h", 
                "cryptonote/src/CryptoNoteCore/CryptoNoteBasic.h",
                "cryptonote/src/CryptoNoteCore/TransactionExtra.h",
                "cryptonote/src/crypto/crypto.h"
            ],
            exclude_patterns: [
                "*.o", "*.so", "*.dll", "*.exe", "*.bin", "*.dat", "*.log", "*.tmp",
                "*Test*", "*test*", "*/build/*", "*/target/*", "*/node_modules/*"
            ]
        };
    }

    initDirectories() {
        console.log('📁 Initializing index directories...');
        [this.indexDir, this.codeChunksDir, this.summariesDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    isExcluded(filePath) {
        return this.config.exclude_patterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(filePath);
        });
    }

    getFileHash(content) {
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    }

    extractCodeFeatures(content, filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const features = {
            functions: [],
            structs: [],
            classes: [],
            includes: [],
            defines: [],
            key_concepts: []
        };

        const lines = content.split('\n');

        // Extract C/C++ features
        if (['.h', '.hpp', '.c', '.cpp'].includes(ext)) {
            for (const line of lines) {
                const trimmed = line.trim();
                
                // Functions
                if (trimmed.match(/^\s*\w+[\s\*]+\w+\s*\([^)]*\)\s*[{;]/)) {
                    const match = trimmed.match(/(\w+)\s*\(/);
                    if (match && !['if', 'while', 'for', 'switch'].includes(match[1])) {
                        features.functions.push(match[1]);
                    }
                }

                // Structs/Classes
                if (trimmed.match(/^(struct|class)\s+(\w+)/)) {
                    const match = trimmed.match(/^(struct|class)\s+(\w+)/);
                    if (match) {
                        features[match[1] === 'struct' ? 'structs' : 'classes'].push(match[2]);
                    }
                }

                // Includes
                if (trimmed.startsWith('#include')) {
                    const match = trimmed.match(/#include\s*[<"](.*)[>"]/);
                    if (match) {
                        features.includes.push(match[1]);
                    }
                }

                // Defines
                if (trimmed.startsWith('#define')) {
                    const match = trimmed.match(/#define\s+(\w+)/);
                    if (match) {
                        features.defines.push(match[1]);
                    }
                }
            }
        }

        // Extract key concepts
        const content_lower = content.toLowerCase();
        const concepts = {
            'transaction': /transaction|tx/,
            'blockchain': /block|chain/,
            'cryptography': /crypto|hash|signature|key/,
            'network': /network|p2p|peer/,
            'wallet': /wallet|address|balance/,
            'mining': /mine|proof|difficulty/,
            'serialization': /serialize|deserialize/,
            'verification': /verify|validate|check/
        };

        for (const [concept, pattern] of Object.entries(concepts)) {
            if (pattern.test(content_lower)) {
                features.key_concepts.push(concept);
            }
        }

        return features;
    }

    processFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️  File not found: ${filePath}`);
                return;
            }

            const stats = fs.statSync(filePath);
            const maxSize = this.config.max_file_size_kb * 1024;
            
            if (stats.size > maxSize) {
                console.warn(`⚠️  Skipping large file: ${filePath} (${Math.round(stats.size/1024)}KB)`);
                return;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const hash = this.getFileHash(content);
            const features = this.extractCodeFeatures(content, filePath);
            
            const summary = {
                file: filePath,
                chunk: 'full',
                hash: hash,
                size: content.length,
                lines: content.split('\n').length,
                priority: this.config.priority_files.includes(filePath),
                description: this.generateDescription(filePath, features),
                ...features,
                timestamp: new Date().toISOString()
            };

            // Save code chunk
            const codeChunkPath = path.join(this.codeChunksDir, `${hash}.code`);
            fs.writeFileSync(codeChunkPath, content);

            // Save summary
            const summaryPath = path.join(this.summariesDir, `${hash}.json`);
            fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

            // Update master index
            this.masterIndex.file_hashes[filePath] = hash;
            this.updateCategories(features);
            
            if (summary.priority) {
                this.masterIndex.priority_files.push(hash);
            }

            this.masterIndex.total_files++;
            this.masterIndex.total_chunks++;

        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error.message);
        }
    }

    updateCategories(features) {
        for (const [category, items] of Object.entries(features)) {
            if (!this.masterIndex.categories[category]) {
                this.masterIndex.categories[category] = new Set();
            }
            
            if (Array.isArray(items)) {
                items.forEach(item => this.masterIndex.categories[category].add(item));
            }
        }
    }

    generateDescription(filePath, features) {
        const filename = path.basename(filePath);
        let desc = filename;

        if (features.functions?.length > 0) {
            desc += ` - Contains ${features.functions.length} function(s)`;
        }
        
        if (features.structs?.length > 0) {
            desc += ` - Defines ${features.structs.length} struct(s)`;
        }

        // Add domain context
        if (filePath.includes('crypto')) {
            desc += ' - Cryptographic operations';
        } else if (filePath.includes('Core')) {
            desc += ' - Core blockchain logic';
        } else if (filePath.includes('Wallet')) {
            desc += ' - Wallet functionality';
        }

        return desc;
    }

    collectSourceFiles() {
        const files = new Set();
        
        // Add priority files first
        this.config.priority_files.forEach(file => {
            if (fs.existsSync(file)) {
                files.add(file);
            }
        });

        // Walk important directories - updated with actual paths
        const dirs = [
            'cryptonote/src',
            'cryptonote/include'
        ];

        dirs.forEach(dir => {
            if (fs.existsSync(dir)) {
                this.walkDirectory(dir, files);
            }
        });

        return Array.from(files);
    }

    walkDirectory(dir, files) {
        try {
            const entries = fs.readdirSync(dir);
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry);
                
                if (this.isExcluded(fullPath)) {
                    continue;
                }
                
                const stats = fs.statSync(fullPath);
                if (stats.isDirectory()) {
                    this.walkDirectory(fullPath, files);
                } else if (this.isSourceFile(fullPath)) {
                    files.add(fullPath);
                }
            }
        } catch (error) {
            console.warn(`⚠️  Cannot read directory: ${dir}`);
        }
    }

    isSourceFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return ['.h', '.hpp', '.c', '.cpp', '.js', '.ts', '.md'].includes(ext);
    }

    saveMasterIndex() {
        // Convert Sets to Arrays for JSON serialization
        const serializable = { ...this.masterIndex };
        serializable.categories = {};
        
        for (const [category, items] of Object.entries(this.masterIndex.categories)) {
            serializable.categories[category] = Array.from(items);
        }

        const masterPath = path.join(this.indexDir, 'master_index.json');
        fs.writeFileSync(masterPath, JSON.stringify(serializable, null, 2));
        
        console.log(`✅ Master index saved: ${masterPath}`);
    }

    generateMemoryOptimizedSummary() {
        const summary = {
            metadata: {
                generated: this.masterIndex.generated,
                total_files: this.masterIndex.total_files,
                total_chunks: this.masterIndex.total_chunks,
                memory_optimized: true
            },
            priority_concepts: {},
            category_distribution: {},
            core_functions: [],
            ai_context_summary: this.generateAIContextSummary()
        };

        // Analyze priority files
        for (const hash of this.masterIndex.priority_files.slice(0, 10)) {
            try {
                const summaryPath = path.join(this.summariesDir, `${hash}.json`);
                if (fs.existsSync(summaryPath)) {
                    const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
                    summary.priority_concepts[data.file] = {
                        functions: data.functions?.slice(0, 5) || [],
                        key_concepts: data.key_concepts?.slice(0, 3) || [],
                        description: data.description
                    };
                }
            } catch (error) {
                console.warn(`⚠️  Error reading summary for ${hash}`);
            }
        }

        // Category distribution
        for (const [category, items] of Object.entries(this.masterIndex.categories)) {
            summary.category_distribution[category] = Array.from(items).length;
        }

        const summaryPath = path.join(this.indexDir, 'memory_optimized_summary.json');
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        
        console.log(`✅ Memory-optimized summary saved: ${summaryPath}`);
        return summary;
    }

    generateAIContextSummary() {
        return {
            fuego_architecture: {
                blockchain_core: "CryptoNote-based privacy coin with ring signatures and stealth addresses",
                consensus: "Proof-of-Work with dynamic difficulty adjustment",
                privacy_features: "Ring signatures, stealth addresses, unlinkable transactions",
                transaction_structure: "Input/output model with key images for double-spend prevention"
            },
            key_data_structures: {
                block: "Contains transaction hashes, previous block hash, merkle tree root",
                transaction: "Inputs, outputs, signatures, extra data field for commitments",
                key_image: "Prevents double-spending by linking spent outputs",
                stealth_address: "One-time addresses for privacy protection"
            },
            core_algorithms: {
                ring_signatures: "Sign transactions without revealing which input is real",
                stealth_addresses: "Generate unique addresses for each transaction",
                key_derivation: "Derive keys from master key and transaction data",
                hash_functions: "Keccak, Blake2b for various cryptographic operations"
            },
            bridge_integration: {
                xfg_to_heat: "Burn XFG on Fuego → Mint HEAT on Arbitrum L2/L3",
                tx_extra_proofs: "Use transaction extra field for commitment storage",
                oracle_verification: "Verify Fuego transactions on external chains",
                privacy_preservation: "Maintain anonymity across chain boundaries"
            }
        };
    }

    generateAIConstantMemoryContext() {
        console.log('🧠 Generating AI Constant Memory Context...');
        
        const context = {
            fuego_source_memory_context: {
                last_updated: new Date().toISOString(),
                version: "1.0.0",
                purpose: "Constant memory context for AI understanding of Fuego blockchain source code",
                
                core_concepts: {
                    blockchain_basics: {
                        architecture: "CryptoNote-based privacy blockchain",
                        consensus: "Proof-of-Work with ASIC resistance",
                        privacy: "Ring signatures + stealth addresses",
                        supply: "Fixed max supply of ~8M XFG tokens"
                    },
                    
                    transaction_system: {
                        structure: "UTXO-based with ring signatures",
                        inputs: "Reference previous outputs + key images",
                        outputs: "One-time keys derived from stealth addresses", 
                        extra_field: "Used for commitments and additional data",
                        verification: "Ring signature verification + key image uniqueness"
                    },
                    
                    cryptographic_primitives: {
                        hash_functions: ["Keccak", "Blake2b", "SHA-3"],
                        signature_schemes: ["Ring signatures", "Ed25519"],
                        key_derivation: "ECDH-based stealth address generation",
                        proof_systems: "Range proofs for amount hiding"
                    },
                    
                    privacy_mechanisms: {
                        ring_signatures: "Hide real input among decoy inputs",
                        stealth_addresses: "Unlinkable one-time addresses",
                        amount_hiding: "Pedersen commitments for amounts",
                        metadata_protection: "Extra field encryption"
                    }
                },
                
                key_file_locations: {
                    core_blockchain: "cryptonote/src/CryptoNoteCore/",
                    cryptography: "cryptonote/src/crypto/",
                    wallet_logic: "cryptonote/src/Wallet/",
                    network_protocol: "cryptonote/src/P2p/",
                    rpc_interface: "cryptonote/src/Rpc/",
                    serialization: "cryptonote/src/Serialization/"
                },
                
                critical_data_structures: {
                    Block: {
                        file: "CryptoNoteBasic.h",
                        purpose: "Container for transactions and metadata",
                        fields: ["previous_hash", "merkle_root", "timestamp", "nonce"]
                    },
                    Transaction: {
                        file: "CryptoNoteBasic.h", 
                        purpose: "Value transfer with privacy",
                        fields: ["inputs", "outputs", "signatures", "extra"]
                    },
                    TransactionInput: {
                        file: "CryptoNoteBasic.h",
                        purpose: "Reference to previous output",
                        fields: ["amount", "key_offsets", "key_image"]
                    },
                    TransactionOutput: {
                        file: "CryptoNoteBasic.h",
                        purpose: "Destination for value transfer",
                        fields: ["amount", "target_key"]
                    },
                    TransactionExtra: {
                        file: "TransactionExtra.h",
                        purpose: "Additional transaction data",
                        usage: "Store commitments, encrypted payloads"
                    }
                },
                
                bridge_mechanisms: {
                    xfg_to_heat_bridge: {
                        burn_process: "Create transaction with null/burn outputs",
                        commitment_storage: "Store commitment in tx_extra field",
                        proof_generation: "Generate cryptographic proof of burn",
                        verification: "Oracle verifies on destination chain"
                    },
                    
                    privacy_preservation: {
                        one_time_addresses: "Each HEAT mint uses fresh address",
                        commitment_schemes: "Hide burned amount until reveal",
                        nullifier_system: "Prevent double-spending across chains",
                        stealth_integration: "Maintain Fuego privacy properties"
                    }
                },
                
                memory_optimization_notes: {
                    efficient_lookups: "Use hash maps for transaction/block lookup",
                    lazy_loading: "Load transaction details only when needed",
                    caching_strategy: "Cache frequently accessed blocks/transactions",
                    index_structures: "Separate indices for different query patterns"
                }
            }
        };
        
        const contextPath = path.join(this.indexDir, 'ai_constant_memory_context.json');
        fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
        
        console.log(`✅ AI Constant Memory Context saved: ${contextPath}`);
        return context;
    }

    build() {
        console.log('🔨 Building Fuego Source Code Index...\n');
        
        this.initDirectories();
        
        console.log('📂 Collecting source files...');
        const files = this.collectSourceFiles();
        console.log(`   Found ${files.length} files to process\n`);
        
        console.log('⚡ Processing files...');
        let processed = 0;
        
        for (const file of files) {
            this.processFile(file);
            processed++;
            
            if (processed % 10 === 0) {
                console.log(`   📄 Processed ${processed}/${files.length} files`);
            }
        }
        
        console.log('\n💾 Saving master index...');
        this.saveMasterIndex();
        
        console.log('🧠 Generating memory-optimized summary...');
        const summary = this.generateMemoryOptimizedSummary();
        
        console.log('🤖 Generating AI constant memory context...');
        const aiContext = this.generateAIConstantMemoryContext();
        
        console.log('\n🎉 Index build complete!');
        console.log('─'.repeat(60));
        console.log(`📊 Statistics:`);
        console.log(`   📁 Files processed: ${this.masterIndex.total_files}`);
        console.log(`   📄 Code chunks: ${this.masterIndex.total_chunks}`);
        console.log(`   ⭐ Priority files: ${this.masterIndex.priority_files.length}`);
        console.log(`   🎯 Categories: ${Object.keys(this.masterIndex.categories).length}`);
        console.log(`   📂 Index location: ${this.indexDir}`);
        console.log(`   🧠 AI Context: ai_constant_memory_context.json`);
        console.log('─'.repeat(60));
        console.log('\nUsage:');
        console.log('  npm run fuego:search "query"     - Search the index');
        console.log('  npm run fuego:stats              - Show statistics');
        
        return { summary, aiContext };
    }
}

// CLI execution
if (require.main === module) {
    const builder = new FuegoIndexBuilder();
    builder.build();
}

module.exports = FuegoIndexBuilder; 
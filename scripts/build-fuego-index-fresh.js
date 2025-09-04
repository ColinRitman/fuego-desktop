#!/usr/bin/env node

/**
 * Fuego Fresh Indexing System
 * Analyzes the ACTUAL Fuego source code without assumptions
 * Based on real analysis of https://github.com/usexfg/fuego
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FUEGO_FRESH_PATH = path.join(__dirname, '..', 'fuego-fresh');
const INDEX_OUTPUT_PATH = path.join(__dirname, '..', 'docs', 'fuego_index_fresh');

// Ensure directories exist
if (!fs.existsSync(INDEX_OUTPUT_PATH)) {
    fs.mkdirSync(INDEX_OUTPUT_PATH, { recursive: true });
}

// Actual findings from source analysis - NO ASSUMPTIONS
const FUEGO_FACTS = {
    // From CryptoNoteConfig.h analysis
    MAX_SUPPLY: 80000088000008, // Raw units
    DECIMAL_PLACES: 7,
    COIN_UNIT: 10000000, // 10^7
    ACTUAL_MAX_SUPPLY_XFG: 8000008.8000008, // 80000088000008 / 10000000
    
    // From crypto directory analysis  
    HASH_FUNCTIONS: [
        'keccak',
        'blake256', // NOT blake2b
        'skein',
        'groestl', 
        'chacha8',
        'jh'
    ],
    
    // Network info
    P2P_PORT: 10808,
    RPC_PORT: 18180,
    
    // Block timing
    BLOCK_TARGET: 480, // seconds
    
    // Address prefix from config
    ADDRESS_PREFIX: 1753191 // "fire" address prefix
};

class FuegoFreshIndexer {
    constructor() {
        this.index = {
            metadata: {
                indexedAt: new Date().toISOString(),
                sourceRepository: 'https://github.com/usexfg/fuego',
                indexVersion: '2.0.0-fresh',
                totalFiles: 0,
                facts: FUEGO_FACTS
            },
            files: {},
            functions: {},
            constants: {}
        };
    }

    async buildIndex() {
        console.log('🔥 Building fresh Fuego index from actual source...');
        
        if (!fs.existsSync(FUEGO_FRESH_PATH)) {
            throw new Error('Fuego fresh repository not found. Please run: git clone https://github.com/usexfg/fuego.git fuego-fresh');
        }

        // Index source files
        await this.indexDirectory(path.join(FUEGO_FRESH_PATH, 'src'));
        
        // Analyze key configuration files
        await this.analyzeConfigFiles();
        
        // Analyze crypto implementations
        await this.analyzeCryptoFiles();
        
        // Generate outputs
        await this.generateOutputs();
        
        console.log(`✅ Fresh indexing complete! ${this.index.metadata.totalFiles} files analyzed`);
        console.log(`📁 Output: ${INDEX_OUTPUT_PATH}`);
    }

    async indexDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) return;

        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
                await this.indexDirectory(fullPath);
            } else if (this.isSourceFile(entry.name)) {
                await this.indexFile(fullPath);
            }
        }
    }

    isSourceFile(filename) {
        const extensions = ['.h', '.hpp', '.c', '.cpp', '.cc', '.cxx'];
        return extensions.some(ext => filename.endsWith(ext));
    }

    async indexFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative(FUEGO_FRESH_PATH, filePath);
            
            const fileInfo = {
                path: relativePath,
                size: content.length,
                lines: content.split('\n').length,
                hash: crypto.createHash('sha256').update(content).digest('hex').substring(0, 16),
                functions: this.extractFunctions(content),
                constants: this.extractConstants(content)
            };

            this.index.files[relativePath] = fileInfo;
            this.index.metadata.totalFiles++;
            
            // Add functions to global function index
            fileInfo.functions.forEach(func => {
                if (!this.index.functions[func.name]) {
                    this.index.functions[func.name] = [];
                }
                this.index.functions[func.name].push({
                    file: relativePath,
                    line: func.line,
                    signature: func.signature
                });
            });
            
            // Add constants to global constant index
            fileInfo.constants.forEach(constant => {
                if (!this.index.constants[constant.name]) {
                    this.index.constants[constant.name] = [];
                }
                this.index.constants[constant.name].push({
                    file: relativePath,
                    line: constant.line,
                    value: constant.value
                });
            });
            
        } catch (error) {
            console.warn(`⚠️  Could not index ${filePath}: ${error.message}`);
        }
    }

    extractFunctions(content) {
        const functions = [];
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Match function definitions (simplified)
            const funcMatch = line.match(/^(?:static\s+)?(?:inline\s+)?(?:extern\s+)?(?:\w+\s+)+(\w+)\s*\([^)]*\)\s*[{;]/);
            if (funcMatch) {
                functions.push({
                    name: funcMatch[1],
                    line: i + 1,
                    signature: line
                });
            }
        }
        
        return functions;
    }

    extractConstants(content) {
        const constants = [];
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Match #define constants
            const defineMatch = line.match(/^#define\s+(\w+)\s+(.+)$/);
            if (defineMatch) {
                constants.push({
                    name: defineMatch[1],
                    line: i + 1,
                    value: defineMatch[2]
                });
            }
            
            // Match const declarations
            const constMatch = line.match(/^(?:static\s+)?const\s+\w+\s+(\w+)\s*=\s*([^;]+);/);
            if (constMatch) {
                constants.push({
                    name: constMatch[1],
                    line: i + 1,
                    value: constMatch[2]
                });
            }
        }
        
        return constants;
    }

    async analyzeConfigFiles() {
        console.log('📋 Analyzing configuration files...');
        
        const configFile = path.join(FUEGO_FRESH_PATH, 'src', 'CryptoNoteConfig.h');
        if (fs.existsSync(configFile)) {
            const content = fs.readFileSync(configFile, 'utf8');
            
            // Extract key constants from actual source
            const moneySupplyMatch = content.match(/MONEY_SUPPLY\s*=\s*UINT64_C\((\d+)\)/);
            const coinMatch = content.match(/COIN\s*=\s*UINT64_C\((\d+)\)/);
            const decimalMatch = content.match(/CRYPTONOTE_DISPLAY_DECIMAL_POINT\s*=\s*(\d+)/);
            
            if (moneySupplyMatch) FUEGO_FACTS.MAX_SUPPLY = parseInt(moneySupplyMatch[1]);
            if (coinMatch) FUEGO_FACTS.COIN_UNIT = parseInt(coinMatch[1]);
            if (decimalMatch) FUEGO_FACTS.DECIMAL_PLACES = parseInt(decimalMatch[1]);
            
            // Recalculate actual supply
            FUEGO_FACTS.ACTUAL_MAX_SUPPLY_XFG = FUEGO_FACTS.MAX_SUPPLY / FUEGO_FACTS.COIN_UNIT;
        }
    }

    async analyzeCryptoFiles() {
        console.log('🔐 Analyzing cryptographic implementations...');
        
        const cryptoDir = path.join(FUEGO_FRESH_PATH, 'src', 'crypto');
        if (!fs.existsSync(cryptoDir)) return;

        const cryptoFiles = fs.readdirSync(cryptoDir);
        const detectedHashes = [];

        cryptoFiles.forEach(file => {
            const name = file.replace(/\.(c|h|cpp|hpp)$/, '');
            if (['keccak', 'blake256', 'skein', 'groestl', 'chacha8', 'jh'].includes(name)) {
                detectedHashes.push(name);
            }
        });

        FUEGO_FACTS.HASH_FUNCTIONS = detectedHashes;
    }

    async generateOutputs() {
        console.log('📝 Generating output files...');

        // Main index file
        fs.writeFileSync(
            path.join(INDEX_OUTPUT_PATH, 'fuego_fresh_index.json'),
            JSON.stringify(this.index, null, 2)
        );

        // Optimized AI context
        const aiContext = {
            fuego: {
                facts: FUEGO_FACTS,
                architecture: 'CryptoNote-based privacy-focused blockchain',
                totalSupply: `${FUEGO_FACTS.ACTUAL_MAX_SUPPLY_XFG} XFG (${FUEGO_FACTS.MAX_SUPPLY} raw units)`,
                decimals: FUEGO_FACTS.DECIMAL_PLACES,
                hashFunctions: FUEGO_FACTS.HASH_FUNCTIONS,
                network: {
                    p2pPort: FUEGO_FACTS.P2P_PORT,
                    rpcPort: FUEGO_FACTS.RPC_PORT,
                    blockTime: `${FUEGO_FACTS.BLOCK_TARGET} seconds`
                },
                totalFiles: this.index.metadata.totalFiles
            }
        };

        fs.writeFileSync(
            path.join(INDEX_OUTPUT_PATH, 'ai_context_fresh.json'),
            JSON.stringify(aiContext, null, 2)
        );

        console.log('✅ Output files generated:');
        console.log(`   - fuego_fresh_index.json (main index)`);
        console.log(`   - ai_context_fresh.json (AI optimized)`);
    }
}

// CLI interface
if (require.main === module) {
    const indexer = new FuegoFreshIndexer();
    indexer.buildIndex().catch(console.error);
}

module.exports = FuegoFreshIndexer; 
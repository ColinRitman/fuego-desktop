#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '..', 'docs', 'fuego_index_fresh', 'fuego_fresh_index.json');
const AI_CONTEXT_PATH = path.join(__dirname, '..', 'docs', 'fuego_index_fresh', 'ai_context_fresh.json');

function loadIndex() {
    if (!fs.existsSync(INDEX_PATH)) {
        console.error('❌ Fresh index not found. Run: npm run fuego:fresh-index');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
}

function loadAIContext() {
    if (!fs.existsSync(AI_CONTEXT_PATH)) {
        console.error('❌ Fresh AI context not found. Run: npm run fuego:fresh-index');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(AI_CONTEXT_PATH, 'utf8'));
}

function searchFunctions(query) {
    const index = loadIndex();
    const results = Object.entries(index.functions)
        .filter(([name]) => name.toLowerCase().includes(query.toLowerCase()))
        .map(([name, occurrences]) => ({
            function: name,
            files: occurrences.length,
            locations: occurrences.slice(0, 3) // Show first 3 locations
        }));
    
    console.log(`🔍 Found ${results.length} functions matching "${query}":`);
    results.slice(0, 10).forEach(result => {
        console.log(`\n📋 ${result.function} (${result.files} occurrences)`);
        result.locations.forEach(loc => {
            console.log(`   📁 ${loc.file}:${loc.line}`);
        });
    });
}

function searchConstants(query) {
    const index = loadIndex();
    const results = Object.entries(index.constants)
        .filter(([name]) => name.toLowerCase().includes(query.toLowerCase()))
        .map(([name, occurrences]) => ({
            constant: name,
            files: occurrences.length,
            locations: occurrences.slice(0, 3)
        }));
    
    console.log(`🔍 Found ${results.length} constants matching "${query}":`);
    results.slice(0, 10).forEach(result => {
        console.log(`\n📋 ${result.constant} (${result.files} occurrences)`);
        result.locations.forEach(loc => {
            console.log(`   📁 ${loc.file}:${loc.line} = ${loc.value}`);
        });
    });
}

function showFacts() {
    const context = loadAIContext();
    console.log('🔥 Fuego Facts (from actual source analysis):');
    console.log(JSON.stringify(context.fuego.facts, null, 2));
}

function showStats() {
    const index = loadIndex();
    const context = loadAIContext();
    
    console.log('📊 Fresh Fuego Index Statistics:');
    console.log(`   📁 Total files indexed: ${index.metadata.totalFiles}`);
    console.log(`   🔧 Total functions: ${Object.keys(index.functions).length}`);
    console.log(`   📋 Total constants: ${Object.keys(index.constants).length}`);
    console.log(`   🔐 Hash functions: ${context.fuego.facts.HASH_FUNCTIONS.filter((v, i, a) => a.indexOf(v) === i).join(', ')}`);
    console.log(`   💰 Max supply: ${context.fuego.facts.ACTUAL_MAX_SUPPLY_XFG} XFG`);
    console.log(`   🌐 Network ports: P2P=${context.fuego.facts.P2P_PORT}, RPC=${context.fuego.facts.RPC_PORT}`);
    console.log(`   ⏰ Block time: ${context.fuego.facts.BLOCK_TARGET} seconds`);
}

function showCrypto() {
    const index = loadIndex();
    console.log('🔐 Cryptographic Functions Found:');
    
    const cryptoFunctions = [
        'cn_slow_hash', 'cn_fast_hash', 'keccak', 'blake256', 'skein', 'groestl', 'chacha8', 'jh',
        'generate_ring_signature', 'check_ring_signature', 'generate_key_image', 'hash_to_scalar'
    ];
    
    cryptoFunctions.forEach(func => {
        if (index.functions[func]) {
            console.log(`   ✅ ${func} (${index.functions[func].length} occurrences)`);
        } else {
            console.log(`   ❌ ${func} (not found)`);
        }
    });
}

// CLI interface
const command = process.argv[2];
const query = process.argv[3];

switch (command) {
    case 'search':
        if (!query) {
            console.error('Usage: npm run fuego:fresh-search search <query>');
            process.exit(1);
        }
        searchFunctions(query);
        break;
        
    case 'constants':
        if (!query) {
            console.error('Usage: npm run fuego:fresh-search constants <query>');
            process.exit(1);
        }
        searchConstants(query);
        break;
        
    case 'facts':
        showFacts();
        break;
        
    case 'stats':
        showStats();
        break;
        
    case 'crypto':
        showCrypto();
        break;
        
    default:
        console.log('🔥 Fuego Fresh Search Commands:');
        console.log('   npm run fuego:fresh-search search <query>     - Search functions');
        console.log('   npm run fuego:fresh-search constants <query>  - Search constants');
        console.log('   npm run fuego:fresh-search facts              - Show Fuego facts');
        console.log('   npm run fuego:fresh-search stats              - Show index stats');
        console.log('   npm run fuego:fresh-search crypto             - Show crypto functions');
        break;
} 
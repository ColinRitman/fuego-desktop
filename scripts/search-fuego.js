#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class FuegoSearch {
    constructor() {
        this.indexDir = 'docs/fuego_index';
        this.masterIndex = null;
    }

    loadIndex() {
        const indexPath = path.join(this.indexDir, 'master_index.json');
        if (!fs.existsSync(indexPath)) {
            console.error('❌ Index not found. Run: node scripts/build-fuego-index.js');
            process.exit(1);
        }
        this.masterIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    }

    search(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        const terms = queryLower.split(/\s+/);

        const summaryDir = path.join(this.indexDir, 'summaries');
        if (!fs.existsSync(summaryDir)) {
            console.error('❌ Summaries directory not found');
            return [];
        }

        const summaryFiles = fs.readdirSync(summaryDir);

        for (const file of summaryFiles) {
            const summaryPath = path.join(summaryDir, file);
            const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
            
            let score = 0;
            const content = JSON.stringify(summary).toLowerCase();
            
            // Score based on term matches
            for (const term of terms) {
                const matches = (content.match(new RegExp(term, 'g')) || []).length;
                score += matches;
                
                // Bonus points for exact matches in key fields
                if (summary.functions && summary.functions.some(f => f.toLowerCase().includes(term))) {
                    score += 5;
                }
                if (summary.structs && summary.structs.some(s => s.toLowerCase().includes(term))) {
                    score += 5;
                }
                if (summary.key_concepts && summary.key_concepts.some(c => c.toLowerCase().includes(term))) {
                    score += 3;
                }
            }

            if (score > 0) {
                results.push({ 
                    ...summary, 
                    score,
                    hash: path.basename(file, '.json')
                });
            }
        }

        // Sort by score and priority
        results.sort((a, b) => {
            if (a.priority && !b.priority) return -1;
            if (!a.priority && b.priority) return 1;
            return b.score - a.score;
        });

        return results.slice(0, 10);
    }

    displayResults(results, query) {
        console.log(`\n🔍 Search results for: "${query}"\n`);
        
        if (results.length === 0) {
            console.log('No results found.');
            return;
        }

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            console.log(`${i + 1}. ${result.file} ${result.chunk}`);
            console.log(`   🎯 Score: ${result.score}${result.priority ? ' (PRIORITY)' : ''}`);
            console.log(`   📝 ${result.description}`);
            
            if (result.functions && result.functions.length > 0) {
                console.log(`   🔧 Functions: ${result.functions.slice(0, 5).join(', ')}`);
            }
            
            if (result.structs && result.structs.length > 0) {
                console.log(`   📊 Structs: ${result.structs.join(', ')}`);
            }
            
            if (result.key_concepts && result.key_concepts.length > 0) {
                console.log(`   💡 Concepts: ${result.key_concepts.join(', ')}`);
            }
            
            console.log(`   📄 View code: node scripts/search-fuego.js show ${result.hash}\n`);
        }
    }

    showFile(hash) {
        const codePath = path.join(this.indexDir, 'code_chunks', `${hash}.code`);
        if (fs.existsSync(codePath)) {
            const content = fs.readFileSync(codePath, 'utf8');
            const summaryPath = path.join(this.indexDir, 'summaries', `${hash}.json`);
            const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
            
            console.log(`\n📄 File: ${summary.file} (${summary.chunk})\n`);
            console.log('─'.repeat(80));
            console.log(content);
            console.log('─'.repeat(80));
        } else {
            console.log('❌ File not found:', hash);
        }
    }

    listCategories() {
        console.log('\n📋 Available search categories:\n');
        console.log('🔧 Functions: search for specific function names');
        console.log('📊 Structures: search for struct/class definitions');
        console.log('🔐 Cryptography: crypto, hash, signature, key');
        console.log('💰 Transactions: transaction, tx, input, output');
        console.log('⛓️  Blockchain: block, chain, validation, consensus');
        console.log('👛 Wallet: wallet, address, balance');
        console.log('⛏️  Mining: mining, proof, difficulty');
        console.log('🌐 Network: p2p, protocol, network');
        console.log('💾 Serialization: serialize, deserialize, format');
        console.log('\nExample searches:');
        console.log('  node scripts/search-fuego.js search "transaction validation"');
        console.log('  node scripts/search-fuego.js search "key image"');
        console.log('  node scripts/search-fuego.js search "block header"');
        console.log('  node scripts/search-fuego.js search "crypto hash"');
    }

    getStats() {
        if (!this.masterIndex) {
            this.loadIndex();
        }

        console.log('\n📊 Fuego Index Statistics:\n');
        console.log(`📁 Total indexed chunks: ${this.masterIndex.total_files}`);
        console.log(`⭐ Priority files: ${this.masterIndex.priority_files.length}`);
        console.log(`🕐 Generated: ${new Date(this.masterIndex.generated).toLocaleString()}`);
        console.log(`📂 Index location: ${this.indexDir}`);
        
        // Count files by extension
        const extensions = {};
        for (const filePath of Object.keys(this.masterIndex.file_hashes)) {
            const ext = path.extname(filePath) || 'no extension';
            extensions[ext] = (extensions[ext] || 0) + 1;
        }

        console.log('\n📋 Files by type:');
        for (const [ext, count] of Object.entries(extensions)) {
            console.log(`   ${ext}: ${count} files`);
        }
    }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

const search = new FuegoSearch();

try {
    if (command === 'search' && args[1]) {
        search.loadIndex();
        const query = args.slice(1).join(' ');
        const results = search.search(query);
        search.displayResults(results, query);
    } else if (command === 'show' && args[1]) {
        search.showFile(args[1]);
    } else if (command === 'stats') {
        search.getStats();
    } else if (command === 'categories') {
        search.listCategories();
    } else {
        console.log('🔍 Fuego Source Code Search\n');
        console.log('Usage:');
        console.log('  node scripts/search-fuego.js search <query>   - Search the index');
        console.log('  node scripts/search-fuego.js show <hash>      - Show specific code chunk');
        console.log('  node scripts/search-fuego.js stats           - Show index statistics');
        console.log('  node scripts/search-fuego.js categories      - List search categories');
        console.log('');
        console.log('Examples:');
        console.log('  node scripts/search-fuego.js search "transaction validation"');
        console.log('  node scripts/search-fuego.js search "key image"');
        console.log('  node scripts/search-fuego.js search "block format"');
        console.log('  node scripts/search-fuego.js show abc123def456');
    }
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
} 
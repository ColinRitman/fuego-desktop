#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs').promises;
const http = require('http');

class TestnetStatusChecker {
    constructor() {
        this.config = {
            coldRpcPort: 26657,
            fuegoRpcPort: 8081,
            privacyApiPort: 3001
        };
    }

    async checkStatus() {
        console.log('🔍 COLD L3 Testnet Status Check\n');
        console.log('=' .repeat(50));
        
        await this.checkProcesses();
        await this.checkPorts();
        await this.checkServices();
        await this.checkAccounts();
        await this.displaySummary();
    }

    async checkProcesses() {
        console.log('\n📊 **Process Status:**');
        
        try {
            const processes = await this.execAsync('ps aux | grep -E "node.*(setup-testnet|start-cold|fuego)" | grep -v grep');
            if (processes.trim()) {
                const lines = processes.split('\n');
                lines.forEach(line => {
                    if (line.includes('setup-testnet')) {
                        console.log('   ✅ Testnet Setup: RUNNING');
                    } else if (line.includes('start-cold')) {
                        console.log('   ✅ COLD L3: RUNNING');
                    } else if (line.includes('FuegoSimulator')) {
                        console.log('   ✅ Fuego Simulator: RUNNING');
                    }
                });
            } else {
                console.log('   ❌ No testnet processes found');
            }
        } catch (error) {
            console.log('   ❌ Error checking processes');
        }
    }

    async checkPorts() {
        console.log('\n🔌 **Port Status:**');
        
        const ports = [
            { port: this.config.fuegoRpcPort, name: 'Fuego RPC' },
            { port: this.config.coldRpcPort, name: 'COLD L3 RPC' },
            { port: this.config.privacyApiPort, name: 'Privacy API' }
        ];

        for (const { port, name } of ports) {
            try {
                const result = await this.execAsync(`lsof -i :${port} 2>/dev/null`);
                if (result.trim()) {
                    console.log(`   ✅ ${name}: Port ${port} OPEN`);
                } else {
                    console.log(`   ❌ ${name}: Port ${port} CLOSED`);
                }
            } catch (error) {
                console.log(`   ❌ ${name}: Port ${port} CLOSED`);
            }
        }
    }

    async checkServices() {
        console.log('\n🌐 **Service Health:**');
        
        // Check Fuego RPC
        try {
            const fuegoResponse = await this.makeRpcCall(this.config.fuegoRpcPort, {
                method: 'getinfo',
                params: []
            });
            
            if (fuegoResponse && fuegoResponse.result) {
                console.log(`   ✅ Fuego RPC: Healthy (Height: ${fuegoResponse.result.height}, Blocks: ${fuegoResponse.result.blocks})`);
            } else {
                console.log('   ❌ Fuego RPC: Unhealthy response');
            }
        } catch (error) {
            console.log('   ❌ Fuego RPC: Not responding');
        }

        // Check COLD L3 RPC
        try {
            const coldResponse = await this.makeRpcCall(this.config.coldRpcPort, {
                method: 'status',
                params: []
            });
            
            if (coldResponse) {
                console.log('   ✅ COLD L3 RPC: Healthy');
            } else {
                console.log('   ❌ COLD L3 RPC: Not responding');
            }
        } catch (error) {
            console.log('   ❌ COLD L3 RPC: Not responding');
        }

        // Check Privacy API
        try {
            const privacyResponse = await this.makeHttpCall(this.config.privacyApiPort, '/health');
            if (privacyResponse) {
                console.log('   ✅ Privacy API: Healthy');
            } else {
                console.log('   ❌ Privacy API: Not responding');
            }
        } catch (error) {
            console.log('   ❌ Privacy API: Not responding');
        }
    }

    async checkAccounts() {
        console.log('\n💰 **Account Status:**');
        
        try {
            const accountsData = await fs.readFile('./testnet-accounts.json', 'utf8');
            const accounts = JSON.parse(accountsData);
            
            console.log(`   📍 Deployer: ${accounts.deployer.address}`);
            console.log(`   📍 Validator: ${accounts.validator.address}`);
            console.log(`   📍 Batch Poster: ${accounts.batchPoster.address}`);
            
            // Check if deployer has been funded
            console.log('\n   💳 **Funding Status:**');
            console.log('   ⚠️  Fund deployer with Arbitrum Sepolia ETH:');
            console.log('   1. Get Sepolia ETH: https://sepoliafaucet.com');
            console.log('   2. Bridge to Arbitrum Sepolia: https://bridge.arbitrum.io');
            console.log(`   3. Send to: ${accounts.deployer.address}`);
            
        } catch (error) {
            console.log('   ❌ No testnet accounts found');
        }
    }

    async displaySummary() {
        console.log('\n' + '=' .repeat(50));
        console.log('📡 **Connection Information:**');
        console.log(`   🔗 COLD L3 RPC: http://localhost:${this.config.coldRpcPort}`);
        console.log(`   🔥 Fuego RPC: http://localhost:${this.config.fuegoRpcPort}`);
        console.log(`   🔒 Privacy API: http://localhost:${this.config.privacyApiPort}`);
        
        console.log('\n🔧 **Next Steps:**');
        console.log('   1. Fund your deployer account with Arbitrum Sepolia ETH');
        console.log('   2. Connect MetaMask to COLD L3 RPC');
        console.log('   3. Import accounts from testnet-accounts.json');
        console.log('   4. Test privacy features!');
        
        console.log('\n📚 **Documentation:**');
        console.log('   🔒 Privacy Guide: ./COLD-PRIVACY-IMPLEMENTATION.md');
        console.log('   🚀 Quick Start: ./COLD-L3-QUICKSTART.md');
        
        console.log('\n🛑 **Commands:**');
        console.log('   📊 Check status: node scripts/testnet-status.js');
        console.log('   🔄 Restart testnet: node scripts/setup-testnet.js');
        console.log('   🛑 Stop testnet: pkill -f "setup-testnet"');
        
        console.log('\n' + '=' .repeat(50));
    }

    async makeRpcCall(port, payload) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(payload);
            
            const options = {
                hostname: 'localhost',
                port: port,
                path: '/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        resolve(data);
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(3000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.write(postData);
            req.end();
        });
    }

    async makeHttpCall(port, path) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: port,
                path: path,
                method: 'GET'
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve(data);
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(3000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    async execAsync(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) reject(error);
                else resolve(stdout.trim());
            });
        });
    }
}

if (require.main === module) {
    const checker = new TestnetStatusChecker();
    checker.checkStatus().catch(console.error);
}

module.exports = TestnetStatusChecker; 
#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 Starting COLD L3 Rollup...");
    
    // 1. Check prerequisites
    console.log("\n🔍 Checking prerequisites...");
    if (!fs.existsSync('rollup/config/genesis.json')) {
        console.log("❌ Genesis file not found. Run: npm run rollup:init");
        process.exit(1);
    }
    
    if (!process.env.DEPLOYER_PRIVATE_KEY && !fs.existsSync('.env')) {
        console.log("❌ Environment not configured. Copy env.example to .env");
        process.exit(1);
    }
    
    console.log("✅ Prerequisites check passed");
    
    // 2. Load configuration
    require('dotenv').config();
    
    const config = {
        chainId: process.env.L3_CHAIN_ID || '31338',
        rpcPort: process.env.L3_RPC_PORT || '26657',
        p2pPort: process.env.L3_P2P_PORT || '26656',
        appPort: process.env.L3_APP_PORT || '26658',
        logLevel: process.env.L3_LOG_LEVEL || 'info'
    };
    
    console.log("\n⚙️  Configuration:");
    console.log("   Chain ID:", config.chainId);
    console.log("   RPC Port:", config.rpcPort);
    console.log("   P2P Port:", config.p2pPort);
    console.log("   App Port:", config.appPort);
    
    // 3. Start application server
    console.log("\n🏁 Starting COLD L3 application...");
    const appServer = startApplicationServer(config);
    
    // Wait a moment for app server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Start Tendermint node
    console.log("\n🔗 Starting Tendermint node...");
    const tendermintNode = startTendermintNode(config);
    
    // 5. Set up signal handlers
    setupSignalHandlers([appServer, tendermintNode]);
    
    // 6. Monitor processes
    monitorProcesses([appServer, tendermintNode]);
    
    console.log("\n✅ COLD L3 Rollup started successfully!");
    console.log("📡 RPC endpoint: http://localhost:" + config.rpcPort);
    console.log("🌐 API endpoint: http://localhost:1317");
    console.log("⛽ Gas token: HEAT");
    console.log("\n🛑 Press Ctrl+C to stop the rollup");
}

function startApplicationServer(config) {
    console.log("   🔄 Starting application server on port", config.appPort);
    
    // Simulate COLD L3 application server
    // In a real implementation, this would be the actual COLD L3 binary
    const appServer = spawn('node', [
        path.join(__dirname, 'cold-l3-app.js'),
        '--port', config.appPort,
        '--chain-id', config.chainId
    ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PORT: config.appPort }
    });
    
    appServer.stdout.on('data', (data) => {
        console.log('📱 APP:', data.toString().trim());
    });
    
    appServer.stderr.on('data', (data) => {
        console.error('❌ APP ERROR:', data.toString().trim());
    });
    
    appServer.on('close', (code) => {
        console.log(`📱 Application server exited with code ${code}`);
    });
    
    return appServer;
}

function startTendermintNode(config) {
    console.log("   ⛓️  Starting Tendermint node...");
    
    // Check if tendermint is available
    const tendermintPath = findTendermint();
    if (!tendermintPath) {
        console.log("⚠️  Tendermint not found, using simulation mode");
        return startSimulatedNode(config);
    }
    
    const tendermint = spawn(tendermintPath, [
        'node',
        '--home', path.resolve('rollup'),
        '--proxy_app', `tcp://127.0.0.1:${config.appPort}`,
        '--rpc.laddr', `tcp://0.0.0.0:${config.rpcPort}`,
        '--p2p.laddr', `tcp://0.0.0.0:${config.p2pPort}`,
        '--log_level', config.logLevel
    ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
    });
    
    tendermint.stdout.on('data', (data) => {
        console.log('⛓️  TM:', data.toString().trim());
    });
    
    tendermint.stderr.on('data', (data) => {
        console.error('❌ TM ERROR:', data.toString().trim());
    });
    
    tendermint.on('close', (code) => {
        console.log(`⛓️  Tendermint node exited with code ${code}`);
    });
    
    return tendermint;
}

function findTendermint() {
    const paths = [
        'tendermint',
        '/usr/local/bin/tendermint',
        '/usr/bin/tendermint',
        path.join(process.env.HOME, 'go/bin/tendermint')
    ];
    
    for (const tmPath of paths) {
        try {
            require('child_process').execSync(`${tmPath} version`, { stdio: 'ignore' });
            return tmPath;
        } catch (error) {
            // Continue to next path
        }
    }
    
    return null;
}

function startSimulatedNode(config) {
    console.log("   🎭 Starting simulated Tendermint node...");
    
    const simulator = spawn('node', [
        path.join(__dirname, 'tendermint-simulator.js'),
        '--rpc-port', config.rpcPort,
        '--chain-id', config.chainId
    ], {
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    simulator.stdout.on('data', (data) => {
        console.log('🎭 SIM:', data.toString().trim());
    });
    
    simulator.stderr.on('data', (data) => {
        console.error('❌ SIM ERROR:', data.toString().trim());
    });
    
    simulator.on('close', (code) => {
        console.log(`🎭 Simulator exited with code ${code}`);
    });
    
    return simulator;
}

function setupSignalHandlers(processes) {
    const cleanup = () => {
        console.log("\n🛑 Shutting down COLD L3 Rollup...");
        
        processes.forEach((process, index) => {
            if (process && !process.killed) {
                console.log(`   🔄 Stopping process ${index + 1}...`);
                process.kill('SIGTERM');
            }
        });
        
        // Force exit after 5 seconds
        setTimeout(() => {
            console.log("🚪 Force exit");
            process.exit(0);
        }, 5000);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGQUIT', cleanup);
}

function monitorProcesses(processes) {
    const checkInterval = setInterval(() => {
        let allRunning = true;
        
        processes.forEach((process, index) => {
            if (process.killed || process.exitCode !== null) {
                console.log(`⚠️  Process ${index + 1} has stopped`);
                allRunning = false;
            }
        });
        
        if (!allRunning) {
            console.log("❌ One or more processes have stopped. Shutting down...");
            clearInterval(checkInterval);
            process.exit(1);
        }
    }, 5000);
    
    // Health check endpoint
    const http = require('http');
    const healthServer = http.createServer((req, res) => {
        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'healthy',
                processes: processes.length,
                timestamp: new Date().toISOString()
            }));
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    });
    
    healthServer.listen(8080, () => {
        console.log("🩺 Health check available at http://localhost:8080/health");
    });
}

// Create necessary supporting files if they don't exist
function createSupportingFiles() {
    // Create COLD L3 application stub
    const appStub = `#!/usr/bin/env node

const net = require('net');
const crypto = require('crypto');

const port = process.argv[process.argv.indexOf('--port') + 1] || 26658;
const chainId = process.argv[process.argv.indexOf('--chain-id') + 1] || 'cold-l3-1';

console.log(\`COLD L3 Application starting on port \${port}\`);
console.log(\`Chain ID: \${chainId}\`);

// Simple ABCI server stub
const server = net.createServer((socket) => {
    console.log('📡 New ABCI connection');
    
    socket.on('data', (data) => {
        // Echo back a simple response
        const response = Buffer.from('OK');
        socket.write(response);
    });
    
    socket.on('end', () => {
        console.log('📡 ABCI connection closed');
    });
});

server.listen(port, '127.0.0.1', () => {
    console.log(\`✅ COLD L3 Application listening on 127.0.0.1:\${port}\`);
});

// Simulate block production
setInterval(() => {
         const blockHeight = Math.floor(Date.now() / 8000); // 8 second blocks
     console.log(\`📦 Block \${blockHeight} produced\`);
 }, 8000);
`;

    const simulatorStub = `#!/usr/bin/env node

const http = require('http');
const crypto = require('crypto');

const rpcPort = process.argv[process.argv.indexOf('--rpc-port') + 1] || 26657;
const chainId = process.argv[process.argv.indexOf('--chain-id') + 1] || 'cold-l3-1';

console.log(\`Tendermint Simulator starting on port \${rpcPort}\`);
console.log(\`Chain ID: \${chainId}\`);

// Simple RPC server
const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.url === '/status') {
        res.end(JSON.stringify({
            result: {
                node_info: {
                    network: chainId,
                    version: '0.34.0-simulated'
                },
                                 sync_info: {
                     latest_block_height: Math.floor(Date.now() / 8000).toString(),
                     latest_block_time: new Date().toISOString()
                 }
            }
        }));
    } else {
        res.end(JSON.stringify({ error: 'Method not implemented in simulator' }));
    }
});

server.listen(rpcPort, () => {
    console.log(\`✅ Tendermint RPC simulator listening on port \${rpcPort}\`);
});

 // Simulate consensus
 setInterval(() => {
     const height = Math.floor(Date.now() / 8000);
     console.log(\`⛓️  Consensus: Block \${height}\`);
 }, 8000);
`;

    if (!fs.existsSync(path.join(__dirname, 'cold-l3-app.js'))) {
        fs.writeFileSync(path.join(__dirname, 'cold-l3-app.js'), appStub);
    }
    
    if (!fs.existsSync(path.join(__dirname, 'tendermint-simulator.js'))) {
        fs.writeFileSync(path.join(__dirname, 'tendermint-simulator.js'), simulatorStub);
    }
}

// Create supporting files
createSupportingFiles();

main()
    .then(() => {
        // Keep the process running
        process.stdin.resume();
    })
    .catch((error) => {
        console.error("❌ Failed to start COLD L3 Rollup:", error);
        process.exit(1);
    }); 
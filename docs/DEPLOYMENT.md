# 🚀 FuegoForecast Deployment Guide

This guide covers deploying the FuegoForecast Terminal DApp to various environments.

## 📋 Prerequisites

### Development Environment
- **Node.js** 16+ and npm/yarn
- **Python** 3.7+ (for local HTTP server)
- **Rust** and Cargo (latest stable)
- **Solana CLI** tools
- **Anchor** framework 0.28+

### Solana Setup
```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Generate keypair (if needed)
solana-keygen new --outfile ~/.config/solana/id.json
```

## 🖥️ Local Development

### 1. Start Local Solana Validator
```bash
solana-test-validator
```

### 2. Configure Solana for Local Development
```bash
solana config set --url localhost
solana config set --keypair ~/.config/solana/id.json
```

### 3. Build and Deploy Program
```bash
cd backend/solana-program
anchor build
anchor deploy
```

### 4. Start Frontend Server
```bash
cd frontend
python3 -m http.server 9009
# Or use npm script: npm run dev
```

### 5. Access the DApp
Open your browser to: `http://localhost:9009/fallout-terminal-ui.html`

## 🌐 Testnet Deployment

### Devnet Deployment
```bash
# Configure for devnet
solana config set --url devnet

# Request airdrop for testing
solana airdrop 2

# Deploy program
cd backend/solana-program
anchor build
anchor deploy --provider.cluster devnet
```

### Testnet Configuration
Update `backend/solana-program/Anchor.toml`:
```toml
[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[programs.devnet]
fuego_forecast = "YOUR_PROGRAM_ID_HERE"
```

## 🏭 Production Deployment

### Mainnet Deployment
```bash
# Configure for mainnet
solana config set --url mainnet-beta

# Deploy program (requires SOL for deployment)
cd backend/solana-program
anchor build
anchor deploy --provider.cluster mainnet-beta
```

### Frontend Hosting Options

#### Option 1: Static Site Hosting (Vercel/Netlify)
```bash
# Build for production
npm run build

# Deploy to Vercel
npx vercel --prod

# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=frontend
```

#### Option 2: IPFS Deployment
```bash
# Install IPFS
npm install -g ipfs

# Add to IPFS
ipfs add -r frontend/
```

#### Option 3: Traditional Web Hosting
Upload the `frontend/` directory to any web server that supports static files.

## 🔧 Configuration

### Environment Variables
Create `.env` file in project root:
```env
# Solana Configuration
SOLANA_NETWORK=devnet
PROGRAM_ID=YOUR_PROGRAM_ID
RPC_URL=https://api.devnet.solana.com

# Oracle Configuration
PYTH_PRICE_FEED_ID=YOUR_PRICE_FEED_ID

# Frontend Configuration
FRONTEND_URL=http://localhost:9009
```

### Program Configuration
Update program constants in `backend/solana-program/src/state.rs`:
```rust
// Adjust these for your deployment
pub const DEFAULT_EPOCH_DURATION: i64 = 8 * 60 * 60; // 8 hours
pub const DEFAULT_FEE_BPS: u16 = 500; // 5%
pub const HIGH_RISK_THRESHOLD: u16 = 7000; // 70%
```

## 🔒 Security Considerations

### Program Security
- **Audit smart contracts** before mainnet deployment
- **Test thoroughly** on devnet with real scenarios
- **Implement circuit breakers** for emergency situations
- **Monitor for unusual activity** patterns

### Frontend Security
- **Use HTTPS** for production deployments
- **Implement CSP headers** to prevent XSS
- **Validate all user inputs** on both frontend and backend
- **Rate limit** API calls to prevent abuse

### Wallet Integration
- **Support multiple wallets** (Phantom, Solflare, etc.)
- **Implement proper error handling** for wallet connections
- **Show clear transaction previews** before signing
- **Handle network switching** gracefully

## 📊 Monitoring and Analytics

### Program Monitoring
```bash
# Monitor program logs
solana logs YOUR_PROGRAM_ID

# Check program account data
solana account YOUR_PROGRAM_ID
```

### Frontend Analytics
- **Google Analytics** for user behavior
- **Custom events** for trading actions
- **Error tracking** with Sentry or similar
- **Performance monitoring** with Web Vitals

## 🔄 Updates and Upgrades

### Program Updates
```bash
# Build new version
anchor build

# Upgrade program (if upgradeable)
anchor upgrade target/deploy/fuego_forecast.so --program-id YOUR_PROGRAM_ID
```

### Frontend Updates
```bash
# Update frontend files
# Redeploy to hosting service
# Clear CDN cache if applicable
```

## 🐛 Troubleshooting

### Common Issues

#### Program Deployment Fails
```bash
# Check balance
solana balance

# Check network status
solana cluster-version

# Verify program size
ls -la target/deploy/
```

#### Frontend Not Loading
- Check browser console for errors
- Verify file paths are correct
- Ensure web server is running
- Check for CORS issues

#### Wallet Connection Issues
- Verify wallet is installed and unlocked
- Check network configuration matches
- Clear browser cache and cookies
- Try different wallet providers

### Debug Commands
```bash
# Check Solana configuration
solana config get

# View recent transactions
solana transaction-history YOUR_ADDRESS

# Check program accounts
solana program show YOUR_PROGRAM_ID
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review logs for error messages
3. Join our Discord for community support
4. Create an issue on GitHub with details

---

**Happy deploying! 🚀** 
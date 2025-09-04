# COLD L3 Rollup

This directory contains the configuration and data for the COLD L3 rollup.

## Directory Structure

- `config/` - Configuration files
  - `genesis.json` - Genesis state
  - `app.toml` - Application configuration
  - `config.toml` - Tendermint configuration
  - `priv_validator_key.json` - Validator private key
- `data/` - Blockchain data
- `logs/` - Log files

## Starting the Rollup

1. Make sure all dependencies are installed:
   ```bash
   npm install
   ```

2. Set up your environment:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. Fund your Celestia account:
   ```bash
   npm run celestia:fund
   ```

4. Deploy settlement contracts:
   ```bash
   npm run contracts:deploy
   ```

5. Start the rollup:
   ```bash
   npm run rollup:start
   ```

## Configuration

The rollup uses HEAT tokens as the native gas token and Celestia for data availability.

## RPC Endpoints

- Tendermint RPC: http://localhost:26657
- Application API: http://localhost:1317
- gRPC: localhost:9090

## Monitoring

Check the logs in the `logs/` directory for debugging information.

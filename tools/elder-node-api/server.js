import express from 'express';
import axios from 'axios';
import morgan from 'morgan';
import NodeCache from 'node-cache';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------
const PORT = process.env.PORT || 8080;
const FUEGO_RPC = process.env.FUEGO_RPC_URL || 'http://localhost:18281/json_rpc';
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '30', 10); // seconds

// Create in-memory cache (per-process)
const cache = new NodeCache({ stdTTL: CACHE_TTL, checkperiod: CACHE_TTL * 0.8 });

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

// -----------------------------------------------------------------------------
// Helper: JSON-RPC to Fuego daemon
// -----------------------------------------------------------------------------
async function fuegoRpc(method, params = {}) {
  const payload = { jsonrpc: '2.0', id: 1, method, params };
  const { data } = await axios.post(FUEGO_RPC, payload, { timeout: 10_000 });
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

// Cache wrapper
async function cached(key, fn, ttl = CACHE_TTL) {
  const val = cache.get(key);
  if (val !== undefined) return val;
  const fresh = await fn();
  cache.set(key, fresh, ttl);
  return fresh;
}

// -----------------------------------------------------------------------------
// Endpoints
// -----------------------------------------------------------------------------
// Health
app.get('/health', (_, res) => res.json({ status: 'ok', fuegoRpc: FUEGO_RPC }));

// Get block header by height
app.get('/block/:height', async (req, res) => {
  try {
    const height = parseInt(req.params.height, 10);
    const result = await cached(`block_${height}`, () => fuegoRpc('getblockheaderbyheight', { height }));
    res.json(result.block_header);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get transaction by hash
app.get('/tx/:hash', async (req, res) => {
  try {
    const hash = req.params.hash;
    const result = await cached(`tx_${hash}`, () => fuegoRpc('gettransactions', { txs_hashes: [hash], decode_as_json: true }));
    res.json(result.txs[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get undefined-output anomaly info (demo)
app.get('/burn-info/:hash', async (req, res) => {
  try {
    // For demo purposes we just fetch tx and parse tx_extra; real implementation would run proper analysis.
    const hash = req.params.hash;
    const tx = await cached(`tx_${hash}`, () => fuegoRpc('gettransactions', { txs_hashes: [hash], decode_as_json: true }));
    res.json({ hash, tx_extra: tx.txs[0].as_json?.extra || 'not_parsed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -----------------------------------------------------------------------------
// Start server
// -----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`[elder-api] listening on :${PORT} (proxying ${FUEGO_RPC})`);
}); 
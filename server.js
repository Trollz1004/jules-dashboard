/**
 * Pre-Order Server
 * Standalone server for the Royalty Hearts pre-order campaign
 *
 * Run from dating-platform/backend: node ../marketing/preorder/server.js
 * OR: cd marketing/preorder && npm start
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PREORDER_PORT || 8081;

app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// Checkout page
app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'checkout.html'));
});

// Main pre-order page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
💕 ═══════════════════════════════════════════════════════════════ 💕
   ROYALTY DECK OF HEARTS - Pre-Order Portal

   🌐 http://localhost:${PORT}

   📅 Launch: Valentine's Day 2026
   💳 Early Bird: $4.99/mo FOR LIFE
   👑 Royalty Cards: $1,000 (Only 4 available!)
   🃏 Joker: Random drawing from ALL pre-orders

💕 ═══════════════════════════════════════════════════════════════ 💕
  `);
});

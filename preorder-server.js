/**
 * Pre-Order Server
 * Standalone server for the Royalty Hearts pre-order campaign
 *
 * Runs on port 8081 - serves marketing/preorder pages
 * Launches Valentine's Day 2026
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PREORDER_PORT || 8081;

// Parse JSON bodies for API proxy
app.use(express.json());

// Serve static files from marketing/preorder
app.use(express.static(path.join(__dirname, 'marketing', 'preorder')));

// Also serve marketing assets
app.use('/assets', express.static(path.join(__dirname, 'marketing')));

// API proxy to main backend (injects API key for auth)
app.use('/api', async (req, res) => {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}${req.originalUrl}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.API_KEY || ''
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({ error: 'Backend unavailable' });
  }
});

// Checkout page
app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'marketing', 'preorder', 'checkout.html'));
});

// Main pre-order page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'marketing', 'preorder', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
💕 ═══════════════════════════════════════════════════════════════ 💕
   ROYALTY DECK OF HEARTS - Pre-Order Portal

   🌐 http://localhost:${PORT}

   📅 Launch: Valentine's Day 2026
   💳 Early Bird: $4.99/mo FOR LIFE ($5 off forever!)
   👑 Royalty Cards: $1,000 (Only 4 available!)
   🃏 Joker: Random drawing from ALL pre-orders

💕 ═══════════════════════════════════════════════════════════════ 💕
  `);
});

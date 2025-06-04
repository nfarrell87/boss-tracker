require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');

// Simple rate limiting - but exclude localhost/same server requests
const requestCounts = new Map();
const RATE_LIMIT = 30;
const WINDOW_MS = 60000;

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Skip rate limiting for localhost and internal requests
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return next();
  }
  
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }
  
  const requests = requestCounts.get(ip);
  const recentRequests = requests.filter(time => time > (now - WINDOW_MS));
  
  if (recentRequests.length >= RATE_LIMIT) {
    return res.status(429).json({ 
      error: 'Rate limit: 30 requests per minute maximum' 
    });
  }
  
  recentRequests.push(now);
  requestCounts.set(ip, recentRequests);
  next();
}

// ===== DISCORD BOT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
  const stripEmojis = str => str.replace(/<:[^>]+>/g, '').trim();
  
  if (message.embeds.length === 0) return;

  const embed = message.embeds[0];
  const [rawBoss, rawZone] = embed.title?.split('»').map(str => str.trim()) || [];
  const boss = stripEmojis(rawBoss || '');
  const zone = stripEmojis(rawZone || '');
  const whenField = embed.fields.find(field => field.name === 'When');
  const durationField = embed.fields.find(field => field.name === 'Duration');
  const rawKilledBy = embed.description?.replace(/killed by\s+/i, '') || '';
  const killedBy = stripEmojis(rawKilledBy);
  const timestampMatch = whenField?.value?.match(/<t:(\d+):[a-zA-Z]>/);
  const killedAt = timestampMatch ? parseInt(timestampMatch[1]) : null;

  if (!boss || !killedAt) return;

  const newKill = {
    killedAt,
    killedBy,
    duration: durationField?.value || 'unknown',
    zone: zone || 'unknown'
  };

  const dataPath = path.join(__dirname, '../site/bossData.json');
  let allData = {};

  try {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    allData = JSON.parse(raw);
  } catch (e) {
    console.log('Starting new bossData.json');
  }

  if (!Array.isArray(allData[boss])) {
    allData[boss] = [];
  }

  // Don't log duplicates (within 10 minutes)
  const alreadyLogged = allData[boss].some(entry =>
    Math.abs(entry.killedAt - killedAt) < 600
  );

  if (!alreadyLogged) {
    allData[boss].unshift(newKill); // Add the new kill to the front
    allData[boss] = allData[boss].slice(0, 5); // Keep only the latest 5 entries
    fs.writeFileSync(dataPath, JSON.stringify(allData, null, 2)); // Save the updated data
    console.log(`✅ Logged kill for ${boss}`);
  }
});

client.login(process.env.DISCORD_TOKEN);

// ===== EXPRESS SERVER =====
const app = express();
const PORT = 3000;

// Serve static files from /site
app.use(express.static(path.join(__dirname, '../site')));

// Apply rate limiting to API routes
app.use('/api', rateLimit);
app.use('/data', rateLimit);

let dataCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds

function getCachedData() {
  const now = Date.now();
  if (dataCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return dataCache;
  }
  
  try {
    const dataPath = path.join(__dirname, '../site/bossData.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    dataCache = data;
    cacheTimestamp = now;
    return data;
  } catch (error) {
    return dataCache || {}; // Return old cache if read fails
  }
}

// Serve bossData.json through an API endpoint
app.get('/data', (req, res) => {
  try {
    const data = getCachedData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// New API endpoint for realm-specific data
app.get('/api/realm/:realm', rateLimit, (req, res) => {
  const realm = req.params.realm.toLowerCase();
  
  try {
    const data = getCachedData();
    const realmData = {};
    
    Object.entries(data).forEach(([bossName, kills]) => {
      const realmKills = kills.filter(kill => {
        const killedBy = (kill.killedBy || '').toLowerCase();
        return killedBy.includes(realm);
      });
      
      if (realmKills.length > 0) {
        realmData[bossName] = realmKills;
      }
    });
    
    res.json(realmData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// API endpoint for specific boss data
app.get('/api/boss/:bossName', rateLimit, (req, res) => {
  const bossName = req.params.bossName;
  
  try {
    const data = getCachedData();
    const bossData = data[bossName] || [];
    res.json({ [bossName]: bossData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Website is running at http://localhost:${PORT}`);
});

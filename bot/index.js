require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');

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

// Serve bossData.json through an API endpoint
app.get('/data', (req, res) => {
  const dataPath = path.join(__dirname, '../site/bossData.json');
  res.sendFile(dataPath);
});

app.listen(PORT, () => {
  console.log(`🌐 Website is running at http://localhost:${PORT}`);
});

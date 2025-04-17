require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

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
  if (message.embeds.length > 0) {
    const embed = message.embeds[0];

    const [boss, zone] = embed.title?.split('»').map(str => str.trim()) || [];
    const whenField = embed.fields.find(field => field.name === 'When');
    const durationField = embed.fields.find(field => field.name === 'Duration');
    const killedBy = embed.description?.replace(/killed by\s+/i, '') || '';

    const timestampMatch = whenField?.value?.match(/<t:(\d+):[a-zA-Z]>/);
    const killedAt = timestampMatch ? parseInt(timestampMatch[1]) : null;

    const data = {
      boss,
      zone,
      killedAt,
      killedBy,
      duration: durationField?.value || 'unknown',
    };

    // Save it to site folder (adjust path if needed)
    const dataPath = path.join(__dirname, '../site/bossData.json');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    console.log(`✅ Saved kill data for ${boss}`);
  }
});

client.login(process.env.DISCORD_TOKEN);

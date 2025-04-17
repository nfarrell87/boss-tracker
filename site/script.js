const respawnRules = {
  "Dragon": { base: 360, variance: 0 },
  "HL": { base: 60, variance: 12 },
  "Princes": { base: 120, variance: 0, note: "Over 4h+ says draggo" },
  "Legion": { base: 240, variance: 48 },
  "SH": { base: 120, variance: 24 },
};

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h}h ${m}m`;
}

async function loadBossData() {
  const res = await fetch('bossData.json');
  const data = await res.json();
  displayBossCard(data);
}

function displayBossCard(bossData) {
  const container = document.getElementById("boss-container");
  container.innerHTML = ''; // clear previous

  const rule = respawnRules[bossData.boss] || { base: 180, variance: 0 };

  const now = Math.floor(Date.now() / 1000); // current time in seconds
  const minsSinceKill = (now - bossData.killedAt) / 60;
  const earliest = rule.base - rule.variance;
  const latest = rule.base + rule.variance;

  const earliestIn = Math.max(0, earliest - minsSinceKill);
  const latestIn = Math.max(0, latest - minsSinceKill);

  const card = document.createElement("div");
  card.innerHTML = `
    <div class="ant-card ant-card-bordered ant-card-hoverable">
      <div class="ant-card-head"><div class="ant-card-head-title">${bossData.boss}</div></div>
      <div class="ant-card-body">
        <b>Zone:</b> ${bossData.zone}<br>
        <b>Killed By:</b> ${bossData.killedBy}<br>
        <b>Duration:</b> ${bossData.duration}<br>
        <b>Kill Time:</b> ${new Date(bossData.killedAt * 1000).toLocaleString()}<br><br>

        ${
          rule.variance > 0
            ? `<b>Respawn Window:</b><br>
               Earliest in: ${formatTime(earliestIn)}<br>
               Latest in: ${formatTime(latestIn)}`
            : `<b>Respawns in:</b> ${formatTime(Math.max(0, rule.base - minsSinceKill))}`
        }

        ${rule.note ? `<br><br><i style="color:#999">${rule.note}</i>` : ''}
      </div>
    </div>
  `;

  container.appendChild(card);
}

// Refresh timer every 30s
loadBossData();
setInterval(loadBossData, 30000);

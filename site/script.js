const bossCategories = {
  "Big Dragons": {
    "Cuuldurach the Glimmer King": 360,
    "Golestandt": 360,
    "Gjalpinulva": 360,
  },
  "Mini Dragons": {
    "Kjorlakath": 30,
    "Sarnvasath": 30,
  },
  "Darkness Falls": {
    "Legion": 240,
    "Beliathan": 240,
    "Prince Abdin": 120,
    "Prince Asmoien": 120,
    "Prince Ba'alorien": 120,
    "High Lord Baelerdoth": 60,
    "High Lord Baln": 60,
    "High Lord Oro": 60,
    "High Lord Saeor": 60,
  },
  "Summoner's Hall": {
    "Grand Summoner Govannon": 120,
    "Summoner Roesia": 120,
    "Summoner Cunovinda": 120,
    "Summoner Lossren": 120,
    "Aidon the Archwizard": 120,
  },
  "SI Epic Dungeon": {
    "Apocalypse": 360,
    "Olcasgean": 360,
    "King Tuscar": 360,
  },
};

function formatTimeFromNow(timestamp) {
  if (!timestamp) return "Unknown";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

function formatDeltaMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h}h ${m}m`;
}

async function loadBossData() {
  try {
    const res = await fetch('/data');
    const data = await res.json();
    renderAllBosses(data);
  } catch (e) {
    console.error("Failed to load boss data:", e);
    document.getElementById("boss-container").innerHTML = `<p class="text-red-500 text-center">Error loading boss data</p>`;
  }
}

function renderAllBosses(data) {
  const container = document.getElementById("boss-container");
  container.innerHTML = '';

  // Create a grid container for categories
  const gridWrapper = document.createElement("div");
  gridWrapper.className = "grid grid-cols-1 gap-10";

  // Loop through each category
  Object.entries(bossCategories).forEach(([categoryName, bosses]) => {
    // Create a card for the category
    const categoryCard = document.createElement("div");
    categoryCard.className = "bg-gray-800 text-white rounded-xl shadow-lg p-6";

    // Add the category title
    const categoryTitle = document.createElement("h2");
    categoryTitle.className = "text-3xl font-bold text-center text-blue-400 mb-6";
    categoryTitle.textContent = categoryName;

    // Create a grid for the bosses inside the category
    const bossesGrid = document.createElement("div");
    bossesGrid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";

    // Loop through bosses in the category
    Object.entries(bosses).forEach(([bossName, base]) => {
      const history = data[bossName] || [];
      const latestKill = history[0];

      const now = Math.floor(Date.now() / 1000);
      const variance = Math.floor(base * 0.2);
      const sinceKill = latestKill ? (now - latestKill.killedAt) / 60 : null;

      const earliest = base - variance;
      const latest = base + variance;

      const earliestIn = sinceKill != null ? Math.max(0, earliest - sinceKill) : null;
      const latestIn = sinceKill != null ? Math.max(0, latest - sinceKill) : null;

      const historyRows = history.length > 0
        ? history.slice(0, 5).map((entry, i) => {
            const lowerText = entry.killedBy?.toLowerCase() || '';
            let rowClass = 'bg-transparent';
            let realmEmoji = '';

            if (lowerText.includes('albion')) {
              rowClass = 'bg-[#f96669]/30';
              realmEmoji = '<img src="https://static.wikia.nocookie.net/camelotherald/images/b/ba/Albion_logo.png" alt="Albion" class="inline h-4 w-4 mr-1 align-middle" />';
            } else if (lowerText.includes('midgard')) {
              rowClass = 'bg-[#46a4fe]/30';
              realmEmoji = '<img src="https://static.wikia.nocookie.net/camelotherald/images/2/28/Midgard_logo.png" alt="Midgard" class="inline h-4 w-4 mr-1 align-middle" />';
            } else if (lowerText.includes('hibernia')) {
              rowClass = 'bg-[#44d56c]/30';
              realmEmoji = '<img src="https://static.wikia.nocookie.net/camelotherald/images/7/7c/Hibernia_logo.png" alt="Hibernia" class="inline h-4 w-4 mr-1 align-middle" />';
            }

            return `
              <tr class="${rowClass} border-b border-gray-700">
                <td class="py-1 px-2 text-sm text-gray-100">${i + 1}</td>
                <td class="py-1 px-2 text-sm text-white">${formatTimeFromNow(entry.killedAt)}</td>
                <td class="py-1 px-2 text-sm text-white">${realmEmoji}${entry.killedBy || 'Unknown'}</td>
                <td class="py-1 px-2 text-sm text-white">${entry.duration || 'Unknown'}</td>
              </tr>
            `;
          }).join('')
        : `<tr><td colspan="4" class="text-sm text-center text-gray-500 py-2">No history available</td></tr>`;

      // Create a card for the boss
      const bossCard = document.createElement("div");
      bossCard.className = "bg-gray-700 text-white rounded-lg shadow p-4";

      bossCard.innerHTML = `
        <h3 class="text-xl font-semibold mb-2 text-blue-300">${bossName}</h3>
        ${latestKill
          ? `<p class="text-sm text-gray-300 mb-2">
                <strong>Last Kill:</strong> ${formatTimeFromNow(latestKill.killedAt)}<br>
                <strong>Zone:</strong> ${latestKill.zone || "Unknown"}
              </p>
              <p class="text-sm text-gray-300 mb-4">
                <strong>Next Respawn Window:</strong><br>
                Earliest: <span class="text-yellow-400">${formatDeltaMinutes(earliestIn)}</span><br>
                Latest: <span class="text-red-400">${formatDeltaMinutes(latestIn)}</span>
              </p>`
          : `<p class="text-sm text-gray-500 mb-4">No kills recorded yet.</p>`}

        <div>
          <p class="text-sm font-semibold mb-1 text-gray-400">Kill History</p>
          <div class="overflow-x-auto">
            <table class="table-auto w-full text-left text-sm border border-gray-700">
              <thead class="bg-gray-700 text-gray-200">
                <tr>
                  <th class="py-1 px-2">#</th>
                  <th class="py-1 px-2">Time</th>
                  <th class="py-1 px-2">Killed By</th>
                  <th class="py-1 px-2">Duration</th>
                </tr>
              </thead>
              <tbody>${historyRows}</tbody>
            </table>
          </div>
        </div>
      `;

      bossesGrid.appendChild(bossCard);
    });

    categoryCard.appendChild(categoryTitle);
    categoryCard.appendChild(bossesGrid);
    gridWrapper.appendChild(categoryCard);
  });

  container.appendChild(gridWrapper);

  // Add the "Other Bosses" table
  const otherBossesWrapper = document.createElement("div");
  otherBossesWrapper.className = "bg-gray-800 text-white rounded-xl shadow-lg p-6 mt-10";

  const otherBossesTitle = document.createElement("h2");
  otherBossesTitle.className = "text-3xl font-bold text-center text-blue-400 mb-6";
  otherBossesTitle.textContent = "Other Bosses";

  const otherBossesTable = document.createElement("div");
  otherBossesTable.className = "overflow-x-auto";

  let otherBossesRows = '';
  Object.entries(data).forEach(([bossName, history]) => {
    if (!Object.values(bossCategories).some(category => bossName in category)) {
      history.forEach((entry) => {
        otherBossesRows += `
          <tr class="border-b border-gray-700">
            <td class="py-1 px-2 text-sm text-gray-300">${bossName}</td>
            <td class="py-1 px-2 text-sm text-white">${formatTimeFromNow(entry.killedAt)}</td>
            <td class="py-1 px-2 text-sm text-white">${entry.killedBy || 'Unknown'}</td>
            <td class="py-1 px-2 text-sm text-white">${entry.duration || 'Unknown'}</td>
          </tr>
        `;
      });
    }
  });

  otherBossesTable.innerHTML = `
    <table class="table-auto w-full text-left text-sm border border-gray-700">
      <thead class="bg-gray-700 text-gray-200">
        <tr>
          <th class="py-1 px-2">Boss</th>
          <th class="py-1 px-2">Time</th>
          <th class="py-1 px-2">Killed By</th>
          <th class="py-1 px-2">Duration</th>
        </tr>
      </thead>
      <tbody>${otherBossesRows || `<tr><td colspan="4" class="text-sm text-center text-gray-500 py-2">No data yet</td></tr>`}</tbody>
    </table>
  `;

  otherBossesWrapper.appendChild(otherBossesTitle);
  otherBossesWrapper.appendChild(otherBossesTable);
  container.appendChild(otherBossesWrapper);
}

loadBossData();
setInterval(loadBossData, 30000); // refresh every 30s

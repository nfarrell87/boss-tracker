const bossCategories = {
  "Big Dragons": {
    "Golestandt": { respawnTime: 360, alias: "Dragon of Albion" },
    "Cuuldurach the Glimmer King": { respawnTime: 360, alias: "Dragon of Hibernia" },
    "Gjalpinulva": { respawnTime: 360, alias: "Dragon of Midgard" },
  },
  "Darkness Falls": {
    "Legion": { respawnTime: 240, alias: "" },
    "High Lord Baelerdoth": { respawnTime: 60, alias: "" },
    "High Lord Baln": { respawnTime: 60, alias: "" },
    "High Lord Oro": { respawnTime: 60, alias: "" },
    "High Lord Saeor": { respawnTime: 60, alias: "" },
    "Prince Asmoien": { respawnTime: 240, alias: "" },
    "Prince Ba'alorien": { respawnTime: 240, alias: "" },
    "Prince Abdin": { respawnTime: 240, alias: "" },
  },
  "Summoner's Hall": {
    "Grand Summoner Govannon": { respawnTime: 120, alias: "" },
    "Summoner Roesia": { respawnTime: 120, alias: "" },
    "Summoner Cunovinda": { respawnTime: 120, alias: "" },
    "Summoner Lossren": { respawnTime: 120, alias: "" },
    "Aidon the Archwizard": { respawnTime: 120, alias: "" },
  },
  "NF Dragons": {
    "Amrateth": { respawnTime: 30, alias: "Dragon of Albion" },
    "Sarnvasath": { respawnTime: 30, alias: "Dragon of Hibernia" },
    "Kjorlakath": { respawnTime: 30, alias: "Dragon of Midgard" },
  },
  "MOH Bosses": {
    "Green Knight": { respawnTime: 30, alias: "Forest Sauvage" },
    "Evern": { respawnTime: 30, alias: "Breifine" },
    "Glacier Giant": { respawnTime: 30, alias: "Odin's Gate" },
  },
  "SI Epic Dungeon": {
    "Apocalypse": { respawnTime: 360, alias: "Caer Sidi" },
    "Olcasgean": { respawnTime: 360, alias: "Galladoria" },
    "King Tuscar": { respawnTime: 360, alias: "Tuscaran Glacier" },
    "Orylle": { respawnTime: 240, alias: "Krondon" },
    "Balor": { respawnTime: 240, alias: "Tur Suil" },
    "Iarnvidiur": { respawnTime: 240, alias: "Iarnvidiur's Lair" },
  },
  "ML Dungeons": {
    "The Phoenix": { respawnTime: 360, alias: "ML9", realms: true },
    "Draco": { respawnTime: 120, alias: "ML10" },
  },
};

const categoryVisibility = JSON.parse(localStorage.getItem('categoryVisibility')) || {};
let condensedView = localStorage.getItem('condensedView') === 'true'; // default: false (Detailed view)

// Save visibility state to localStorage
function saveCategoryVisibility() {
  localStorage.setItem('categoryVisibility', JSON.stringify(categoryVisibility));
}

// Render checkboxes for category filters
function renderCategoryFilters() {
  const filtersContainer = document.getElementById('category-filters');
  filtersContainer.innerHTML = ''; // Clear existing filters

  // Get all categories including potential "Other Bosses"
  const allCategories = { ...bossCategories };
  const otherBossKills = getOtherBosses(currentData);
  if (otherBossKills.length > 0) {
    allCategories["Other Bosses"] = {};
  }

  Object.keys(allCategories).forEach((category) => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `filter-${category}`;
    checkbox.checked = categoryVisibility[category];
    checkbox.className = 'sr-only';

    const label = document.createElement('label');
    label.htmlFor = `filter-${category}`;
    label.className = 'filter-pill' + (categoryVisibility[category] ? ' active' : '');
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(category));

    checkbox.addEventListener('change', (e) => {
      categoryVisibility[category] = e.target.checked;
      label.classList.toggle('active', e.target.checked);
      saveCategoryVisibility();
      renderAllBosses(currentData);
    });

    filtersContainer.appendChild(label);
  });
}

function formatTimeFromNow(timestamp) {
  if (!timestamp) return "Unknown";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString([], { 
    month: 'numeric', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });
}

function formatDeltaMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h}h ${m}m`;
}

let nextUpdateTime = null; // Store the next update time globally
let countdownInterval = null; // Store the interval ID globally
let currentData = {}; // Store the current data globally to compare with new data

async function loadBossData() {
  try {
    const res = await fetch('/data');
    const newData = await res.json();

    currentData = newData;
    
    // Set default visibility for ALL categories BEFORE any rendering
    const otherBossKills = getOtherBosses(currentData);
    const allCategories = { ...bossCategories };
    if (otherBossKills.length > 0) {
      allCategories["Other Bosses"] = {};
    }
    
    // Ensure all categories have default visibility set to true
    Object.keys(allCategories).forEach(category => {
      if (categoryVisibility[category] === undefined) {
        categoryVisibility[category] = true;
      }
    });
    
    renderCategoryFilters();
    renderAllBosses(newData);

    const now = new Date();
    nextUpdateTime = new Date(now.getTime() + 60000);

    const updateInfo = document.getElementById("update-info");
    updateInfo.innerHTML = `
      <span>Last Updated: <strong>${now.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}</strong></span>
      <span> | Next Update: <strong id="countdown">60</strong> seconds</span>
    `;

    startCountdown();
  } catch (e) {
    console.error("Failed to load boss data:", e);
    document.getElementById("boss-container").innerHTML = `<p class="text-red-500 text-center">Error loading boss data</p>`;
  }
}

function startCountdown() {
  const countdownElement = document.getElementById("countdown");

  if (!countdownElement) return; // Exit if the countdown element is not found

  // Clear any existing interval to avoid overlapping intervals
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  // Start a new interval for the main countdown
  countdownInterval = setInterval(() => {
    if (!nextUpdateTime) return; // Exit if nextUpdateTime is not set

    const now = new Date();
    const timeLeft = Math.max(0, Math.floor((nextUpdateTime - now) / 1000)); // Calculate seconds left

    countdownElement.textContent = timeLeft;

    // Stop the countdown when it reaches 0
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
    }
  }, 1000); // Update every second

  // Start a separate interval to update "Earliest Spawn" and "Latest Spawn" dynamically
  setInterval(() => {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    Object.entries(bossCategories).forEach(([categoryName, bosses]) => {
      Object.entries(bosses).forEach(([bossName, { respawnTime }]) => {
        const latestElement = document.getElementById(`latest-${categoryName}-${bossName}`);
        const earliestElement = document.getElementById(`earliest-${categoryName}-${bossName}`);
        const history = currentData[bossName] || [];
        const latestKill = history[0];

        if (latestKill) {
          const sinceKill = (nowInSeconds - latestKill.killedAt) / 60; // Minutes since the last kill
          const variance = Math.floor(respawnTime * 0.2); // Calculate variance
          const earliest = respawnTime - variance; // Earliest respawn time in minutes
          const latest = respawnTime + variance; // Latest respawn time in minutes
          const earliestIn = Math.max(0, earliest - sinceKill);
          const latestIn = Math.max(0, latest - sinceKill);

          // Determine if the boss is alive
          const isAlive = sinceKill >= latest;

          // Update the "Earliest Spawn" element dynamically
          if (earliestElement) {
            if (earliestIn > 0) {
              // Before the spawn window: Show the "Earliest Spawn" timer in yellow
              earliestElement.textContent = `${formatDeltaMinutes(earliestIn)}`;
              earliestElement.classList.add("text-yellow-400");
              earliestElement.classList.remove("text-gray-400");
            } else if (latestIn > 0) {
              // During the spawn window: Show "Boss is in spawn window now!" in yellow
              earliestElement.textContent = "Boss is in spawn window now!";
              earliestElement.classList.add("text-yellow-400");
              earliestElement.classList.remove("text-gray-400");
            } else {
              // After the spawn window: Clear the "Earliest Spawn" text
              earliestElement.textContent = "";
              earliestElement.classList.remove("text-yellow-400");
              earliestElement.classList.add("text-gray-400");
            }
          }

          // Update the "Latest Spawn" element dynamically
          if (latestElement) {
            if (isAlive) {
              // After the spawn window: Show "Boss is up now!" in green
              latestElement.textContent = "Boss is up now!";
              latestElement.classList.add("text-green-400");
              latestElement.classList.remove("text-red-400");
            } else if (latestIn > 0) {
              // Before or during the spawn window: Show the "Latest Spawn" timer in red
              latestElement.textContent = `${formatDeltaMinutes(latestIn)}`;
              latestElement.classList.add("text-red-400");
              latestElement.classList.remove("text-green-400");
            } else {
              // Clear the "Latest Spawn" text if no valid state applies
              latestElement.textContent = "";
              latestElement.classList.remove("text-red-400");
              latestElement.classList.add("text-gray-400");
            }
          }
        }
      });
    });
  }, 60000); // Update every minute
}

function extractRealm(killedBy) {
  if (!killedBy) return null;
  const lowerText = killedBy.toLowerCase();
  if (lowerText.includes('albion')) return 'Albion';
  if (lowerText.includes('hibernia')) return 'Hibernia';
  if (lowerText.includes('midgard')) return 'Midgard';
  return null;
}

function getRealmBorderClass(realm) {
  switch (realm) {
    case 'Albion': return 'border-l-8 border-l-[#f96669]';
    case 'Hibernia': return 'border-l-8 border-l-[#44d56c]';
    case 'Midgard': return 'border-l-8 border-l-[#46a4fe]';
    default: return '';
  }
}

function condensedAlias(alias) {
  if (!alias) return '';
  if (alias === 'Dragon of Albion') return 'Alb';
  if (alias === 'Dragon of Hibernia') return 'Hib';
  if (alias === 'Dragon of Midgard') return 'Mid';
  return alias;
}

function createBossCard(bossName, boss, history, realm = null, condensed = false) {
  const now = Math.floor(Date.now() / 1000);
  const { respawnTime, alias } = boss;
  
  // Filter history by realm if this is a realm-specific card
  const filteredHistory = realm 
    ? history.filter(entry => extractRealm(entry.killedBy) === realm)
    : history;
  
  const latestKill = filteredHistory[0];

  const variance = Math.floor(respawnTime * 0.2);
  const sinceKill = latestKill ? (now - latestKill.killedAt) / 60 : null;

  const earliest = respawnTime - variance;
  const latest = respawnTime + variance;

  // Determine if the boss is alive or calculate the respawn window
  const isAlive = sinceKill != null && sinceKill >= latest;
  const earliestIn = !isAlive && sinceKill != null ? Math.max(0, earliest - sinceKill) : null;
  const latestIn = !isAlive && sinceKill != null ? Math.max(0, latest - sinceKill) : null;

  // Determine if the boss is in the spawn window
  const isInSpawnWindow = earliestIn === 0 && latestIn > 0;

  // Display name with realm suffix if applicable
  const displayName = realm ? `${bossName} (${realm})` : bossName;
  
  // Get realm border class
  const borderClass = realm ? getRealmBorderClass(realm) : '';
  // Get status glow class (red=down, yellow=in window, green=up)
  let statusClass = '';
  let statusText = '—';
  let indicatorClass = 'status-indicator-unknown';
  if (latestKill) {
    if (isAlive) {
      statusClass = 'boss-status-up';
      statusText = 'UP';
      indicatorClass = 'status-indicator-up';
    } else if (isInSpawnWindow) {
      statusClass = 'boss-status-window';
      statusText = latestIn != null ? `Up in ≤ ${formatDeltaMinutes(latestIn)}` : 'IN WINDOW';
      indicatorClass = 'status-indicator-window';
    } else {
      statusClass = 'boss-status-down';
      statusText = 'DOWN';
      indicatorClass = 'status-indicator-down';
    }
  }

  if (condensed) {
    const bossId = bossName.toLowerCase().replace(/\s+/g, '-');
    const realmSuffix = realm ? `-${realm.toLowerCase()}` : '';
    const cardId = `boss-card-${bossId}${realmSuffix}`;
    const condensedCard = document.createElement("div");
    condensedCard.className = `boss-card condensed text-white rounded-lg flex items-center justify-between gap-3 ${statusClass || ''} ${borderClass}`;
    condensedCard.id = cardId;
    condensedCard.setAttribute('data-boss-name', bossName);
    condensedCard.setAttribute('data-realm', realm || 'all');
    condensedCard.setAttribute('data-respawn-time', respawnTime);
    const namePart = realm ? bossName : displayName;
    const shortAlias = condensedAlias(alias);
    const descPart = shortAlias ? ` <span class="text-gray-400 text-sm">(${shortAlias})</span>` : '';
    const fullLabel = [namePart, alias ? `(${alias})` : ''].filter(Boolean).join(' ');
    const windowTooltip = isInSpawnWindow && latestIn != null
      ? `Could be up now or anytime within the next ${formatDeltaMinutes(latestIn)}`
      : fullLabel;
    condensedCard.setAttribute('title', windowTooltip);
    condensedCard.innerHTML = `
      <div class="flex-grow min-w-0 truncate">
        <span class="font-semibold boss-name-condensed text-sm">${namePart}${descPart}</span>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="status-indicator ${indicatorClass}" aria-hidden="true"></span>
        <span class="text-sm font-medium whitespace-nowrap ${isInSpawnWindow ? '' : 'uppercase'}">${statusText}</span>
      </div>
    `;
    return condensedCard;
  }

  const historyRows = filteredHistory.length > 0
    ? filteredHistory.slice(0, 5).map((entry, i) => {
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

      // Calculate how long ago the boss was killed
      const killedAt = entry.killedAt || 0;
      const timeAgo = killedAt
        ? Math.floor((now - killedAt) / 60) // Time in minutes
        : null;
      const timeAgoText = timeAgo != null
        ? `${Math.floor(timeAgo / 60)}h ${timeAgo % 60}m ago`
        : 'Unknown';

      return `
          <tr class="${rowClass} border-b border-gray-700">
            <td class="py-1 px-2 text-sm text-gray-100">${i + 1}</td>
            <td class="py-1 px-2 text-sm text-white">${formatTimeFromNow(killedAt)}</td>
            <td class="py-1 px-2 text-sm text-white">${realmEmoji}${entry.killedBy || 'Unknown'}</td>
            <td class="py-1 px-2 text-sm text-white">${timeAgoText}</td>
          </tr>
        `;
    }).join('')
    : `<tr><td colspan="4" class="text-sm text-center text-gray-500 py-2">No history available</td></tr>`;

  // Create unique IDs for easier scraping/reference
  const bossId = bossName.toLowerCase().replace(/\s+/g, '-');
  const realmSuffix = realm ? `-${realm.toLowerCase()}` : '';
  const tableId = `boss-table-${bossId}${realmSuffix}`;
  const cardId = `boss-card-${bossId}${realmSuffix}`;

  const bossCard = document.createElement("div");
  bossCard.className = `boss-card text-white rounded-lg p-4 ${statusClass || ''} ${borderClass}`;
  bossCard.id = cardId;
  bossCard.setAttribute('data-boss-name', bossName);
  bossCard.setAttribute('data-realm', realm || 'all');
  bossCard.setAttribute('data-respawn-time', respawnTime);

  bossCard.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <h3 class="text-xl font-semibold boss-name flex-grow text-left leading-none">
        ${displayName}
        ${alias ? `<br /><span class="text-sm text-gray-400">(${alias})</span>` : ""}
      </h3>
    </div>
    ${latestKill
      ? isAlive
        ? `<p class="text-sm text-gray-300 mb-4">
            <strong>Next Respawn Window:</strong><br>
            <span class="text-sm text-green-400 mb-4"><strong>Boss is up now!</strong></span>
          </p>`
        : isInSpawnWindow
          ? `<p class="text-sm text-gray-300 mb-4">
              <strong>Next Respawn Window:</strong><br>
              <span class="text-sm text-yellow-400 mb-4"><strong>Boss is in spawn window now!</strong></span><br>
              Latest Spawn: <span class="text-red-400">${latestIn !== null ? formatDeltaMinutes(latestIn) : "N/A"}</span>
            </p>`
          : `<p class="text-sm text-gray-300 mb-4">
              <strong>Next Respawn Window:</strong><br>
              Earliest Spawn: <span class="text-yellow-400">${earliestIn !== null ? formatDeltaMinutes(earliestIn) : "N/A"}</span><br>
              Latest Spawn: <span class="text-red-400">${latestIn !== null ? formatDeltaMinutes(latestIn) : "N/A"}</span>
            </p>`
      : `<p class="text-sm text-gray-500 mb-4">No kills recorded yet.</p>`}
    <p class="text-xs text-gray-400 mb-3">Base Respawn Time: ${formatDeltaMinutes(respawnTime)} (+/- 20%)</p>
    <div class="mt-4">
      <table id="${tableId}" class="boss-history-table table-auto w-full text-left text-sm border border-gray-700" data-boss="${bossName}" data-realm="${realm || 'all'}">
        <thead class="text-gray-200" style="background: rgba(24, 30, 42, 0.9);">
          <tr>
            <th class="py-1 px-2">#</th>
            <th class="py-1 px-2">Time</th>
            <th class="py-1 px-2">Killed By</th>
            <th class="py-1 px-2">Time Ago</th>
          </tr>
        </thead>
        <tbody>
          ${historyRows}
        </tbody>
      </table>
    </div>
  `;

  return bossCard;
}

function getAllPredefinedBosses() {
  const predefinedBosses = new Set();
  Object.values(bossCategories).forEach(category => {
    Object.keys(category).forEach(bossName => {
      predefinedBosses.add(bossName);
    });
  });
  return predefinedBosses;
}

// Function to get "Other Bosses" dynamically from data
function getOtherBosses(data) {
  const predefinedBosses = getAllPredefinedBosses();
  const otherBossKills = [];
  
  Object.entries(data).forEach(([bossName, kills]) => {
    if (!predefinedBosses.has(bossName)) {
      // Add boss name to each kill entry for the combined list
      kills.forEach(kill => {
        otherBossKills.push({
          ...kill,
          bossName: bossName
        });
      });
    }
  });
  
  // Sort by most recent kill first and take last 50
  otherBossKills.sort((a, b) => b.killedAt - a.killedAt);
  return otherBossKills.slice(0, 50); // Changed from 30 to 50
}

// Create a special card for "Other Bosses" that shows combined history
function createOtherBossesCard(otherBossKills) {
  const now = Math.floor(Date.now() / 1000);

  const historyRows = otherBossKills.length > 0
    ? otherBossKills.map((entry, i) => {
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

      // Calculate how long ago the boss was killed
      const killedAt = entry.killedAt || 0;
      const timeAgo = killedAt
        ? Math.floor((now - killedAt) / 60) // Time in minutes
        : null;
      const timeAgoText = timeAgo != null
        ? `${Math.floor(timeAgo / 60)}h ${timeAgo % 60}m ago`
        : 'Unknown';

      return `
          <tr class="${rowClass} border-b border-gray-700">
            <td class="py-1 px-2 text-sm text-gray-100">${i + 1}</td>
            <td class="py-1 px-2 text-sm text-white font-semibold">${entry.bossName}</td>
            <td class="py-1 px-2 text-sm text-white">${formatTimeFromNow(killedAt)}</td>
            <td class="py-1 px-2 text-sm text-white">${realmEmoji}${entry.killedBy || 'Unknown'}</td>
            <td class="py-1 px-2 text-sm text-white">${timeAgoText}</td>
          </tr>
        `;
    }).join('')
    : `<tr><td colspan="5" class="text-sm text-center text-gray-500 py-2">No other boss kills recorded yet</td></tr>`;

  const bossCard = document.createElement("div");
  bossCard.className = `boss-card text-white rounded-lg p-4`;
  bossCard.id = `boss-card-other-bosses`;
  bossCard.setAttribute('data-boss-name', 'Other Bosses');
  bossCard.setAttribute('data-realm', 'all');

  bossCard.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <h3 class="text-xl font-semibold accent-text flex-grow text-left leading-none">
        Other Bosses
        <br /><span class="text-sm text-gray-400">(Last 50 kills)</span>
      </h3>
    </div>
    <div class="mt-4">
      <table id="boss-table-other-bosses" class="boss-history-table table-auto w-full text-left text-sm border border-gray-700" data-boss="Other Bosses" data-realm="all">
        <thead class="text-gray-200" style="background: rgba(24, 30, 42, 0.9);">
          <tr>
            <th class="py-1 px-2">#</th>
            <th class="py-1 px-2">Boss</th>
            <th class="py-1 px-2">Time</th>
            <th class="py-1 px-2">Killed By</th>
            <th class="py-1 px-2">Time Ago</th>
          </tr>
        </thead>
        <tbody>
          ${historyRows}
        </tbody>
      </table>
    </div>
  `;

  return bossCard;
}

function buildBossesGrid(categoryName, bosses, data, condensed) {
  const bossesGrid = document.createElement("div");
  if (categoryName === "Darkness Falls") {
    bossesGrid.className = condensed
      ? "flex flex-col gap-2"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6";
    Object.entries(bosses).forEach(([bossName, boss]) => {
      bossesGrid.appendChild(createBossCard(bossName, boss, data[bossName] || [], null, condensed));
    });
  } else if (categoryName === "Summoner's Hall") {
    bossesGrid.className = condensed
      ? "flex flex-col gap-2"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6";
    Object.entries(bosses).forEach(([bossName, boss]) => {
      bossesGrid.appendChild(createBossCard(bossName, boss, data[bossName] || [], null, condensed));
    });
  } else {
    const bossCount = Object.keys(bosses).reduce((count, bossName) => {
      const boss = bosses[bossName];
      return count + (boss.realms ? 3 : 1);
    }, 0);
    const gridClass = condensed
      ? "flex flex-col gap-2"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";
    if (bossCount === 1 && !condensed) {
      bossesGrid.className = "flex justify-center";
      const centerWrapper = document.createElement("div");
      centerWrapper.className = "w-full max-w-md";
      bossesGrid.appendChild(centerWrapper);
      Object.entries(bosses).forEach(([bossName, boss]) => {
        if (boss.realms) {
          ['Albion', 'Hibernia', 'Midgard'].forEach(realm => {
            centerWrapper.appendChild(createBossCard(bossName, boss, data[bossName] || [], realm, condensed));
          });
        } else {
          centerWrapper.appendChild(createBossCard(bossName, boss, data[bossName] || [], null, condensed));
        }
      });
    } else {
      bossesGrid.className = gridClass;
      Object.entries(bosses).forEach(([bossName, boss]) => {
        if (boss.realms) {
          ['Albion', 'Hibernia', 'Midgard'].forEach(realm => {
            bossesGrid.appendChild(createBossCard(bossName, boss, data[bossName] || [], realm, condensed));
          });
        } else {
          bossesGrid.appendChild(createBossCard(bossName, boss, data[bossName] || [], null, condensed));
        }
      });
    }
  }
  return bossesGrid;
}

function renderAllBosses(data) {
  const container = document.getElementById("boss-container");
  container.innerHTML = "";

  const otherBossKills = getOtherBosses(data);
  const allCategories = { ...bossCategories };
  if (otherBossKills.length > 0) {
    allCategories["Other Bosses"] = {};
  }

  if (condensedView) {
    // Condensed: bundle all categories (except Other Bosses) into cards at top
    const categoriesGrid = document.createElement("div");
    categoriesGrid.className = "w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 items-stretch";
    container.appendChild(categoriesGrid);

    const categoryEntries = Object.entries(allCategories).filter(
      ([name]) => name !== "Other Bosses" && categoryVisibility[name]
    );
    categoryEntries.forEach(([categoryName, bosses]) => {
      const categoryCard = document.createElement("div");
      categoryCard.className = "category-card flex flex-col h-full max-w-full";
      const title = document.createElement("h3");
      title.className = "text-base font-bold accent-text mb-2 pb-1.5 border-b accent-border-bottom";
      title.textContent = categoryName;
      categoryCard.appendChild(title);
      const bossesGrid = buildBossesGrid(categoryName, bosses, data, true);
      categoryCard.appendChild(bossesGrid);
      categoriesGrid.appendChild(categoryCard);
    });
  } else {
    // Detailed: each category in its own section
    Object.entries(allCategories).forEach(([categoryName, bosses]) => {
      if (!categoryVisibility[categoryName]) return;

      const categorySection = document.createElement("div");
      categorySection.className = "mb-8";
      const categoryTitle = document.createElement("h2");
      categoryTitle.className = "category-section-title text-2xl font-bold mb-4 pb-2";
      categoryTitle.textContent = categoryName;
      categorySection.appendChild(categoryTitle);

      if (categoryName === "Other Bosses") {
        const centerWrapper = document.createElement("div");
        centerWrapper.className = "w-full max-w-4xl";
        centerWrapper.appendChild(createOtherBossesCard(otherBossKills));
        categorySection.appendChild(centerWrapper);
      } else {
        categorySection.appendChild(buildBossesGrid(categoryName, bosses, data, false));
      }
      container.appendChild(categorySection);
    });
  }
}

// Update the category visibility check to handle dynamic categories
function renderCategoryFilters() {
  const filtersContainer = document.getElementById('category-filters');
  filtersContainer.innerHTML = ''; // Clear existing filters

  // Get all categories including potential "Other Bosses"
  const allCategories = { ...bossCategories };
  const otherBossKills = getOtherBosses(currentData);
  if (otherBossKills.length > 0) {
    allCategories["Other Bosses"] = {};
  }

  Object.keys(allCategories).forEach((category) => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `filter-${category}`;
    checkbox.checked = categoryVisibility[category];
    checkbox.className = 'sr-only';

    const label = document.createElement('label');
    label.htmlFor = `filter-${category}`;
    label.className = 'filter-pill' + (categoryVisibility[category] ? ' active' : '');
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(category));

    checkbox.addEventListener('change', (e) => {
      categoryVisibility[category] = e.target.checked;
      label.classList.toggle('active', e.target.checked);
      saveCategoryVisibility();
      renderAllBosses(currentData);
    });

    filtersContainer.appendChild(label);
  });
}

// --- Swing Speed Calculator (from DAoC Utils archive) ---
function validateSwingInput(dom, optional) {
  const val = dom.value;
  if (!optional && (val === "" || val === undefined)) {
    dom.classList.add("border-red-500");
    return null;
  }
  dom.classList.remove("border-red-500");
  const n = parseFloat(val);
  return (optional && (val === "" || isNaN(n))) ? null : n;
}

function getDecimal(percentage) {
  if (percentage != null && !isNaN(percentage)) return percentage / 100;
  return 0;
}

function calculateSwingSpeed(weaponSpeed, quickness, toa, haste, celerity) {
  if (weaponSpeed == null || isNaN(weaponSpeed)) return null;
  if (quickness > 250) quickness = 250;
  toa = getDecimal(toa);
  haste = getDecimal(haste);
  celerity = getDecimal(celerity);
  const speed = Math.floor(Math.floor(Math.floor(weaponSpeed * 100 * (1 - (quickness - 50) / 500)) * (1 - haste - celerity)) * (1 - toa)) / 100;
  return Math.round(speed * 100) / 100;
}

function initSwingSpeedModal() {
  const modal = document.getElementById("swing-speed-modal");
  const btnOpen = document.getElementById("swing-speed-btn");
  const btnClose = document.getElementById("swing-speed-close");
  const btnClose2 = document.getElementById("swing-speed-close-btn");
  const backdrop = document.getElementById("swing-speed-backdrop");
  const resultText = document.getElementById("swing-speed-result-text");
  const disclaimerText = document.getElementById("swing-speed-disclaimer");
  const inputs = ["mainhand-speed", "offhand-speed", "quickness", "toa-melee-speed", "haste", "celerity"];

  function openModal() {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    runSwingCalc();
  }

  function closeModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  const infoModal = document.getElementById("swing-speed-info-modal");
  const btnInfo = document.getElementById("swing-speed-info-btn");
  const infoBackdrop = document.getElementById("swing-speed-info-backdrop");
  const infoClose = document.getElementById("swing-speed-info-close");
  const infoCloseBtn = document.getElementById("swing-speed-info-close-btn");

  function openInfoModal() {
    infoModal.classList.remove("hidden");
    infoModal.setAttribute("aria-hidden", "false");
  }
  function closeInfoModal() {
    infoModal.classList.add("hidden");
    infoModal.setAttribute("aria-hidden", "true");
  }

  function runSwingCalc() {
    const mhWeaponSpeed = validateSwingInput(document.getElementById("mainhand-speed"), true);
    const ohWeaponSpeed = validateSwingInput(document.getElementById("offhand-speed"), true);
    const quickness = validateSwingInput(document.getElementById("quickness"), true) ?? 0;
    const toa = validateSwingInput(document.getElementById("toa-melee-speed"), true) ?? 0;
    const haste = validateSwingInput(document.getElementById("haste"), true) ?? 0;
    const celerity = validateSwingInput(document.getElementById("celerity"), true) ?? 0;

    if (mhWeaponSpeed == null) {
      resultText.textContent = "—";
      disclaimerText.textContent = "";
      disclaimerText.classList.remove("font-semibold", "text-amber-400");
      return;
    }

    let speed = calculateSwingSpeed(mhWeaponSpeed, quickness, toa, haste, celerity);
    const ohSpeed = ohWeaponSpeed != null ? calculateSwingSpeed(ohWeaponSpeed, quickness, toa, haste, celerity) : null;
    if (ohSpeed != null) {
      speed = Math.round((speed + ohSpeed) / 2 * 100) / 100;
    }

    resultText.textContent = speed + "s";
    if (speed < 1.5) {
      disclaimerText.textContent = "Effective cap is 1.5s";
      disclaimerText.classList.add("font-semibold", "text-amber-400");
    } else {
      disclaimerText.textContent = "";
      disclaimerText.classList.remove("font-semibold", "text-amber-400");
    }
  }

  btnInfo.addEventListener("click", openInfoModal);
  infoBackdrop.addEventListener("click", closeInfoModal);
  infoClose.addEventListener("click", closeInfoModal);
  infoCloseBtn.addEventListener("click", closeInfoModal);

  btnOpen.addEventListener("click", openModal);
  btnClose.addEventListener("click", closeModal);
  btnClose2.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);

  inputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", runSwingCalc);
  });
}

// --- Buffs Cap Calculator ---
// Buff formula per Laekker (Eden dev, 3/2023): effectiveness = 0.75 + specLevel*0.5/spellLevel (capped 0.75-1.25), ToA applied after. -1 terms: spell levels start at 1, not 0.
function calcBuffsActual(delveValue, spellLevel, compositeSpec, toaDecimal, cap) {
  if (!delveValue || !spellLevel || spellLevel <= 1) return null;
  const effectiveness = Math.min(Math.max(0.75 + (compositeSpec - 1) * 0.5 / (spellLevel - 1), 0.75), 1.25);
  const toaFactor = Math.min(1 + toaDecimal, 1.25);
  let val = delveValue * effectiveness * toaFactor;
  val = Math.max(val, 0.75 * delveValue);
  val = Math.min(val, cap);
  return Math.floor(val);
}

function initBuffsCapModal() {
  const modal = document.getElementById("buffs-cap-modal");
  const btnOpen = document.getElementById("buffs-cap-btn");
  const btnClose = document.getElementById("buffs-cap-close");
  const btnClose2 = document.getElementById("buffs-cap-close-btn");
  const backdrop = document.getElementById("buffs-cap-backdrop");
  const resultsDiv = document.getElementById("buffs-cap-results");
  const inputToa = document.getElementById("buffs-toa");
  const inputAug = document.getElementById("buffs-aug");
  const inputItems = document.getElementById("buffs-items");

  function openModal() {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    runBuffsCalc();
  }
  function closeModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  const infoModal = document.getElementById("buffs-cap-info-modal");
  const btnInfo = document.getElementById("buffs-cap-info-btn");
  const infoBackdrop = document.getElementById("buffs-cap-info-backdrop");
  const infoClose = document.getElementById("buffs-cap-info-close");
  const infoCloseBtn = document.getElementById("buffs-cap-info-close-btn");

  function openInfoModal() {
    infoModal.classList.remove("hidden");
    infoModal.setAttribute("aria-hidden", "false");
  }
  function closeInfoModal() {
    infoModal.classList.add("hidden");
    infoModal.setAttribute("aria-hidden", "true");
  }

  btnInfo.addEventListener("click", openInfoModal);
  infoBackdrop.addEventListener("click", closeInfoModal);
  infoClose.addEventListener("click", closeInfoModal);
  infoCloseBtn.addEventListener("click", closeInfoModal);

  btnOpen.addEventListener("click", openModal);
  btnClose.addEventListener("click", closeModal);
  btnClose2.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);

  // Base values by class (spell level and delve)
  const BUFFS_BASES = {
    midgard: {
      spell: { dexH: 48, strH: 50, conH: 47, afH: 42, dexL: 37, strL: 43, conL: 38, afL: 31 },
      delve: { dexH: 48, strH: 50, conH: 47, afH: 52, dexL: 39, strL: 44, conL: 40, afL: 41 },
    },
    albion: {
      spell: { dexH: 48, strH: 50, conH: 43, afH: 42, dexL: 38, strL: 41, conL: 33, afL: 31 },
      delve: { dexH: 48, strH: 50, conH: 44, afH: 52, dexL: 40, strL: 42, conL: 36, afL: 41 },
    },
    hibernia: {
      spell: { dexH: 48, strH: 50, conH: 43, afH: 45, dexL: 38, strL: 41, conL: 33, afL: 32 },
      delve: { dexH: 48, strH: 50, conH: 44, afH: 55, dexL: 40, strL: 42, conL: 36, afL: 42 },
    },
  };

  // Spec buffs (yellow): same formula as base, cap 93. Keyed by realm.
  const SPEC_BUFFS = {
    midgard: {
      strCon: { spell: { h: 46, l: 36 }, delve: { h: 69, l: 57 }, cap: 93 },
      dexQui: { spell: { h: 47, l: 37 }, delve: { h: 70, l: 60 }, cap: 93 },
      acuity: { spell: { h: 42, l: 31 }, delve: { h: 52, l: 41 }, cap: 93 },
    },
    albion: {
      strCon: { spell: { h: 46, l: 35 }, delve: { h: 69, l: 57 }, cap: 93 },
      dexQui: { spell: { h: 50, l: 40 }, delve: { h: 75, l: 63 }, cap: 93 },
      acuity: { spell: { h: 42, l: 31 }, delve: { h: 52, l: 41 }, cap: 93 },
    },
    hibernia: {
      strCon: { spell: { h: 44, l: 34 }, delve: { h: 67, l: 55 }, cap: 93 },
      dexQui: { spell: { h: 49, l: 39 }, delve: { h: 73, l: 61 }, cap: 93 },
      acuity: { spell: { h: 42, l: 31 }, delve: { h: 52, l: 41 }, cap: 93 },
    },
  };

  const classWrap = document.getElementById("buffs-class-wrap");
  const getSelectedRealm = () => document.querySelector('input[name="buffs-class"]:checked')?.value || "midgard";

  const augLabel = document.getElementById("buffs-aug-label");
  const SPEC_NAMES = { midgard: "Aug", albion: "Enhance", hibernia: "Nurture" };

  function updateRealmGlow() {
    const val = getSelectedRealm();
    classWrap.querySelectorAll(".realm-radio-card").forEach((card) => {
      card.classList.toggle("selected", card.dataset.realm === val);
    });
    if (augLabel) augLabel.textContent = `Natural ${SPEC_NAMES[val] || "Aug"} Spec`;
  }

  function runBuffsCalc() {
    const toa = parseFloat(inputToa.value) || 0;
    const aug = parseFloat(inputAug.value) || 0;
    const items = parseFloat(inputItems.value) || 0;
    const compositeSpec = aug + items;
    const toaDecimal = toa / 100;
    const sel = getSelectedRealm();
    const bases = BUFFS_BASES[sel] || BUFFS_BASES.midgard;
    const spell = bases.spell;
    const delve = bases.delve;
    const CAP = 62;
    const AFCAP = 1e9;

    const out = {
      dexH: calcBuffsActual(delve.dexH, spell.dexH, compositeSpec, toaDecimal, CAP),
      strH: calcBuffsActual(delve.strH, spell.strH, compositeSpec, toaDecimal, CAP),
      conH: calcBuffsActual(delve.conH, spell.conH, compositeSpec, toaDecimal, CAP),
      afH: calcBuffsActual(delve.afH, spell.afH, compositeSpec, toaDecimal, AFCAP),
      dexL: calcBuffsActual(delve.dexL, spell.dexL, compositeSpec, toaDecimal, CAP),
      strL: calcBuffsActual(delve.strL, spell.strL, compositeSpec, toaDecimal, CAP),
      conL: calcBuffsActual(delve.conL, spell.conL, compositeSpec, toaDecimal, CAP),
      afL: calcBuffsActual(delve.afL, spell.afL, compositeSpec, toaDecimal, AFCAP),
    };

    ["dex", "str", "con", "af"].forEach((stat) => {
      document.getElementById(`buffs-out-${stat}-h`).textContent = out[`${stat}H`] ?? "—";
      document.getElementById(`buffs-out-${stat}-l`).textContent = out[`${stat}L`] ?? "—";
    });
    document.getElementById("buffs-miss-dex-h").textContent = out.dexH != null ? CAP - out.dexH : "—";
    document.getElementById("buffs-miss-dex-l").textContent = out.dexL != null ? CAP - out.dexL : "—";
    document.getElementById("buffs-miss-str-h").textContent = out.strH != null ? CAP - out.strH : "—";
    document.getElementById("buffs-miss-str-l").textContent = out.strL != null ? CAP - out.strL : "—";
    document.getElementById("buffs-miss-con-h").textContent = out.conH != null ? CAP - out.conH : "—";
    document.getElementById("buffs-miss-con-l").textContent = out.conL != null ? CAP - out.conL : "—";

    const specBases = SPEC_BUFFS[sel];
    if (specBases) {
      const setSpec = (id, buff, cap) => {
        const spellH = specBases[buff].spell.h;
        const spellL = specBases[buff].spell.l;
        const h = aug >= spellH ? calcBuffsActual(specBases[buff].delve.h, spellH, compositeSpec, toaDecimal, cap) : null;
        const l = aug >= spellL ? calcBuffsActual(specBases[buff].delve.l, spellL, compositeSpec, toaDecimal, cap) : null;
        document.getElementById(`buffs-spec-${id}-h`).textContent = h != null ? h : "N/A";
        document.getElementById(`buffs-spec-${id}-l`).textContent = l != null ? l : "N/A";
        document.getElementById(`buffs-spec-${id}-miss-h`).textContent = h != null ? cap - h : "N/A";
        document.getElementById(`buffs-spec-${id}-miss-l`).textContent = l != null ? cap - l : "N/A";
      };
      setSpec("strcon", "strCon", 93);
      setSpec("dexqui", "dexQui", 93);
      setSpec("acuity", "acuity", 93);
    } else {
      document.getElementById("buffs-spec-strcon-h").textContent = "N/A";
      document.getElementById("buffs-spec-strcon-l").textContent = "N/A";
      document.getElementById("buffs-spec-strcon-miss-h").textContent = "N/A";
      document.getElementById("buffs-spec-strcon-miss-l").textContent = "N/A";
      document.getElementById("buffs-spec-dexqui-h").textContent = "N/A";
      document.getElementById("buffs-spec-dexqui-l").textContent = "N/A";
      document.getElementById("buffs-spec-dexqui-miss-h").textContent = "N/A";
      document.getElementById("buffs-spec-dexqui-miss-l").textContent = "N/A";
      document.getElementById("buffs-spec-acuity-h").textContent = "N/A";
      document.getElementById("buffs-spec-acuity-l").textContent = "N/A";
      document.getElementById("buffs-spec-acuity-miss-h").textContent = "N/A";
      document.getElementById("buffs-spec-acuity-miss-l").textContent = "N/A";
    }
  }

  classWrap.addEventListener("change", () => { updateRealmGlow(); runBuffsCalc(); });
  updateRealmGlow();
  inputToa.addEventListener("input", runBuffsCalc);
  inputAug.addEventListener("input", runBuffsCalc);
  inputItems.addEventListener("input", runBuffsCalc);
}

function updateViewToggle() {
  const track = document.querySelector("#view-toggle .view-toggle-track");
  const toggle = document.getElementById("view-toggle");
  if (track && toggle) {
    track.classList.remove("condensed", "detailed");
    track.classList.add(condensedView ? "condensed" : "detailed");
    toggle.setAttribute("aria-checked", condensedView ? "true" : "false");
  }
}

function initViewToggle() {
  const toggle = document.getElementById("view-toggle");
  const options = document.querySelectorAll(".view-toggle-option");
  if (toggle && options.length) {
    updateViewToggle();
    options.forEach((opt) => {
      opt.addEventListener("click", () => {
        const view = opt.getAttribute("data-view");
        const newCondensed = view === "condensed";
        if (newCondensed === condensedView) return;
        condensedView = newCondensed;
        localStorage.setItem("condensedView", condensedView);
        updateViewToggle();
        renderAllBosses(currentData);
      });
    });
  }
}

// Start the data loading process
loadBossData();
setInterval(loadBossData, 60000); // Refresh every 60 seconds
initViewToggle();
initSwingSpeedModal();
initBuffsCapModal();

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
    checkbox.className = 'form-checkbox h-5 w-5 text-blue-500 rounded focus:ring focus:ring-blue-300';

    checkbox.addEventListener('change', (e) => {
      categoryVisibility[category] = e.target.checked;
      saveCategoryVisibility();
      renderAllBosses(currentData); // Re-render bosses
    });

    const label = document.createElement('label');
    label.htmlFor = `filter-${category}`;
    label.className = 'text-sm text-gray-300 ml-2';
    label.textContent = category;

    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-2';
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);

    filtersContainer.appendChild(wrapper);
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

function createBossCard(bossName, boss, history, realm = null) {
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
  bossCard.className = `bg-gray-700 text-white rounded-lg shadow p-4 ${borderClass}`;
  bossCard.id = cardId;
  bossCard.setAttribute('data-boss-name', bossName);
  bossCard.setAttribute('data-realm', realm || 'all');
  bossCard.setAttribute('data-respawn-time', respawnTime);

  bossCard.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <h3 class="text-xl font-semibold text-orange-200 flex-grow text-left leading-none">
        ${displayName}
        ${alias ? `<br /><span class="text-sm text-gray-400">(${alias})</span>` : ""}
      </h3>
      <p class="text-xs text-gray-400 text-right flex-shrink-0 w-2/5">
        Base Respawn Time: ${formatDeltaMinutes(respawnTime)}<br />
        (+/- 20%)
      </p>
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
    <div class="mt-4">
      <table id="${tableId}" class="boss-history-table table-auto w-full text-left text-sm border border-gray-700" data-boss="${bossName}" data-realm="${realm || 'all'}">
        <thead class="bg-gray-700 text-gray-200">
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
  bossCard.className = `bg-gray-700 text-white rounded-lg shadow p-4`;
  bossCard.id = `boss-card-other-bosses`;
  bossCard.setAttribute('data-boss-name', 'Other Bosses');
  bossCard.setAttribute('data-realm', 'all');

  bossCard.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <h3 class="text-xl font-semibold text-orange-200 flex-grow text-left leading-none">
        Other Bosses
        <br /><span class="text-sm text-gray-400">(Last 50 kills)</span>
      </h3>
    </div>
    <div class="mt-4">
      <table id="boss-table-other-bosses" class="boss-history-table table-auto w-full text-left text-sm border border-gray-700" data-boss="Other Bosses" data-realm="all">
        <thead class="bg-gray-700 text-gray-200">
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

function renderAllBosses(data) {
  const container = document.getElementById("boss-container");
  container.innerHTML = "";

  // Get dynamic "Other Bosses" kills
  const otherBossKills = getOtherBosses(data);
  
  // Create combined categories including dynamic "Other Bosses"
  const allCategories = { ...bossCategories };
  if (otherBossKills.length > 0) {
    allCategories["Other Bosses"] = {}; // Empty object, we'll handle this specially
  }

  Object.entries(allCategories).forEach(([categoryName, bosses]) => {
    if (!categoryVisibility[categoryName]) return;

    const categorySection = document.createElement("div");
    categorySection.className = "mb-8";
    
    const categoryTitle = document.createElement("h2");
    categoryTitle.className = "text-2xl font-bold text-orange-200 mb-4 border-b-2 border-orange-500 pb-2";
    categoryTitle.textContent = categoryName;
    categorySection.appendChild(categoryTitle);

    const bossesGrid = document.createElement("div");
    
    // Special handling for "Other Bosses"
    if (categoryName === "Other Bosses") {
      bossesGrid.className = "flex justify-center";
      const centerWrapper = document.createElement("div");
      centerWrapper.className = "w-full max-w-4xl"; // Wider for the table
      const otherBossesCard = createOtherBossesCard(otherBossKills);
      centerWrapper.appendChild(otherBossesCard);
      bossesGrid.appendChild(centerWrapper);
    }
    // Special layout for specific categories
    else if (categoryName === "Darkness Falls") {
      bossesGrid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6";
      
      Object.entries(bosses).forEach(([bossName, boss]) => {
        const bossCard = createBossCard(bossName, boss, data[bossName] || []);
        bossesGrid.appendChild(bossCard);
      });
    } else if (categoryName === "Summoner's Hall") {
      bossesGrid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6";
      
      Object.entries(bosses).forEach(([bossName, boss]) => {
        const bossCard = createBossCard(bossName, boss, data[bossName] || []);
        bossesGrid.appendChild(bossCard);
      });
    } else {
      // Default layout for other categories
      const bossCount = Object.keys(bosses).reduce((count, bossName) => {
        const boss = bosses[bossName];
        return count + (boss.realms ? 3 : 1); // Count realm-specific bosses as 3
      }, 0);
      
      if (bossCount === 1) {
        // Center single boss cards
        bossesGrid.className = "flex justify-center";
        const centerWrapper = document.createElement("div");
        centerWrapper.className = "w-full max-w-md";
        bossesGrid.appendChild(centerWrapper);
        
        Object.entries(bosses).forEach(([bossName, boss]) => {
          if (boss.realms) {
            ['Albion', 'Hibernia', 'Midgard'].forEach(realm => {
              const bossCard = createBossCard(bossName, boss, data[bossName] || [], realm);
              centerWrapper.appendChild(bossCard);
            });
          } else {
            const bossCard = createBossCard(bossName, boss, data[bossName] || []);
            centerWrapper.appendChild(bossCard);
          }
        });
      } else {
        bossesGrid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";
        
        Object.entries(bosses).forEach(([bossName, boss]) => {
          if (boss.realms) {
            ['Albion', 'Hibernia', 'Midgard'].forEach(realm => {
              const bossCard = createBossCard(bossName, boss, data[bossName] || [], realm);
              bossesGrid.appendChild(bossCard);
            });
          } else {
            const bossCard = createBossCard(bossName, boss, data[bossName] || []);
            bossesGrid.appendChild(bossCard);
          }
        });
      }
    }

    categorySection.appendChild(bossesGrid);
    container.appendChild(categorySection);
  });
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
    checkbox.className = 'form-checkbox h-5 w-5 text-blue-500 rounded focus:ring focus:ring-blue-300';

    checkbox.addEventListener('change', (e) => {
      categoryVisibility[category] = e.target.checked;
      saveCategoryVisibility();
      renderAllBosses(currentData); // Re-render bosses
    });

    const label = document.createElement('label');
    label.htmlFor = `filter-${category}`;
    label.className = 'text-sm text-gray-300 ml-2';
    label.textContent = category;

    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-2';
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);

    filtersContainer.appendChild(wrapper);
  });
}

// Start the data loading process
loadBossData();
setInterval(loadBossData, 60000); // Refresh every 60 seconds

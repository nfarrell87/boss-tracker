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
    "The Phoenix": { respawnTime: 240, alias: "ML9" },
    "Draco": { respawnTime: 120, alias: "ML10" },
  },
};

const categoryVisibility = JSON.parse(localStorage.getItem('categoryVisibility')) || {};

// Ensure all categories have a default visibility state
Object.keys(bossCategories).forEach((category) => {
  if (categoryVisibility[category] === undefined) {
    categoryVisibility[category] = true; // Default to visible
  }
});

// Save visibility state to localStorage
function saveCategoryVisibility() {
  localStorage.setItem('categoryVisibility', JSON.stringify(categoryVisibility));
}

// Render checkboxes for category filters
function renderCategoryFilters() {
  const filtersContainer = document.getElementById('category-filters');
  filtersContainer.innerHTML = ''; // Clear existing filters

  Object.keys(bossCategories).forEach((category) => {
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

    if (JSON.stringify(newData) !== JSON.stringify(currentData)) {
      currentData = newData;
      renderAllBosses(newData);
    }

    const now = new Date();
    nextUpdateTime = new Date(now.getTime() + 60000);

    const updateInfo = document.getElementById("update-info");
    updateInfo.innerHTML = `
      <span>Last Updated: <strong>${now.toLocaleTimeString()}</strong></span>
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

function createBossCard(bossName, boss, history) {
  const now = Math.floor(Date.now() / 1000);
  const { respawnTime, alias } = boss;
  const latestKill = history[0];

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

  const bossCard = document.createElement("div");
  bossCard.className = "bg-gray-700 text-white rounded-lg shadow p-4";

  bossCard.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <h3 class="text-xl font-semibold text-orange-200 flex-grow text-left leading-none">
        ${bossName}
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
      <table class="table-auto w-full text-left text-sm border border-gray-700">
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

function renderAllBosses(data) {
  const container = document.getElementById("boss-container");
  container.innerHTML = '';

  // Define the current time at the start of the function
  const now = Math.floor(Date.now() / 1000);

  // Create a grid container for categories
  const gridWrapper = document.createElement("div");
  gridWrapper.className = "grid grid-cols-1 gap-10";

  // Loop through each category
  Object.entries(bossCategories).forEach(([categoryName, bosses]) => {
    if (!categoryVisibility[categoryName]) return; // Skip rendering if category is hidden

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

    if (categoryName === "Darkness Falls") {
      // Custom layout for Darkness Falls
      bossesGrid.className = "grid gap-6";

      // Top row: Legion and one High Lord
      const topRow = document.createElement("div");
      topRow.className = "grid grid-cols-2 gap-6 justify-center";
      ["Legion", "High Lord Baelerdoth"].forEach((bossName) => {
        const boss = bosses[bossName];
        if (boss) {
          const bossCard = createBossCard(bossName, boss, data[bossName] || []);
          topRow.appendChild(bossCard);
        }
      });
      bossesGrid.appendChild(topRow);

      // Middle row: Three High Lords
      const middleRow = document.createElement("div");
      middleRow.className = "grid grid-cols-3 gap-6 justify-center";
      ["High Lord Baln", "High Lord Oro", "High Lord Saeor"].forEach((bossName) => {
        const boss = bosses[bossName];
        if (boss) {
          const bossCard = createBossCard(bossName, boss, data[bossName] || []);
          middleRow.appendChild(bossCard);
        }
      });
      bossesGrid.appendChild(middleRow);

      // Bottom row: Three Princes
      const bottomRow = document.createElement("div");
      bottomRow.className = "grid grid-cols-3 gap-6 justify-center";
      ["Prince Asmoien", "Prince Ba'alorien", "Prince Abdin"].forEach((bossName) => {
        const boss = bosses[bossName];
        if (boss) {
          const bossCard = createBossCard(bossName, boss, data[bossName] || []);
          bottomRow.appendChild(bossCard);
        }
      });
      bossesGrid.appendChild(bottomRow);
    } else if (categoryName === "Summoner's Hall") {
      // Custom layout for Summoner's Hall
      bossesGrid.className = "grid gap-6";

      // Top row: Grand Summoner Govannon and Aidon the Archwizard
      const topRow = document.createElement("div");
      topRow.className = "grid grid-cols-2 gap-6 justify-center";
      ["Grand Summoner Govannon", "Aidon the Archwizard"].forEach((bossName) => {
        const boss = bosses[bossName];
        if (boss) {
          const bossCard = createBossCard(bossName, boss, data[bossName] || []);
          topRow.appendChild(bossCard);
        }
      });
      bossesGrid.appendChild(topRow);

      // Bottom row: Summoner Roesia, Summoner Cunovinda, and Summoner Lossren
      const bottomRow = document.createElement("div");
      bottomRow.className = "grid grid-cols-3 gap-6 justify-center";
      ["Summoner Roesia", "Summoner Cunovinda", "Summoner Lossren"].forEach((bossName) => {
        const boss = bosses[bossName];
        if (boss) {
          const bossCard = createBossCard(bossName, boss, data[bossName] || []);
          bottomRow.appendChild(bossCard);
        }
      });
      bossesGrid.appendChild(bottomRow);
    } else {
      // Default layout for other categories
      Object.entries(bosses).forEach(([bossName, boss]) => {
        const bossCard = createBossCard(bossName, boss, data[bossName] || []);
        bossesGrid.appendChild(bossCard);
      });
    }

    categoryCard.appendChild(categoryTitle);
    categoryCard.appendChild(bossesGrid);
    gridWrapper.appendChild(categoryCard);
  });

  container.appendChild(gridWrapper);
}

// Start the data loading and countdown process
loadBossData();
setInterval(loadBossData, 60000); // Refresh every 60 seconds
renderCategoryFilters(); // Render category filters

/**
 * Eden DAoC Campaign Level Calculator
 * Recreates the Main tab logic from the Google Sheet calculator.
 */

const CHARACTERS_STORAGE_KEY = "campaignCharacters";
const BASE_TITLE = "Eden DAoC Campaign Calculator";

function generateId() {
  return "c_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
}

function loadCharacters() {
  try {
    const raw = localStorage.getItem(CHARACTERS_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.characters?.length) {
        data.characters.forEach((c) => { if (c.lastUpdated === undefined) c.lastUpdated = null; });
        return data;
      }
    }
    // Migrate from old single-character format
    const oldName = localStorage.getItem("campaignCharacterName");
    return {
      characters: [{ id: "main", name: oldName || "Main", levels: {}, lastUpdated: null }],
      activeId: "main",
    };
  } catch {
    return {
      characters: [{ id: "main", name: "Main", levels: {}, lastUpdated: null }],
      activeId: "main",
    };
  }
}

function saveCharacters(data) {
  localStorage.setItem(CHARACTERS_STORAGE_KEY, JSON.stringify(data));
}

// Task Reward: incremental XP for completing each level (index 0 = level 1)
const TASK_REWARD = [25, 35, 45, 50, 60, 70, 75, 90, 95, 110];
const TASK_REWARD_EXTENDED = [...TASK_REWARD, 120, 130, 140, 150, 160];

// Campaign Total: cumulative XP to reach each campaign level (index = level)
const CAMPAIGN_TOTAL = [0, 100, 300, 500, 800, 1100, 1500, 1900, 2400, 2900, 3500];

// 21 tasks with names and max levels
const TASKS = [
  { name: "Big Game Hunter", maxLevel: 12 },
  { name: "Capture or Defend Keeps", maxLevel: 12 },
  { name: "Capture or Defend Relics", maxLevel: 12 },
  { name: "Capture or Defend Towers", maxLevel: 12 },
  { name: "Consider Yourself Evicted", maxLevel: 12 },
  { name: "Deliver War Supplies", maxLevel: 12 },
  { name: "Destroy Enemy Golems and Laborer", maxLevel: 12 },
  { name: "Frontline Participant", maxLevel: 14 },
  { name: "I Was Tired of Sitting Around", maxLevel: 14 },
  { name: "Kill The Behemoths", maxLevel: 14 },
  { name: "Maybe We Get Things Moving", maxLevel: 12 },
  { name: "Participate in Large Fair Fights", maxLevel: 12 },
  { name: "Participate in Large PVP Events", maxLevel: 12 },
  { name: "Participate in Small Fair Fights", maxLevel: 12 },
  { name: "Player Kills", maxLevel: 15 },
  { name: "Taste of Blood Participant", maxLevel: 10 },
  { name: "Taste of Blood Victor", maxLevel: 10 },
  { name: "Timed Mission Completion", maxLevel: 10 },
  { name: "Win in Large PVP Events", maxLevel: 10 },
  { name: "Win Large Fair Fights", maxLevel: 10 },
  { name: "Win Small Fair Fights", maxLevel: 10 },
];

// Rewards by campaign level
const REWARDS = {
  0: "Relic realm points multiplied against campaign level",
  1: "Relic realm points multiplied against campaign level",
  2: `Relic realm points multiplied against campaign level
Champion level or alchemy supply sack
100 Luna Coins
Pet whistle (from across all realms)
Incantation (from across all realms)
Pattern  (from across all realms)
Mount (from across all realms)
Low chance dungeon mythirian
Low chance Deserter mythirian`,
  3: `Relic realm points multiplied against campaign level
Champion level or alchemy supply sack
100 Luna Coins
Pet whistle (from across all realms)
Incantation (from across all realms)
Pattern  (from across all realms)
Mount (from across all realms)
Low chance dungeon mythirian
Low chance Deserter mythirian`,
  4: `Relic realm points multiplied against campaign level
400 Luna Coins
Pet whistle, low chance rare pet whistle
Incantation, low chance rare incantation
Pattern, low chance rare pattern
Mount, low chance rare mount
Low chance respec stone
Dungeon mythirian, low chance Deserter mythirian`,
  5: `Relic realm points multiplied against campaign level
400 Luna Coins
Pet whistle, low chance rare pet whistle
Incantation, low chance rare incantation
Pattern, low chance rare pattern
Mount, low chance rare mount
Low chance respec stone
Dungeon mythirian, low chance Deserter mythirian`,
  6: `Relic realm points multiplied against campaign level
400 Luna Coins
Pet whistle, low chance rare pet whistle
Incantation, low chance rare incantation
Pattern, low chance rare pattern
Mount, low chance rare mount
Low chance respec stone
Dungeon mythirian, low chance Deserter mythirian`,
  7: `Relic realm points multiplied against campaign level
1,000 Luna Coins
Pet whistle, medium chance at a rare pet whistle
Incantation, medium chance at a rare incantation
Pattern, medium chance at a rare pattern
Mount, medium chance at a rare mount
Medium chance at a respec stone
Dungeon mythirian
Deserter mythirian`,
  8: `Relic realm points multiplied against campaign level
1,000 Luna Coins
Pet whistle, medium chance at a rare pet whistle
Incantation, medium chance at a rare incantation
Pattern, medium chance at a rare pattern
Mount, medium chance at a rare mount
Medium chance at a respec stone
Dungeon mythirian
Deserter mythirian`,
  9: `Relic realm points multiplied against campaign level
1,000 Luna Coins
Pet whistle, medium chance at a rare pet whistle
Incantation, medium chance at a rare incantation
Pattern, medium chance at a rare pattern
Mount, medium chance at a rare mount
Medium chance at a respec stone
Dungeon mythirian
Deserter mythirian`,
  10: `Relic realm points multiplied against campaign level
1,200 Luna Coins
Pet whistle, high chance at a rare pet whistle
Incantation, 1 rare incantation
Pattern, 1 rare pattern
Rare mount, low chance new exclusive mount
Low chance exclusive cloak (Silverstars & Heartforged)
High chance major respec stones
Major Deserter mythirian (Arcane, Mighty or Curative)
Low chance Infernal sleeves
Improved Barrel of Combined Regeneration`,
};

// Cumulative XP for task level (sum of TASK_REWARD up to level)
function getTotalXP(level) {
  if (!level || level === "None") return 0;
  const n = parseInt(level.replace("Level ", ""), 10);
  if (n < 1) return 0;
  const rewards = n <= 10 ? TASK_REWARD : TASK_REWARD_EXTENDED;
  let sum = 0;
  for (let i = 0; i < n && i < rewards.length; i++) {
    sum += rewards[i];
  }
  return sum;
}

// Incremental XP for next level, or "MAX" at cap
function getNextLevelXP(level, maxLevel) {
  if (!level || level === "None") return TASK_REWARD[0];
  const n = parseInt(level.replace("Level ", ""), 10);
  if (n >= maxLevel) return "MAX";
  const rewards = maxLevel <= 10 ? TASK_REWARD : TASK_REWARD_EXTENDED;
  return rewards[n] ?? "MAX";
}

// Campaign level from total points
function getCampaignLevel(totalPoints) {
  for (let i = CAMPAIGN_TOTAL.length - 1; i >= 0; i--) {
    if (totalPoints >= CAMPAIGN_TOTAL[i]) return i;
  }
  return 0;
}

// XP needed to reach next campaign level, or "GG you won!" at max
function getNextLevelIn(totalPoints, campaignLevel) {
  if (campaignLevel >= 10) return "GG you won!";
  const nextThreshold = CAMPAIGN_TOTAL[campaignLevel + 1];
  return nextThreshold - totalPoints;
}

// Check if completing this task's next level would level up the campaign
function wouldLevelUp(totalPoints, taskTotalXP, level, maxLevel) {
  const nextXP = getNextLevelXP(level, maxLevel);
  if (nextXP === "MAX") return false;
  if (!level || level === "None") {
    // At None: completing Level 1 would add nextXP (25)
    const newTotal = totalPoints + nextXP;
    return getCampaignLevel(newTotal) > getCampaignLevel(totalPoints);
  }
  const n = parseInt(level.replace("Level ", ""), 10);
  if (n >= maxLevel) return false;
  const newTotal = totalPoints + nextXP;
  const currentCampaign = getCampaignLevel(totalPoints);
  const newCampaign = getCampaignLevel(newTotal);
  return newCampaign > currentCampaign;
}

// Build level options for a task
function getLevelOptions(maxLevel) {
  const opts = ["None"];
  for (let i = 1; i <= maxLevel; i++) opts.push(`Level ${i}`);
  return opts;
}

// Build task table
function buildTaskTable() {
  const tbody = document.getElementById("campaign-tasks-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  TASKS.forEach((task, i) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-gray-700 hover:bg-gray-800/50 transition-colors";
    tr.dataset.taskIndex = i;

    const tdName = document.createElement("td");
    tdName.className = "py-2 px-3 text-gray-300 text-sm";
    tdName.textContent = task.name;

    const tdLevel = document.createElement("td");
    tdLevel.className = "py-2 px-3";
    const select = document.createElement("select");
    select.className =
      "campaign-level-select w-full text-sm bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
    select.dataset.taskIndex = i;
    getLevelOptions(task.maxLevel).forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      select.appendChild(o);
    });
    select.addEventListener("change", recalculate);
    tdLevel.appendChild(select);

    const tdTotal = document.createElement("td");
    tdTotal.className = "py-2 px-3 text-right text-gray-300 font-mono text-sm";
    tdTotal.dataset.totalXp = i;

    const tdNext = document.createElement("td");
    tdNext.className = "py-2 px-3 text-right text-gray-400 font-mono text-sm";
    tdNext.dataset.nextXp = i;

    tr.appendChild(tdName);
    tr.appendChild(tdLevel);
    tr.appendChild(tdTotal);
    tr.appendChild(tdNext);

    tbody.appendChild(tr);
  });
}

function recalculate() {
  const selects = document.querySelectorAll(".campaign-level-select");
  let totalPoints = 0;

  // First pass: compute full total (needed for correct yellow highlight)
  selects.forEach((select, i) => {
    totalPoints += getTotalXP(select.value);
  });

  // Second pass: update cells and highlights
  selects.forEach((select, i) => {
    const task = TASKS[i];
    const level = select.value;
    const totalXP = getTotalXP(level);
    const nextXP = getNextLevelXP(level, task.maxLevel);

    const tdTotal = document.querySelector(`[data-total-xp="${i}"]`);
    const tdNext = document.querySelector(`[data-next-xp="${i}"]`);
    const tr = select.closest("tr");

    if (tdTotal) tdTotal.textContent = totalXP;
    if (tdNext) tdNext.textContent = nextXP;

    const wouldLevel = wouldLevelUp(totalPoints, totalXP, level, task.maxLevel);
    if (tr) tr.classList.toggle("campaign-task-highlight", wouldLevel);
  });

  const campaignLevel = getCampaignLevel(totalPoints);
  const nextLevelIn = getNextLevelIn(totalPoints, campaignLevel);

  const totalEl = document.getElementById("campaign-total-points");
  const levelEl = document.getElementById("campaign-level");
  const nextEl = document.getElementById("campaign-next-in");

  if (totalEl) totalEl.textContent = totalPoints;
  if (levelEl) levelEl.textContent = `Level ${campaignLevel}`;
  if (nextEl) nextEl.textContent = nextLevelIn;

  const rewardsEl = document.getElementById("campaign-rewards");
  if (rewardsEl) {
    rewardsEl.innerHTML = (REWARDS[campaignLevel] ?? "")
      .split("\n")
      .map((line) => `<div class="text-sm text-gray-300">${line}</div>`)
      .join("");
  }
}

function reset() {
  document.querySelectorAll(".campaign-level-select").forEach((el) => {
    el.value = "None";
  });
  recalculate();
  saveCurrentLevels();
  updateTimestampDisplay();
}

function updateTabTitle(characterName) {
  const name = (characterName || "").trim();
  document.title = name ? `${name} - ${BASE_TITLE}` : BASE_TITLE;
}

function formatLastUpdated(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Last updated: just now";
  if (diffMins < 60) return `Last updated: ${diffMins} min ago`;
  if (diffHours < 24) return `Last updated: ${diffHours} hr ago`;
  if (diffDays < 7) return `Last updated: ${diffDays} days ago`;
  return "Last updated: " + d.toLocaleDateString();
}

function updateTimestampDisplay() {
  const el = document.getElementById("campaign-last-updated");
  if (!el) return;
  const active = getActiveCharacter();
  el.textContent = active?.lastUpdated ? formatLastUpdated(active.lastUpdated) : "";
}

let charactersData = null;

function getActiveCharacter() {
  if (!charactersData) charactersData = loadCharacters();
  return charactersData.characters.find((c) => c.id === charactersData.activeId);
}

function touchLastUpdated() {
  const active = getActiveCharacter();
  if (active) active.lastUpdated = new Date().toISOString();
}

function saveCurrentLevels() {
  const active = getActiveCharacter();
  if (!active) return;
  const levels = {};
  document.querySelectorAll(".campaign-level-select").forEach((select, i) => {
    const val = select.value;
    if (val && val !== "None") levels[String(i)] = val;
  });
  active.levels = levels;
  touchLastUpdated();
  saveCharacters(charactersData);
  updateTimestampDisplay();
}

function loadLevelsIntoTable(levels) {
  document.querySelectorAll(".campaign-level-select").forEach((select, i) => {
    select.value = levels[String(i)] || "None";
  });
  recalculate();
}

function deleteCharacter(id, ev) {
  ev?.stopPropagation();
  if (charactersData.characters.length <= 1) return;
  saveCurrentLevels();
  const idx = charactersData.characters.findIndex((c) => c.id === id);
  if (idx < 0) return;
  charactersData.characters.splice(idx, 1);
  const next = charactersData.characters[Math.max(0, idx - 1)];
  charactersData.activeId = next.id;
  saveCharacters(charactersData);
  const active = getActiveCharacter();
  loadLevelsIntoTable(active?.levels || {});
  renderTabs();
  const characterInput = document.getElementById("campaign-character");
  if (characterInput) {
    characterInput.value = active?.name || "";
    updateTabTitle(active?.name);
  }
  updateTimestampDisplay();
}

function renderTabs() {
  const container = document.getElementById("campaign-tabs");
  if (!container) return;
  container.innerHTML = "";
  const canDelete = charactersData.characters.length > 1;
  charactersData.characters.forEach((char) => {
    const tab = document.createElement("div");
    tab.className = "campaign-tab" + (char.id === charactersData.activeId ? " active" : "");
    const nameBtn = document.createElement("button");
    nameBtn.type = "button";
    nameBtn.className = "campaign-tab-name";
    nameBtn.textContent = char.name || "Unnamed";
    nameBtn.dataset.id = char.id;
    nameBtn.addEventListener("click", () => switchCharacter(char.id));
    tab.appendChild(nameBtn);
    if (canDelete) {
      const del = document.createElement("button");
      del.type = "button";
      del.className = "campaign-tab-delete";
      del.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
      del.title = "Remove character";
      del.addEventListener("click", (e) => { e.stopPropagation(); deleteCharacter(char.id, e); });
      tab.appendChild(del);
    }
    container.appendChild(tab);
  });
}

function switchCharacter(id) {
  saveCurrentLevels();
  charactersData.activeId = id;
  saveCharacters(charactersData);
  const active = getActiveCharacter();
  loadLevelsIntoTable(active?.levels || {});
  renderTabs();
  const characterInput = document.getElementById("campaign-character");
  if (characterInput) {
    characterInput.value = active?.name || "";
    updateTabTitle(active?.name);
  }
  updateTimestampDisplay();
}

function getNextAltName() {
  let max = 0;
  for (const c of charactersData.characters) {
    const m = (c.name || "").match(/^Alt #(\d+)$/i);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `Alt #${max + 1}`;
}

function addCharacter() {
  saveCurrentLevels();
  const defaultName = getNextAltName();
  const newChar = { id: generateId(), name: defaultName, levels: {}, lastUpdated: null };
  charactersData.characters.push(newChar);
  charactersData.activeId = newChar.id;
  saveCharacters(charactersData);
  loadLevelsIntoTable({});
  renderTabs();
  const characterInput = document.getElementById("campaign-character");
  if (characterInput) {
    characterInput.value = defaultName;
    characterInput.focus();
    updateTabTitle(defaultName);
  }
  updateTimestampDisplay();
}

function init() {
  charactersData = loadCharacters();
  buildTaskTable();

  const active = getActiveCharacter();
  loadLevelsIntoTable(active?.levels || {});

  recalculate();

  renderTabs();
  updateTimestampDisplay();

  // Refresh timestamp display every minute so "just now" becomes "1 min ago" etc.
  setInterval(updateTimestampDisplay, 60000);

  const resetBtn = document.getElementById("campaign-reset");
  if (resetBtn) resetBtn.addEventListener("click", reset);

  const addBtn = document.getElementById("campaign-tab-add");
  if (addBtn) addBtn.addEventListener("click", addCharacter);

  // Save levels when user changes a dropdown
  document.querySelectorAll(".campaign-level-select").forEach((el) => {
    el.addEventListener("change", saveCurrentLevels);
  });

  // Character name: updates current tab's name
  const characterInput = document.getElementById("campaign-character");
  if (characterInput) {
    characterInput.value = active?.name || "";
    updateTabTitle(active?.name);
    characterInput.addEventListener("input", () => {
      const val = characterInput.value.trim();
      const activeChar = getActiveCharacter();
      if (activeChar) {
        activeChar.name = val || "Unnamed";
        touchLastUpdated();
        saveCharacters(charactersData);
        renderTabs();
        updateTabTitle(val || activeChar.name);
        updateTimestampDisplay();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", init);

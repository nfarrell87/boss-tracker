# Boss Timer API & Scraping Quick Guide

## 🚀 API Usage (Recommended)

**Base URL:** `https://wtfrickisup.com`

### Get All Data
```
GET /data
```

**Example Response:**
```json
{
  "The Phoenix": [
    {
      "killedAt": 1745550572,
      "killedBy": "7 members of Hibernia",
      "duration": "31s",
      "zone": "Cathal Valley"
    },
    {
      "killedAt": 1745528972,
      "killedBy": "5 members of Albion",
      "duration": "45s",
      "zone": "Cathal Valley"
    }
  ],
  "Golestandt": [
    {
      "killedAt": 1745548512,
      "killedBy": "8 members of Albion",
      "duration": "16s",
      "zone": "Dartmoor"
    }
  ]
}
```

### Get Realm-Specific Data
```
GET /api/realm/hibernia
GET /api/realm/albion  
GET /api/realm/midgard
```

**Example Response (Hibernia):**
```json
{
  "The Phoenix": [
    {
      "killedAt": 1745550572,
      "killedBy": "7 members of Hibernia",
      "duration": "31s",
      "zone": "Cathal Valley"
    }
  ],
  "Cuuldurach the Glimmer King": [
    {
      "killedAt": 1745549289,
      "killedBy": "6 members of Hibernia",
      "duration": "14s",
      "zone": "Sheeroe Hills"
    }
  ]
}
```

### Get Single Boss
```
GET /api/boss/The%20Phoenix
GET /api/boss/Golestandt
```

**Example Response:**
```json
{
  "The Phoenix": [
    {
      "killedAt": 1745550572,
      "killedBy": "7 members of Hibernia",
      "duration": "31s",
      "zone": "Cathal Valley"
    },
    {
      "killedAt": 1745528972,
      "killedBy": "5 members of Albion",
      "duration": "45s",
      "zone": "Cathal Valley"
    }
  ]
}
```

**Rate Limit:** 30 requests/minute per IP

## 📊 Data Format

Each kill entry contains:
- `killedAt` - Unix timestamp (use `new Date(killedAt * 1000)` in JavaScript)
- `killedBy` - Who killed the boss (includes realm info)
- `duration` - How long the fight took
- `zone` - Where the boss was killed

## 📝 Quick Code Examples

### Python
```python
import requests
from datetime import datetime

# Get Hibernia boss data
r = requests.get('https://wtfrickisup.com/api/realm/hibernia')
data = r.json()

# Calculate time since last Phoenix kill
if 'The Phoenix' in data:
    last_kill = data['The Phoenix'][0]
    kill_time = datetime.fromtimestamp(last_kill['killedAt'])
    print(f"Phoenix last killed at {kill_time} by {last_kill['killedBy']}")
```

### JavaScript
```javascript
// Get all boss data
fetch('/data')
  .then(r => r.json())
  .then(data => {
    // Check if Phoenix is up (360 min respawn ±20%)
    if (data['The Phoenix']) {
      const lastKill = data['The Phoenix'][0];
      const now = Math.floor(Date.now() / 1000);
      const minutesSinceKill = (now - lastKill.killedAt) / 60;
      
      if (minutesSinceKill >= 432) { // 360 + 72 (max spawn time)
        console.log('Phoenix is UP!');
      } else if (minutesSinceKill >= 288) { // 360 - 72 (min spawn time)
        console.log('Phoenix is in spawn window!');
      } else {
        const spawnIn = 288 - minutesSinceKill;
        console.log(`Phoenix spawns in ${spawnIn.toFixed(0)} minutes`);
      }
    }
  });
```

## 🔍 HTML Scraping (Not Recommended)

If you must scrape HTML, use these selectors:

- **Boss Cards:** `#boss-card-{boss-name}-{realm}`
- **Tables:** `#boss-table-{boss-name}-{realm}`
- **Data Attributes:** `data-boss-name`, `data-realm`, `data-respawn-time`

**Example:** Phoenix Hibernia = `#boss-card-the-phoenix-hibernia`

## ⚠️ Please Use API Instead of Scraping
- 10x faster responses
- Less server load  
- Won't break when HTML changes
- Structured JSON data

**Questions?** Don't hesisate to reach out and ask!
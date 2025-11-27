# Image Vault - Complete User Guide

## Overview
The Image Vault is your comprehensive mnemonic system manager. Store, organize, and manage your Major System, PAO System, and Memory Palaces with full CRUD operations and localStorage persistence.

## ✨ Key Features

### 🔍 Universal Search
- Search across all systems simultaneously
- Real-time filtering as you type
- Searches:
  - **Major System**: Numbers and images
  - **PAO System**: Cards, persons, actions, objects
  - **Memory Palaces**: Palace names and locations

### 💾 Auto-Save
- All changes saved instantly to localStorage
- Data persists across browser sessions
- No manual save button needed
- Works offline

### 📊 Live Counters
- Tab headers show entry counts
- Updates in real-time as you add/remove items

---

## 📚 Major System

### Features
- **Multiple Images per Number**: Add as many images as you want for each number
- **Auto-Sorting**: Entries automatically sort numerically (00-99)
- **Individual Image Deletion**: Remove specific images without deleting the entire entry
- **Bulk Operations**: Delete all images for a number at once

### How to Use

#### Add a New Entry
1. Enter a 2-digit number (00-99)
2. Enter an image/word
3. Click "Add" or press Enter

**Adding to Existing Number**:
- If the number already exists, the new image is added to that number
- Example: 
  - Add "00" → "Sauce"
  - Add "00" → "Seas"
  - Result: 00 has both "Sauce" and "Seas"

#### Delete an Image
- Click the "×" button on any image tag
- If it's the last image, the entire entry is removed

#### Delete All Images for a Number
- Click "Delete All" button
- Removes the entire number entry

#### Search
- Type in the search bar to filter by number or image name
- Example: Search "sa" finds "Sauce", "Sane", etc.

---

## 🃏 PAO System

### Features
- **Full 52-Card Support**: Add entries for any playing card
- **Inline Editing**: Edit Person, Action, Object directly
- **Auto-Sorting**: Cards sort alphabetically (2C, 2D, 2H, 2S, 3C...)
- **Real-time Updates**: Changes save as you type

### How to Use

#### Add a New Entry
1. Enter card code (e.g., "AS", "KH", "2D")
   - A-K for rank
   - S/H/D/C for suit
2. Enter Person (required)
3. Enter Action (optional)
4. Enter Object (optional)
5. Click "Add"

**Card Format**:
- Ace of Spades: `AS`
- King of Hearts: `KH`
- 2 of Diamonds: `2D`
- 10 of Clubs: `TC` (T = 10)

#### Edit an Entry
- Click in any field (Person, Action, Object)
- Type your changes
- Changes save automatically

#### Delete an Entry
- Click the "×" button on the right
- Entry is removed immediately

#### Search
- Search by card, person, action, or object
- Example: Search "king" finds all entries with "King" in any field

---

## 🏛️ Memory Palaces

### Features
- **Unlimited Palaces**: Create as many palaces as you need
- **Unlimited Locations**: Add any number of locations per palace
- **Reorder Locations**: Move locations up/down to perfect your journey
- **Rename Palaces**: Click palace name to edit
- **Location Counter**: See how many locations each palace has

### How to Use

#### Create a New Palace
1. Enter palace name (e.g., "Home Journey", "Office Route")
2. Click "Create Palace"
3. Palace is created and ready for locations

#### Add Locations
1. Click in the "Add new location..." field
2. Type location name (e.g., "Front Door", "Hallway")
3. Click "Add" or press Enter
4. Location appears at the bottom of the list

#### Reorder Locations
- Click **↑** to move location up
- Click **↓** to move location down
- First location can't move up
- Last location can't move down
- Perfect for optimizing your mental journey

#### Delete a Location
- Click the "×" button next to any location
- Location is removed immediately

#### Rename a Palace
- Click on the palace name
- Edit the text
- Click outside to save

#### Delete a Palace
- Click "Delete Palace" button
- Entire palace and all locations are removed
- **Warning**: This cannot be undone!

#### Search
- Search by palace name or location name
- Example: Search "door" finds all palaces with "door" in any location

---

## 💡 Best Practices

### Major System
1. **Start with 00-99**: Build your complete system first
2. **Multiple Images**: Add alternatives for flexibility
   - 00: Sauce, Seas, Sews
   - Helps when one image doesn't fit the context
3. **Consistent Phonetics**: Follow Major System rules
   - 0 = S, Z
   - 1 = T, D
   - 2 = N
   - etc.

### PAO System
1. **Vivid Characters**: Choose memorable, distinct persons
2. **Characteristic Actions**: Pick actions that fit the person
3. **Concrete Objects**: Use tangible, visualizable objects
4. **Consistency**: Keep the same person for a card across all uses

### Memory Palaces
1. **Familiar Places**: Use locations you know well
2. **Logical Flow**: Order locations in a natural walking path
3. **Distinct Locations**: Each should be visually unique
4. **Adequate Spacing**: Don't cram locations too close together
5. **Regular Practice**: Walk through mentally to maintain familiarity

---

## 🔧 Technical Details

### Data Storage
- **Location**: Browser localStorage
- **Format**: JSON
- **Keys**: 
  - `majorSystem`
  - `paoSystem`
  - `palaces`

### Data Persistence
- Survives browser refresh
- Survives browser close/reopen
- Tied to specific browser and domain
- **Not synced** across devices (local only)

### Export/Backup (Manual)
To backup your data:
1. Open browser DevTools (F12)
2. Go to Console
3. Run:
```javascript
// Export all data
console.log(JSON.stringify({
  major: JSON.parse(localStorage.getItem('majorSystem')),
  pao: JSON.parse(localStorage.getItem('paoSystem')),
  palaces: JSON.parse(localStorage.getItem('palaces'))
}, null, 2));
```
4. Copy the output and save to a file

### Import Data (Manual)
```javascript
// Import from backup
const backup = { /* paste your backup here */ };
localStorage.setItem('majorSystem', JSON.stringify(backup.major));
localStorage.setItem('paoSystem', JSON.stringify(backup.pao));
localStorage.setItem('palaces', JSON.stringify(backup.palaces));
location.reload();
```

---

## 🎯 Quick Start Guide

### Day 1: Major System
1. Add numbers 00-09 with images
2. Practice recalling them
3. Add 10-19 the next day
4. Continue until you have 00-99

### Week 1: PAO System
1. Start with Aces (AS, AH, AD, AC)
2. Add one suit per day
3. By week's end, have 13 cards
4. Continue until all 52 cards are complete

### Week 2: Memory Palaces
1. Create your first palace (home)
2. Add 5-10 locations
3. Walk through mentally
4. Create a second palace (work/school)
5. Practice both regularly

---

## 🚀 Advanced Tips

### Major System
- **Themes**: Group by categories (00-09 = food, 10-19 = animals)
- **Variations**: Add different images for different contexts
- **Speed Drill**: Use the drill mode (coming soon) to test recall

### PAO System
- **Famous People**: Use celebrities, historical figures
- **Fictional Characters**: Movies, books, games
- **Personal Connections**: Friends, family (if comfortable)
- **Consistency**: Same person = same action/object

### Memory Palaces
- **Multiple Palaces**: Create 5-10 for different purposes
- **Size Variety**: Small (5 locs), Medium (20 locs), Large (50+ locs)
- **Purpose-Specific**: 
  - Shopping list palace (10 locations)
  - Deck of cards palace (52 locations)
  - Number palace (100 locations)

---

## ❓ FAQ

**Q: Can I sync across devices?**
A: Not currently. Data is stored locally in your browser.

**Q: What happens if I clear browser data?**
A: Your data will be lost. Export regularly as backup.

**Q: Can I export to CSV/JSON?**
A: Use the manual export method in DevTools (see Technical Details).

**Q: Is there a limit to entries?**
A: No hard limit, but keep it reasonable for performance.

**Q: Can I import from other apps?**
A: Yes, if you can format it as JSON matching our structure.

**Q: Will this work offline?**
A: Yes! All data is stored locally.

---

## 🐛 Troubleshooting

**Data not saving?**
- Check if localStorage is enabled
- Check browser privacy settings
- Try a different browser

**Search not working?**
- Clear search box and try again
- Check spelling
- Search is case-insensitive

**Can't reorder locations?**
- Make sure you're clicking the correct arrows
- First/last items can't move beyond boundaries

---

**Need help?** All changes are saved automatically. Experiment freely - you can always delete and start over!

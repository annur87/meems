# Major System PAO Overhaul - Progress Report

## ✅ Completed

### 1. Data Structure
- ✅ Updated `MajorEntry` interface in `/src/lib/firebase.ts`
- ✅ Added `persons`, `actions`, `objects` arrays
- ✅ Kept `images` as optional for backward compatibility

### 2. State Variables
- ✅ Replaced `newMajorImage` with:
  - `newMajorPerson`
  - `newMajorAction`
  - `newMajorObject`
- ✅ Added `majorEditCategory` state

### 3. Functions
- ✅ Created `addMajorPerson(number, person)`
- ✅ Created `addMajorAction(number, action)`
- ✅ Created `addMajorObject(number, object)`
- ✅ Created `deleteMajorPerson(number, person)`
- ✅ Created `deleteMajorAction(number, action)`
- ✅ Created `deleteMajorObject(number, object)`

### 4. Sample Data
- ✅ Updated `SAMPLE_MAJOR_SYSTEM` in `/src/data/sampleImageVault.ts`
- ✅ Added example persons, actions, objects for each number

## 🚧 Remaining Work

### 1. UI Updates (HIGH PRIORITY)
- ⏳ Update card display UI to show PAO categories
- ⏳ Create tabbed interface for editing (Persons/Actions/Objects tabs)
- ⏳ Update card selector dropdown (line 1779) to handle new structure
- ⏳ Add migration UI for converting old `images` data

### 2. Quiz/Drill Logic
- ⏳ Update `handleQuizSubmit` to work with PAO categories
- ⏳ Update `startQuiz` to randomly select from persons/actions/objects
- ⏳ Update answer validation logic
- ⏳ Update System Component Checker

### 3. Display Logic
- ⏳ Update card rendering to show all three categories
- ⏳ Add helper function to get display text from PAO entry
- ⏳ Handle legacy `images` data gracefully

### 4. Data Migration
- ⏳ Create migration function to convert `images` → `persons`/`objects`
- ⏳ Add UI button to trigger migration
- ⏳ Test with existing user data

## Current Lint Errors
1. Line 1779: `card.images[0]` - needs to handle new PAO structure
2. Other references to `images` field throughout the codebase

## Next Immediate Steps
1. Fix line 1779 card selector
2. Update card display UI
3. Create tabbed editing interface
4. Update quiz logic

## Notes
- The new structure allows much more flexibility
- Each number can have multiple persons, actions, and objects
- This makes it more like a full PAO system
- Backward compatibility maintained with optional `images` field

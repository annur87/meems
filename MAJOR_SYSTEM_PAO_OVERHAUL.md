# Major System PAO Overhaul Plan

## Overview
Transform the Major System from simple number-to-word mapping into a full PAO (Person-Action-Object) system where each 2-digit number (00-99) can have multiple items in three categories.

## Data Structure Changes

### Before:
```typescript
interface MajorEntry {
    id: string;
    number: string;
    images: string[];  // e.g., ["sauce", "sausage"]
}
```

### After:
```typescript
interface MajorEntry {
    id: string;
    number: string;
    images?: string[];      // Legacy support
    persons: string[];      // e.g., ["Einstein", "Elvis"]
    actions: string[];      // e.g., ["eating", "exploding"]
    objects: string[];      // e.g., ["sauce", "sword"]
}
```

## Implementation Steps

### 1. ✅ Update Interface (DONE)
- Updated `MajorEntry` in `/src/lib/firebase.ts`
- Added `persons`, `actions`, `objects` arrays
- Kept `images` as optional for backward compatibility

### 2. Update State Variables
In `/src/app/training/image-vault/page.tsx`:
- Replace `newMajorImage` with:
  - `newMajorPerson`
  - `newMajorAction`
  - `newMajorObject`
- Add `majorEditCategory` to track which category is being edited

### 3. Update Functions
- `addMajorEntry()` → Split into:
  - `addMajorPerson(number, person)`
  - `addMajorAction(number, action)`
  - `addMajorObject(number, object)`
- `deleteMajorImage()` → Split into:
  - `deleteMajorPerson(number, person)`
  - `deleteMajorAction(number, action)`
  - `deleteMajorObject(number, object)`

### 4. Update UI
- Create tabbed interface for each number showing:
  - **Persons** tab with list and add button
  - **Actions** tab with list and add button
  - **Objects** tab with list and add button
- Update card display to show all three categories
- Add migration UI to convert old `images` data

### 5. Update Quiz/Drill Logic
- Update quiz generation to randomly select from persons/actions/objects
- Update answer validation to check against all items in the category
- Update System Component Checker to support PAO categories

### 6. Data Migration
- Create migration function to convert existing `images` to `persons`
- Provide UI button to trigger migration
- Keep `images` data for rollback safety

## UI Mockup

```
┌─────────────────────────────────────────┐
│ 00                                      │
├─────────────────────────────────────────┤
│ [Persons] [Actions] [Objects]           │
├─────────────────────────────────────────┤
│ Persons:                                │
│ • Einstein                    [Delete]  │
│ • Elvis Presley              [Delete]  │
│ [+ Add Person]                          │
└─────────────────────────────────────────┘
```

## Next Steps
1. Update state variables
2. Implement add/delete functions for each category
3. Build new UI with tabs
4. Update quiz logic
5. Add migration tool

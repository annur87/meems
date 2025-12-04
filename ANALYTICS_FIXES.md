# Analytics & Scoring Improvements

## Number Wall Enhancements

### 1. Scoring Logic Update
- **Accuracy Calculation**: Changed from `(Correct / Total Digits)` to `(Correct / Attempted Digits)`.
  - **Why**: If a user attempts 50 digits out of 150 and gets all 50 correct, their accuracy is now 100% (reflecting precision) rather than 33% (which conflated accuracy with completion).
- **New Metric: Recall Percentage**: Added `(Attempted Digits / Total Digits)`.
  - **Why**: This explicitly tracks how much of the target sequence the user attempted to recall, separating "completeness" from "correctness".

### 2. Data Persistence
- Updated `GameResult` interface in `firebase.ts` to include optional `accuracy` and `recallPercentage` fields.
- `saveGameResult` now stores these granular metrics for Number Wall sessions.

### 3. UI Updates
- **Results Screen (Game End)**: Now displays two distinct cards:
  - **Accuracy**: Shows percentage of correct digits relative to attempts.
  - **Recall %**: Shows percentage of total digits attempted.
- **Main Analytics Page**:
  - **Stats Cards**: When "Number Wall" is selected, custom cards now appear:
    - **Avg. Correct Digits**: The raw number of digits correctly recalled.
    - **Avg. Accuracy**: The precision of the recall (Correct / Attempted).
    - **Avg. Recall %**: The completeness of the recall (Attempted / Total).
  - **Recent Activity Table**: Displays "Correct/Total" and "Accuracy %" for Number Wall entries, providing a more detailed breakdown than the standard percentage view.

## Major System UI Fixes (Recap)
- **Edit PAO Button**: Enhanced event handling with `e.preventDefault()` and `onMouseDown` stop propagation, plus increased z-index (100) to ensure reliable clicking within the 3D flipping card context.

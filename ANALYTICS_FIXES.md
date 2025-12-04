# Analytics & Scoring Improvements

## Number Wall & Word Memory Enhancements

### 1. Scoring Logic Update
Both Number Wall and Word Memory now use the same improved scoring methodology:

- **Accuracy Calculation**: Changed from `(Correct / Total Target)` to `(Correct / Attempted)`.
  - **Why**: If a user attempts 50 items out of 150 and gets all 50 correct, their accuracy is now 100% (reflecting precision) rather than 33% (which conflated accuracy with completion).
  
- **New Metric: Recall Percentage**: Added `(Attempted / Total Target)`.
  - **Why**: This explicitly tracks how much of the target sequence the user attempted to recall, separating "completeness" from "correctness".

### 2. Data Persistence
- Updated `GameResult` interface in `firebase.ts` to include optional `accuracy` and `recallPercentage` fields.
- `saveGameResult` now stores these granular metrics for both Number Wall and Word Memory sessions.

### 3. UI Updates

#### Game Results Screen
Both games now display:
- **Accuracy**: Shows percentage of correct items relative to attempts (Correct / Attempted).
- **Recall %**: Shows percentage of total items attempted (Attempted / Total).
- **Memorize Time**: Time spent memorizing.
- **Recall Time**: Time spent recalling.

#### Main Analytics Page
When "Number Wall" or "Word Memory" is selected:
- **Stats Cards**:
  - **Avg. Correct Digits/Words**: The raw number of items correctly recalled.
  - **Avg. Accuracy**: The precision of the recall (Correct / Attempted).
  - **Avg. Recall %**: The completeness of the recall (Attempted / Total).
  
- **Recent Activity Table**: Displays "Correct/Total" and "Accuracy %" for these game types, providing a more detailed breakdown than the standard percentage view.

### 4. Benefits
- **Clearer Feedback**: Users can now distinguish between:
  - Being cautious and accurate (high accuracy, lower recall %)
  - Being ambitious and comprehensive (high recall %, potentially lower accuracy)
- **Better Progress Tracking**: Separate metrics allow users to identify specific areas for improvement.
- **Consistent Methodology**: Both digit and word memorization use the same scoring approach.

## Major System UI Fixes
- **Edit PAO Button**: Enhanced event handling with `e.preventDefault()` and `onMouseDown` stop propagation, plus increased z-index (100) to ensure reliable clicking within the 3D flipping card context.

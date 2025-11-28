// Bootstrap script to populate Firestore with Dhaka landmarks
// Run this once to initialize your database with all landmarks

import { dhakaLandmarks } from '../data/dhaka-landmarks';
import { saveLandmark } from '../lib/firebase';

const USER_ID = 'default_user';

async function bootstrapLandmarks() {
    console.log('Starting bootstrap...');
    console.log(`Total landmarks to add: ${dhakaLandmarks.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const landmark of dhakaLandmarks) {
        try {
            await saveLandmark(USER_ID, {
                name: landmark.name,
                type: landmark.category,
                lat: landmark.lat,
                lng: landmark.lng,
                createdAt: Date.now()
            });
            successCount++;
            console.log(`✓ Added: ${landmark.name}`);
        } catch (error) {
            errorCount++;
            console.error(`✗ Failed to add ${landmark.name}:`, error);
        }
    }
    
    console.log('\n=== Bootstrap Complete ===');
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

// Uncomment to run:
// bootstrapLandmarks();

export { bootstrapLandmarks };

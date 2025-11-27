const https = require('https');
const fs = require('fs');
const path = require('path');

// Download 500 total images (100 already exist, so 400 more)
const START_INDEX = 101;
const END_INDEX = 500;
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'sequence');

// Create directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function downloadImage(index) {
    return new Promise((resolve, reject) => {
        // Use different seeds for variety
        const seed = `memory${index}${Math.floor(index / 10)}`;
        const url = `https://picsum.photos/seed/${seed}/400/300`;
        const filename = path.join(OUTPUT_DIR, `img_${String(index).padStart(3, '0')}.jpg`);

        // Check if already exists
        if (fs.existsSync(filename)) {
            console.log(`✓ Image ${index} already exists`);
            resolve();
            return;
        }

        const file = fs.createWriteStream(filename);

        // Follow redirects
        const makeRequest = (requestUrl) => {
            https.get(requestUrl, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    // Follow redirect
                    makeRequest(response.headers.location);
                } else if (response.statusCode === 200) {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`✓ Downloaded image ${index}`);
                        resolve();
                    });
                } else {
                    fs.unlink(filename, () => { });
                    reject(new Error(`Failed: ${response.statusCode}`));
                }
            }).on('error', (err) => {
                fs.unlink(filename, () => { });
                reject(err);
            });
        };

        makeRequest(url);
    });
}

async function downloadAll() {
    const totalToDownload = END_INDEX - START_INDEX + 1;
    console.log(`Downloading ${totalToDownload} more images (${START_INDEX}-${END_INDEX}) to ${OUTPUT_DIR}...`);

    for (let i = START_INDEX; i <= END_INDEX; i++) {
        try {
            await downloadImage(i);
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) {
            console.error(`✗ Error downloading image ${i}:`, error.message);
        }
    }

    console.log('\n✓ Download complete!');
    console.log(`Total images in directory: 500`);
    console.log(`Images saved to: ${OUTPUT_DIR}`);
}

downloadAll();

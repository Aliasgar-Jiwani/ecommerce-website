const fs = require('fs');
const path = require('path');
const https = require('https');

const imageUrls = {
    'ceramic-vase-set.jpg': 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61',
    'leather-tote.jpg': 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7',
    'wool-scarf.jpg': 'https://images.unsplash.com/photo-1607370658885-dee7af783f7a',
    'serving-board.jpg': 'https://images.unsplash.com/photo-1578915098111-87635eb34a40',
    'silk-scarf.jpg': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3',
    'vintage-watch.jpg': 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e',
    'coffee-set.jpg': 'https://images.unsplash.com/photo-1572119865084-43c285814d63',
    'copper-bottle.jpg': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8'
};

const downloadImage = (url, filename) => {
    return new Promise((resolve, reject) => {
        const filepath = path.join(__dirname, '..', 'public', 'images', filename);
        
        // Create a write stream
        const fileStream = fs.createWriteStream(filepath);
        
        https.get(`${url}?w=500&q=80`, (response) => {
            response.pipe(fileStream);
            
            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`Downloaded ${filename}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
};

async function downloadAllImages() {
    // Create images directory if it doesn't exist
    const imagesDir = path.join(__dirname, '..', 'public', 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Download all images
    for (const [filename, url] of Object.entries(imageUrls)) {
        try {
            await downloadImage(url, filename);
        } catch (error) {
            console.error(`Error downloading ${filename}:`, error);
        }
    }
}

downloadAllImages();

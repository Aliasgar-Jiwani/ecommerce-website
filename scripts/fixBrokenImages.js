const fs = require('fs');
const path = require('path');
const https = require('https');

const imageUrls = {
    'wool-scarf.jpg': 'https://images.unsplash.com/photo-1543076447-215ad9ba6923',
    'serving-board.jpg': 'https://images.unsplash.com/photo-1578915997054-a7c34c9f3f29'
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

async function downloadMissingImages() {
    for (const [filename, url] of Object.entries(imageUrls)) {
        try {
            // Delete existing file if it exists
            const filepath = path.join(__dirname, '..', 'public', 'images', filename);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
            await downloadImage(url, filename);
        } catch (error) {
            console.error(`Error downloading ${filename}:`, error);
        }
    }
}

downloadMissingImages();

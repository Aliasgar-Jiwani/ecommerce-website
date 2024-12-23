const fs = require('fs');
const path = require('path');
const https = require('https');

const imageUrls = {
    'serving-board.jpg': 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d'
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

async function fixServingBoard() {
    try {
        // Delete existing file if it exists
        const filepath = path.join(__dirname, '..', 'public', 'images', 'serving-board.jpg');
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
        await downloadImage(imageUrls['serving-board.jpg'], 'serving-board.jpg');
    } catch (error) {
        console.error('Error downloading serving-board.jpg:', error);
    }
}

fixServingBoard();

const fs = require('fs');
const path = require('path');
const https = require('https');

const products = [
    { name: 'ceramic-vase-set', url: 'https://picsum.photos/400/300' },
    { name: 'leather-tote', url: 'https://picsum.photos/400/300' },
    { name: 'wool-scarf', url: 'https://picsum.photos/400/300' },
    { name: 'serving-board', url: 'https://picsum.photos/400/300' },
    { name: 'silk-scarf', url: 'https://picsum.photos/400/300' },
    { name: 'vintage-watch', url: 'https://picsum.photos/400/300' },
    { name: 'coffee-set', url: 'https://picsum.photos/400/300' },
    { name: 'copper-bottle', url: 'https://picsum.photos/400/300' }
];

const imagesDir = path.join(__dirname, '..', 'public', 'images');

// Create images directory if it doesn't exist
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Download images
products.forEach(product => {
    const filePath = path.join(imagesDir, `${product.name}.jpg`);
    
    https.get(product.url, (response) => {
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
            console.log(`Downloaded ${product.name}.jpg`);
            fileStream.close();
        });
    }).on('error', (err) => {
        console.error(`Error downloading ${product.name}.jpg:`, err);
    });
});

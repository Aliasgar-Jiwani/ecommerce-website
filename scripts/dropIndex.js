require('dotenv').config();
const mongoose = require('mongoose');

async function dropIndex() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const collection = mongoose.connection.collection('products');
        await collection.dropIndex('productId_1');
        console.log('Successfully dropped productId index');
        
        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

dropIndex();

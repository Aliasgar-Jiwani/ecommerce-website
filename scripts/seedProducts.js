require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/product');

const products = [
    {
        name: "Handcrafted Silver Necklace",
        description: "Beautiful handmade silver necklace with intricate design",
        price: 2999,
        category: "Jewelry",
        imageUrl: "/images/silver-necklace.jpg",
        stock: 10
    },
    {
        name: "Ceramic Vase Set",
        description: "Set of 3 handcrafted ceramic vases in different sizes",
        price: 3499,
        category: "Home Decor",
        imageUrl: "/images/ceramic-vase-set.jpg",
        stock: 5
    },
    {
        name: "Leather Tote Bag",
        description: "Premium leather tote bag with spacious compartments",
        price: 4999,
        category: "Accessories",
        imageUrl: "/images/leather-tote.jpg",
        stock: 8
    },
    {
        name: "Vintage Watch",
        description: "Classic vintage-style watch with leather strap",
        price: 5999,
        category: "Accessories",
        imageUrl: "/images/vintage-watch.jpg",
        stock: 3
    },
    {
        name: "Handwoven Wool Scarf",
        description: "Soft and warm handwoven wool scarf in earth tones",
        price: 1999,
        category: "Accessories",
        imageUrl: "/images/wool-scarf.jpg",
        stock: 15
    },
    {
        name: "Artisan Coffee Set",
        description: "Complete coffee brewing set with handmade ceramic cups",
        price: 6999,
        category: "Home Decor",
        imageUrl: "/images/coffee-set.jpg",
        stock: 4
    },
    {
        name: "Wooden Serving Board",
        description: "Handcrafted wooden serving board with unique grain pattern",
        price: 2499,
        category: "Kitchen",
        imageUrl: "/images/serving-board.jpg",
        stock: 12
    },
    {
        name: "Hand-painted Silk Scarf",
        description: "Unique hand-painted silk scarf with vibrant colors",
        price: 3999,
        category: "Accessories",
        imageUrl: "/images/silk-scarf.jpg",
        stock: 6
    },
    {
        name: "Copper Water Bottle",
        description: "Handcrafted copper water bottle with ayurvedic benefits",
        price: 1499,
        category: "Kitchen",
        imageUrl: "/images/copper-bottle.jpg",
        stock: 20
    }
];

async function seedProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Insert new products
        const result = await Product.insertMany(products);
        console.log(`Added ${result.length} products to the database`);

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
}

seedProducts();

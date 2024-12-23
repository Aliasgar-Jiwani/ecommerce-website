require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/product');

const products = [
    {
        name: "Ceramic Vase Set",
        description: "Set of 3 handcrafted ceramic vases in different sizes",
        price: 3499,
        category: "Home Decor",
        image: "ceramic-vase-set.jpg",
        stock: 5
    },
    {
        name: "Leather Tote Bag",
        description: "Premium leather tote bag with spacious compartments",
        price: 4999,
        category: "Accessories",
        image: "leather-tote.jpg",
        stock: 8
    },
    {
        name: "Wool Scarf",
        description: "Soft and warm handwoven wool scarf in earth tones",
        price: 1999,
        category: "Accessories",
        image: "wool-scarf.jpg",
        stock: 15
    },
    {
        name: "Wooden Serving Board",
        description: "Handcrafted wooden serving board",
        price: 2499,
        category: "Kitchen",
        image: "serving-board.jpg",
        stock: 10
    },
    {
        name: "Silk Scarf",
        description: "Elegant silk scarf with unique patterns",
        price: 2999,
        category: "Accessories",
        image: "silk-scarf.jpg",
        stock: 12
    },
    {
        name: "Vintage Watch",
        description: "Classic vintage-style watch with leather strap",
        price: 5999,
        category: "Accessories",
        image: "vintage-watch.jpg",
        stock: 3
    },
    {
        name: "Coffee Set",
        description: "Complete coffee brewing set with handmade ceramic cups",
        price: 6999,
        category: "Kitchen",
        image: "coffee-set.jpg",
        stock: 4
    },
    {
        name: "Copper Water Bottle",
        description: "Handcrafted copper water bottle",
        price: 1499,
        category: "Kitchen",
        image: "copper-bottle.jpg",
        stock: 20
    }
];

async function updateProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Remove existing products
        await Product.deleteMany({});
        console.log('Existing products removed');

        // Insert new products
        await Product.insertMany(products);
        console.log('New products inserted');

        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

updateProducts();

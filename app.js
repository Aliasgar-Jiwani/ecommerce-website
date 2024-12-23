const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const authRoutes = require('./routes/auth');
const uuid = require('uuid');
const bcrypt = require('bcrypt'); 
const Seller = require('./models/seller');
const adminAuthRoutes = require('./routes/adminauth'); 
const cartRoutes = require('./routes/cart');
const complaintsRoutes = require('./routes/complaints');
const couponRoutes = require('./routes/coupon')
const Product = require('./models/product');
const crypto = require('crypto');
const path = require('path'); 

require('dotenv').config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', './views');

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Specify allowed origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: true,
    optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 24 * 60 * 60, // 1 day
        autoRemove: 'native'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'lax'
    },
    name: 'sessionId' // Custom cookie name
};

app.use(session(sessionConfig));

// Debug middleware
app.use((req, res, next) => {
    console.log('Session middleware:', {
        sessionID: req.sessionID,
        userId: req.session.userId,
        isAuthenticated: !!req.session.userId
    });
    next();
});

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/auth/login', (req, res) => {
  res.render('auth/login');
});

app.get('/auth/register', (req, res) => {
  res.render('auth/register');
});

app.get('/cart', (req, res) => {
  res.render('cart');
});

app.get('/products', async (req, res) => {
  try {
    const { category } = req.query;
    let products;
    
    if (category) {
      products = await Product.find({ category });
    } else {
      products = await Product.find();
    }
    
    res.render('products', { products });
  } catch (error) {
    res.status(500).render('error', { error: 'Failed to fetch products' });
  }
});

app.get('/auth/status', (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      isAuthenticated: true,
      user: {
        name: req.session.user.name,
        email: req.session.user.email
      }
    });
  } else {
    res.json({
      isAuthenticated: false
    });
  }
});

app.get('/cart/count', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.json({ success: true, count: 0 });
    }
    
    const cart = await Cart.findOne({ userId: req.session.user._id });
    const count = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
    
    res.json({ success: true, count });
  } catch (error) {
    res.json({ success: false, count: 0 });
  }
});

app.use('/auth', authRoutes);
app.use('/cart', cartRoutes);
app.use('/admin', adminAuthRoutes);
app.use('/complaints', complaintsRoutes);
app.use('/coupon', couponRoutes);

// About page route
app.get('/about', (req, res) => {
    res.render('about');
});

// Contact page route
app.get('/contact', (req, res) => {
    res.render('contact');
});

// Keep-Alive Route
app.get('/keep-alive', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is up and running'
  });
});

// Get Products by Category Route
app.post('/product/category', async (req, res) => {
  try {
    const { category } = req.body;
    
    // Normalize the category to handle case variations
    let normalizedCategory = category.toLowerCase();
    let searchCategory;

    // Map normalized categories to their proper display versions
    switch(normalizedCategory) {
      case 'gift-boxes':
      case 'gift boxes':
        searchCategory = 'Gift Boxes';
        break;
      case 'books':
        searchCategory = 'Books';
         break;
      case 'stationery':
        searchCategory = 'Stationery';
        break;
      default:
        searchCategory = category;
    }
    
    const products = await Product.find({ category: searchCategory });

    res.status(200).json({
      success: true,
      products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by category',
      error: error.message
    });
  }
});


// Create Product Route
app.post('/create-product', async (req, res) => {
  try {
    const productData = req.body;
    const product = new Product(productData);
    const result = await product.save();
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

// Get All Products Route
app.get('/get-product', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// Update Product Visibility Route
app.put('/update-visibility', async (req, res) => {
  try {
    const { productId, visibility } = req.body;

    // Find and update the product, creating visibility field if it doesn't exist
    const updatedProduct = await Product.findOneAndUpdate(
      { productId: productId },
      { $set: { visibility: visibility } },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product visibility updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product visibility',
      error: error.message
    });
  }
});

// Get Product by Product ID Route
app.post('/:productId', async (req, res) => {
  try {
    const { productId } = req.body;

    // Find product by productId
    const product = await Product.findOne({ productId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// Get Product by ID Route
app.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false, 
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// Update Stock Status Route
app.put('/instock-update', async (req, res) => {
  try {
    const { productId, price, name, category, inStockValue, soldStockValue } = req.body;
    // Find and update the product
    const updatedProduct = await Product.findOneAndUpdate(
      { productId: productId }, // Match by productId
      {
        $set: {
          name: name,
          price: price,
          category: category,
          inStockValue: inStockValue,
          soldStockValue: soldStockValue
        }
      },
      { new: true, upsert: false } // Return the updated document
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stock status updated successfully',
      product: updatedProduct // Include updated product in response for verification
    });

  } catch (error) {
    // Log the error
    res.status(500).json({
      success: false,
      message: 'Error updating stock status',
      error: error.message
    });
  }
});

// Complaints Schema

// Assign Product ID Route
app.get('/assign-productid', async (req, res) => {
  try {
    // Find all products
    const products = await Product.find();
    
    if (products.length === 0) {
      return res.status(404).send('No products found to assign productIds.');
    }

    // Update each product to add a productId
    const updatedProducts = [];
    const usedIds = new Set(); // Track used IDs to ensure uniqueness

    for (const product of products) {
      let productId;
      // Generate unique 6 digit number
      do {
        productId = Math.floor(100000 + Math.random() * 900000).toString();
      } while (usedIds.has(productId));
      
      usedIds.add(productId);

      const updateResult = await Product.findOneAndUpdate(
        { _id: product._id },
        { $set: { productId } },
        { new: true }
      );

      if (updateResult) {
        updatedProducts.push(updateResult);
      } else {
        console.error(`Failed to update product with ID: ${product._id}`);
      }
    }

    // Save all updated products
    await Promise.all(updatedProducts.map(product => product.save()));

    res.status(200).json({
      success: true,
      message: 'Product IDs assigned successfully',
      products: updatedProducts
    });
  } catch (err) {
    console.error('Error during product ID assignment:', err);
    res.status(500).json({
      success: false,
      message: 'Error assigning product IDs',
      error: err.message
    });
  }
});
// Address Schema
const addressSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  address: String
});

const Address = mongoose.model('Address', addressSchema);

// Update or Create Address Route
app.post('/update-address', async (req, res) => {
  try {
    const { userId, address } = req.body;

    // Try to find existing address for user
    const existingAddress = await Address.findOne({ userId });

    let result;
    if (existingAddress) {
      // Update existing address
      existingAddress.address = address;
      result = await existingAddress.save();
    } else {
      // Create new address entry
      const newAddress = new Address({
        userId,
        address
      });
      result = await newAddress.save();
    }

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating address',
      error: error.message
    });
  }
});
// Order Schema
const Order = require('./models/ordermodel');

// Place Order Route
// Get All Orders Route
app.get('/get-orders', async (req, res) => {
  try {
    const orders = await Order.find();
    
    res.status(200).json({
      success: true,
      orders
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// Get User Details Route
app.get('/get-user', async (req, res) => {
  try {
    const users = await mongoose.model('User').find(
      {}, // Remove filter to get all users
      '-password' // Exclude only the password field
    );
    
    res.status(200).json({
      success: true,
      users
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error.message
    });
  }
});

// Update Account Status Route
app.put('/update-account-status', async (req, res) => {
  try {
    const { userId, accountStatus } = req.body;

    // Find and update the user, and get the updated document
    const updatedUser = await mongoose.model('User').findOneAndUpdate(
      { userId: userId },
      { accountStatus },
      { new: true } // This option returns the modified document rather than the original
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account status updated successfully',
      user: {
        userId: updatedUser.userId,
        accountStatus: updatedUser.accountStatus
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating account status',
      error: error.message
    });
  }
});

const otpStore = new Map();

app.post('/find-my-order', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Find orders for this user
    const orders = await Order.find({ userId });

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No orders found for this user'
      });
    }

    // Function to get product details for each productId
    const findProductDetails = async (productIds) => {
      try {
        const productDetails = [];
        
        // Make API calls for each productId
        for (const productId of productIds) {
          try {
            const product = await Product.findById(productId);
            if (product) {
              productDetails.push(product);
            }
          } catch (err) {
            console.error(`Error fetching product ${productId}:`, err);
          }
        }

        return productDetails;
      } catch (error) {
        throw new Error('Error fetching product details: ' + error.message);
      }
    };

    // Get product details for each order
    const ordersWithProducts = await Promise.all(
      orders.map(async (order) => {
        const productDetails = await findProductDetails(order.productIds);
        return {
          ...order.toObject(),
          products: productDetails
        };
      })
    );

    res.status(200).json({
      success: true,
      orders: ordersWithProducts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error finding orders',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Server Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

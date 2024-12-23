const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Cart = require('../models/cartmodel');
const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/ordermodel'); // Added Order model

// Middleware to check authentication
const checkAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Please login to continue'
        });
    }
    next();
};

// Get Cart Count
router.get('/count', checkAuth, async (req, res) => {
    try {
        console.log('Getting cart count for user:', req.session.userId);

        const cart = await Cart.findOne({ userId: req.session.userId });
        console.log('Found cart for count:', cart);

        const count = cart ? cart.productsInCart.reduce((total, item) => total + item.quantity, 0) : 0;
        console.log('Calculated count:', count);

        res.json({ 
            success: true, 
            count,
            message: `Cart has ${count} items`
        });
    } catch (error) {
        console.error('Error getting cart count:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting cart count',
            error: error.message
        });
    }
});

// Get Cart Route
router.post('/get-cart', checkAuth, async (req, res) => {
    try {
        console.log('Getting cart for user:', req.session.userId);
        
        if (!req.session.userId) {
            console.log('No user ID in session');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const cart = await Cart.findOne({ userId: req.session.userId })
            .populate({
                path: 'productsInCart.productId',
                select: 'name price image description' // Select the fields you want
            });
        
        console.log('Found cart:', cart);

        if (!cart) {
            console.log('No cart found, returning empty cart');
            return res.json({
                success: true,
                cart: {
                    userId: req.session.userId,
                    items: [],
                    total: 0,
                    count: 0
                }
            });
        }

        // Calculate total count
        const count = cart.productsInCart.reduce((total, item) => total + item.quantity, 0);

        // Transform cart data for response
        const formattedCart = {
            userId: cart.userId,
            items: cart.productsInCart.map(item => ({
                product: {
                    _id: item.productId._id,
                    name: item.productId.name,
                    price: item.productId.price,
                    image: item.productId.image,
                    description: item.productId.description
                },
                quantity: item.quantity,
                subtotal: item.productId.price * item.quantity
            })),
            total: cart.productsInCart.reduce((total, item) => 
                total + (item.productId.price * item.quantity), 0),
            count: count // Include count in cart object
        };

        console.log('Sending formatted cart:', formattedCart);

        res.json({
            success: true,
            cart: formattedCart,
            count: count // Include count at root level too
        });
    } catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving cart',
            error: error.message
        });
    }
});

// Get Cart Items Route
router.get('/', checkAuth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId })
            .populate('productsInCart.productId');
        
        if (!cart) {
            return res.json({
                success: true,
                cart: {
                    userId: req.session.userId,
                    items: [],
                    total: 0
                }
            });
        }

        const formattedCart = {
            userId: cart.userId,
            items: cart.productsInCart.map(item => ({
                product: {
                    _id: item.productId._id,
                    name: item.productId.name,
                    price: item.productId.price,
                    image: item.productId.image
                },
                quantity: item.quantity,
                subtotal: item.productId.price * item.quantity
            })),
            total: cart.calculateTotal()
        };

        res.json({
            success: true,
            cart: formattedCart
        });
    } catch (error) {
        console.error('Error getting cart items:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting cart items'
        });
    }
});

// Add to Cart Route
router.post('/addtocart', checkAuth, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.session.userId;

        console.log('Add to cart request:', { userId, productId, quantity });

        if (!userId) {
            console.log('No user ID in session');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }

        const product = await Product.findById(productId);
        console.log('Found product:', product);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Not enough stock available'
            });
        }

        let cart = await Cart.findOne({ userId });
        console.log('Found existing cart:', cart);
        
        if (!cart) {
            console.log('Creating new cart');
            cart = new Cart({
                userId: new mongoose.Types.ObjectId(userId),
                productsInCart: [{
                    productId: new mongoose.Types.ObjectId(productId),
                    quantity
                }]
            });
        } else {
            console.log('Updating existing cart');
            const existingProductIndex = cart.productsInCart.findIndex(
                item => item.productId.toString() === productId.toString()
            );

            if (existingProductIndex >= 0) {
                cart.productsInCart[existingProductIndex].quantity += quantity;
            } else {
                cart.productsInCart.push({
                    productId: new mongoose.Types.ObjectId(productId),
                    quantity
                });
            }
        }

        const savedCart = await cart.save();
        console.log('Saved cart:', savedCart);

        await savedCart.populate('productsInCart.productId');

        // Calculate new count
        const newCount = savedCart.productsInCart.reduce((total, item) => total + item.quantity, 0);

        // Transform cart data for response
        const formattedCart = {
            userId: savedCart.userId,
            items: savedCart.productsInCart.map(item => ({
                product: {
                    _id: item.productId._id,
                    name: item.productId.name,
                    price: item.productId.price,
                    image: item.productId.image,
                    description: item.productId.description
                },
                quantity: item.quantity,
                subtotal: item.productId.price * item.quantity
            })),
            total: savedCart.productsInCart.reduce((total, item) => 
                total + (item.productId.price * item.quantity), 0),
            count: newCount // Include count in response
        };

        console.log('Sending formatted cart response:', formattedCart);

        res.json({
            success: true,
            message: 'Product added to cart successfully',
            cart: formattedCart,
            count: newCount // Include count in response
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding product to cart',
            error: error.message
        });
    }
});

// Get Cart Items Route
router.get('/items', checkAuth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId }).populate('productsInCart.productId');

        if (!cart) {
            return res.json({
                success: true,
                cart: {
                    userId: req.session.userId,
                    items: [],
                    total: 0
                }
            });
        }

        const formattedCart = {
            userId: cart.userId,
            items: cart.productsInCart.map(item => ({
                product: {
                    _id: item.productId._id,
                    name: item.productId.name,
                    price: item.productId.price,
                    image: item.productId.image
                },
                quantity: item.quantity,
                subtotal: item.productId.price * item.quantity
            })),
            total: cart.calculateTotal()
        };

        res.json({
            success: true,
            cart: formattedCart
        });
    } catch (error) {
        console.error('Error getting cart items:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting cart items'
        });
    }
});

// Remove Item Route
router.delete('/remove-item', checkAuth, async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.userId;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.productsInCart = cart.productsInCart.filter(
            item => item.productId.toString() !== productId
        );

        await cart.save();
        await cart.populate('productsInCart.productId');

        const formattedCart = {
            userId: cart.userId,
            items: cart.productsInCart.map(item => ({
                product: {
                    _id: item.productId._id,
                    name: item.productId.name,
                    price: item.productId.price,
                    image: item.productId.image
                },
                quantity: item.quantity,
                subtotal: item.productId.price * item.quantity
            })),
            total: cart.calculateTotal()
        };

        res.json({
            success: true,
            message: 'Item removed from cart',
            cart: formattedCart
        });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing item from cart'
        });
    }
});

// Update Quantity Route
router.put('/update-quantity', checkAuth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.userId;

        if (!productId || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and quantity are required'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Not enough stock available'
            });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const productInCart = cart.productsInCart.find(
            item => item.productId.toString() === productId
        );

        if (!productInCart) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in cart'
            });
        }

        productInCart.quantity = quantity;
        await cart.save();
        await cart.populate('productsInCart.productId');

        const formattedCart = {
            userId: cart.userId,
            items: cart.productsInCart.map(item => ({
                product: {
                    _id: item.productId._id,
                    name: item.productId.name,
                    price: item.productId.price,
                    image: item.productId.image
                },
                quantity: item.quantity,
                subtotal: item.productId.price * item.quantity
            })),
            total: cart.calculateTotal()
        };

        res.json({
            success: true,
            message: 'Cart updated successfully',
            cart: formattedCart
        });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating cart'
        });
    }
});

// Place Order Route
router.post('/place-order', checkAuth, async (req, res) => {
    try {
        const { date, time, address, price, productsOrdered } = req.body;
        const userId = req.session.userId;

        console.log('Generating order ID and tracking ID');
        const orderId = Math.floor(100000 + Math.random() * 900000).toString();
        const trackingId = Math.random().toString(36).substring(2, 14).toUpperCase();

        console.log('Finding user:', userId);
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found:', userId);
            throw new Error('User not found');
        }

        console.log('Finding product details');
        const productIds = productsOrdered.map(item => item.productId);

        const productDetails = await Product.find({ _id: { $in: productIds } });

        console.log('Creating new order');
        const order = new Order({
            userId,
            orderId,
            date,
            time,
            address,
            email: user.email,
            name: user.name,
            productIds,
            trackingId,
            price
        });

        await order.save();

        console.log('Sending order confirmation email');
        const emailHtml = `<div>Order Confirmation for ${user.name}...</div>`; 
        // await transporter.sendMail({ from: `pecommerce8@gmail.com`, to: user.email, subject: 'Order Confirmation', html: emailHtml });

        console.log('Order placed successfully');
        res.status(200).json({ success: true, message: 'Order placed successfully', orderId, trackingId });
    } catch (error) {
        console.error('Error in /place-order:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Error placing order', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;

const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productsInCart: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        }
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Add a method to calculate total
cartSchema.methods.calculateTotal = function() {
    return this.productsInCart.reduce((total, item) => {
        return total + (item.productId.price * item.quantity);
    }, 0);
};

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;

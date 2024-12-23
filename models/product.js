const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: 'placeholder.jpg' },
  category: { type: String, required: true },
  stock: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  soldCount: { type: Number, default: 0 },
  visibility: { type: String, default: 'on' }
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
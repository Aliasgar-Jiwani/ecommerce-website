# E-Commerce Website

A modern, feature-rich e-commerce platform built with Python (Django) and React. This project provides a seamless shopping experience with robust admin capabilities and secure payment processing.

## 🌟 Features

- User Authentication & Authorization
- Product Catalog with Categories
- Shopping Cart & Wishlist
- Secure Payment Integration
- Order Management
- Admin Dashboard
- Responsive Design
- Search Functionality
- User Reviews & Ratings

## 📸 Screenshots

### Homepage
![Homepage](screenshots/website1.png)
*Modern and intuitive homepage design with featured products*

### Product Catalog
![Product Catalog](screenshots/website2.png)
*Comprehensive product listing with filtering options*

### Shopping Cart
![Shopping Cart](screenshots/website3.png)
*User-friendly shopping cart with payment integration*

## 🚀 Technologies Used

- **Frontend:**
  - React.js
  - Redux for state management
  - Material-UI components
  - Responsive CSS

- **Backend:**
  - Django
  - Django REST Framework
  - PostgreSQL
  - JWT Authentication

## 📦 Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ecommerce-website.git
cd ecommerce-website
```

2. Install backend dependencies
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Install frontend dependencies
```bash
cd frontend
npm install
```

4. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run migrations
```bash
python manage.py migrate
```

6. Start the development servers
```bash
# Backend
python manage.py runserver

# Frontend (in a new terminal)
cd frontend
npm start
```

## 💡 Usage

1. Register a new account or login
2. Browse products by categories
3. Add items to cart
4. Proceed to checkout
5. Complete payment
6. Track your order

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

For any queries, please reach out to [your-email@example.com]

---
⭐ Don't forget to star this repository if you found it helpful!

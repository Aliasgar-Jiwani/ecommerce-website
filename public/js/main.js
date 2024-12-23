document.addEventListener('DOMContentLoaded', function() {
    // Add to Cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const productId = this.dataset.productId;
            try {
                const response = await fetch('/cart/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ productId })
                });
                
                const data = await response.json();
                if (data.success) {
                    alert('Product added to cart successfully!');
                } else {
                    alert('Failed to add product to cart. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            }
        });
    });

    // Category Filter functionality
    const categoryLinks = document.querySelectorAll('.dropdown-item');
    categoryLinks.forEach(link => {
        link.addEventListener('click', async function(e) {
            e.preventDefault();
            const category = this.textContent;
            
            try {
                const response = await fetch('/product/category', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ category })
                });
                
                const data = await response.json();
                if (data.success) {
                    updateProductsDisplay(data.products);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to filter products. Please try again.');
            }
        });
    });
});

function updateProductsDisplay(products) {
    const container = document.getElementById('products-container');
    container.innerHTML = products.map(product => `
        <div class="col-md-4 mb-4">
            <div class="card h-100">
                <img src="${product.imageUrl}" class="card-img-top" alt="${product.name}">
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text">${product.description}</p>
                    <p class="card-text"><strong>Price: $${product.price}</strong></p>
                    <button class="btn btn-primary add-to-cart" data-product-id="${product._id}">Add to Cart</button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Reattach event listeners to new buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            addToCart(productId);
        });
    });
}

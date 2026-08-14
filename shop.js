/**
 * PajarraCO Shop System
 * Módulo principal reutilizable para cualquier moneda
 */

class PajarracoShop {
    constructor(products, currency) {
        this.products = products;
        this.currency = currency;
        this.cart = [];
        this.currentFilter = 'all';
        
        // Elementos del DOM
        this.productsGrid = document.getElementById('productsGrid');
        this.cartIcon = document.getElementById('cartIcon');
        this.cartModal = document.getElementById('cartModal');
        this.closeCartBtn = document.getElementById('closeCart');
        this.checkoutBtn = document.getElementById('checkoutBtn');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        
        this.init();
    }

    /**
     * Inicializar la tienda
     */
    init() {
        this.loadCartFromStorage();
        this.renderProducts();
        this.setupEventListeners();
        this.updateCartCount();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        this.cartIcon.addEventListener('click', () => this.openCart());
        this.closeCartBtn.addEventListener('click', () => this.closeCart());
        this.cartModal.addEventListener('click', (e) => {
            if (e.target === this.cartModal) this.closeCart();
        });

        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderProducts();
            });
        });

        this.checkoutBtn.addEventListener('click', () => this.checkout());
    }

    /**
     * Formatear precio según la moneda
     */
    formatPrice(price) {
        const decimals = this.currency.name === 'CLP' ? 0 : 2;
        return price.toFixed(decimals);
    }

    /**
     * Renderizar productos
     */
    renderProducts() {
        const filteredProducts = this.currentFilter === 'all' 
            ? this.products 
            : this.products.filter(p => p.category === this.currentFilter);

        this.productsGrid.innerHTML = filteredProducts.map(product => `
            <div class="product-card">
                <div class="product-image">
                    ${product.image 
                        ? `<img src="${product.image}" alt="${product.name}">` 
                        : `<div class="emoji-placeholder">${product.emoji}</div>`
                    }
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-description">Diseño exclusivo</div>
                    <div class="product-footer">
                        <span class="price">${this.currency.symbol}${this.formatPrice(product.price)}</span>
                        <button class="add-to-cart-btn" data-id="${product.id}">Añadir</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Agregar event listeners a los botones de añadir
        this.productsGrid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.id);
                this.addToCart(productId);
                this.showAddedNotification(e.target);
            });
        });
    }

    /**
     * Agregar producto al carrito
     */
    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }

        this.saveCartToStorage();
        this.updateCartCount();
    }

    /**
     * Mostrar notificación de producto añadido
     */
    showAddedNotification(btn) {
        const originalText = btn.textContent;
        btn.textContent = '✓ Añadido';
        btn.style.background = '#51cf66';
        btn.disabled = true;

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.disabled = false;
        }, 1500);
    }

    /**
     * Actualizar cantidad de artículos en el carrito
     */
    updateCartCount() {
        const count = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cartCount').textContent = count;
    }

    /**
     * Abrir carrito modal
     */
    openCart() {
        this.renderCart();
        this.cartModal.classList.add('active');
    }

    /**
     * Cerrar carrito modal
     */
    closeCart() {
        this.cartModal.classList.remove('active');
    }

    /**
     * Renderizar contenido del carrito
     */
    renderCart() {
        const cartItemsDiv = document.getElementById('cartItems');

        if (this.cart.length === 0) {
            cartItemsDiv.innerHTML = '<div class="empty-cart">Tu carrito está vacío 😢</div>';
            this.checkoutBtn.disabled = true;
            this.updateCartTotals();
            return;
        }

        this.checkoutBtn.disabled = false;

        cartItemsDiv.innerHTML = this.cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.emoji || ''} ${item.name}</div>
                    <div class="cart-item-price">${this.currency.symbol}${this.formatPrice(item.price)}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" data-index="${index}" data-action="decrease">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-index="${index}" data-action="increase">+</button>
                    </div>
                </div>
                <button class="remove-btn" data-index="${index}">Eliminar</button>
            </div>
        `).join('');

        // Agregar event listeners a los controles del carrito
        cartItemsDiv.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const action = e.target.dataset.action;
                this.updateQuantity(index, action === 'increase' ? 1 : -1);
            });
        });

        cartItemsDiv.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeFromCart(index);
            });
        });

        this.updateCartTotals();
    }

    /**
     * Actualizar cantidad de un producto
     */
    updateQuantity(index, change) {
        const newQuantity = this.cart[index].quantity + change;
        
        if (newQuantity > 0) {
            this.cart[index].quantity = newQuantity;
        } else {
            this.removeFromCart(index);
            return;
        }

        this.saveCartToStorage();
        this.updateCartCount();
        this.renderCart();
    }

    /**
     * Eliminar producto del carrito
     */
    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.saveCartToStorage();
        this.updateCartCount();
        this.renderCart();
    }

    /**
     * Actualizar totales del carrito
     */
    updateCartTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = this.cart.length > 0 ? this.currency.shippingCost : 0;
        const total = subtotal + shipping;

        document.getElementById('subtotal').textContent = `${this.currency.symbol}${this.formatPrice(subtotal)}`;
        document.getElementById('shipping').textContent = `${this.currency.symbol}${this.formatPrice(shipping)}`;
        document.getElementById('total').textContent = `${this.currency.symbol}${this.formatPrice(total)}`;
    }

    /**
     * Finalizar compra
     */
    checkout() {
    if (this.cart.length === 0) return;

    // 1. Calcular el total
    const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + this.currency.shippingCost;

    // 2. Armar el texto del mensaje con formato amigable
    let mensaje = "¡Hola Cony y Robert! 🐦 Me gustaría hacer el siguiente pedido en PajarraCO:%0A%0A";
    
    this.cart.forEach(item => {
        mensaje += `▪️ ${item.quantity}x ${item.name} (${this.currency.symbol}${this.formatPrice(item.price)})%0A`;
    });
    
    mensaje += `%0A📦 *Envío:* ${this.currency.symbol}${this.formatPrice(this.currency.shippingCost)}%0A`;
    mensaje += `💰 *Total a pagar:* ${this.currency.symbol}${this.formatPrice(total)}%0A%0A`;
    mensaje += `Por favor indíquenme los datos de transferencia. ¡Gracias!`;

    // 3. Configurar tu número de teléfono (Reemplaza las X con tu número real, incluyendo el 56 de Chile)
    const telefonoPajarraco = "569XXXXXXXX"; 
    const urlWhatsApp = `https://wa.me/${telefonoPajarraco}?text=${mensaje}`;

    // 4. Vaciar el carrito y cerrar el modal
    this.cart = [];
    this.saveCartToStorage();
    this.updateCartCount();
    this.closeCart();
    this.renderCart();

    // 5. Abrir WhatsApp en una nueva pestaña
    window.open(urlWhatsApp, '_blank');
}

    /**
     * Guardar carrito en localStorage
     */
    saveCartToStorage() {
        localStorage.setItem(this.currency.storageKey, JSON.stringify(this.cart));
    }

    /**
     * Cargar carrito de localStorage
     */
    loadCartFromStorage() {
        const savedCart = localStorage.getItem(this.currency.storageKey);
        if (savedCart) {
            try {
                this.cart = JSON.parse(savedCart);
            } catch (e) {
                console.error('Error al cargar carrito:', e);
                this.cart = [];
            }
        }
    }
}

/**
 * Función para inicializar la tienda
 * Se utiliza en los archivos HTML
 */
function initializeShop(products, currency) {
    new PajarracoShop(products, currency);
}

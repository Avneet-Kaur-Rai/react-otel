import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ROUTES } from '../../constants/routes';
import { formatCurrency } from '../../utils/formatters';
import Button from '../../components/common/Button/Button';
import './CartPage.css';

const CartPage = () => {
    const navigate = useNavigate();
    const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            alert('Your shopping bag is empty!');
            return;
        }
        navigate(ROUTES.CHECKOUT);
    };

    const handleQuantityChange = (productId, newQuantity) => {
        if (newQuantity < 1) return;
        updateQuantity(productId, newQuantity);
    };

    if (cartItems.length === 0) {
        return (
            <div className="cart-page">
                <div className="cart-container">
                    <div className="empty-cart">
                        <div className="empty-cart-icon">🛍️</div>
                        <h2>Your Shopping Bag is Empty</h2>
                        <p>Add some products to get started!</p>
                        <Button onClick={() => navigate(ROUTES.PRODUCTS)} size="large">
                            Continue Shopping
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="cart-container">
                <h1 className="cart-title">Shopping Bag</h1>

                <div className="cart-content">
                    <div className="cart-items">
                        {cartItems.map((item) => (
                            <div key={item.id} className="cart-item">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="cart-item-image"
                                />
                                <div className="cart-item-info">
                                    <h3 className="cart-item-name">{item.name}</h3>
                                    <p className="cart-item-category">{item.category}</p>
                                    <p className="cart-item-price">{formatCurrency(item.price)}</p>
                                </div>
                                <div className="cart-item-actions">
                                    <div className="quantity-control">
                                        <button
                                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                            className="quantity-btn"
                                        >
                                            -
                                        </button>
                                        <span className="quantity-value">{item.quantity}</span>
                                        <button
                                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                            className="quantity-btn"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <p className="cart-item-subtotal">
                                        {formatCurrency(item.price * item.quantity)}
                                    </p>
                                    <Button
                                        variant="danger"
                                        size="small"
                                        onClick={() => removeFromCart(item.id)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary">
                        <h2 className="summary-title">Order Summary</h2>
                        <div className="summary-row">
                            <span>Subtotal ({cartItems.length} items):</span>
                            <span>{formatCurrency(getCartTotal())}</span>
                        </div>
                        <div className="summary-row">
                            <span>Shipping:</span>
                            <span>{getCartTotal() > 100 ? 'FREE' : formatCurrency(10)}</span>
                        </div>
                        <div className="summary-row">
                            {/* UIFIX AI - BUG - LOGICAL
                    Description: Tax calculation is incorrect - using 0.5 (50%) instead of 0.1 (10%)
                    Impact: Customers are overcharged 5x on tax
                    Expected: Should be getCartTotal() * 0.1 for 10% tax */}
                            <span>Tax (10%):</span>
                            <span>{formatCurrency(getCartTotal() * 0.5)}</span>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="summary-row summary-total">
                            <span>Total:</span>
                            <span>
                                {/* UIFIX AI - BUG - LOGICAL
                    Description: Tax calculation is incorrect - using 0.5 (50%) instead of 0.1 (10%)
                    Impact: Customers are overcharged 5x on tax
                    Expected: Should be getCartTotal() * 0.1 for 10% tax */}
                                {formatCurrency(
                                    getCartTotal() +
                                    (getCartTotal() > 100 ? 0 : 10) +
                                    getCartTotal() * 0.5
                                )}
                            </span>
                        </div>
                        <Button size="large" fullWidth onClick={handleCheckout}>
                            Proceed to Checkout
                        </Button>
                        <Button
                            variant="outline"
                            size="large"
                            fullWidth
                            onClick={() => navigate(ROUTES.PRODUCTS)}
                        >
                            Continue Shopping
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;

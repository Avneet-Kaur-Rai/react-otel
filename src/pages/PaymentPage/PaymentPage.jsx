import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ROUTES } from '../../constants/routes';
import { PAYMENT_METHODS } from '../../constants/enums';
import { formatCurrency } from '../../utils/formatters';
import { validateCardNumber, validateCVV } from '../../utils/validators';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import './PaymentPage.css';

const PaymentPage = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CREDIT_CARD);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCardData({ ...cardData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    if (paymentMethod === PAYMENT_METHODS.COD) {
      return {};
    }

    const newErrors = {};

    if (!cardData.cardName.trim()) {
      newErrors.cardName = 'Cardholder name is required';
    }

    if (!validateCardNumber(cardData.cardNumber)) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }

    if (!cardData.expiryDate.match(/^\d{2}\/\d{2}$/)) {
      newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
    }

    if (!validateCVV(cardData.cvv)) {
      newErrors.cvv = 'Please enter a valid CVV';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Create order data - Date.now() is safe in event handlers
    const orderData = {
      items: cartItems,
      paymentMethod,
      total: calculateGrandTotal(),
      date: new Date().toISOString(),
      orderId: `ORD-${Date.now()}`,
    };

    sessionStorage.setItem('orderData', JSON.stringify(orderData));
    clearCart();
    navigate(ROUTES.ORDER_SUMMARY);
  };

  const subtotal = getCartTotal();
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.1;
  const calculateGrandTotal = () => subtotal + shipping + tax;

  return (
    <div className="payment-page">
      <div className="payment-container">
        <h1 className="payment-title">Payment</h1>

        <div className="payment-content">
          <form onSubmit={handleSubmit} className="payment-form">
            <div className="payment-methods">
              <h2 className="section-title">Select Payment Method</h2>
              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PAYMENT_METHODS.CREDIT_CARD}
                    checked={paymentMethod === PAYMENT_METHODS.CREDIT_CARD}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>💳 Credit Card</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PAYMENT_METHODS.DEBIT_CARD}
                    checked={paymentMethod === PAYMENT_METHODS.DEBIT_CARD}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>💳 Debit Card</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PAYMENT_METHODS.PAYPAL}
                    checked={paymentMethod === PAYMENT_METHODS.PAYPAL}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>📱 PayPal</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PAYMENT_METHODS.COD}
                    checked={paymentMethod === PAYMENT_METHODS.COD}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>💵 Cash on Delivery</span>
                </label>
              </div>
            </div>

            {paymentMethod !== PAYMENT_METHODS.COD && (
              <div className="card-details">
                <h2 className="section-title">Card Details</h2>
                <Input
                  label="Cardholder Name"
                  name="cardName"
                  value={cardData.cardName}
                  onChange={handleChange}
                  error={errors.cardName}
                  placeholder="John Doe"
                  required
                />
                <Input
                  label="Card Number"
                  name="cardNumber"
                  value={cardData.cardNumber}
                  onChange={handleChange}
                  error={errors.cardNumber}
                  placeholder="1234 5678 9012 3456"
                  maxLength="16"
                  required
                />
                <div className="form-row">
                  <Input
                    label="Expiry Date"
                    name="expiryDate"
                    value={cardData.expiryDate}
                    onChange={handleChange}
                    error={errors.expiryDate}
                    placeholder="MM/YY"
                    maxLength="5"
                    required
                  />
                  <Input
                    label="CVV"
                    name="cvv"
                    type="password"
                    value={cardData.cvv}
                    onChange={handleChange}
                    error={errors.cvv}
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(ROUTES.CHECKOUT)}
              >
                Back
              </Button>
              <Button type="submit" size="large">
                Place Order
              </Button>
            </div>
          </form>

          <div className="payment-summary">
            <h2 className="summary-title">Order Summary</h2>
            <div className="summary-items">
              {cartItems.map((item) => (
                <div key={item.id} className="summary-item">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span>{shipping === 0 ? 'FREE' : formatCurrency(shipping)}</span>
            </div>
            <div className="summary-row">
              <span>Tax:</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row summary-total">
              <span>Total:</span>
              <span>{formatCurrency(calculateGrandTotal())}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

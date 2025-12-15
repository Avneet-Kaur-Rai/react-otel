import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ROUTES } from '../../constants/routes';
import { PAYMENT_METHODS } from '../../constants/enums';
import { formatCurrency } from '../../utils/formatters';
import { validateCardNumber, validateCVV } from '../../utils/validators';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import { tracer, businessMetrics, logger } from '../../telemetry/telemetry';
import { SpanStatusCode } from '@opentelemetry/api';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    return tracer.startActiveSpan('payment.submit', async (span) => {
      try {
        span.setAttribute('payment.method', paymentMethod);
        span.setAttribute('order.items_count', cartItems.length);
        span.setAttribute('order.total', calculateGrandTotal());
        span.addEvent('payment_submit_initiated');
        
        const newErrors = validate();

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          span.setAttribute('validation.result', 'failed');
          span.setAttribute('validation.error_count', Object.keys(newErrors).length);
          span.addEvent('validation_failed');
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Validation failed' });
          span.end();
          return;
        }

        span.addEvent('validation_passed');
        
        // Get checkout data from sessionStorage
        const checkoutDataStr = sessionStorage.getItem('checkoutData');
        const checkoutData = checkoutDataStr ? JSON.parse(checkoutDataStr) : {};
        
        // Prepare order data for backend
        const orderData = {
          customer: {
            firstName: checkoutData.firstName || 'Guest',
            lastName: checkoutData.lastName || '',
            email: checkoutData.email || '',
            phone: checkoutData.phone || ''
          },
          shippingAddress: {
            street: checkoutData.address || '',
            city: checkoutData.city || '',
            state: checkoutData.state || '',
            zipCode: checkoutData.zipCode || '',
            country: checkoutData.country || 'United States'
          },
          items: cartItems.map(item => ({
            productId: item.id.toString(),
            quantity: item.quantity,
            price: item.price
          })),
          paymentMethod,
          subtotal: getCartTotal(),
          shipping: getCartTotal() > 100 ? 0 : 10,
          tax: getCartTotal() * 0.1,
          total: calculateGrandTotal()
        };
        
        span.addEvent('calling_backend_api', {
          'http.url': 'http://localhost:3001/api/orders',
          'http.method': 'POST'
        });
        
        logger.info('Submitting order to backend', {
          'order.total': orderData.total,
          'order.items_count': orderData.items.length,
          'payment.method': paymentMethod
        });
        
        // Call backend API
        const response = await fetch('http://localhost:3001/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        });
        
        span.setAttribute('http.status_code', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Order submission failed' }));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        span.addEvent('order_created', {
          'order.id': result.data.orderId,
          'order.status': result.data.status
        });
        
        logger.info('Order created successfully', {
          'order.id': result.data.orderId,
          'order.status': result.data.status,
          'order.total': result.data.total
        });
        
        // Track successful order
        businessMetrics.checkoutCompleted.add(1, {
          'payment.method': paymentMethod,
          'order.status': 'success'
        });
        
        // Store order data for order summary page
        sessionStorage.setItem('orderData', JSON.stringify(result.data));
        
        clearCart();
        span.setAttribute('order.result', 'success');
        span.setAttribute('order.id', result.data.orderId);
        span.addEvent('navigating_to_order_summary');
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        
        navigate(ROUTES.ORDER_SUMMARY);
        
      } catch (error) {
        span.setAttribute('error', true);
        span.setAttribute('error.message', error.message);
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.end();
        
        logger.error('Order submission failed', {
          'error.message': error.message,
          'payment.method': paymentMethod
        });
        
        alert(`Order submission failed: ${error.message}\n\nPlease try again or contact support.`);
      }
    });
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

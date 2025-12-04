import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button/Button';
import './OrderSummaryPage.css';

const OrderSummaryPage = () => {
  const navigate = useNavigate();
  const [orderData] = useState(() => {
    const order = sessionStorage.getItem('orderData');
    return order ? JSON.parse(order) : null;
  });
  const [checkoutData] = useState(() => {
    const checkout = sessionStorage.getItem('checkoutData');
    return checkout ? JSON.parse(checkout) : null;
  });

  useEffect(() => {
    if (!orderData) {
      navigate(ROUTES.PRODUCTS);
    }
  }, [navigate, orderData]);

  if (!orderData) {
    return null;
  }

  const handleContinueShopping = () => {
    sessionStorage.removeItem('orderData');
    sessionStorage.removeItem('checkoutData');
    navigate(ROUTES.PRODUCTS);
  };

  return (
    <div className="order-summary-page">
      <div className="order-summary-container">
        <div className="success-icon">✓</div>
        <h1 className="success-title">Order Placed Successfully!</h1>
        <p className="success-subtitle">
          Thank you for your purchase. Your order has been received.
        </p>

        <div className="order-details-card">
          <div className="order-header">
            <div className="order-info-item">
              <span className="label">Order Number</span>
              <span className="value">{orderData.orderId}</span>
            </div>
            <div className="order-info-item">
              <span className="label">Order Date</span>
              <span className="value">{formatDate(orderData.date)}</span>
            </div>
            <div className="order-info-item">
              <span className="label">Total Amount</span>
              <span className="value total-amount">
                {formatCurrency(orderData.total)}
              </span>
            </div>
          </div>

          {checkoutData && (
            <div className="shipping-info">
              <h2>Shipping Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-value">
                    {checkoutData.firstName} {checkoutData.lastName}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{checkoutData.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{checkoutData.phone}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Address:</span>
                  <span className="info-value">
                    {checkoutData.address}, {checkoutData.city},{' '}
                    {checkoutData.state} {checkoutData.zipCode}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="order-items">
            <h2>Order Items</h2>
            <div className="items-list">
              {orderData.items.map((item) => (
                <div key={item.id} className="order-item">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="item-image"
                  />
                  <div className="item-details">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-category">{item.category}</p>
                    <p className="item-quantity">Quantity: {item.quantity}</p>
                  </div>
                  <div className="item-price">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="payment-info">
            <h2>Payment Method</h2>
            <p className="payment-method">
              {orderData.paymentMethod.replace(/_/g, ' ').toUpperCase()}
            </p>
          </div>
        </div>

        <div className="order-actions">
          <Button size="large" onClick={handleContinueShopping}>
            Continue Shopping
          </Button>
          <Button
            size="large"
            variant="outline"
            onClick={() => window.print()}
          >
            Print Receipt
          </Button>
        </div>

        <div className="next-steps">
          <h3>What's Next?</h3>
          <ul>
            <li>📧 You will receive an order confirmation email shortly</li>
            <li>📦 Your order will be processed within 1-2 business days</li>
            <li>🚚 Estimated delivery: 3-5 business days</li>
            <li>📱 Track your order status in your account</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryPage;

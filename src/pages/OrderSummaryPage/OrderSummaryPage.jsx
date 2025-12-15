import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button/Button';
import { tracer, logger } from '../../telemetry/telemetry';
import { SpanStatusCode } from '@opentelemetry/api';
import './OrderSummaryPage.css';

const OrderSummaryPage = () => {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      return tracer.startActiveSpan('order.summary.fetch', async (span) => {
        try {
          // Get order ID from sessionStorage (set by PaymentPage)
          const storedOrder = sessionStorage.getItem('orderData');
          
          if (!storedOrder) {
            logger.warn('No order data in session, redirecting to products');
            navigate(ROUTES.PRODUCTS);
            span.setStatus({ code: SpanStatusCode.ERROR, message: 'No order data' });
            span.end();
            return;
          }
          
          const order = JSON.parse(storedOrder);
          span.setAttribute('order.id', order.orderId);
          
          // If we have a full order from sessionStorage, use it
          // (Backend doesn't store orders in this demo, so we use sessionStorage)
          if (order.orderId) {
            setOrderData(order);
            span.addEvent('order_loaded_from_session', {
              'order.id': order.orderId,
              'order.total': order.total,
            });
            logger.info('Order summary displayed', {
              'order.id': order.orderId,
              'order.total': order.total,
            });
            span.setStatus({ code: SpanStatusCode.OK });
          } else {
            throw new Error('Invalid order data');
          }
        } catch (error) {
          span.recordException(error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
          logger.error('Failed to load order summary', {
            'error.message': error.message,
          });
          navigate(ROUTES.PRODUCTS);
        } finally {
          setLoading(false);
          span.end();
        }
      });
    };
    
    fetchOrderDetails();
  }, [navigate]);

  if (loading) {
    return (
      <div className="order-summary-page">
        <div className="order-summary-container">
          <h1>Loading order details...</h1>
        </div>
      </div>
    );
  }

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

          <div className="shipping-info">
            <h2>Shipping Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">
                  {orderData.customer?.firstName} {orderData.customer?.lastName}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{orderData.customer?.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone:</span>
                <span className="info-value">{orderData.customer?.phone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Address:</span>
                <span className="info-value">
                  {orderData.shippingAddress?.street}, {orderData.shippingAddress?.city},{' '}
                  {orderData.shippingAddress?.state} {orderData.shippingAddress?.zipCode}
                </span>
              </div>
            </div>
          </div>

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

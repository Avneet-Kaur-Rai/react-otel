/**
 * ProductDetailPage with OpenTelemetry Instrumentation
 * 
 * For Session Demo: Shows page-level tracing
 * - Page view tracking
 * - User action tracking
 * - Navigation flows
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { PRODUCTS } from '../../constants/productData';
import { ROUTES } from '../../constants/routes';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';
import Button from '../../components/common/Button/Button';
import { tracer, recordBusinessMetric } from '../../telemetry/telemetry';
import { SpanStatusCode } from '@opentelemetry/api';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const product = PRODUCTS.find((p) => p.id === parseInt(id));

  // ============================================================================
  // Track Page View (For Session: Explain importance of page analytics)
  // ============================================================================
  useEffect(() => {
    const span = tracer.startSpan('page.view.productDetail');
    
    span.setAttribute('page.name', 'ProductDetailPage');
    span.setAttribute('page.route', `/product/${id}`);
    span.setAttribute('product.id', id);
    
    if (product) {
      // Product found - track product details
      span.setAttribute('product.name', product.name);
      span.setAttribute('product.category', product.category);
      span.setAttribute('product.price', product.price);
      span.setAttribute('product.inStock', product.inStock);
      span.setAttribute('product.rating', product.rating);
      
      span.addEvent('product_detail_loaded', {
        'product.id': product.id,
        'product.name': product.name,
      });
      
      recordBusinessMetric('page.product_view', 1);
      recordBusinessMetric('product.views', 1);
      
      span.setStatus({ code: SpanStatusCode.OK });
      
      console.log(`👁️ [OTel] Product viewed: ${product.name}`);
    } else {
      // Product not found - track error
      span.setAttribute('error', true);
      span.addEvent('product_not_found', {
        'product.id': id,
      });
      
      recordBusinessMetric('page.product_not_found', 1);
      
      span.setStatus({ 
        code: SpanStatusCode.ERROR,
        message: 'Product not found' 
      });
      
      console.warn(`⚠️ [OTel] Product not found: ${id}`);
    }
    
    span.end();
    
    // Cleanup: Track time spent on page
    const startTime = Date.now();
    return () => {
      const timeSpent = Date.now() - startTime;
      const exitSpan = tracer.startSpan('page.exit.productDetail');
      exitSpan.setAttribute('page.timeSpent_ms', timeSpent);
      exitSpan.setAttribute('product.id', id);
      exitSpan.end();
      
      console.log(`⏱️ [OTel] Time on product page: ${timeSpent}ms`);
    };
  }, [id, product]);

  if (!product) {
    return (
      <div className="pdp-page">
        <div className="pdp-container">
          <div className="product-not-found">
            <h2>Product Not Found</h2>
            <Button onClick={() => navigate(ROUTES.PRODUCTS)}>
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Handle Add to Cart
   * 
   * For Session: Show how to trace user actions
   */
  const handleAddToCart = () => {
    return tracer.startActiveSpan('user.action.addToCart', (span) => {
      try {
        span.setAttribute('product.id', product.id);
        span.setAttribute('product.name', product.name);
        span.setAttribute('product.price', product.price);
        span.setAttribute('action.source', 'product_detail_page');
        
        span.addEvent('add_to_cart_button_clicked');
        
        // CartContext will create its own span as a child of this span
        addToCart(product);
        
        span.addEvent('add_to_cart_successful');
        alert('Product added to cart!');
        
        recordBusinessMetric('user.add_to_cart', 1);
        span.setStatus({ code: SpanStatusCode.OK });
        
        console.log(`🛒 [OTel] Add to cart action: ${product.name}`);
        
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.recordException(error);
        console.error('❌ [OTel] Add to cart failed:', error);
      } finally {
        span.end();
      }
    });
  };

  /**
   * Handle Buy Now
   * 
   * For Session: Show navigation tracing
   */
  const handleBuyNow = () => {
    return tracer.startActiveSpan('user.action.buyNow', (span) => {
      try {
        span.setAttribute('product.id', product.id);
        span.setAttribute('product.name', product.name);
        span.setAttribute('product.price', product.price);
        span.setAttribute('action.source', 'product_detail_page');
        span.setAttribute('navigation.target', ROUTES.CART);
        
        span.addEvent('buy_now_button_clicked');
        
        // Add to cart
        addToCart(product);
        span.addEvent('product_added_to_cart');
        
        // Navigate to cart
        span.addEvent('navigating_to_cart');
        navigate(ROUTES.CART);
        
        recordBusinessMetric('user.buy_now', 1);
        recordBusinessMetric('conversion.quick_checkout', 1);
        
        span.setStatus({ code: SpanStatusCode.OK });
        
        console.log(`💳 [OTel] Buy now action: ${product.name}`);
        
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.recordException(error);
        console.error('❌ [OTel] Buy now failed:', error);
      } finally {
        span.end();
      }
    });
  };

  return (
    <div className="pdp-page">
      <div className="pdp-container">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>

        <div className="product-detail">
          <div className="product-image-section">
            <img
              src={product.image}
              alt={product.name}
              className="product-detail-image"
            />
          </div>

          <div className="product-info-section">
            <span className="product-category-badge">{product.category}</span>
            <h1 className="product-detail-name">{product.name}</h1>

            <div className="product-rating-section">
              <div className="rating-stars">
                {'⭐'.repeat(Math.round(product.rating))}
              </div>
              <span className="rating-text">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>

            <div className="product-price-section">
              <span className="product-detail-price">
                {formatCurrency(product.price)}
              </span>
              {product.inStock ? (
                <span className="stock-status in-stock">In Stock</span>
              ) : (
                <span className="stock-status out-of-stock">Out of Stock</span>
              )}
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            <div className="product-features">
              <h3>Features</h3>
              <ul>
                <li>High-quality materials</li>
                <li>30-day money-back guarantee</li>
                <li>Free shipping on orders over $100</li>
                <li>1-year warranty included</li>
              </ul>
            </div>

            <div className="product-actions">
              <Button
                size="large"
                onClick={handleAddToCart}
                disabled={!product.inStock}
                fullWidth
              >
                Add to Cart
              </Button>
              {/* UIFIX AI - BUG - STYLE
                  Description: Buy Now button using 'danger' variant instead of 'secondary'
                  Impact: Button appears red/error color instead of neutral secondary style
                  Expected: variant="secondary" for proper CTA styling */}
              <Button
                size="large"
                variant="danger"
                onClick={handleBuyNow}
                disabled={!product.inStock}
                fullWidth
              >
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

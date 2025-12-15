/**
 * ProductDetailPage with OpenTelemetry Instrumentation
 * 
 * For Session Demo: Shows page-level tracing
 * - Page view tracking
 * - User action tracking
 * - Navigation flows
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ROUTES } from '../../constants/routes';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';
import Button from '../../components/common/Button/Button';
import { tracer, businessMetrics, logger } from '../../telemetry/telemetry';
import { SpanStatusCode } from '@opentelemetry/api';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================================
  // Fetch Product from Backend
  // ============================================================================
  useEffect(() => {
    const fetchProduct = async () => {
      return tracer.startActiveSpan('product.detail.fetch', async (span) => {
        try {
          span.setAttribute('product.id', id);
          span.setAttribute('http.method', 'GET');
          span.setAttribute('http.url', `http://localhost:3001/api/products/${id}`);
          
          span.addEvent('fetching_product_details');
          
          const response = await fetch(`http://localhost:3001/api/products/${id}`);
          
          span.setAttribute('http.status_code', response.status);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.success && data.product) {
            setProduct(data.product);
            span.addEvent('product_fetched', {
              'product.name': data.product.name,
              'product.price': data.product.price,
            });
            logger.info('Product details fetched from backend', {
              'product.id': data.product.id,
              'product.name': data.product.name,
            });
          } else {
            throw new Error('Product not found');
          }
          
          span.setStatus({ code: SpanStatusCode.OK });
        } catch (error) {
          span.recordException(error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
          logger.error('Failed to fetch product details', {
            'product.id': id,
            'error.message': error.message,
          });
          setProduct(null);
        } finally {
          setLoading(false);
          span.end();
        }
      });
    };
    
    fetchProduct();
  }, [id]);

  // ============================================================================
  // Track Page View (For Session: Explain importance of page analytics)
  // ============================================================================
  useEffect(() => {
    if (!product) return;
    
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
      
      // Track product view metric
      businessMetrics.productViews.add(1, {
        'product.id': product.id.toString(),
        'product.category': product.category
      });
      
      // Log product view
      logger.info('Product viewed', {
        'product.id': product.id,
        'product.name': product.name,
        'product.price': product.price
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
    } else {
      // Product not found - track error
      span.setAttribute('error', true);
      span.addEvent('product_not_found', {
        'product.id': id,
      });
      
      // Log not found
      logger.warn('Product not found', {
        'product.id': id
      });
      
      span.setStatus({ 
        code: SpanStatusCode.ERROR,
        message: 'Product not found' 
      });
    }
    
    span.end();
    
    // Cleanup: Track time spent on page
    const startTime = Date.now();
    return () => {
      const timeSpan = Date.now() - startTime;
      const exitSpan = tracer.startSpan('page.exit.productDetail');
      exitSpan.setAttribute('page.timeSpent_ms', timeSpan);
      exitSpan.setAttribute('product.id', id);
      exitSpan.end();
      
      console.log(`⏱️ [OTel] Time on product page: ${timeSpan}ms`);
    };
  }, [id, product]);

  if (loading) {
    return (
      <div className="pdp-page">
        <div className="pdp-container">
          <h1>Loading product...</h1>
        </div>
      </div>
    );
  }

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
        
        // Log user action
        logger.info('Add to cart from product detail', {
          'product.id': product.id,
          'product.name': product.name
        });
        
        span.setStatus({ code: SpanStatusCode.OK });
        
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.recordException(error);
        
        logger.error('Add to cart failed', {
          'error.message': error.message,
          'product.id': product.id
        });
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
        
        // Track quick checkout
        businessMetrics.checkoutStarted.add(1, {
          'source': 'buy_now_button',
          'product.id': product.id.toString()
        });
        
        // Log buy now action
        logger.info('Buy now clicked', {
          'product.id': product.id,
          'product.name': product.name
        });
        
        span.setStatus({ code: SpanStatusCode.OK });
        
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.recordException(error);
        
        logger.error('Buy now failed', {
          'error.message': error.message,
          'product.id': product.id
        });
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

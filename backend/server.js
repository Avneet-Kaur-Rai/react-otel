/**
 * Express API Server with OpenTelemetry
 * 
 * ChicCloset Fashion E-commerce Backend
 * Demonstrates distributed tracing with custom spans
 */

// ============================================================================
// STEP 1: Initialize OpenTelemetry FIRST!
// ============================================================================
require('./tracing');

// ============================================================================
// STEP 2: Import other modules
// ============================================================================
const express = require('express');
const cors = require('cors');
const { trace, SpanStatusCode } = require('@opentelemetry/api');

// Get tracer for custom instrumentation
const tracer = trace.getTracer('chiccloset-backend-tracer', '1.0.0');

// ============================================================================
// Setup Express
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // React app
  credentials: true,
  // Allow OpenTelemetry trace headers
  allowedHeaders: ['Content-Type', 'Authorization', 'traceparent', 'tracestate'],
  exposedHeaders: ['traceparent', 'tracestate'],
}));
app.use(express.json());

// Request logging middleware with trace context
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log trace headers if present
  if (req.headers.traceparent) {
    console.log(`📥 ${req.method} ${req.path} - traceparent: ${req.headers.traceparent}`);
  }
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const traceInfo = req.headers.traceparent ? ' ✅ traced' : ' ⚠️ not traced';
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)${traceInfo}`);
  });
  next();
});

// ============================================================================
// Mock Data - ChicCloset Fashion Products
// ============================================================================

const users = [
  { id: 1, email: 'demo@chiccloset.com', name: 'Fashion Lover', password: 'demo123' },
  { id: 2, email: 'jane@example.com', name: 'Jane Smith', password: 'password' },
];

const products = [
  { 
    id: 1, 
    name: 'Floral Summer Dress', 
    price: 89.99, 
    stock: 15, 
    category: 'Dresses',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&h=500&fit=crop',
    description: 'Lightweight floral print dress perfect for summer days. Features adjustable straps and a flattering A-line silhouette.',
    rating: 4.7,
    reviews: 234,
    inStock: true,
  },
  { 
    id: 2, 
    name: 'Classic Denim Jacket', 
    price: 129.99, 
    stock: 8, 
    category: 'Jackets',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop',
    description: 'Timeless denim jacket with distressed details. Versatile piece that pairs with any outfit.',
    rating: 4.8,
    reviews: 567,
    inStock: true,
  },
  { 
    id: 3, 
    name: 'High-Waisted Skinny Jeans', 
    price: 79.99, 
    stock: 25, 
    category: 'Bottoms',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=500&fit=crop',
    description: 'Comfortable stretch denim with a flattering high-waist fit. Available in multiple washes.',
    rating: 4.5,
    reviews: 892,
    inStock: true,
  },
  { 
    id: 4, 
    name: 'Silk Blouse - Ivory', 
    price: 119.99, 
    stock: 12, 
    category: 'Tops',
    image: 'https://images.unsplash.com/photo-1564257577-6049b8f0f7d1?w=500&h=500&fit=crop',
    description: 'Luxurious 100% silk blouse with delicate button details. Perfect for work or evening wear.',
    rating: 4.6,
    reviews: 312,
    inStock: true,
  },
  { 
    id: 5, 
    name: 'Maxi Wrap Dress', 
    price: 149.99, 
    stock: 10, 
    category: 'Dresses',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=500&fit=crop',
    description: 'Elegant wrap dress in flowing fabric. Features a tie waist and flattering V-neckline.',
    rating: 4.9,
    reviews: 421,
    inStock: true,
  },
  { 
    id: 6, 
    name: 'Leather Ankle Boots', 
    price: 189.99, 
    stock: 6, 
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=500&fit=crop',
    description: 'Premium leather ankle boots with block heel. Comfortable and stylish for all-day wear.',
    rating: 4.7,
    reviews: 156,
    inStock: true,
  },
  { 
    id: 7, 
    name: 'Cashmere Sweater', 
    price: 199.99, 
    stock: 9, 
    category: 'Tops',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=500&fit=crop',
    description: 'Soft 100% cashmere crewneck sweater. Available in multiple colors for layering.',
    rating: 4.8,
    reviews: 289,
    inStock: true,
  },
  { 
    id: 8, 
    name: 'Wide-Leg Trousers', 
    price: 99.99, 
    stock: 18, 
    category: 'Bottoms',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=500&fit=crop',
    description: 'Tailored wide-leg trousers with pleated front. Professional and comfortable fit.',
    rating: 4.6,
    reviews: 445,
    inStock: true,
  },
];

let orders = [];

// ============================================================================
// Helper Functions with Custom Spans
// ============================================================================

/**
 * Simulate database query
 */
function simulateDbQuery(queryName, duration = 50) {
  return tracer.startActiveSpan(`database.${queryName}`, (span) => {
    try {
      span.setAttribute('db.system', 'postgresql');
      span.setAttribute('db.operation', 'SELECT');
      span.setAttribute('db.name', 'chiccloset_db');
      span.setAttribute('db.table', queryName.split('.')[1] || 'unknown');
      
      // Simulate query delay
      const start = Date.now();
      while (Date.now() - start < duration) {}
      
      span.addEvent('query_executed', {
        'query.duration_ms': duration,
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      return true;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Validate user credentials
 */
function validateUser(email, password) {
  return tracer.startActiveSpan('auth.validateCredentials', (span) => {
    try {
      span.setAttribute('auth.method', 'password');
      span.setAttribute('user.email', email);
      
      span.addEvent('validation_started');
      
      // Simulate database lookup
      simulateDbQuery('query.users', 30);
      
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        span.addEvent('user_authenticated');
        span.setAttribute('auth.result', 'success');
        span.setAttribute('user.id', user.id);
        span.setStatus({ code: SpanStatusCode.OK });
        return user;
      } else {
        span.addEvent('authentication_failed');
        span.setAttribute('auth.result', 'failure');
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Invalid credentials' });
        return null;
      }
    } finally {
      span.end();
    }
  });
}

/**
 * Check product availability
 */
function checkInventory(productId, quantity) {
  return tracer.startActiveSpan('inventory.check', (span) => {
    try {
      span.setAttribute('product.id', productId);
      span.setAttribute('quantity.requested', quantity);
      
      simulateDbQuery('query.inventory', 40);
      
      const product = products.find(p => p.id === productId);
      
      if (product && product.stock >= quantity) {
        span.setAttribute('inventory.available', true);
        span.setAttribute('inventory.stock', product.stock);
        span.addEvent('inventory_sufficient', {
          'available_stock': product.stock,
          'requested_quantity': quantity,
        });
        span.setStatus({ code: SpanStatusCode.OK });
        return { available: true, product };
      } else {
        span.setAttribute('inventory.available', false);
        span.addEvent('inventory_insufficient', {
          'available_stock': product?.stock || 0,
          'requested_quantity': quantity,
        });
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Insufficient stock' });
        return { available: false, product };
      }
    } finally {
      span.end();
    }
  });
}

/**
 * Process payment
 */
function processPayment(amount, paymentMethod) {
  return tracer.startActiveSpan('payment.process', (span) => {
    try {
      span.setAttribute('payment.amount', amount);
      span.setAttribute('payment.method', paymentMethod);
      span.setAttribute('payment.gateway', 'stripe');
      
      span.addEvent('payment_initiated');
      
      // Simulate payment processing
      const start = Date.now();
      while (Date.now() - start < 100) {}
      
      // 95% success rate
      const success = Math.random() > 0.05;
      
      if (success) {
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        span.setAttribute('payment.transaction_id', transactionId);
        span.addEvent('payment_successful', {
          'transaction_id': transactionId,
        });
        span.setStatus({ code: SpanStatusCode.OK });
        return { success: true, transactionId };
      } else {
        span.addEvent('payment_failed');
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Payment declined' });
        return { success: false, error: 'Payment declined by gateway' };
      }
    } finally {
      span.end();
    }
  });
}

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * Health Check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * User Login
 */
app.post('/api/auth/login', (req, res) => {
  return tracer.startActiveSpan('api.auth.login', (span) => {
    try {
      const { email, password } = req.body;
      
      span.setAttribute('http.method', 'POST');
      span.setAttribute('http.route', '/api/auth/login');
      span.setAttribute('user.email', email);
      
      span.addEvent('login_attempt_started');
      
      // Validate credentials
      const user = validateUser(email, password);
      
      if (user) {
        span.addEvent('login_successful', {
          'user.id': user.id,
        });
        span.setAttribute('auth.result', 'success');
        span.setStatus({ code: SpanStatusCode.OK });
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({
          success: true,
          user: userWithoutPassword,
          token: `jwt_${Date.now()}_${user.id}`,
        });
      } else {
        span.addEvent('login_failed');
        span.setAttribute('auth.result', 'failure');
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Invalid credentials' });
        
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      res.status(500).json({ success: false, message: 'Server error' });
    } finally {
      span.end();
    }
  });
});

/**
 * Get Products
 */
app.get('/api/products', (req, res) => {
  return tracer.startActiveSpan('api.products.list', (span) => {
    try {
      span.setAttribute('http.method', 'GET');
      span.setAttribute('http.route', '/api/products');
      
      const { category } = req.query;
      
      if (category) {
        span.setAttribute('filter.category', category);
      }
      
      simulateDbQuery('query.products', 20);
      
      let filteredProducts = products;
      if (category && category !== 'All') {
        filteredProducts = products.filter(p => p.category === category);
      }
      
      span.setAttribute('products.count', filteredProducts.length);
      span.addEvent('products_fetched', {
        'count': filteredProducts.length,
      });
      span.setStatus({ code: SpanStatusCode.OK });
      
      res.json({
        success: true,
        products: filteredProducts,
      });
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      res.status(500).json({ success: false, message: 'Server error' });
    } finally {
      span.end();
    }
  });
});

/**
 * Get Product by ID
 */
app.get('/api/products/:id', (req, res) => {
  return tracer.startActiveSpan('api.products.get', (span) => {
    try {
      const productId = parseInt(req.params.id);
      span.setAttribute('product.id', productId);
      
      simulateDbQuery('query.product_by_id', 25);
      
      const product = products.find(p => p.id === productId);
      
      if (product) {
        span.addEvent('product_found');
        span.setStatus({ code: SpanStatusCode.OK });
        res.json({ success: true, product });
      } else {
        span.addEvent('product_not_found');
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Product not found' });
        res.status(404).json({ success: false, message: 'Product not found' });
      }
    } finally {
      span.end();
    }
  });
});

/**
 * Create Order
 */
app.post('/api/orders', (req, res) => {
  return tracer.startActiveSpan('api.orders.create', (span) => {
    try {
      const { userId, items, shippingAddress, paymentMethod } = req.body;
      
      span.setAttribute('http.method', 'POST');
      span.setAttribute('http.route', '/api/orders');
      span.setAttribute('order.userId', userId);
      span.setAttribute('order.itemCount', items.length);
      
      span.addEvent('order_creation_started');
      
      // Step 1: Validate user
      simulateDbQuery('query.user', 30);
      span.addEvent('user_validated');
      
      // Step 2: Check inventory for all items
      const inventoryChecks = [];
      for (const item of items) {
        const check = checkInventory(item.productId, item.quantity);
        inventoryChecks.push(check);
        if (!check.available) {
          span.addEvent('inventory_check_failed', {
            'product.id': item.productId,
          });
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Insufficient inventory' });
          return res.status(400).json({
            success: false,
            message: `Product ${check.product?.name || item.productId} is out of stock`,
          });
        }
      }
      
      span.addEvent('inventory_validated');
      
      // Step 3: Calculate total
      const total = items.reduce((sum, item) => {
        const check = inventoryChecks.find(c => c.product.id === item.productId);
        return sum + (check.product.price * item.quantity);
      }, 0);
      
      span.setAttribute('order.total', total);
      
      // Step 4: Process payment
      const paymentResult = processPayment(total, paymentMethod);
      
      if (!paymentResult.success) {
        span.addEvent('payment_failed');
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Payment failed' });
        return res.status(400).json({
          success: false,
          message: paymentResult.error,
        });
      }
      
      span.addEvent('payment_completed', {
        'transaction_id': paymentResult.transactionId,
      });
      
      // Step 5: Create order
      simulateDbQuery('insert.order', 50);
      
      const order = {
        id: orders.length + 1,
        userId,
        items,
        total,
        shippingAddress,
        paymentMethod,
        transactionId: paymentResult.transactionId,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };
      
      orders.push(order);
      
      span.addEvent('order_created', {
        'order.id': order.id,
        'order.total': total,
        'order.status': 'confirmed',
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      
      res.status(201).json({
        success: true,
        order: order,
        message: 'Order created successfully',
      });
      
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      res.status(500).json({ success: false, message: 'Server error' });
    } finally {
      span.end();
    }
  });
});

/**
 * Get Order by ID
 */
app.get('/api/orders/:id', (req, res) => {
  return tracer.startActiveSpan('api.orders.get', (span) => {
    try {
      const orderId = parseInt(req.params.id);
      span.setAttribute('order.id', orderId);
      
      simulateDbQuery('query.order', 25);
      
      const order = orders.find(o => o.id === orderId);
      
      if (order) {
        span.addEvent('order_found');
        span.setStatus({ code: SpanStatusCode.OK });
        res.json({ success: true, order });
      } else {
        span.addEvent('order_not_found');
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Order not found' });
        res.status(404).json({ success: false, message: 'Order not found' });
      }
    } finally {
      span.end();
    }
  });
});

/**
 * Get All Orders
 */
app.get('/api/orders', (req, res) => {
  return tracer.startActiveSpan('api.orders.list', (span) => {
    try {
      simulateDbQuery('query.orders', 30);
      
      span.setAttribute('orders.count', orders.length);
      span.addEvent('orders_fetched');
      span.setStatus({ code: SpanStatusCode.OK });
      
      res.json({
        success: true,
        orders: orders,
      });
    } finally {
      span.end();
    }
  });
});

/**
 * Health Check (not traced)
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Debug endpoint to verify trace context propagation
 */
app.get('/api/debug/trace', (req, res) => {
  return tracer.startActiveSpan('api.debug.trace', (span) => {
    try {
      const traceparent = req.headers.traceparent;
      const tracestate = req.headers.tracestate;
      const spanContext = span.spanContext();
      
      const debugInfo = {
        success: true,
        message: 'Trace context received',
        headers: {
          traceparent: traceparent || 'NOT RECEIVED',
          tracestate: tracestate || 'NOT RECEIVED',
        },
        activeSpan: {
          traceId: spanContext.traceId,
          spanId: spanContext.spanId,
          traceFlags: spanContext.traceFlags,
        },
        note: traceparent 
          ? '✅ Distributed tracing is working!' 
          : '❌ traceparent header not received - check CORS and fetch config',
      };
      
      console.log('🔍 Debug trace endpoint called:');
      console.log(JSON.stringify(debugInfo, null, 2));
      
      span.setStatus({ code: SpanStatusCode.OK });
      res.json(debugInfo);
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      res.status(500).json({ success: false, error: error.message });
    } finally {
      span.end();
    }
  });
});

// ============================================================================
// Error Handler
// ============================================================================

app.use((err, req, res, next) => {
  const span = trace.getActiveSpan();
  if (span) {
    span.recordException(err);
    span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
  }
  
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🚀 ChicCloset Backend Server Running`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`   URL: http://localhost:${PORT}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`   GET    /health`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/products`);
  console.log(`   GET    /api/products/:id`);
  console.log(`   POST   /api/orders`);
  console.log(`   GET    /api/orders`);
  console.log(`   GET    /api/orders/:id`);
  console.log('');
  console.log('📊 Traces sent to: http://localhost:4318/v1/traces');
  console.log('🔍 View in Jaeger: http://localhost:16686');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

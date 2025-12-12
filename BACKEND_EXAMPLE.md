# Node.js Backend Example with OpenTelemetry

> **Optional Backend for Complete Distributed Tracing Demo**
> 
> This shows how to connect React frontend traces with Node.js backend traces

---

## 📋 What This Adds to Your Demo

With this backend, you can demonstrate:
- **Distributed tracing** across frontend → backend → database
- **Context propagation** via HTTP headers
- **End-to-end visibility** of entire request flow
- **Real API instrumentation** (not just mocked data)

---

## 🚀 Quick Setup

### 1. Create Backend Directory

```bash
mkdir backend
cd backend
```

### 2. Initialize Node.js Project

```bash
npm init -y
```

### 3. Install Dependencies

```bash
npm install express cors
npm install --save-dev nodemon

# OpenTelemetry packages
npm install @opentelemetry/api
npm install @opentelemetry/sdk-node
npm install @opentelemetry/auto-instrumentations-node
npm install @opentelemetry/exporter-trace-otlp-http
npm install @opentelemetry/resources
npm install @opentelemetry/semantic-conventions
```

### 4. Create Backend Files

---

## 📁 File Structure

```
backend/
├── package.json
├── tracing.js          # OTel initialization
├── server.js           # Express API
└── README.md           # This file
```

---

## 📄 File: `tracing.js`

```javascript
/**
 * OpenTelemetry Configuration for Node.js Backend
 * 
 * IMPORTANT: This must be imported FIRST, before any other modules
 */

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { 
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION 
} = require('@opentelemetry/semantic-conventions');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

// ============================================================================
// Configure Resource (Service Identity)
// ============================================================================

const resource = new Resource({
  [ATTR_SERVICE_NAME]: 'shophub-ecommerce-backend',
  [ATTR_SERVICE_VERSION]: '1.0.0',
  'deployment.environment': 'development',
  'service.namespace': 'ecommerce',
});

// ============================================================================
// Configure Exporter (Where to send traces)
// ============================================================================

const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces', // Jaeger endpoint
  headers: {},
});

// ============================================================================
// Initialize OpenTelemetry SDK
// ============================================================================

const sdk = new NodeSDK({
  resource: resource,
  traceExporter: traceExporter,
  
  // Auto-instrumentation for common Node.js libraries
  instrumentations: [
    getNodeAutoInstrumentations({
      // Automatically instrument:
      // - express (HTTP server)
      // - http/https (outgoing requests)
      // - fs (file system)
      // - dns (DNS lookups)
      // - And many more!
      
      // Customize specific instrumentations
      '@opentelemetry/instrumentation-http': {
        // Ignore health check endpoints
        ignoreIncomingRequestHook: (request) => {
          return request.url === '/health';
        },
      },
      '@opentelemetry/instrumentation-express': {
        // Add custom attributes to HTTP spans
        requestHook: (span, info) => {
          span.setAttribute('custom.request_id', info.request.headers['x-request-id'] || 'none');
        },
      },
    }),
  ],
});

// ============================================================================
// Start the SDK
// ============================================================================

sdk.start();

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('🎉 OpenTelemetry SDK Started (Backend)');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('📊 Configuration:');
console.log(`   Service: shophub-ecommerce-backend`);
console.log(`   Version: 1.0.0`);
console.log(`   Exporter: http://localhost:4318/v1/traces`);
console.log('');
console.log('🔧 Auto-instrumented:');
console.log('   ✓ Express HTTP server');
console.log('   ✓ HTTP/HTTPS requests');
console.log('   ✓ File system operations');
console.log('   ✓ DNS lookups');
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// ============================================================================
// Graceful Shutdown
// ============================================================================

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('📊 OTel SDK terminated'))
    .catch((error) => console.error('❌ Error shutting down OTel SDK', error))
    .finally(() => process.exit(0));
});

// Export for manual instrumentation if needed
module.exports = sdk;
```

---

## 📄 File: `server.js`

```javascript
/**
 * Express API Server with OpenTelemetry
 * 
 * For Session Demo: Shows backend instrumentation
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
const tracer = trace.getTracer('shophub-backend-tracer', '1.0.0');

// ============================================================================
// Setup Express
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your React app
  credentials: true,
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ============================================================================
// Mock Data
// ============================================================================

const users = [
  { id: 1, email: 'john@example.com', name: 'John Doe' },
  { id: 2, email: 'jane@example.com', name: 'Jane Smith' },
];

const products = [
  { id: 1, name: 'Laptop', price: 999.99, stock: 10 },
  { id: 2, name: 'Headphones', price: 79.99, stock: 50 },
  { id: 3, name: 'Mouse', price: 29.99, stock: 100 },
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
      span.setAttribute('db.name', 'ecommerce');
      
      // Simulate query delay
      const start = Date.now();
      while (Date.now() - start < duration) {}
      
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
      
      // Simulate validation
      simulateDbQuery('query.users', 30);
      
      const user = users.find(u => u.email === email);
      
      if (user) {
        span.addEvent('user_found');
        span.setStatus({ code: SpanStatusCode.OK });
        return user;
      } else {
        span.addEvent('user_not_found');
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
        span.addEvent('inventory_available');
        span.setStatus({ code: SpanStatusCode.OK });
        return true;
      } else {
        span.setAttribute('inventory.available', false);
        span.addEvent('inventory_insufficient');
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Insufficient stock' });
        return false;
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
 * 
 * For Session: Show distributed tracing from frontend login
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
        span.addEvent('login_successful');
        span.setAttribute('auth.result', 'success');
        span.setStatus({ code: SpanStatusCode.OK });
        
        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          token: 'mock-jwt-token',
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
      
      simulateDbQuery('query.products', 20);
      
      span.setAttribute('products.count', products.length);
      span.addEvent('products_fetched');
      span.setStatus({ code: SpanStatusCode.OK });
      
      res.json({
        success: true,
        products: products,
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
 * Create Order
 * 
 * For Session: Show complex multi-step operation tracing
 */
app.post('/api/orders', (req, res) => {
  return tracer.startActiveSpan('api.orders.create', (span) => {
    try {
      const { userId, items, shippingAddress } = req.body;
      
      span.setAttribute('http.method', 'POST');
      span.setAttribute('http.route', '/api/orders');
      span.setAttribute('order.userId', userId);
      span.setAttribute('order.itemCount', items.length);
      
      span.addEvent('order_creation_started');
      
      // Step 1: Validate user
      simulateDbQuery('query.user', 30);
      span.addEvent('user_validated');
      
      // Step 2: Check inventory for all items
      let allAvailable = true;
      items.forEach(item => {
        const available = checkInventory(item.productId, item.quantity);
        if (!available) allAvailable = false;
      });
      
      if (!allAvailable) {
        span.addEvent('inventory_check_failed');
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Insufficient inventory' });
        return res.status(400).json({
          success: false,
          message: 'Some items are out of stock',
        });
      }
      
      span.addEvent('inventory_validated');
      
      // Step 3: Calculate total
      const total = items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + (product.price * item.quantity);
      }, 0);
      
      span.setAttribute('order.total', total);
      
      // Step 4: Create order
      simulateDbQuery('insert.order', 50);
      
      const order = {
        id: orders.length + 1,
        userId,
        items,
        total,
        shippingAddress,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      orders.push(order);
      
      span.addEvent('order_created', {
        'order.id': order.id,
        'order.total': total,
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      
      res.status(201).json({
        success: true,
        order: order,
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
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('Available endpoints:');
  console.log(`   GET    http://localhost:${PORT}/health`);
  console.log(`   POST   http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET    http://localhost:${PORT}/api/products`);
  console.log(`   POST   http://localhost:${PORT}/api/orders`);
  console.log(`   GET    http://localhost:${PORT}/api/orders/:id`);
  console.log('');
  console.log('📊 Traces sent to: http://localhost:4318/v1/traces');
  console.log('🔍 View in Jaeger: http://localhost:16686');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});
```

---

## 📄 File: `package.json` (update scripts)

```json
{
  "name": "shophub-backend",
  "version": "1.0.0",
  "description": "E-commerce backend with OpenTelemetry",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": ["opentelemetry", "express", "observability"],
  "author": "Your Name",
  "license": "MIT"
}
```

---

## 🎬 How to Use in Your Demo

### 1. Start Jaeger
```bash
docker-compose up -d
```

### 2. Start Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Start Frontend
```bash
# In another terminal, from project root
npm install
npm run dev
```

### 4. Demo Flow

**Show in Jaeger:**
1. Navigate to http://localhost:16686
2. You'll see TWO services:
   - `shophub-ecommerce-frontend`
   - `shophub-ecommerce-backend`

**Trigger a distributed trace:**
1. In your React app, trigger login (if you wire it up)
2. Or use curl to test:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"test123"}'
```

3. In Jaeger, search for traces
4. Click on a trace
5. **Show the magic:**

```
Complete Trace (both services):
└─ [Frontend] user.action.login       [500ms]
    └─ [Frontend] HTTP POST            [450ms]
        └─ [Backend] api.auth.login    [400ms]
            ├─ auth.validateCredentials [350ms]
            │   └─ database.query.users [300ms]
            └─ ...
```

**Talking Points:**
> "See how the trace flows from frontend to backend? The Trace ID is the same across both services. This is distributed tracing - we can see the entire request journey across multiple services, even in different languages!"

---

## 🎯 Advanced Demo Scenarios

### Scenario 1: Slow Database Query

**Setup:** Modify `simulateDbQuery` to be slower:
```javascript
function simulateDbQuery(queryName, duration = 2000) { // 2 seconds!
  // ...
}
```

**Demo:**
1. Create an order
2. Show trace in Jaeger
3. Instantly identify database as bottleneck

**Say:**
> "The order creation took 2.5 seconds. Where's the problem? Let's look... ah! The database query took 2 seconds. In production, we'd add an index or optimize the query."

### Scenario 2: Error Tracking

**Setup:** Force an error:
```javascript
app.post('/api/orders', (req, res) => {
  throw new Error('Payment gateway timeout!');
});
```

**Demo:**
1. Try to create order
2. Show error trace (highlighted in red)
3. Show exception details

**Say:**
> "When errors occur, they're automatically captured with full stack traces and context. We can see exactly what the user was doing when it failed."

---

## 📊 What This Shows Your Audience

✅ **Real distributed tracing** (not just frontend)
✅ **Context propagation** across services
✅ **Database query tracing** (simulated)
✅ **Error correlation** across services
✅ **End-to-end latency** visibility
✅ **Production-like setup** (multiple services)

---

## 🎓 Bonus: For Advanced Audiences

### Add Database (PostgreSQL) Tracing

If you want to show REAL database tracing:

```bash
npm install pg @opentelemetry/instrumentation-pg
```

Auto-instrumentation will automatically trace all PostgreSQL queries!

### Add Redis Caching

```bash
npm install redis @opentelemetry/instrumentation-redis
```

Show caching layer in traces!

### Add External API Calls

```bash
npm install axios
```

Make a call to external API and show it in traces.

---

## 🚀 Production Enhancements

For a production-ready version, add:

1. **Authentication**: JWT tokens, OAuth
2. **Database**: Real PostgreSQL/MongoDB
3. **Caching**: Redis
4. **Rate limiting**: Express rate limit
5. **Validation**: Joi or Zod
6. **Error handling**: Centralized error middleware
7. **Logging**: Winston with trace correlation
8. **Health checks**: Liveness/readiness probes
9. **Metrics**: Prometheus metrics
10. **Documentation**: Swagger/OpenAPI

---

## 📝 Summary

This backend gives you:
- **Complete distributed tracing demo**
- **Production-like instrumentation examples**
- **Easy to understand code**
- **Works with your existing frontend**
- **Shows OpenTelemetry best practices**

**Time to implement:** 30 minutes
**Demo impact:** HUGE! 🚀

---

**Ready to show end-to-end observability!** 🎉

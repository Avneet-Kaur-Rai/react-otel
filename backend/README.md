# ChicCloset Fashion Backend

Node.js backend with OpenTelemetry distributed tracing for the ChicCloset e-commerce demo.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm run dev
```

The server will run on `http://localhost:3001`

## 📊 OpenTelemetry Configuration

- **Service Name**: `chiccloset-fashion-backend`
- **Namespace**: `fashion-ecommerce`
- **Exporter**: OTLP HTTP to Jaeger (`http://localhost:4318/v1/traces`)
- **Auto-instrumentation**: Express, HTTP, File System, DNS

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - User login with credentials

### Products
- `GET /api/products` - Get all products (optional `?category=` filter)
- `GET /api/products/:id` - Get product by ID

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID

### Health
- `GET /health` - Server health check

## 🎯 Demo Credentials

```
Email: demo@chiccloset.com
Password: demo123
```

## 📈 Distributed Tracing

This backend demonstrates:
- ✅ **Auto-instrumentation** - HTTP requests automatically traced
- ✅ **Custom spans** - Database queries, auth validation, inventory checks, payment processing
- ✅ **Context propagation** - Trace context flows from frontend through backend
- ✅ **Span events** - Key operations marked with events (payment_successful, inventory_validated, etc.)
- ✅ **Error tracking** - Exceptions automatically captured with full context
- ✅ **Business attributes** - Order totals, product IDs, user emails tracked

## 🔍 Viewing Traces

1. Start backend: `npm run dev`
2. Make API requests (or use frontend)
3. Open Jaeger: `http://localhost:16686`
4. Select service: `chiccloset-fashion-backend`
5. View distributed traces showing frontend → backend → database flow

## 💡 Custom Spans

The backend includes custom spans for:
- `database.*` - Simulated database queries
- `auth.validateCredentials` - User authentication
- `inventory.check` - Stock availability
- `payment.process` - Payment processing
- `api.*` - API endpoint operations

## 🎬 Demo Scenarios

### Slow Database Query
Shows performance bottlenecks in traces when database queries are slow.

### Order Creation Flow
Demonstrates complex multi-step operation:
1. Validate user
2. Check inventory for each item
3. Calculate order total
4. Process payment
5. Create order record

Each step creates spans showing timing and dependencies.

### Error Tracking
When payments fail or inventory is insufficient, errors are captured with full trace context.

## 🛠️ Development

- `npm start` - Production mode
- `npm run dev` - Development mode with auto-restart (nodemon)

## 📦 Dependencies

- **express** - Web framework
- **cors** - Cross-origin resource sharing
- **@opentelemetry/sdk-node** - OTel SDK for Node.js
- **@opentelemetry/auto-instrumentations-node** - Auto-instrumentation
- **@opentelemetry/exporter-trace-otlp-http** - OTLP exporter

# ShopHub E-commerce with OpenTelemetry

> **Complete Observability Demo: React E-commerce Application with OpenTelemetry Instrumentation**

A production-ready React e-commerce application fully instrumented with OpenTelemetry for distributed tracing, demonstrating:
- ✅ Frontend observability (React + Vite)
- ✅ Auto-instrumentation (HTTP, user interactions, page loads)
- ✅ Custom business logic tracing
- ✅ Real-time visualization with Jaeger
- ✅ Production-ready patterns and best practices

Perfect for **technical sessions**, **learning OpenTelemetry**, and **production implementation**.

---

## 🎯 What This Demonstrates

### For Developers
- **Debug 10x faster** - See complete request journeys in seconds
- **Identify bottlenecks** - Visual timeline shows slow operations
- **Trace user flows** - Follow users through your app
- **Error tracking** - Full context when things break

### For Business
- **Improve conversion** - Identify checkout friction points
- **Reduce downtime** - Find issues before customers complain
- **Optimize performance** - Data-driven improvements
- **Better UX** - Understand user behavior

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- Docker Desktop running
- Git installed

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd react-otel
npm install
```

### 2. Start Jaeger (Trace Visualization)

```bash
docker-compose up -d
```

Verify Jaeger is running: http://localhost:16686

### 3. Start the App

```bash
npm run dev
```

App running at: http://localhost:5173

### 4. Use the App & Watch Traces!

1. Navigate through the app (browse products, add to cart, checkout)
2. Open Jaeger UI: http://localhost:16686
3. Select service: `shophub-ecommerce-frontend`
4. Click "Find Traces"
5. **See your traces! 🎉**

---

## 📊 Features

### E-Commerce Functionality
- **User Authentication**: Login/signup with validation
- **Product Catalog**: Browse, search, filter products
- **Shopping Cart**: Add/remove items, update quantities
- **Checkout Flow**: Multi-step checkout with validation
- **Payment Processing**: Multiple payment methods
- **Order Summary**: Complete order confirmation

### OpenTelemetry Instrumentation

#### ✅ Auto-Instrumentation (Zero Code Changes)
- **HTTP Requests** - Every fetch() call traced
- **User Interactions** - Clicks, form submits tracked
- **Page Loads** - Navigation and performance metrics
- **Resource Loading** - Images, CSS, JS timing

#### ✅ Custom Instrumentation (Business Logic)
- **Cart Operations** - Add/remove items with product details
- **Authentication** - Login/logout with user context
- **Checkout Flow** - Validation, submission, conversion tracking
- **Page Views** - Time on page, abandonment tracking
- **Business Metrics** - Cart value, conversion rates, error rates

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **React Router** - Navigation

### Observability
- **OpenTelemetry SDK** - Instrumentation
- **Jaeger** - Trace visualization
- **OTLP** - Data export protocol

### State Management
- **Context API** - Auth & Cart state
- **Custom Hooks** - Reusable logic

---

## 📁 Project Structure

```
react-otel/
├── src/
│   ├── telemetry/              # 🆕 OpenTelemetry Setup
│   │   └── telemetry.js       # OTel initialization & config
│   ├── components/
│   │   ├── common/            # Reusable UI components
│   │   ├── features/          # Feature-specific components
│   │   └── layout/            # Layout components
│   ├── pages/                 # Page components (instrumented)
│   │   ├── ProductDetailPage/
│   │   ├── CheckoutPage/
│   │   └── ...
│   ├── context/               # 🆕 Instrumented Contexts
│   │   ├── AuthContext.jsx    # Login/logout tracing
│   │   └── CartContext.jsx    # Cart operations tracing
│   ├── hooks/                 # Custom React hooks
│   ├── constants/             # App constants
│   ├── utils/                 # Utility functions
│   └── main.jsx              # 🆕 OTel init before React
├── docker-compose.yml        # 🆕 Jaeger setup
├── OPENTELEMETRY.md          # 🆕 Complete OTel guide
├── SESSION_DEMO.md           # 🆕 Presentation demo script
├── SLIDES_OUTLINE.md         # 🆕 Presentation slides
├── BACKEND_EXAMPLE.md        # 🆕 Node.js backend example
└── README.md                 # This file
```

---

## 🎓 For Technical Sessions

This project is **ready for presentations**! We've included everything you need:

### 📚 Documentation
1. **OPENTELEMETRY.md** - Complete guide to OpenTelemetry
   - What is OTel?
   - Core concepts (Traces, Spans, Collector)
   - Architecture diagrams
   - Real-world use cases
   - Best practices

2. **SESSION_DEMO.md** - Step-by-step demo script
   - Pre-session checklist
   - 60-minute presentation flow
   - Live demo walkthrough
   - Talking points
   - Q&A preparation
   - Troubleshooting guide

3. **SLIDES_OUTLINE.md** - Complete presentation structure
   - 40 slide deck outline
   - Speaker notes
   - Design tips
   - Visual guidelines

4. **BACKEND_EXAMPLE.md** - Optional Node.js backend
   - Distributed tracing across services
   - Database query tracing
   - Error propagation

### 🎬 Demo Flow (25 minutes)

1. **Code Walkthrough** (5 min)
   - Show telemetry initialization
   - Explain auto-instrumentation
   - Demonstrate custom spans

2. **Live User Journey** (10 min)
   - Browse products → traces in Jaeger
   - Add to cart → see business attributes
   - Checkout flow → multi-span traces

3. **Debugging Scenario** (5 min)
   - Search for slow operations
   - Identify bottlenecks
   - Show error tracking

4. **Advanced Features** (5 min)
   - Search/filter capabilities
   - Business metrics tracking
   - Production considerations

---

## 💻 Development

### Install Dependencies
│   │   ├── useCarousel.js
│   │   └── useForm.js
│   ├── utils/               # Utility functions
│   │   ├── formatters.js
│   │   └── validators.js
│   └── constants/           # Constants and static data
│       ├── routes.js
│       ├── enums.js
│       └── productData.js
```

## 🐛 Intentional Bugs (For Demo Purposes)

This project contains **3 intentionally injected bugs** marked with `UIFIX AI` comments:

### Bug #1: UI/UX Issue (CheckoutPage.jsx - Line 181)
- **Type**: Missing Navigation Button
- **Location**: `src/pages/CheckoutPage/CheckoutPage.jsx`
- **Description**: Missing "Back to Cart" button on checkout page
- **Impact**: Poor UX - users cannot navigate back to cart without browser back button
- **Expected Fix**: Add a "Back to Cart" button with `variant="outline"`

### Bug #2: Style Issue (ProductDetailPage.jsx - Line 102)
- **Type**: Incorrect Button Variant
- **Location**: `src/pages/ProductDetailPage/ProductDetailPage.jsx`
- **Description**: "Buy Now" button uses `variant="danger"` (red) instead of `variant="secondary"` (gray)
- **Impact**: Inconsistent UI - red button suggests destructive action, not purchase
- **Expected Fix**: Change to `variant="secondary"`

### Bug #3: Logical Issue (CartPage.jsx - Line 115)
- **Type**: Incorrect Calculation
- **Location**: `src/pages/CartPage/CartPage.jsx`
- **Description**: Tax calculation uses 0.5 (50%) instead of 0.1 (10%)
- **Impact**: Incorrect total price - customers charged 50% tax instead of 10%
- **Expected Fix**: Change `const tax = subtotal * 0.5` to `const tax = subtotal * 0.1`

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Avneet-Kaur-Rai/ui-fix-demo.git
cd ui-fix-demo
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔐 Demo Credentials

Since this is a mock application, you can use any credentials:
- **Email**: Any valid email format (e.g., demo@example.com)
- **Password**: Any password (minimum 6 characters)

## 🎯 Usage for POC Demo

This project is designed for showcasing automated UI fix capabilities:

1. **Run the application** to see all features working
2. **Identify the 3 bugs** marked with `UIFIX AI` comments
3. **Demonstrate automated detection** of these issues
4. **Apply automated fixes** to resolve the bugs
5. **Verify fixes** by testing the affected functionality

## 📝 License

This project is created for demonstration purposes only.

## 👥 Author

Avneet Kaur Rai

---

**Note**: This is a demo project with intentional bugs for showcasing automated UI fix capabilities. Do not use in production environments.

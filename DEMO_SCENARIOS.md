# 🎯 OpenTelemetry Demo Scenarios - Real-World Use Cases

This document outlines 5 powerful demo scenarios that showcase OpenTelemetry's capabilities in solving real business problems. Each scenario demonstrates the three pillars of observability (traces, metrics, logs) and their correlation.

---

## 📊 Scenario Overview

| Scenario | Business Problem | OTel Solution | Pillars Used | Wow Factor |
|----------|-----------------|---------------|--------------|------------|
| 1. Checkout Abandonment Investigation | Why are users leaving during checkout? | Trace analysis reveals slow API + error logs | Traces + Logs | 🔥🔥🔥 |
| 2. Performance Degradation Detective | Homepage loading slowly for some users | Distributed tracing shows bottleneck | Traces + Metrics | 🔥🔥🔥 |
| 3. Business Metrics Dashboard | Track revenue, conversions in real-time | Custom metrics with trace context | Metrics + Traces | 🔥🔥 |
| 4. Error Correlation | User reports "payment failed" | Trace ID connects frontend error → backend logs → DB query | Traces + Logs | 🔥🔥🔥 |
| 5. A/B Test Performance Impact | New feature causing slowdown? | Compare trace durations across experiments | Traces + Metrics | 🔥🔥 |

---

## 🔍 Scenario 1: The Checkout Abandonment Mystery

### Business Problem
**"30% of users abandon checkout on the payment page. Why?"**

### Demo Flow

#### Step 1: Show the Problem (Metrics)
```javascript
// In CheckoutPage.jsx - Already instrumented!
// Show how businessMetrics.checkoutStarted vs checkoutCompleted reveals gap

// LIVE DEMO:
// 1. Navigate to checkout multiple times
// 2. Abandon some, complete some
// 3. Show metrics in Jaeger (if Prometheus connected) or console
```

**What to Say:**
> "Our metrics show checkoutStarted: 100, but checkoutCompleted: 70. That's 30 conversions lost! But metrics don't tell us WHY. Let's dig into traces..."

#### Step 2: Find a Specific Abandonment (Traces)
```javascript
// Show in Jaeger:
// - Search for service: chiccloset-fashion-frontend
// - Operation: checkout.validate
// - Filter by: error = true

// You'll see traces with long durations or errors
```

**What to Say:**
> "Here's a trace where the user abandoned checkout. Look at this - the checkout.validate span took 5 seconds! No wonder they left."

#### Step 3: Understand Root Cause (Logs + Traces)
```javascript
// In CheckoutPage.jsx logs (already implemented):
logger.warn('Checkout validation failed', { 
  errors: validationErrors,
  traceId: spanContext.traceId 
});

// Show in console how logs have the SAME traceId
```

**What to Say:**
> "The logs show validation errors with the same trace ID. We can see the exact validation that failed - card number validation took 4.8s because we're calling a slow external fraud check API!"

#### Implementation (Already in Code!)
```javascript
// src/pages/CheckoutPage/CheckoutPage.jsx - lines 15-45

// ADD ARTIFICIAL DELAY for demo:
const validate = () => {
  return tracer.startActiveSpan('checkout.validate', (span) => {
    try {
      const errors = {};
      
      // DEMO: Simulate slow validation
      const start = Date.now();
      while (Date.now() - start < 3000) {} // 3 second delay!
      
      if (!formData.cardNumber) {
        errors.cardNumber = 'Card number is required';
      }
      
      if (Object.keys(errors).length > 0) {
        span.setAttribute('validation.failed', true);
        span.setAttribute('error.count', Object.keys(errors).length);
        logger.warn('Checkout validation failed', { 
          errors,
          formData: { ...formData, cardNumber: '****' } // Hide sensitive data
        });
      } else {
        span.setAttribute('validation.success', true);
        logger.info('Checkout validation passed');
      }
      
      span.end();
      return errors;
    } catch (error) {
      span.recordException(error);
      span.end();
      throw error;
    }
  });
};
```

### Key Takeaways
- ✅ **Metrics** identified the problem (30% abandonment)
- ✅ **Traces** showed WHERE it happens (payment page, validation span)
- ✅ **Logs** explained WHY (slow fraud check API)
- ✅ **Correlation** via trace ID connects everything

---

## 🐌 Scenario 2: The Slow Homepage Mystery

### Business Problem
**"Some users report homepage taking 10+ seconds to load. Others say it's fast. What's different?"**

### Demo Flow

#### Step 1: Reproduce the Issue
```javascript
// LIVE DEMO:
// 1. Open homepage normally (fast)
// 2. Open with "Slow 3G" throttling in Chrome DevTools (slow)
// 3. Show two different traces in Jaeger
```

**What to Say:**
> "Let's compare two user experiences. User A's page loaded in 800ms. User B's took 8 seconds! What's the difference?"

#### Step 2: Compare Traces (Distributed Tracing)
```javascript
// In Jaeger, compare:
// - documentLoad span (auto-instrumented)
// - resourceFetch spans (CSS, JS, images)
// - fetch spans (API calls)

// Show waterfall view:
// FAST USER: documentLoad → fetchProductList (200ms) → render
// SLOW USER: documentLoad (6s!) → fetchProductList (200ms) → render
```

**What to Say:**
> "The documentLoad span shows the culprit! Look at all these resourceFetch spans - we're loading 16 product images simultaneously, and on slow networks, this blocks rendering."

#### Step 3: Solution with Metrics
```javascript
// Add custom metric to track load times
export const performanceMetrics = {
  pageLoadDuration: meter.createHistogram('page.load.duration', {
    description: 'Page load time in milliseconds',
    unit: 'ms'
  }),
  
  slowPageLoads: meter.createCounter('page.load.slow', {
    description: 'Number of page loads exceeding 3 seconds'
  })
};

// In ProductListingPage.jsx:
useEffect(() => {
  const loadStart = performance.now();
  
  return () => {
    const duration = performance.now() - loadStart;
    performanceMetrics.pageLoadDuration.record(duration);
    
    if (duration > 3000) {
      performanceMetrics.slowPageLoads.add(1);
      logger.warn('Slow page load detected', { 
        duration,
        userAgent: navigator.userAgent,
        connection: navigator.connection?.effectiveType 
      });
    }
  };
}, []);
```

### Key Takeaways
- ✅ **Traces** showed the performance breakdown (documentLoad vs API vs render)
- ✅ **Spans** identified the bottleneck (image loading)
- ✅ **Metrics** track load time distribution across all users
- ✅ **Logs** capture context about slow loads (network type, user agent)

---

## 💰 Scenario 3: Real-Time Business Intelligence

### Business Problem
**"Finance team wants to see revenue and conversions in real-time, not wait for daily reports."**

### Demo Flow

#### Step 1: Show Business Metrics in Action
```javascript
// Already implemented in CartContext.jsx and CheckoutPage.jsx!

// LIVE DEMO:
// 1. Add items to cart → businessMetrics.cartAdditions++
// 2. Remove items → businessMetrics.cartRemovals++
// 3. Complete checkout → businessMetrics.revenue.add(totalAmount)
// 4. Show in Jaeger or export to Prometheus/Grafana
```

**What to Say:**
> "Every business action is now a metric. Let me add this $149 dress to cart... see that? cartAdditions incremented. Now I'll checkout... revenue counter just increased by $149!"

#### Step 2: Connect Metrics to Traces
```javascript
// In CartContext.jsx - show how metrics have trace context:
businessMetrics.revenue.add(item.price * item.quantity, {
  'product.id': item.id,
  'product.name': item.name,
  'product.category': item.category
});

logger.info('Revenue recorded', {
  amount: item.price * item.quantity,
  product: item.name,
  // Trace ID automatically added by logger!
});
```

**What to Say:**
> "But here's the magic - these metrics aren't just numbers. They have trace context! If revenue suddenly drops, we can query traces to see what happened to those users."

#### Step 3: Advanced Use Case - Funnel Analysis
```javascript
// Add funnel tracking metrics
export const funnelMetrics = {
  // Top of funnel
  productPageViews: meter.createCounter('funnel.product_views'),
  
  // Middle of funnel
  addToCart: meter.createCounter('funnel.add_to_cart'),
  viewCart: meter.createCounter('funnel.view_cart'),
  
  // Bottom of funnel
  initiateCheckout: meter.createCounter('funnel.checkout_initiated'),
  addPaymentInfo: meter.createCounter('funnel.payment_info_added'),
  purchase: meter.createCounter('funnel.purchase'),
  
  // Calculate conversion rate in real-time
  conversionRate: meter.createObservableGauge('funnel.conversion_rate', {
    description: 'Real-time conversion rate from view to purchase'
  })
};

// Track user journey
tracer.startActiveSpan('user.journey', (journeySpan) => {
  journeySpan.setAttribute('funnel.stage', 'product_view');
  funnelMetrics.productPageViews.add(1);
  
  // When user adds to cart:
  journeySpan.setAttribute('funnel.stage', 'add_to_cart');
  funnelMetrics.addToCart.add(1);
  
  // And so on...
});
```

### Key Takeaways
- ✅ **Metrics** provide real-time business KPIs
- ✅ **Traces** give context when metrics look abnormal
- ✅ **Correlation** enables "drill down from metric to trace"

---

## 🔴 Scenario 4: The Error Hunt

### Business Problem
**"User called support: 'Payment failed with error XYZ123'. Support needs to find what went wrong."**

### Demo Flow

#### Step 1: User Reports Error
```javascript
// LIVE DEMO: Trigger an error
// In CheckoutPage.jsx, add:
const handleSubmit = async (e) => {
  e.preventDefault();
  
  return tracer.startActiveSpan('checkout.submit', async (span) => {
    try {
      const errors = validate();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
      
      // DEMO: Simulate payment API failure
      if (Math.random() > 0.7) { // 30% chance of failure
        const errorId = `ERR-${Date.now()}`;
        span.setAttribute('error', true);
        span.setAttribute('error.id', errorId);
        
        logger.error('Payment processing failed', {
          errorId,
          errorCode: 'PAYMENT_DECLINED',
          amount: getCartTotal(),
          cardType: formData.cardNumber.startsWith('4') ? 'Visa' : 'Unknown'
        });
        
        alert(`Payment failed. Error ID: ${errorId}\nPlease contact support with this ID.`);
        span.end();
        return;
      }
      
      // Success path...
    } catch (error) {
      span.recordException(error);
      logger.error('Checkout submission failed', { error: error.message });
      span.end();
    }
  });
};
```

**What to Say:**
> "User sees 'Payment failed. Error ID: ERR-1702556789'. They call support. Support now searches Jaeger for this error ID..."

#### Step 2: Find Error in Jaeger
```javascript
// In Jaeger UI:
// - Search for tag: error.id = ERR-1702556789
// - Find the exact trace
// - See the full user journey: product view → add to cart → checkout → payment failure
```

**What to Say:**
> "Here's the trace! We can see everything: which product they tried to buy ($149 Maxi Wrap Dress), when they added it to cart (2 minutes before checkout), what card type they used (Visa), and the exact error code (PAYMENT_DECLINED)."

#### Step 3: Root Cause Analysis
```javascript
// Show in logs (console):
// ❌ [ERROR] Payment processing failed
// 🔗 Trace: 7c8a4f3e2b1d9c8a7f6e5d4c3b2a1098
// 📋 Attributes: {
//   errorId: 'ERR-1702556789',
//   errorCode: 'PAYMENT_DECLINED',
//   amount: 149.99,
//   cardType: 'Visa'
// }

// If you had backend traces:
// - Frontend trace ID → propagated to backend via HTTP headers
// - Backend trace shows: payment gateway returned "insufficient_funds"
// - Database trace shows: user's account balance = $50
```

**What to Say:**
> "The log has the same trace ID, so we know it's connected. In a full distributed system, this trace ID would propagate to the backend, payment gateway, and database - giving us the COMPLETE story."

### Key Takeaways
- ✅ **Trace ID** is the golden thread connecting frontend → backend → database
- ✅ **Logs** provide detailed error context
- ✅ **Spans** show the sequence of events leading to the error
- ✅ **Error correlation** means < 1 minute from user report to root cause

---

## 🧪 Scenario 5: A/B Test Performance Impact

### Business Problem
**"We deployed a new 'AI-powered recommendations' feature to 50% of users. Is it affecting performance?"**

### Demo Flow

#### Step 1: Add Experiment Tracking
```javascript
// Add experiment context to spans
const experimentGroup = Math.random() > 0.5 ? 'control' : 'treatment';
localStorage.setItem('experiment_group', experimentGroup);

// In ProductListingPage.jsx:
useEffect(() => {
  tracer.startActiveSpan('page.product_listing.load', (span) => {
    span.setAttribute('experiment.id', 'ai_recommendations_v1');
    span.setAttribute('experiment.group', experimentGroup);
    
    const loadStart = performance.now();
    
    if (experimentGroup === 'treatment') {
      // Simulate AI recommendations loading
      span.addEvent('loading_ai_recommendations');
      const aiStart = performance.now();
      // Fake AI call
      setTimeout(() => {
        const aiDuration = performance.now() - aiStart;
        span.setAttribute('ai.recommendations.duration', aiDuration);
        span.addEvent('ai_recommendations_loaded');
      }, 500); // AI takes 500ms
    }
    
    const duration = performance.now() - loadStart;
    span.setAttribute('page.load.duration', duration);
    
    logger.info('Product listing loaded', {
      experimentGroup,
      duration,
      hasAI: experimentGroup === 'treatment'
    });
    
    span.end();
  });
}, []);
```

#### Step 2: Compare Performance
```javascript
// In Jaeger, query:
// - experiment.group = control → avg duration: 800ms
// - experiment.group = treatment → avg duration: 1300ms

// Show histogram in Jaeger or Grafana
```

**What to Say:**
> "Let's compare the two groups. Control group: median load time 800ms. Treatment group with AI: 1.3 seconds! The AI feature adds 500ms latency. Is the conversion uplift worth it? Let's check the metrics..."

#### Step 3: Business Metrics Comparison
```javascript
// Compare conversion metrics:
// Control group: 
//   - productViews: 1000, purchases: 30 (3% conversion)
// Treatment group:
//   - productViews: 1000, purchases: 45 (4.5% conversion)

// Calculate ROI:
// Extra 15 purchases × $100 avg = $1,500 extra revenue
// Cost: 500ms latency → potential bounce rate increase
```

**What to Say:**
> "The data tells the story! Yes, AI adds latency, but conversion increased by 50% (3% → 4.5%). The business metrics prove the feature is worth keeping, despite the performance cost."

### Key Takeaways
- ✅ **Spans with attributes** enable experiment tracking
- ✅ **Metrics** show business impact
- ✅ **Traces** show technical impact (performance)
- ✅ **Data-driven decisions** - not guessing!

---

## 🎬 Presentation Flow Recommendation

### Act 1: The Hook (5 minutes)
Start with Scenario 4 (Error Hunt) - most relatable to audience
> "Imagine: It's Friday 5 PM. User calls: 'Payment failed!' Your boss asks: 'What happened?' You have 5 minutes. What do you do?"

**Show live demo:**
1. Trigger error
2. Get error ID
3. Search in Jaeger
4. Find root cause in < 1 minute
5. **Audience reaction: 😲**

### Act 2: The Three Pillars (15 minutes)
Explain concepts using Scenario 1 (Checkout Abandonment)
- **Traces**: "Where is the problem?" → Show span waterfall
- **Metrics**: "How big is the problem?" → Show abandonment rate
- **Logs**: "Why did it happen?" → Show validation errors

**Show live demo** of all three working together

### Act 3: Real-World Power (15 minutes)
Quick demos of Scenarios 2, 3, 5
- Scenario 2: Performance bottleneck → Distribute tracing value
- Scenario 3: Business metrics → Show executives love this
- Scenario 5: A/B testing → Data-driven decisions

### Act 4: Architecture Deep Dive (15 minutes)
Walk through `telemetry.js`:
- **Resource** → Service identity
- **Exporters** → Pluggable backends (Jaeger, Datadog, etc.)
- **Instrumentation** → Auto-magic vs manual
- **Collectors** → Show docker-compose.yml
- **Propagation** → W3C Trace Context headers

### Act 5: Call to Action (5 minutes)
> "You can start TODAY. Here's how..."

Show QUICKSTART.md live implementation in 5 minutes

---

## 🛠️ Code Changes Needed for Demos

I'll implement these scenarios in the next files:

1. **Enhanced CheckoutPage.jsx** - Add artificial delays for Scenario 1
2. **Enhanced ProductListingPage.jsx** - Add performance tracking for Scenario 2
3. **New: FunnelMetrics.js** - Advanced funnel tracking for Scenario 3
4. **Enhanced CheckoutPage.jsx** - Add error simulation for Scenario 4
5. **New: ExperimentTracking.js** - A/B test tracking for Scenario 5

Each scenario will be toggleable via URL params:
- `?demo=slow-checkout` → Activate Scenario 1
- `?demo=slow-page` → Activate Scenario 2
- `?demo=error` → Activate Scenario 4
- `?demo=experiment` → Activate Scenario 5

---

## 💡 Pro Tips for Session

### Make it Interactive
- Let audience suggest what to search for in Jaeger
- Ask "What would YOU do to debug this?"
- Show failures too! Break something live

### Use Real Numbers
- "This saved us 40 hours of debugging last month"
- "Reduced MTTR from 4 hours to 4 minutes"
- "Increased revenue by catching 15% more errors"

### The "Aha!" Moment
Create this moment when you show:
> "See this trace ID in the frontend log? Watch what happens when I search for it in the backend logs... SAME TRACE! We just jumped across services!"

### Avoid These Pitfalls
- ❌ Don't spend 20 minutes on installation (use QUICKSTART.md)
- ❌ Don't explain every configuration option (focus on value)
- ❌ Don't show empty Jaeger UI (pre-generate traces)
- ✅ DO show problems → solutions → results
- ✅ DO let traces export during intro (5s delay)
- ✅ DO have backup screenshots

---

## 📊 Success Metrics for Your Session

Track these during your talk:
- Audience engagement (questions, "wow" reactions)
- GitHub stars on demo repo (ask them to star it!)
- Follow-up questions after session
- Adoption in their teams (ask for feedback in 1 month)

Good luck! 🚀

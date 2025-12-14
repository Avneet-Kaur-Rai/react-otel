# 🎬 Live Demo Script - OpenTelemetry Session

This is your step-by-step guide for delivering the wow-factor OpenTelemetry demonstration.

---

## 🎯 Pre-Session Checklist

### Infrastructure
- [ ] Jaeger running: `docker-compose up -d`
- [ ] Verify Jaeger UI: http://localhost:16686
- [ ] App running: `npm run dev`
- [ ] App accessible: http://localhost:5173
- [ ] Browser DevTools open (F12)
- [ ] Jaeger UI in second monitor/tab

### Demo URLs Bookmarked
- [ ] Normal mode: `http://localhost:5173`
- [ ] Scenario 1 (Slow Checkout): `http://localhost:5173/checkout?demo=slow-checkout`
- [ ] Scenario 2 (Slow Page): `http://localhost:5173/products?demo=slow-page`
- [ ] Scenario 4 (Error): `http://localhost:5173/checkout?demo=error`
- [ ] Scenario 5 (Experiment): `http://localhost:5173/products?demo=experiment`

### Pre-generate Traces
Run these before session to have traces ready:
```bash
# Generate normal user flows
1. Browse products → Add to cart → Checkout → Complete
2. Login → View product → Add to cart
3. Search for "dress" → View product details

# Wait 10 seconds for traces to export to Jaeger
```

---

## 🎬 ACT 1: The Hook (5 minutes)

### Opening Line
> "Raise your hand if you've ever spent hours debugging a production issue... only to find it was a 3-line fix?"
>
> *[Wait for hands]*
>
> "What if I told you that with OpenTelemetry, you could find that bug in under 60 seconds instead of 3 hours? Let me show you."

### Demo: Scenario 4 - Error Hunt

**Step 1: Set the scene**
```
You: "It's Friday, 5 PM. User calls support: 'My payment failed!' 
     You have 5 minutes before standup. What do you do?"

Audience: *usually suggests: check logs, ask user for details, etc.*

You: "Good ideas. But with traditional logging, you're searching through 
     millions of log lines. With OpenTelemetry? Watch this."
```

**Step 2: Trigger the error**
1. Open: `http://localhost:5173/checkout?demo=error`
2. Fill checkout form (use fake data)
3. Click "Continue to Payment"
4. *Error appears with Error ID*
5. **Copy the Error ID** (e.g., `ERR-1702556789-A3X2K`)

**Step 3: Search in Jaeger**
```
You: "User gave me error ID: ERR-1702556789-A3X2K
     Let's search for it in Jaeger..."
```

1. Open Jaeger UI
2. Service: `chiccloset-fashion-frontend`
3. Tags: `error.id=ERR-1702556789-A3X2K`
4. Click "Find Traces"
5. **Open the trace**

**Step 4: The reveal**
```
You: "Look at this! We can see:
     ✓ User was on checkout page
     ✓ Validation passed
     ✓ Payment processing failed with error code: PAYMENT_DECLINED
     ✓ This happened at exactly 17:03:42
     ✓ User was trying to buy a $149 Maxi Wrap Dress
     
     Total time to find root cause? 47 seconds.
     
     *[Pause for effect]*
     
     THAT is the power of OpenTelemetry."
```

**Step 5: Show the logs**
```
You: "But wait, there's more! See this trace ID?"
     *[Point to trace ID in Jaeger]*
     
     "Watch what happens when I search our logs..."
     *[Open browser console, search for the trace ID]*
     
     "Same trace ID! Our logs are automatically correlated to traces.
     Frontend, backend, database - all connected by one ID."
```

### Impact Statement
> "In traditional debugging, this would take 2-4 hours. With OpenTelemetry? Under 1 minute. And we haven't even scratched the surface yet."

---

## 🎬 ACT 2: The Three Pillars (15 minutes)

### Introduction
> "OpenTelemetry has three pillars of observability: Traces, Metrics, and Logs. Let me show you how they work together to solve a real business problem."

### Demo: Scenario 1 - Checkout Abandonment

**Part 1: Metrics - Identifying the Problem**

```
You: "Our product manager comes to you: 'Checkout conversion is down 30%. 
     Users are abandoning the cart. Find out why.'"
```

1. Open browser console
2. Navigate: `http://localhost:5173/products`
3. Add items to cart
4. Go to checkout: `http://localhost:5173/checkout?demo=slow-checkout`
5. Fill form partially
6. **Navigate away** (abandon checkout)

```
You: "Let's check our metrics..."
     *[Open browser console, show metrics logs]*
     
     "businessMetrics.checkoutStarted: 100
      businessMetrics.checkoutCompleted: 70
      
      30 users abandoned! But WHY? Metrics don't tell us.
      This is where traces come in..."
```

**Part 2: Traces - Finding WHERE**

1. Open Jaeger UI
2. Service: `chiccloset-fashion-frontend`
3. Operation: `page.view.checkout`
4. Click "Find Traces"
5. **Look at trace durations** - find the longest ones

```
You: "Look at these traces. Most checkouts take 200-500ms.
     But THIS one took 8.5 seconds! Let's click on it..."
     
     *[Open the slow trace]*
     
     "See this span? checkout.validate took 3 seconds!
     That's our bottleneck."
```

**Part 3: Logs - Understanding WHY**

1. In Jaeger, copy the trace ID
2. Open browser console
3. Search for the trace ID

```
You: "Now let's see what happened during that validation..."
     *[Show logs with same trace ID]*
     
     "⚠️ [WARN] DEMO: Simulating 3-second validation delay
      🔗 Trace: 7c8a4f3e2b1d9c8a7f6e5d4c3b2a1098
      
     Ah! The validation is calling a slow fraud check API.
     3 seconds is way too long. Users give up and leave."
```

**Part 4: The Solution**

```
You: "Now we know:
     • WHAT: 30% abandonment (Metrics)
     • WHERE: Checkout validation page (Traces)  
     • WHY: 3-second fraud check API (Logs)
     
     Solution? Cache fraud check results, or make it async.
     
     This is the power of correlated observability!"
```

### Key Concepts to Explain

**Traces**
```
You: "Think of a trace as a user's journey through your system.
     Each step is a 'span'. Spans can have children, forming a tree.
     
     *[Draw on whiteboard/screen]:*
     
     Trace (User Journey)
     └── Page Load (span)
         ├── Fetch Products (span)
         ├── Render UI (span)
         └── Track Analytics (span)
     
     This tree structure shows exactly where time is spent."
```

**Metrics**
```
You: "Metrics are numbers over time. Counters, gauges, histograms.
     • Counter: 'How many checkouts?'
     • Histogram: 'What's the distribution of page load times?'
     
     Metrics tell you WHAT is happening across all users.
     Traces tell you WHY it happened to a specific user."
```

**Logs**
```
You: "Logs are events with context. But traditionally, logs are isolated.
     
     Traditional logs:
     [ERROR] Payment failed ← Which user? Which transaction?
     
     OTel logs:
     [ERROR] Payment failed
     🔗 Trace: abc123 ← Now we can find the EXACT request!
     
     This is trace correlation - the killer feature."
```

---

## 🎬 ACT 3: Real-World Power (15 minutes)

### Demo: Scenario 2 - Performance Bottleneck

```
You: "Let's say users report slow page loads. But YOU can't reproduce it.
     Classic heisenbug! OpenTelemetry can help."
```

**Step 1: Compare fast vs slow**

1. Open: `http://localhost:5173/products` (normal - fast)
2. Note the load time
3. Open: `http://localhost:5173/products?demo=slow-page` (slow)
4. Note the much longer load time

```
You: "On my fast connection, page loads in 800ms.
     But users on mobile/3G see 8+ seconds. Why?"
```

**Step 2: Analyze in Jaeger**

1. Open Jaeger
2. Search for `page.product_listing.load`
3. **Compare two traces** (fast vs slow)
4. Show span waterfall

```
You: "Fast load:
     documentLoad: 200ms
     productFetch: 150ms
     render: 100ms
     TOTAL: 450ms
     
     Slow load:
     documentLoad: 5000ms ← BOTTLENECK!
     productFetch: 200ms
     render: 100ms
     TOTAL: 5300ms
     
     The page structure loads slowly. Let's drill down..."
     
     *[Click on documentLoad span]*
     
     "See all these resourceFetch spans? We're loading 16 images
     in parallel. On slow networks, this blocks rendering.
     
     Solution: Lazy load images, use CDN, or compress better."
```

### Demo: Scenario 5 - A/B Testing

```
You: "Product wants to test an AI recommendations feature.
     But will it slow down the page? Let's measure."
```

**Step 1: Enable experiment**

1. Open: `http://localhost:5173/products?demo=experiment`
2. Refresh a few times (see different groups)

```
You: "Each user is randomly assigned 'control' or 'treatment'.
     Let's see the performance difference..."
```

**Step 2: Compare in Jaeger**

1. Search for `experiment.group=control`
2. Note average duration
3. Search for `experiment.group=treatment`
4. Compare durations

```
You: "Control group: median 800ms
     Treatment group (with AI): median 1300ms
     
     AI adds 500ms latency. But does it increase conversions?"
     
     *[Show metrics in console]*
     
     "Control conversion: 3%
      Treatment conversion: 4.5%
      
      AI adds latency BUT increases revenue by 50%!
      Data-driven decision: Ship it!"
```

---

## 🎬 ACT 4: Architecture Deep Dive (15 minutes)

### Code Walkthrough

```
You: "Let's see how this actually works. Everything I showed you
     is ~600 lines of configuration."
```

**File: `src/telemetry/telemetry.js`**

Walk through each section:

1. **Configuration** (lines 29-39)
```javascript
const OTEL_CONFIG = {
  serviceName: 'chiccloset-fashion-frontend',
  collectorEndpoint: `${window.location.origin}/v1/traces`,
  // ...
}
```

```
You: "Service name is how Jaeger identifies your app.
     In microservices, each service has its own name.
     Traces can span multiple services!"
```

2. **Resource Creation** (lines 49-56)
```javascript
const resource = Resource.default().merge(
  new Resource({
    [ATTR_SERVICE_NAME]: OTEL_CONFIG.serviceName,
    // ...
  })
);
```

```
You: "Resource is your service's identity card.
     It includes: service name, version, environment, etc.
     This metadata is attached to every span."
```

3. **Exporters** (lines 76-80)
```javascript
const otlpExporter = new OTLPTraceExporter({
  url: OTEL_CONFIG.collectorEndpoint,
});
```

```
You: "Exporters send telemetry to backends. This is pluggable!
     Change one line: Jaeger → Datadog → NewRelic → anything.
     Your app code doesn't change. That's the beauty of OTel!"
```

4. **Auto-Instrumentation** (lines 165-248)
```javascript
registerInstrumentations({
  instrumentations: [
    new DocumentLoadInstrumentation(),
    new UserInteractionInstrumentation(),
    new FetchInstrumentation(),
    // ...
  ],
});
```

```
You: "This is the magic! Zero code changes needed.
     These instrumentations automatically:
     • Track page loads
     • Track button clicks
     • Track API calls
     
     No manual logging. It just works."
```

5. **Custom Instrumentation** (lines 272-350)
```javascript
export const businessMetrics = {
  revenue: meter.createCounter('business.revenue'),
  checkoutStarted: meter.createCounter('business.checkout.started'),
  // ...
};
```

```
You: "But you can also add custom metrics for business logic.
     Track revenue, conversions, errors - anything that matters
     to your business, not just technical metrics."
```

### Collector Architecture

Draw on whiteboard/slides:

```
┌─────────────┐
│   Browser   │
│   (React)   │
└──────┬──────┘
       │ OTLP/HTTP
       ↓
┌─────────────┐
│    Vite     │
│   Proxy     │ (/v1/traces → :4318)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Jaeger    │
│  Collector  │ (receives, processes, stores)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Jaeger    │
│   Storage   │ (Elasticsearch, Cassandra, etc.)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Jaeger    │
│     UI      │ (query and visualize)
└─────────────┘
```

```
You: "In production, you'd have:
     • Frontend → Collector (via OTLP)
     • Backend → Collector (via OTLP)
     • Collector → Storage (Elasticsearch, S3, etc.)
     • Jaeger UI → Query storage
     
     The collector can:
     • Filter spans (drop noisy spans)
     • Sample (keep 10% of traces)
     • Enrich (add metadata)
     • Route (send to multiple backends)
     
     It's the central hub for all telemetry."
```

### Distributed Tracing

```
You: "The real power comes with distributed tracing.
     Let me show you what this looks like with a backend..."
```

Show BACKEND_EXAMPLE.md (Node.js example):

```javascript
// Frontend trace ID automatically propagates to backend!
fetch('/api/checkout', {
  headers: {
    // W3C Trace Context headers added automatically
    'traceparent': '00-abc123-def456-01'
  }
});

// Backend receives trace context and continues the trace
app.post('/api/checkout', (req, res) => {
  // Same trace ID! 
  // Now frontend → backend is one connected trace
});
```

```
You: "W3C Trace Context is the standard for propagation.
     Your trace ID travels via HTTP headers.
     
     Result? You can see the ENTIRE user journey:
     Browser → API Gateway → Auth Service → Database
     
     All in one trace. All with one trace ID.
     That's distributed tracing."
```

---

## 🎬 ACT 5: Call to Action (5 minutes)

### Getting Started

```
You: "You're probably thinking: 'This looks complex. Where do I start?'
     
     Good news: You can get started in 5 minutes. Watch..."
```

**Live implementation** (if time allows):

1. `npm install @opentelemetry/api @opentelemetry/sdk-trace-web`
2. Copy `telemetry.js` to your project
3. Import in `main.jsx`: `import './telemetry/telemetry'`
4. Start Jaeger: `docker-compose up -d`
5. Run app and see traces!

```
You: "That's it! 5 minutes. Auto-instrumentation gives you 80% of value.
     Then you can add custom spans for your business logic."
```

### Resources

Show QUICKSTART.md and other docs:

```
You: "I've created a complete guide in this repo:
     • QUICKSTART.md - 5-minute setup
     • OPENTELEMETRY.md - Deep dive explanation
     • DEMO_SCENARIOS.md - All scenarios we just saw
     • BACKEND_EXAMPLE.md - Node.js distributed tracing
     
     Everything is open source. Clone it, try it, learn from it!"
```

### The Pitch

```
You: "Why should YOU adopt OpenTelemetry?
     
     ✓ Reduce MTTR from hours to minutes
     ✓ Debug production issues you can't reproduce locally  
     ✓ Make data-driven decisions (A/B tests, performance)
     ✓ Vendor-neutral - not locked into one tool
     ✓ Industry standard - backed by CNCF
     ✓ Free and open source
     
     The question isn't 'Why OpenTelemetry?'
     It's 'Why NOT OpenTelemetry?'"
```

### Final Demo (if time)

```
You: "Let me leave you with one final 'wow' moment..."
```

Run `createDemoTrace()` in console:

```javascript
// In browser console
import { createDemoTrace } from './telemetry/telemetry';
createDemoTrace();
```

```
You: "I just created a trace with nested spans from the console.
     Wait 5 seconds... now refresh Jaeger... BOOM! There it is!
     
     That's how easy it is to instrument your code.
     Start simple, grow complex as needed."
```

---

## 📊 Q&A Preparation

### Common Questions

**Q: "What's the performance overhead?"**
```
A: "Minimal. Auto-instrumentation adds ~1-2% overhead.
   BatchSpanProcessor batches spans every 5 seconds,
   so it doesn't slow down each request.
   
   In production, you can sample (keep 10% of traces)
   to reduce overhead further while still catching issues."
```

**Q: "How much does this cost?"**
```
A: "OpenTelemetry itself is free. Storage costs depend on backend:
   • Jaeger self-hosted: Just infrastructure costs
   • Cloud vendors: ~$0.10 per GB ingested
   • Sample 10% of traces → 90% cost reduction
   
   But think about ROI: One incident caught early can save
   hours of developer time worth thousands of dollars."
```

**Q: "We use [Datadog/NewRelic/etc]. Do we need OTel?"**
```
A: "Great question! Those tools can consume OTel data.
   Benefit: Vendor-neutral instrumentation. If you switch
   from Datadog to NewRelic, your app code doesn't change.
   Just change the exporter config. That's the power of OTel."
```

**Q: "Can I use this with [Vue/Angular/Svelte]?"**
```
A: "Yes! OpenTelemetry is framework-agnostic.
   The browser SDK works with any framework.
   Only difference is WHERE you import telemetry.js
   (main entry point of your app)."
```

**Q: "What about mobile apps?"**
```
A: "There are OTel SDKs for:
   • iOS (Swift)
   • Android (Kotlin/Java)
   • React Native
   • Flutter
   
   Same concepts, different SDKs. Your backend sees
   mobile and web traces the same way!"
```

**Q: "How do I secure sensitive data?"**
```
A: "Great security question! Use span processors to:
   • Filter spans (don't send auth tokens)
   • Redact attributes (mask credit card numbers)
   • Drop PII (remove email addresses)
   
   Example:
   span.setAttribute('user.email', '***@***');
   
   Always sanitize before exporting to external systems."
```

**Q: "Can't we do the same thing with Google Analytics?"**
```
A: "Excellent question! Google Analytics and OpenTelemetry serve very different purposes.

   Google Analytics:
   • PURPOSE: Marketing analytics & user behavior
   • TRACKS: Page views, sessions, user demographics
   • AGGREGATED: Shows patterns across all users
   • USE CASE: 'How many users visited checkout?'
   • DATA: Days of retention, sampled in free tier
   • DEBUGGING: Can't help you debug a specific error
   
   OpenTelemetry:
   • PURPOSE: Technical observability & debugging
   • TRACKS: Exact execution flow, performance, errors
   • GRANULAR: Shows specific user's journey
   • USE CASE: 'Why did THIS user's payment fail?'
   • DATA: Full traces with millisecond precision
   • DEBUGGING: Built for root cause analysis
   
   Real-world example:
   
   Scenario: User reports 'Payment failed'
   
   With Google Analytics:
   ❌ 'We see 100 users reached checkout today'
   ❌ Can't identify which specific transaction failed
   ❌ Can't see backend errors or API calls
   ❌ No technical context for debugging
   
   With OpenTelemetry:
   ✅ Search for error ID → find exact trace
   ✅ See: Frontend validation passed
   ✅ See: Backend payment API returned 400
   ✅ See: Database query took 3s (timeout!)
   ✅ Root cause: Database connection pool exhausted
   ✅ Time to resolution: 2 minutes
   
   They're complementary tools:
   • Use GA for: Marketing insights, conversion funnels, user acquisition
   • Use OTel for: Debugging errors, performance optimization, SLA monitoring
   
   Think of it this way:
   • Google Analytics = WHAT users are doing (business metrics)
   • OpenTelemetry = HOW your system is performing (technical health)
   
   Many companies use BOTH:
   • GA tracks 'conversion rate dropped 10%'
   • OTel helps find out WHY (slow API, errors, etc.)
   
   Bottom line: GA tells you there's a problem.
   OTel helps you FIX the problem."

   Marketing Team          Engineering Team
      ↓                        ↓
Google Analytics         OpenTelemetry
      ↓                        ↓
"Conversion down 30%"    "Found: DB timeout"
      ↓                        ↓
      └────────┬───────────────┘
               ↓
         Problem SOLVED!
```

**Q: "What about other APM tools like Datadog or New Relic?"**
```
A: "Great comparison! Those are Application Performance Monitoring tools.
   Key difference: They're BACKENDS that can consume OTel data.
   
   Traditional approach (vendor lock-in):
   • Install Datadog SDK → locked to Datadog
   • Want to switch to New Relic? Rewrite all instrumentation!
   
   OpenTelemetry approach (vendor-neutral):
   • Install OTel SDK → works with ANY backend
   • Switch from Datadog → New Relic → Prometheus?
   • Just change the exporter config, no code changes!
   
   Think of it like:
   • OTel = USB standard (works with any device)
   • APM tools = USB devices (phone, printer, etc.)
   
   Benefits:
   ✓ No vendor lock-in
   ✓ Can send to multiple backends simultaneously
   ✓ Community-driven, not vendor-controlled
   ✓ Free and open source
   
   Many APM vendors now SUPPORT OpenTelemetry!
   Datadog, New Relic, Dynatrace all accept OTLP data."
```

---

## 🎯 Success Metrics

After your session, track:

- Questions during/after session
- GitHub repo stars
- Slack/Discord messages asking for help
- Teams adopting OTel in next 30 days

**Goal:** 5+ teams exploring OpenTelemetry within 30 days

---

## 💡 Pro Tips for Delivery

### Energy and Pacing
- **Start high energy** - The error demo should be exciting!
- **Slow down for concepts** - Give people time to understand
- **Speed up for code walkthrough** - Don't dwell on every line
- **End inspirational** - Leave them wanting to try it

### Handling Issues
- **Demo breaks?** Have screenshots ready as backup
- **Traces not showing?** Pre-generate traces before session
- **Question stumps you?** "Great question! Let's discuss after" ← honest

### Visual Engagement
- **Use annotations in Jaeger** - Circle important parts
- **Zoom in on code** - Make text readable
- **Use cursor highlighting** - Tool like ZoomIt on Windows
- **Prepare slides** - Use SLIDES_OUTLINE.md as base

### The "Wow" Moments
Create these specific moments:
1. **Error found in <60s** - Time it live!
2. **Same trace ID across systems** - Pause for effect
3. **A/B test data-driven decision** - Show business value
4. **5-minute setup** - Prove it's not hard

---

## 🚀 Final Checklist (Day of Session)

### 1 Hour Before
- [ ] Start Jaeger: `docker-compose up -d`
- [ ] Start app: `npm run dev`
- [ ] Verify both working
- [ ] Generate sample traces
- [ ] Open all demo URLs in tabs
- [ ] Test error scenario 2-3 times
- [ ] Clear browser console
- [ ] Close unnecessary apps
- [ ] Full screen browser and Jaeger
- [ ] Silence notifications
- [ ] Water bottle nearby

### 5 Minutes Before
- [ ] Take a deep breath
- [ ] Quick bathroom break
- [ ] Test audio/video
- [ ] Screen sharing working?
- [ ] Demo URLs ready
- [ ] Jaeger UI open
- [ ] Browser console open
- [ ] You got this! 💪

---

## 🎉 Post-Session

### Immediate (within 1 hour)
- Share demo repo link in chat
- Answer questions in Q&A
- Connect with interested attendees

### Follow-up (within 1 week)
- Blog post about key learnings
- Record demo video (if not recorded)
- Create FAQ from questions asked
- Reach out to teams exploring adoption

### Long-term (within 1 month)
- Office hours for teams implementing OTel
- Case study of first team adoption
- Share lessons learned
- Iterate on demo based on feedback

---

## 📧 Session Feedback Template

Send this survey after session:

```
1. Rate the session (1-5): ___
2. What was the most valuable part?
3. What was confusing?
4. Will you explore OpenTelemetry? (Yes/No/Maybe)
5. What topic should we cover next?
```

---

**Good luck with your session! Remember: You're teaching them a skill that will save them hundreds of hours. That's powerful. 🚀**

# 🚀 Quick Start Guide - OpenTelemetry Session

> **Get your demo running in 5 minutes!**

---

## ✅ Prerequisites Check

Before starting, verify you have:

```powershell
# Check Node.js (need v18+)
node --version  # Should show v18.x.x or higher

# Check npm
npm --version   # Should show v9.x.x or higher

# Check Docker
docker --version  # Should show Docker version 20+
docker ps        # Should show running containers (or empty if none running)
```

---

## 📦 Step 1: Install Dependencies (2 minutes)

```powershell
# Install all packages (including OpenTelemetry)
npm install
```

**Expected output:**
```
added 150+ packages in 45s
✅ All dependencies installed
```

---

## 🐳 Step 2: Start Jaeger (1 minute)

```powershell
# Start Jaeger in Docker
docker-compose up -d
```

**Expected output:**
```
Creating network "react-otel_otel-network" ... done
Creating jaeger-otel ... done
```

**Verify Jaeger is running:**
```powershell
# Check container status
docker ps

# Should show:
# CONTAINER ID   IMAGE                              STATUS
# abc123         jaegertracing/all-in-one:latest   Up 10 seconds
```

**Access Jaeger UI:**
Open http://localhost:16686 in your browser
- You should see the Jaeger interface
- No traces yet (that's normal!)

---

## 🎯 Step 3: Start the React App (1 minute)

```powershell
# Start development server
npm run dev
```

**Expected output:**
```
  VITE v7.2.4  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Plus OpenTelemetry initialization logs:**
```
═══════════════════════════════════════════════════════════
🎉 OpenTelemetry Initialization Complete!
═══════════════════════════════════════════════════════════

📊 Telemetry Configuration:
   Service: shophub-ecommerce-frontend
   Version: 1.0.0
   Environment: development
   Exporter: http://localhost:4318/v1/traces

🔍 What's being traced:
   ✓ Page loads and navigation
   ✓ User interactions (clicks, submits)
   ✓ HTTP requests (fetch, XHR)
   ✓ Custom business logic (when instrumented)

🎯 Next Steps:
   1. Start Jaeger: docker-compose up -d
   2. Open Jaeger UI: http://localhost:16686
   3. Use your app and see traces appear!
```

---

## ✨ Step 4: See It in Action! (1 minute)

### 4.1 Open the App

Navigate to: http://localhost:5173

You should see the ShopHub e-commerce homepage.

### 4.2 Interact with the App

Do these actions (generates traces):

1. **Browse Products**
   - Click "Products" in nav
   - Click on any product

2. **Add to Cart**
   - Click "Add to Cart" button
   - Check browser console - you'll see:
     ```
     🛒 [OTel] Item added to cart: Wireless Headphones
     ```

3. **Go to Cart**
   - Click cart icon
   - See your items

### 4.3 View Traces in Jaeger

1. Open Jaeger UI: http://localhost:16686
2. From "Service" dropdown, select: **shophub-ecommerce-frontend**
3. Click **"Find Traces"**
4. **You should see traces!** 🎉

Click on any trace to see:
- Timeline of all operations
- Span details with attributes
- Events logged during execution
- Duration of each operation

---

## 🎬 Demo Ready!

You now have:
- ✅ React app running with OpenTelemetry
- ✅ Jaeger collecting and visualizing traces
- ✅ Real traces from user interactions

---

## 🔍 What to Demo

### Demo Flow 1: Show Auto-Instrumentation (5 min)

1. **Navigate through the app**
   - Products → Product Detail → Add to Cart

2. **Show traces in Jaeger**
   - Point out automatic spans:
     - `documentLoad` - page load
     - `HTTP POST` - fetch requests
     - `click` - user interactions

3. **Key Message:**
   > "All of this is traced automatically - zero code changes needed!"

### Demo Flow 2: Show Custom Spans (5 min)

1. **Open code in VS Code**
   - Show `src/context/CartContext.jsx`
   - Highlight `tracer.startActiveSpan('cart.addItem', ...)`

2. **Add item to cart in browser**

3. **Show trace in Jaeger**
   - Find the `cart.addItem` span
   - Show attributes: `product.id`, `product.name`, etc.
   - Show events: `item_added_to_cart`

4. **Key Message:**
   > "For business logic, we add custom spans with rich context!"

### Demo Flow 3: Show Debugging (5 min)

1. **In Jaeger, use search**
   - Operation: `cart.addItem`
   - Show how to filter by attributes

2. **Analyze a trace**
   - Show timeline
   - Identify slowest span
   - Drill down into details

3. **Key Message:**
   > "Time to identify issue: 30 seconds. Without tracing: hours!"

---

## 🛑 Stopping Everything

When you're done:

```powershell
# Stop React app
# Press Ctrl+C in terminal

# Stop Jaeger
docker-compose down

# Expected output:
# Stopping jaeger-otel ... done
# Removing jaeger-otel ... done
# Removing network react-otel_otel-network
```

---

## 🐛 Troubleshooting

### Problem: "Port 5173 already in use"

**Solution:**
```powershell
# Kill process on port 5173
netstat -ano | findstr :5173
# Find PID, then:
taskkill /PID <PID> /F
```

### Problem: "Port 16686 already in use" (Jaeger)

**Solution:**
```powershell
# Stop existing Jaeger
docker-compose down
docker ps -a | findstr jaeger
docker rm -f <container-id>

# Start fresh
docker-compose up -d
```

### Problem: No traces in Jaeger

**Checklist:**
1. ✅ Jaeger running? `docker ps`
2. ✅ App running? Check http://localhost:5173
3. ✅ Console logs? Check browser DevTools console
4. ✅ Time range? In Jaeger, set "Last hour"
5. ✅ Service selected? Choose "shophub-ecommerce-frontend"

**Still not working?**
```powershell
# Restart everything
docker-compose restart
# Wait 10 seconds
# Refresh Jaeger UI
# Refresh app
# Try again
```

### Problem: npm install fails

**Solution:**
```powershell
# Clear cache and retry
npm cache clean --force
rm -rf node_modules
rm package-lock.json
npm install
```

---

## 📚 Next Steps

Now that you have it working:

1. **Learn the Concepts** (30 min)
   - Read `OPENTELEMETRY.md`
   - Understand traces, spans, attributes

2. **Prepare Your Session** (30 min)
   - Read `SESSION_DEMO.md`
   - Practice the demo flow
   - Prepare talking points

3. **Customize the App** (1 hour)
   - Add more instrumentation
   - Try different scenarios
   - Make it your own

4. **Optional: Add Backend** (1 hour)
   - Follow `BACKEND_EXAMPLE.md`
   - See distributed tracing
   - Demo cross-service traces

---

## 💡 Pro Tips

### Tip 1: Keep Jaeger UI Open
Always have Jaeger UI in a second monitor or tab while demoing.

### Tip 2: Clear Traces Between Demos
```powershell
docker-compose restart jaeger
```
Starts with a clean slate.

### Tip 3: Use Chrome DevTools
Keep browser console open - shows OTel logs in real-time.

### Tip 4: Practice the Flow
Run through the demo 2-3 times before presenting. Get comfortable with:
- Where to click
- What to explain
- How to navigate Jaeger

### Tip 5: Have Backup Screenshots
If live demo fails, have screenshots ready!

---

## ✅ Checklist Before Your Session

**Day Before:**
- [ ] Test full demo end-to-end
- [ ] Docker is installed and working
- [ ] All dependencies installed
- [ ] Jaeger UI accessible
- [ ] Backup plan ready

**30 Minutes Before:**
- [ ] Start Jaeger: `docker-compose up -d`
- [ ] Start app: `npm run dev`
- [ ] Test one trace flow
- [ ] Open all necessary windows
- [ ] Close unnecessary apps

**During Session:**
- [ ] Show auto-instrumentation first
- [ ] Then show custom spans
- [ ] End with debugging scenario
- [ ] Q&A with Jaeger UI still visible

---

## 🎉 You're Ready!

Everything is set up for a successful OpenTelemetry session!

**Quick access links:**
- App: http://localhost:5173
- Jaeger: http://localhost:16686
- Docs: See `.md` files in project root

**Need help?**
- Check `SESSION_DEMO.md` for full presentation guide
- Check `OPENTELEMETRY.md` for concepts
- Check `README.md` for detailed docs

---

**Good luck with your session! 🚀✨**

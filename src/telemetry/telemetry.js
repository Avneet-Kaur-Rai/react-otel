/**
 * OpenTelemetry Configuration for React E-commerce App
 * 
 * This module initializes OpenTelemetry instrumentation for:
 * - Automatic tracing (page loads, user interactions, HTTP requests)
 * - Custom business logic tracing
 * - Integration with Jaeger for visualization
 * 
 * For Session Demo: This is the CORE of OpenTelemetry implementation
 */

import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { trace, context, metrics } from '@opentelemetry/api';

// ============================================================================
// CONFIGURATION
// ============================================================================

const OTEL_CONFIG = {
  serviceName: 'chiccloset-fashion-frontend',
  serviceVersion: '1.0.0',
  environment: 'development',
  
  // Jaeger endpoint - use window.location.origin for relative proxy path
  collectorEndpoint: `${window.location.origin}/v1/traces`,
  
  // Enable console exporter for debugging (set to false for cleaner console)
  enableConsoleExporter: false,  // Set to true to see raw span objects in console
};

// ============================================================================
// STEP 1: Create Resource (Service Identity)
// ============================================================================

/**
 * Resource represents the entity producing telemetry
 * Think of it as the "identity card" of your service
 */
const resource = Resource.default().merge(
  new Resource({
    [ATTR_SERVICE_NAME]: OTEL_CONFIG.serviceName,
    [ATTR_SERVICE_VERSION]: OTEL_CONFIG.serviceVersion,
    'deployment.environment': OTEL_CONFIG.environment,
    'service.namespace': 'ecommerce',
  })
);

console.log('🏷️  OTel Resource created:', {
  service: OTEL_CONFIG.serviceName,
  version: OTEL_CONFIG.serviceVersion,
  environment: OTEL_CONFIG.environment,
});

// ============================================================================
// STEP 2: Create Exporters (Where to send telemetry)
// ============================================================================

/**
 * OTLP Exporter - Sends traces to Jaeger
 * 
 * For Session: Explain that exporters are pluggable
 * You can change from Jaeger to Datadog without changing app code
 */
const otlpExporter = new OTLPTraceExporter({
  url: OTEL_CONFIG.collectorEndpoint,
  headers: {
    // Add authentication headers if needed in production
    // 'Authorization': 'Bearer YOUR_TOKEN'
  },
});

/**
 * Console Exporter - Useful for debugging
 * Prints spans to browser console
 */
const consoleExporter = OTEL_CONFIG.enableConsoleExporter 
  ? new ConsoleSpanExporter() 
  : null;

console.log('📤 OTel Exporters configured');

// ============================================================================
// STEP 3: Create Tracer Provider (The core SDK)
// ============================================================================

/**
 * TracerProvider is the main entry point for tracing
 * It manages tracer instances and span processors
 */
const provider = new WebTracerProvider({
  resource: resource,
});

// ============================================================================
// STEP 4: Add Span Processors (How to process spans)
// ============================================================================

/**
 * BatchSpanProcessor - Batches spans before exporting
 * 
 * Benefits:
 * - Reduces network calls
 * - Better performance
 * - Configurable batch size and timeout
 * 
 * For Session: Explain this prevents performance overhead
 */
provider.addSpanProcessor(
  new BatchSpanProcessor(otlpExporter, {
    maxQueueSize: 2048,              // Max spans in queue
    scheduledDelayMillis: 5000,      // Export every 5 seconds
    exportTimeoutMillis: 30000,      // 30s timeout
    maxExportBatchSize: 512,         // Max spans per batch
  })
);

// Add console exporter if enabled
if (consoleExporter) {
  provider.addSpanProcessor(new BatchSpanProcessor(consoleExporter));
  console.log('🖥️  Console exporter enabled (check browser console for spans)');
}

// ============================================================================
// STEP 5: Register the Provider
// ============================================================================

/**
 * Register makes this provider the global default
 * All subsequent trace.getTracer() calls will use this provider
 */
provider.register({
  // Context manager handles span context propagation
  contextManager: new ZoneContextManager(),
});

console.log('✅ OTel TracerProvider registered');

// ============================================================================
// STEP 6: Auto-Instrumentation (Automatic tracing)
// ============================================================================

/**
 * Auto-instrumentations automatically create spans for:
 * - Page loads
 * - User interactions (clicks, form submits)
 * - HTTP requests (fetch, XMLHttpRequest)
 * 
 * For Session: This is the MAGIC - no code changes needed!
 */
registerInstrumentations({
  instrumentations: [
    // ========================================================================
    // Document Load Instrumentation
    // ========================================================================
    /**
     * Tracks page load performance
     * Creates spans for:
     * - documentFetch: Time to fetch HTML
     * - documentLoad: Full page load time
     * - resourceFetch: Time to load assets (CSS, JS, images)
     */
    new DocumentLoadInstrumentation({
      // Capture detailed resource timing
      applyCustomAttributesOnSpan: (span, resource) => {
        if (resource) {
          span.setAttribute('resource.name', resource.name);
          span.setAttribute('resource.type', resource.initiatorType);
          span.setAttribute('resource.size', resource.transferSize || 0);
        }
      },
    }),

    // ========================================================================
    // User Interaction Instrumentation
    // ========================================================================
    /**
     * Tracks user interactions
     * Creates spans for clicks, form submits, etc.
     * 
     * For Session: Demo by clicking "Add to Cart" and seeing the span
     */
    new UserInteractionInstrumentation({
      eventNames: ['click', 'submit', 'dblclick', 'keypress'],
      
      // Add custom attributes to interaction spans
      shouldPreventSpanCreation: (eventType, element, span) => {
        // Skip tracing for certain elements if needed
        return false;
      },
    }),

    // ========================================================================
    // Fetch Instrumentation
    // ========================================================================
    /**
     * Automatically traces fetch() API calls
     * 
     * For Session: Any fetch() in your code is automatically traced!
     */
    new FetchInstrumentation({
      // Propagate trace context to backend via HTTP headers
      propagateTraceHeaderCorsUrls: [
        /localhost:\d+/,           // Local development
        /^https?:\/\/api\.example\.com/, // Production API
        /.*/,                      // Allow all for demo
      ],
      
      // Clear timing resources to prevent memory leaks
      clearTimingResources: true,
      
      // Add custom attributes to fetch spans
      applyCustomAttributesOnSpan: (span, request, response) => {
        // Add request details
        if (request.url) {
          const url = new URL(request.url);
          span.setAttribute('http.target', url.pathname);
          span.setAttribute('http.host', url.host);
        }
        
        // Add response details
        if (response) {
          span.setAttribute('http.status_code', response.status);
          span.setAttribute('http.status_text', response.statusText);
        }
      },
    }),

    // ========================================================================
    // XMLHttpRequest Instrumentation
    // ========================================================================
    /**
     * Automatically traces XMLHttpRequest calls
     * (for libraries that don't use fetch)
     */
    new XMLHttpRequestInstrumentation({
      propagateTraceHeaderCorsUrls: [/.*/],
      clearTimingResources: true,
    }),
  ],
});

console.log('🔧 Auto-instrumentations registered:', [
  '• DocumentLoadInstrumentation (page loads)',
  '• UserInteractionInstrumentation (clicks, submits)',
  '• FetchInstrumentation (API calls)',
  '• XMLHttpRequestInstrumentation (legacy AJAX)',
]);

// ============================================================================
// STEP 7: Setup Metrics (For Business KPIs)
// ============================================================================

/**
 * Metrics API - Track numerical values over time
 * 
 * For Session Demo: Show how to track business metrics
 * - Counters (always increasing)
 * - Histograms (distributions)
 */

const meter = metrics.getMeter('chiccloset-business-metrics', '1.0.0');

// Business Metrics
export const businessMetrics = {
  // Revenue tracking
  revenue: meter.createCounter('business.revenue', {
    description: 'Total revenue in USD',
    unit: 'USD'
  }),
  
  // Cart operations
  cartAdditions: meter.createCounter('business.cart.additions', {
    description: 'Number of items added to cart'
  }),
  
  cartRemovals: meter.createCounter('business.cart.removals', {
    description: 'Number of items removed from cart'
  }),
  
  cartAbandonment: meter.createCounter('business.cart.abandoned', {
    description: 'Number of abandoned carts'
  }),
  
  // User authentication
  loginAttempts: meter.createCounter('business.auth.login_attempts', {
    description: 'Number of login attempts'
  }),
  
  loginSuccesses: meter.createCounter('business.auth.login_success', {
    description: 'Number of successful logins'
  }),
  
  loginFailures: meter.createCounter('business.auth.login_failures', {
    description: 'Number of failed logins'
  }),
  
  // Checkout flow
  checkoutStarted: meter.createCounter('business.checkout.started', {
    description: 'Number of checkouts started'
  }),
  
  checkoutCompleted: meter.createCounter('business.checkout.completed', {
    description: 'Number of checkouts completed'
  }),
  
  checkoutDuration: meter.createHistogram('business.checkout.duration', {
    description: 'Time to complete checkout',
    unit: 'ms'
  }),
  
  // Product interactions
  productViews: meter.createCounter('business.product.views', {
    description: 'Number of product views'
  }),
  
  productSearches: meter.createCounter('business.product.searches', {
    description: 'Number of product searches'
  }),
};

console.log('📊 Business metrics initialized (11 metrics ready)');

// ============================================================================
// STEP 8: Setup Structured Logging with Trace Correlation
// ============================================================================

/**
 * Structured Logger - Logs with trace correlation
 * 
 * For Session Demo: Show how logs connect to traces
 * Each log automatically includes:
 * - Trace ID (connect log to trace)
 * - Span ID (connect log to specific operation)
 * - Timestamp
 * - Severity level
 */

export const logger = {
  debug: (message, attributes = {}) => {
    logWithTraceContext('DEBUG', message, attributes);
  },
  
  info: (message, attributes = {}) => {
    logWithTraceContext('INFO', message, attributes);
  },
  
  warn: (message, attributes = {}) => {
    logWithTraceContext('WARN', message, attributes);
  },
  
  error: (message, attributes = {}) => {
    logWithTraceContext('ERROR', message, attributes);
  },
};

function logWithTraceContext(severity, message, attributes) {
  const span = trace.getActiveSpan();
  const spanContext = span?.spanContext();
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    severity,
    message,
    ...attributes,
  };
  
  // Add trace context if available
  if (spanContext) {
    logEntry.traceId = spanContext.traceId;
    logEntry.spanId = spanContext.spanId;
    logEntry.traceFlags = spanContext.traceFlags;
  }
  
  // Enhanced console logging with rich details
  const emoji = {
    DEBUG: '🔍',
    INFO: 'ℹ️',
    WARN: '⚠️',
    ERROR: '❌'
  }[severity];
  
  const color = {
    DEBUG: '#9E9E9E',
    INFO: '#2196F3',
    WARN: '#FF9800',
    ERROR: '#F44336'
  }[severity];
  
  // Create a visually rich log output
  console.groupCollapsed(
    `%c${emoji} [${severity}] ${message}`,
    `color: ${color}; font-weight: bold; font-size: 12px;`
  );
  
  // Timestamp
  console.log(
    `%c⏰ Timestamp: %c${logEntry.timestamp}`,
    'color: #757575; font-weight: bold;',
    'color: #424242;'
  );
  
  // Trace Context
  if (spanContext) {
    console.group('%c🔗 Trace Context', 'color: #9C27B0; font-weight: bold;');
    console.log(
      `%cTrace ID: %c${spanContext.traceId}`,
      'color: #757575;',
      'color: #9C27B0; font-family: monospace; background: #F3E5F5; padding: 2px 6px; border-radius: 3px;'
    );
    console.log(
      `%cSpan ID: %c${spanContext.spanId}`,
      'color: #757575;',
      'color: #7B1FA2; font-family: monospace; background: #F3E5F5; padding: 2px 6px; border-radius: 3px;'
    );
    console.log(
      `%cTrace Flags: %c${spanContext.traceFlags}`,
      'color: #757575;',
      'color: #6A1B9A;'
    );
    
    // Get span name and timing if available
    if (span) {
      const spanName = span.name || 'unknown';
      console.log(
        `%cSpan Name: %c${spanName}`,
        'color: #757575;',
        'color: #8E24AA; font-weight: bold;'
      );
      
      // Try to get span attributes
      try {
        const spanAttributes = span.attributes || {};
        if (Object.keys(spanAttributes).length > 0) {
          console.log('%cSpan Attributes:', 'color: #AB47BC; font-weight: bold;');
          console.table(spanAttributes);
        }
      } catch (e) {
        // Span attributes might not be accessible
      }
    }
    
    console.groupEnd();
  }
  
  // Custom Attributes
  if (Object.keys(attributes).length > 0) {
    console.group('%c📋 Custom Attributes', 'color: #FF6F00; font-weight: bold;');
    
    // Display attributes in a formatted way
    Object.entries(attributes).forEach(([key, value]) => {
      const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
      console.log(
        `%c${key}: %c${displayValue}`,
        'color: #757575; font-weight: bold;',
        'color: #E65100;'
      );
    });
    
    console.groupEnd();
  }
  
  // Jaeger Link (if trace context available)
  if (spanContext) {
    const jaegerUrl = `http://localhost:16686/trace/${spanContext.traceId}`;
    console.log(
      `%c🔍 View in Jaeger: %c${jaegerUrl}`,
      'color: #00897B; font-weight: bold;',
      'color: #00695C; text-decoration: underline; cursor: pointer;'
    );
  }
  
  // Performance Hint
  if (severity === 'WARN' || severity === 'ERROR') {
    console.log(
      `%c💡 Tip: Use the Trace ID to search in Jaeger UI for complete request flow`,
      'color: #0288D1; font-style: italic; font-size: 11px;'
    );
  }
  
  console.groupEnd();
  
  // Also log raw object for programmatic access
  if (OTEL_CONFIG.environment === 'development') {
    console.debug('📦 Raw Log Entry:', logEntry);
  }
}

console.log('📝 Structured logging initialized with trace correlation');

// ============================================================================
// STEP 9: Export Tracer for Custom Instrumentation
// ============================================================================

/**
 * Export a tracer instance for manual instrumentation
 * Use this in your components/contexts to create custom spans
 */
export const tracer = trace.getTracer(
  'chiccloset-frontend-tracer',
  OTEL_CONFIG.serviceVersion
);

console.log('🎯 Custom tracer exported');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper function to create a span and automatically handle errors
 * 
 * Usage:
 * ```javascript
 * import { createSpan } from './telemetry/telemetry';
 * 
 * const result = createSpan('operation.name', (span) => {
 *   span.setAttribute('key', 'value');
 *   return doSomething();
 * });
 * ```
 */
export const createSpan = (name, fn, options = {}) => {
  return tracer.startActiveSpan(name, options, (span) => {
    try {
      const result = fn(span);
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        return result
          .then((value) => {
            span.setStatus({ code: 0 }); // OK
            span.end();
            return value;
          })
          .catch((error) => {
            span.setStatus({ code: 2, message: error.message }); // ERROR
            span.recordException(error);
            span.end();
            throw error;
          });
      }
      
      // Synchronous result
      span.setStatus({ code: 0 }); // OK
      span.end();
      return result;
    } catch (error) {
      span.setStatus({ code: 2, message: error.message }); // ERROR
      span.recordException(error);
      span.end();
      throw error;
    }
  });
};

/**
 * Helper to add user context to current span
 * 
 * For Session: Explain how context enriches traces
 */
export const setUserContext = (userId, userEmail) => {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute('user.id', userId);
    span.setAttribute('user.email', userEmail);
    console.log('👤 User context added to span:', { userId, userEmail });
  }
};

/**
 * Helper to add business metrics to spans
 */
export const recordBusinessMetric = (name, value, unit = '') => {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute(`business.${name}`, value);
    if (unit) {
      span.setAttribute(`business.${name}.unit`, unit);
    }
    span.addEvent(`metric_recorded: ${name}`, { value, unit });
  }
};

/**
 * Helper to create a child span
 * Useful when you need nested spans
 */
export const createChildSpan = (name, parentSpan, fn) => {
  const ctx = trace.setSpan(context.active(), parentSpan);
  return context.with(ctx, () => createSpan(name, fn));
};

// ============================================================================
// SESSION DEMO HELPERS
// ============================================================================

/**
 * Helper to demonstrate trace visualization
 * Call this to create a sample trace with multiple spans
 */
export const createDemoTrace = () => {
  return createSpan('demo.trace', (rootSpan) => {
    rootSpan.setAttribute('demo', true);
    rootSpan.addEvent('demo_trace_started');
    
    // Simulate nested operations
    createChildSpan('demo.operation1', rootSpan, (span) => {
      span.setAttribute('operation', 'first');
      // Simulate work
      const start = Date.now();
      while (Date.now() - start < 50) {} // 50ms delay
    });
    
    createChildSpan('demo.operation2', rootSpan, (span) => {
      span.setAttribute('operation', 'second');
      const start = Date.now();
      while (Date.now() - start < 100) {} // 100ms delay
    });
    
    rootSpan.addEvent('demo_trace_completed');
    console.log('🎬 Demo trace created - check Jaeger UI!');
  });
};

// ============================================================================
// INITIALIZATION COMPLETE
// ============================================================================

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('🎉 OpenTelemetry Initialization Complete!');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('📊 Telemetry Configuration:');
console.log(`   Service: ${OTEL_CONFIG.serviceName}`);
console.log(`   Version: ${OTEL_CONFIG.serviceVersion}`);
console.log(`   Environment: ${OTEL_CONFIG.environment}`);
console.log(`   Exporter: ${OTEL_CONFIG.collectorEndpoint}`);
console.log('');
console.log('🔍 What\'s being traced:');
console.log('   ✓ Page loads and navigation');
console.log('   ✓ User interactions (clicks, submits)');
console.log('   ✓ HTTP requests (fetch, XHR)');
console.log('   ✓ Custom business logic (when instrumented)');
console.log('');
console.log('🎯 Next Steps:');
console.log('   1. Start Jaeger: docker-compose up -d');
console.log('   2. Open Jaeger UI: http://localhost:16686');
console.log('   3. Use your app and see traces appear!');
console.log('');
console.log('💡 For custom tracing, import { tracer } from this file');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Export configuration for reference
export const otelConfig = OTEL_CONFIG;

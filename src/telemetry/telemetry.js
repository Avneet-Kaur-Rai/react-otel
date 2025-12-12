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
import { trace, context } from '@opentelemetry/api';

// ============================================================================
// CONFIGURATION
// ============================================================================

const OTEL_CONFIG = {
  serviceName: 'shophub-ecommerce-frontend',
  serviceVersion: '1.0.0',
  environment: 'development',
  
  // Jaeger endpoint - use window.location.origin for relative proxy path
  collectorEndpoint: `${window.location.origin}/v1/traces`,
  
  // Enable console exporter for debugging
  enableConsoleExporter: true,
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
// STEP 7: Export Tracer for Custom Instrumentation
// ============================================================================

/**
 * Export a tracer instance for manual instrumentation
 * Use this in your components/contexts to create custom spans
 */
export const tracer = trace.getTracer(
  'shophub-frontend-tracer',
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

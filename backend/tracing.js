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
  [ATTR_SERVICE_NAME]: 'chiccloset-fashion-backend',
  [ATTR_SERVICE_VERSION]: '1.0.0',
  'deployment.environment': 'development',
  'service.namespace': 'fashion-ecommerce',
});

// ============================================================================
// Configure Exporter (Where to send traces)
// ============================================================================

const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces', // Jaeger OTLP endpoint
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
        // Enable trace context propagation
        headersToSpanAttributes: {
          server: {
            requestHeaders: ['traceparent', 'tracestate'],
          },
        },
        // Ignore health check endpoints
        ignoreIncomingRequestHook: (request) => {
          return request.url === '/health';
        },
      },
      '@opentelemetry/instrumentation-express': {
        // Add custom attributes to HTTP spans
        requestHook: (span, info) => {
          span.setAttribute('custom.request_id', info.request.headers['x-request-id'] || 'none');
          // Log incoming trace headers for debugging
          if (info.request.headers.traceparent) {
            console.log(`📥 Received traceparent: ${info.request.headers.traceparent}`);
          }
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
console.log(`   Service: chiccloset-fashion-backend`);
console.log(`   Version: 1.0.0`);
console.log(`   Namespace: fashion-ecommerce`);
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

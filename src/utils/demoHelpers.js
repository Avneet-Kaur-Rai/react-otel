/**
 * Demo Helpers for OpenTelemetry Session
 * 
 * These helpers enable/disable demo scenarios via URL parameters
 * Usage: Add ?demo=slow-checkout or ?demo=error to URL
 */

/**
 * Get active demo scenario from URL
 * @returns {string|null} Demo scenario name or null
 */
export const getActiveDemoScenario = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('demo');
};

/**
 * Check if a specific demo is active
 * @param {string} scenarioName - Name of the demo scenario
 * @returns {boolean}
 */
export const isDemoActive = (scenarioName) => {
  return getActiveDemoScenario() === scenarioName;
};

/**
 * Get demo configuration
 */
export const getDemoConfig = () => {
  const scenario = getActiveDemoScenario();
  
  const configs = {
    'slow-checkout': {
      name: 'Scenario 1: Slow Checkout Validation',
      description: 'Simulates 3-second delay in checkout validation',
      delayMs: 3000,
      color: '#ff6b6b'
    },
    'slow-page': {
      name: 'Scenario 2: Slow Page Load',
      description: 'Simulates slow image loading',
      delayMs: 2000,
      color: '#ffa500'
    },
    'error': {
      name: 'Scenario 4: Payment Error',
      description: '30% chance of payment processing failure',
      errorRate: 0.3,
      color: '#dc3545'
    },
    'experiment': {
      name: 'Scenario 5: A/B Test Experiment',
      description: 'Splits users into control/treatment groups',
      treatmentRate: 0.5,
      color: '#4CAF50'
    }
  };
  
  return scenario ? configs[scenario] : null;
};

/**
 * Show demo banner
 */
export const showDemoBanner = () => {
  const config = getDemoConfig();
  if (!config) return;
  
  // Create banner element
  const banner = document.createElement('div');
  banner.id = 'otel-demo-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: ${config.color};
    color: white;
    padding: 8px 16px;
    text-align: center;
    font-weight: 600;
    z-index: 10000;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  banner.innerHTML = `
    🎬 DEMO MODE: ${config.name} - ${config.description}
    <button onclick="window.location.href=window.location.pathname" 
            style="margin-left: 16px; background: white; color: ${config.color}; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-weight: 600;">
      Exit Demo
    </button>
  `;
  
  // Remove existing banner if any
  const existing = document.getElementById('otel-demo-banner');
  if (existing) existing.remove();
  
  document.body.prepend(banner);
  
  // Adjust root element to not overlap
  const root = document.getElementById('root');
  if (root) {
    root.style.marginTop = '40px';
  }
};

/**
 * Simulate delay for demo purposes
 * @param {number} ms - Milliseconds to delay
 */
export const demoDelay = (ms) => {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // Busy wait to simulate CPU-bound operation
  }
};

/**
 * Simulate async delay
 * @param {number} ms - Milliseconds to delay
 */
export const demoDelayAsync = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate random error for demo
 * @param {number} errorRate - Probability of error (0-1)
 * @returns {boolean} Whether error should occur
 */
export const shouldSimulateError = (errorRate = 0.3) => {
  return Math.random() < errorRate;
};

/**
 * Get or set experiment group for user
 * @returns {'control' | 'treatment'}
 */
export const getExperimentGroup = () => {
  let group = localStorage.getItem('otel_experiment_group');
  
  if (!group) {
    group = Math.random() > 0.5 ? 'control' : 'treatment';
    localStorage.setItem('otel_experiment_group', group);
  }
  
  return group;
};

/**
 * Generate unique error ID
 * @returns {string} Error ID in format ERR-timestamp
 */
export const generateErrorId = () => {
  return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
};

/**
 * Log demo scenario activation
 */
export const logDemoScenario = (scenarioName, logger) => {
  const config = getDemoConfig();
  if (config && logger) {
    logger.info('Demo scenario activated', {
      'demo.scenario': scenarioName,
      'demo.name': config.name,
      'demo.description': config.description
    });
  }
};

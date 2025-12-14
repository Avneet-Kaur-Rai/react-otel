/**
 * CheckoutPage with OpenTelemetry Instrumentation
 * 
 * For Session Demo: Critical conversion funnel tracking
 * - Form validation tracking
 * - Error rates
 * - Checkout abandonment
 * - Performance monitoring
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { validateEmail, validatePhone, validateZipCode } from '../../utils/validators';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import { tracer, businessMetrics, logger } from '../../telemetry/telemetry';
import { SpanStatusCode } from '@opentelemetry/api';
import { isDemoActive, demoDelay, shouldSimulateError, generateErrorId, showDemoBanner } from '../../utils/demoHelpers';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });
  const [errors, setErrors] = useState({});

  // ============================================================================
  // Track Page View and Time on Page
  // ============================================================================
  useEffect(() => {
    // Show demo banner if demo mode is active
    showDemoBanner();
    
    const pageLoadStart = performance.now();
    const span = tracer.startSpan('page.view.checkout');
    
    span.setAttribute('page.name', 'CheckoutPage');
    span.setAttribute('page.route', '/checkout');
    span.setAttribute('checkout.step', 'information');
    
    span.addEvent('checkout_page_loaded');
    
    // Track checkout started metric
    businessMetrics.checkoutStarted.add(1, {
      'checkout.step': 'information'
    });
    
    // Log page view
    logger.info('Checkout page viewed', {
      'page.name': 'CheckoutPage',
      'checkout.step': 'information'
    });
    
    span.end();
    
    // Track abandonment on unmount
    const startTime = Date.now();
    return () => {
      const timeSpent = Date.now() - startTime;
      const pageLoadTime = performance.now() - pageLoadStart;
      
      const exitSpan = tracer.startSpan('page.exit.checkout');
      exitSpan.setAttribute('page.timeSpent_ms', timeSpent);
      exitSpan.setAttribute('page.loadTime_ms', pageLoadTime);
      exitSpan.setAttribute('form.completed', false);
      exitSpan.addEvent('checkout_abandoned');
      
      // Track abandonment
      businessMetrics.cartAbandonment.add(1, {
        'checkout.step': 'information',
        'time.spent_ms': timeSpent.toString()
      });
      
      logger.warn('Checkout abandoned', {
        'time.spent_ms': timeSpent,
        'checkout.step': 'information'
      });
      
      exitSpan.end();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  /**
   * Form Validation with Tracing
   * 
   * For Session: Show how to track validation errors
   * DEMO SCENARIO 1: Simulate slow validation when ?demo=slow-checkout
   */
  const validate = () => {
    return tracer.startActiveSpan('checkout.validate', (span) => {
      try {
        span.setAttribute('validation.step', 'checkout_form');
        
        // 🎬 DEMO SCENARIO 1: Slow Checkout Validation
        if (isDemoActive('slow-checkout')) {
          span.setAttribute('demo.scenario', 'slow-checkout');
          span.addEvent('simulating_slow_validation');
          logger.warn('DEMO: Simulating 3-second validation delay', {
            'demo.scenario': 'slow-checkout'
          });
          demoDelay(3000); // 3 second delay!
          span.addEvent('slow_validation_completed');
        }
        
        const newErrors = {};
        const validationResults = [];

        if (!formData.firstName.trim()) {
          newErrors.firstName = 'First name is required';
          validationResults.push('firstName_missing');
        }

        if (!formData.lastName.trim()) {
          newErrors.lastName = 'Last name is required';
          validationResults.push('lastName_missing');
        }

        if (!validateEmail(formData.email)) {
          newErrors.email = 'Please enter a valid email';
          validationResults.push('email_invalid');
        }

        if (!validatePhone(formData.phone)) {
          newErrors.phone = 'Please enter a valid 10-digit phone number';
          validationResults.push('phone_invalid');
        }

        if (!formData.address.trim()) {
          newErrors.address = 'Address is required';
          validationResults.push('address_missing');
        }

        if (!formData.city.trim()) {
          newErrors.city = 'City is required';
          validationResults.push('city_missing');
        }

        if (!formData.state.trim()) {
          newErrors.state = 'State is required';
          validationResults.push('state_missing');
        }

        if (!validateZipCode(formData.zipCode)) {
          newErrors.zipCode = 'Please enter a valid ZIP code';
          validationResults.push('zipCode_invalid');
        }

        // Add validation results to span
        const errorCount = Object.keys(newErrors).length;
        span.setAttribute('validation.errorCount', errorCount);
        span.setAttribute('validation.passed', errorCount === 0);
        
        if (errorCount > 0) {
          span.setAttribute('validation.errors', validationResults.join(', '));
          span.addEvent('validation_failed', {
            'error.count': errorCount,
            'error.fields': validationResults.join(', '),
          });
          
          // Log validation errors
          logger.warn('Checkout validation failed', {
            'error.count': errorCount,
            'error.fields': validationResults.join(', ')
          });
        } else {
          span.addEvent('validation_passed');
          
          logger.info('Checkout validation passed', {
            'form.fields': Object.keys(formData).length
          });
        }
        
        span.setStatus({ code: SpanStatusCode.OK });
        return newErrors;
        
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  };

  /**
   * Form Submission with Tracing
   * 
   * For Session: Track critical conversion step
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    return tracer.startActiveSpan('checkout.submit', (span) => {
      try {
        span.setAttribute('checkout.step', 'information');
        span.setAttribute('form.country', formData.country);
        
        span.addEvent('submit_button_clicked');
        
        // Validate form
        const newErrors = validate();

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          
          span.setAttribute('submission.result', 'validation_failed');
          span.addEvent('submission_blocked_by_validation');
          
          // Track failed checkout
          businessMetrics.checkoutCompleted.add(0, {
            'result': 'validation_failed',
            'error.count': Object.keys(newErrors).length.toString()
          });
          
          span.setStatus({ 
            code: SpanStatusCode.ERROR,
            message: 'Validation failed' 
          });
          
          logger.error('Checkout submission failed - validation errors', {
            'error.count': Object.keys(newErrors).length,
            'submission.result': 'validation_failed'
          });
          
          return;
        }

        // Store checkout data in sessionStorage
        sessionStorage.setItem('checkoutData', JSON.stringify(formData));
        span.addEvent('checkout_data_saved');
        
        // 🎬 DEMO SCENARIO 4: Payment Error Simulation
        if (isDemoActive('error')) {
          span.setAttribute('demo.scenario', 'error');
          
          if (shouldSimulateError(0.3)) {
            const errorId = generateErrorId();
            span.setAttribute('error', true);
            span.setAttribute('error.id', errorId);
            span.setAttribute('error.type', 'payment_processing_failed');
            
            logger.error('DEMO: Payment processing failed', {
              'demo.scenario': 'error',
              'error.id': errorId,
              'error.code': 'PAYMENT_DECLINED',
              'error.message': 'Card was declined by payment processor'
            });
            
            alert(`❌ Payment Failed!\n\nError ID: ${errorId}\nError: Card was declined\n\n📞 Please contact support with this Error ID for assistance.`);
            
            span.setStatus({ 
              code: SpanStatusCode.ERROR,
              message: 'Payment processing failed'
            });
            span.end();
            return;
          } else {
            logger.info('DEMO: Payment processed successfully (70% success rate)');
          }
        }
        
        // Track successful checkout timing
        const checkoutDuration = performance.now();
        businessMetrics.checkoutDuration.record(checkoutDuration, {
          'checkout.step': 'information',
          'result': 'success'
        });
        
        // Navigate to payment
        span.setAttribute('submission.result', 'success');
        span.setAttribute('navigation.target', ROUTES.PAYMENT);
        span.setAttribute('checkout.duration_ms', checkoutDuration);
        span.addEvent('navigating_to_payment');
        
        // Track completed checkout
        businessMetrics.checkoutCompleted.add(1, {
          'checkout.step': 'information',
          'navigation.target': 'payment'
        });
        
        span.setStatus({ code: SpanStatusCode.OK });
        
        logger.info('Checkout submitted successfully', {
          'navigation.target': 'payment',
          'checkout.duration_ms': checkoutDuration,
          'form.fields_count': Object.keys(formData).length
        });
        
        navigate(ROUTES.PAYMENT);
        
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.recordException(error);
        
        // Log error
        logger.error('Checkout submission error', {
          'error.message': error.message,
          'error.type': error.name
        });
        
        throw error;
        
      } finally {
        span.end();
      }
    });
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        <div className="checkout-content">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-section">
              <h2 className="section-title">Contact Information</h2>
              <div className="form-row">
                <Input
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  required
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  required
                />
              </div>
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
              />
              <Input
                label="Phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                placeholder="(555) 555-5555"
                required
              />
            </div>

            <div className="form-section">
              <h2 className="section-title">Shipping Address</h2>
              <Input
                label="Street Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                error={errors.address}
                required
              />
              <div className="form-row">
                <Input
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  error={errors.city}
                  required
                />
                <Input
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  error={errors.state}
                  required
                />
              </div>
              <div className="form-row">
                <Input
                  label="ZIP Code"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  error={errors.zipCode}
                  placeholder="12345"
                  required
                />
                <Input
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled
                />
              </div>
            </div>

            <div className="form-actions">
              {/* UIFIX AI - BUG - UI/UX
                  Description: Missing "Back to Cart" button - users cannot go back without browser back button
                  Impact: Poor UX - users stuck on checkout page with no back navigation
                  Expected: Should have a "Back to Cart" button using variant="outline" */}
              <Button type="submit" size="large">
                Continue to Payment
              </Button>
            </div>
          </form>

          <div className="checkout-sidebar">
            <div className="order-info">
              <h3>Order Information</h3>
              <p>Complete your shipping information to proceed with payment.</p>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-icon">📦</span>
                  <div>
                    <h4>Free Shipping</h4>
                    <p>On orders over $100</p>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">🔒</span>
                  <div>
                    <h4>Secure Checkout</h4>
                    <p>Your data is protected</p>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">↩️</span>
                  <div>
                    <h4>Easy Returns</h4>
                    <p>30-day return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

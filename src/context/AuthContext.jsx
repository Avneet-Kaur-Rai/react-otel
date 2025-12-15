/**
 * AuthContext with OpenTelemetry Instrumentation
 * 
 * For Session Demo: Shows how to trace authentication flows
 * - User login/logout events
 * - Session management
 * - Security-conscious attribute logging (no passwords!)
 */

import { createContext, useContext, useState } from 'react';
import { tracer, setUserContext, businessMetrics, logger } from '../telemetry/telemetry';
import { SpanStatusCode } from '@opentelemetry/api';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * User Login - Connected to Backend API
   * 
   * For Session: Demonstrate distributed tracing
   * SECURITY: Never log passwords or sensitive data!
   */
  const login = async (email, password) => {
    return tracer.startActiveSpan('auth.login', async (span) => {
      try {
        // ====================================================================
        // Add span attributes
        // NOTE: Hash or mask sensitive data in production!
        // ====================================================================
        span.setAttribute('auth.method', 'email_password');
        span.setAttribute('user.email', email); // In prod: hash this!
        span.setAttribute('auth.provider', 'backend_api');
        
        span.addEvent('login_attempt_started', {
          'user.email': email,
        });
        
        // ====================================================================
        // Call Backend API
        // Fetch instrumentation will automatically add traceparent header!
        // ====================================================================
        const startTime = Date.now();
        span.addEvent('calling_backend_api');
        
        const response = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        const duration = Date.now() - startTime;
        span.setAttribute('auth.duration_ms', duration);
        span.setAttribute('http.status_code', response.status);
        
        if (!response.ok) {
          span.addEvent('login_failed', {
            'http.status_code': response.status,
          });
          
          businessMetrics.loginAttempts.add(1, {
            'auth.method': 'email_password',
            'auth.result': 'failure'
          });
          
          businessMetrics.loginFailures.add(1, {
            'auth.method': 'email_password',
            'user.email': email
          });
          
          span.setStatus({ 
            code: SpanStatusCode.ERROR, 
            message: 'Login failed' 
          });
          
          logger.error('Login failed', {
            'user.email': email,
            'http.status_code': response.status
          });
          
          span.end();
          return { success: false, message: 'Invalid credentials' };
        }
        
        const data = await response.json();
        const userData = data.user;
        
        // ====================================================================
        // Set user state
        // ====================================================================
        setUser(userData);
        setIsAuthenticated(true);
        
        // ====================================================================
        // Set user context for all future spans
        // This enriches ALL subsequent traces with user info
        // ====================================================================
        setUserContext(userData.email, userData.id);
        span.addEvent('user_context_set');
        
        // ====================================================================
        // Record business events and metrics
        // ====================================================================
        span.addEvent('login_successful', {
          'user.name': userData.name,
          'user.id': userData.id,
          'session.started': new Date().toISOString(),
        });
        
        // Track login metrics
        businessMetrics.loginAttempts.add(1, {
          'auth.method': 'email_password',
          'auth.result': 'success'
        });
        
        businessMetrics.loginSuccesses.add(1, {
          'auth.method': 'email_password',
          'user.email': email
        });
        
        // Log successful login with trace context
        logger.info(`User logged in successfully via backend`, {
          'user.email': email,
          'user.name': userData.name,
          'user.id': userData.id,
          'auth.duration_ms': duration
        });
        
        span.setStatus({ code: SpanStatusCode.OK });
        
        return { success: true, user: userData };
        
      } catch (error) {
        // ====================================================================
        // Error handling
        // ====================================================================
        span.setStatus({ 
          code: SpanStatusCode.ERROR,
          message: error.message 
        });
        span.recordException(error);
        span.addEvent('login_error', {
          'error.type': error.name,
          'error.message': error.message,
        });
        
        // Track failed login metric
        businessMetrics.loginAttempts.add(1, {
          'auth.method': 'email_password',
          'auth.result': 'error'
        });
        
        businessMetrics.loginFailures.add(1, {
          'auth.method': 'email_password',
          'error.type': error.name
        });
        
        // Log error with trace context
        logger.error('Login error', {
          'error.type': error.name,
          'error.message': error.message,
          'user.email': email
        });
        
        console.error('❌ [OTel] Login error:', error);
        return { success: false, message: error.message };
        
      } finally {
        span.end();
      }
    });
  };

  /**
   * User Logout
   */
  const logout = () => {
    return tracer.startActiveSpan('auth.logout', (span) => {
      try {
        span.setAttribute('user.email', user?.email || 'unknown');
        
        span.addEvent('logout_initiated');
        
        // Clear user state
        setUser(null);
        setIsAuthenticated(false);
        
        span.addEvent('session_terminated', {
          'session.ended': new Date().toISOString(),
        });
        
        // Log logout
        logger.info('User logged out', {
          'user.email': user?.email || 'unknown'
        });
        
        span.setStatus({ code: SpanStatusCode.OK });
        
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.recordException(error);
        
        logger.error('Logout failed', {
          'error.message': error.message
        });
        throw error;
      } finally {
        span.end();
      }
    });
  };

  /**
   * User Signup
   * 
   * For Session: Show how to trace registration flow
   */
  const signup = (email, password, name) => {
    return tracer.startActiveSpan('auth.signup', (span) => {
      try {
        // ====================================================================
        // Add span attributes
        // SECURITY: Never log passwords!
        // ====================================================================
        span.setAttribute('auth.method', 'email_password');
        span.setAttribute('user.email', email); // Hash in production
        span.setAttribute('user.name', name);
        span.setAttribute('auth.provider', 'local');
        
        // Note password length for validation tracking (NOT the password itself!)
        span.setAttribute('password.length', password?.length || 0);
        
        span.addEvent('signup_attempt_started');
        
        // ====================================================================
        // Simulate signup logic
        // ====================================================================
        span.addEvent('validating_input');
        
        // In production: API call, database insert, email verification
        const userData = { email, name };
        setUser(userData);
        setIsAuthenticated(true);
        
        // Set user context
        setUserContext(email, email);
        
        span.addEvent('signup_successful', {
          'user.name': name,
          'account.created': new Date().toISOString(),
        });
        
        // Log signup
        logger.info('New user signed up', {
          'user.email': email,
          'user.name': name
        });
        
        span.setStatus({ code: SpanStatusCode.OK });
        
        return true;
        
      } catch (error) {
        span.setStatus({ 
          code: SpanStatusCode.ERROR,
          message: 'Signup failed' 
        });
        span.recordException(error);
        span.addEvent('signup_failed', {
          'error.type': error.name,
        });
        
        // Log signup failure
        logger.error('Signup failed', {
          'error.type': error.name,
          'error.message': error.message,
          'user.email': email
        });
        
        return false;
        
      } finally {
        span.end();
      }
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        signup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

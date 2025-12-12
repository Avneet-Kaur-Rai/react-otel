/**
 * AuthContext with OpenTelemetry Instrumentation
 * 
 * For Session Demo: Shows how to trace authentication flows
 * - User login/logout events
 * - Session management
 * - Security-conscious attribute logging (no passwords!)
 */

import { createContext, useContext, useState } from 'react';
import { tracer, setUserContext, recordBusinessMetric } from '../telemetry/telemetry';
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
   * User Login
   * 
   * For Session: Demonstrate authentication tracing
   * SECURITY: Never log passwords or sensitive data!
   */
  const login = (email) => {
    return tracer.startActiveSpan('auth.login', (span) => {
      try {
        // ====================================================================
        // Add span attributes
        // NOTE: Hash or mask sensitive data in production!
        // ====================================================================
        span.setAttribute('auth.method', 'email_password');
        span.setAttribute('user.email', email); // In prod: hash this!
        span.setAttribute('auth.provider', 'local');
        
        span.addEvent('login_attempt_started', {
          'user.email': email,
        });
        
        // ====================================================================
        // Simulate login logic
        // In real app: API call, token validation, etc.
        // ====================================================================
        const username = email.split('@')[0];
        const userData = { email, name: username };
        
        // Simulate authentication delay
        const startTime = Date.now();
        span.addEvent('validating_credentials');
        
        // In production, this would be an API call
        // For demo: simulate success
        setUser(userData);
        setIsAuthenticated(true);
        
        const duration = Date.now() - startTime;
        span.setAttribute('auth.duration_ms', duration);
        
        // ====================================================================
        // Set user context for all future spans
        // This enriches ALL subsequent traces with user info
        // ====================================================================
        setUserContext(email, email);
        span.addEvent('user_context_set');
        
        // ====================================================================
        // Record business events
        // ====================================================================
        span.addEvent('login_successful', {
          'user.name': username,
          'session.started': new Date().toISOString(),
        });
        
        recordBusinessMetric('auth.login_success', 1);
        span.setStatus({ code: SpanStatusCode.OK });
        
        console.log(`✅ [OTel] User logged in: ${email}`);
        
        return true;
        
      } catch (error) {
        // ====================================================================
        // Error handling
        // ====================================================================
        span.setStatus({ 
          code: SpanStatusCode.ERROR,
          message: 'Login failed' 
        });
        span.recordException(error);
        span.addEvent('login_failed', {
          'error.type': error.name,
          'error.message': error.message,
        });
        
        recordBusinessMetric('auth.login_failure', 1);
        
        console.error('❌ [OTel] Login failed:', error);
        return false;
        
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
        
        recordBusinessMetric('auth.logout', 1);
        span.setStatus({ code: SpanStatusCode.OK });
        
        console.log('👋 [OTel] User logged out');
        
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.recordException(error);
        console.error('❌ [OTel] Logout failed:', error);
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
        
        recordBusinessMetric('auth.signup_success', 1);
        span.setStatus({ code: SpanStatusCode.OK });
        
        console.log(`🎉 [OTel] New user signed up: ${email}`);
        
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
        
        recordBusinessMetric('auth.signup_failure', 1);
        
        console.error('❌ [OTel] Signup failed:', error);
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

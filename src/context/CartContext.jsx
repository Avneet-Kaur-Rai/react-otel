/**
 * CartContext with OpenTelemetry Instrumentation
 * 
 * For Session Demo: This shows how to add custom tracing to business logic
 * Each cart operation is traced with:
 * - Operation name
 * - Product details
 * - Business events
 * - Error handling
 */

import { createContext, useContext, useState } from 'react';
import { tracer, businessMetrics, logger } from '../telemetry/telemetry';
import { SpanStatusCode } from '@opentelemetry/api';

const CartContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  /**
   * Add product to cart
   * 
   * For Session: Demonstrate how we trace business operations
   * - Span name follows convention: {entity}.{operation}
   * - Attributes capture important business data
   * - Events mark significant moments
   */
  const addToCart = (product) => {
    return tracer.startActiveSpan('cart.addItem', (span) => {
      try {
        // ====================================================================
        // Add span attributes (searchable metadata)
        // ====================================================================
        span.setAttribute('product.id', product.id);
        span.setAttribute('product.name', product.name);
        span.setAttribute('product.price', product.price);
        span.setAttribute('product.category', product.category || 'unknown');
        
        // ====================================================================
        // Execute business logic
        // ====================================================================
        let actionType = 'new_item';
        
        setCartItems((prevItems) => {
          const existingItem = prevItems.find((item) => item.id === product.id);
          
          if (existingItem) {
            actionType = 'quantity_increased';
            span.setAttribute('cart.action', 'increment');
            span.setAttribute('cart.previousQuantity', existingItem.quantity);
            span.setAttribute('cart.newQuantity', existingItem.quantity + 1);
            
            return prevItems.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          }
          
          span.setAttribute('cart.action', 'add_new');
          span.setAttribute('cart.newQuantity', 1);
          return [...prevItems, { ...product, quantity: 1 }];
        });
        
        // ====================================================================
        // Add span events (timestamped log entries)
        // ====================================================================
        span.addEvent('item_added_to_cart', {
          'event.type': actionType,
          'product.name': product.name,
        });
        
        // ====================================================================
        // Record business metrics (Session Demo: Show metrics tracking)
        // ====================================================================
        businessMetrics.cartAdditions.add(1, {
          'product.id': product.id.toString(),
          'product.category': product.category || 'unknown',
          'action': actionType
        });
        
        // Track revenue potential
        businessMetrics.revenue.add(product.price, {
          'stage': 'cart_addition',
          'product.category': product.category || 'unknown'
        });
        
        // ====================================================================
        // Structured logging (Session Demo: Logs with trace context)
        // ====================================================================
        logger.info(`Item added to cart: ${product.name}`, {
          'product.id': product.id,
          'product.price': product.price,
          'cart.action': actionType
        });
        
        // ====================================================================
        // Mark span as successful
        // ====================================================================
        span.setStatus({ code: SpanStatusCode.OK });
        
        console.log(`🛒 [OTel] Item added to cart: ${product.name}`);
        
      } catch (error) {
        // ====================================================================
        // Error handling with tracing
        // ====================================================================
        span.setStatus({ 
          code: SpanStatusCode.ERROR,
          message: error.message 
        });
        span.recordException(error);
        span.addEvent('cart_operation_failed', {
          'error.type': error.name,
          'error.message': error.message,
        });
        
        // Structured error logging
        logger.error('Failed to add item to cart', {
          'error.type': error.name,
          'error.message': error.message,
          'product.id': product.id
        });
        
        throw error;
        
      } finally {
        // ====================================================================
        // Always end the span
        // ====================================================================
        span.end();
      }
    });
  };

  /**
   * Remove product from cart
   */
  const removeFromCart = (productId) => {
    return tracer.startActiveSpan('cart.removeItem', (span) => {
      try {
        span.setAttribute('product.id', productId);
        
        // Find item details before removing
        const itemToRemove = cartItems.find(item => item.id === productId);
        if (itemToRemove) {
          span.setAttribute('product.name', itemToRemove.name);
          span.setAttribute('cart.removedQuantity', itemToRemove.quantity);
          span.setAttribute('cart.valueRemoved', itemToRemove.price * itemToRemove.quantity);
        }
        
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
        
        span.addEvent('item_removed_from_cart', {
          'product.id': productId,
        });
        
        // Track removal metrics
        businessMetrics.cartRemovals.add(1, {
          'product.id': productId.toString()
        });
        
        // Log the removal
        logger.info(`Item removed from cart`, {
          'product.id': productId,
          'quantity.removed': itemToRemove?.quantity || 0
        });
        
        span.setStatus({ code: SpanStatusCode.OK });
        
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.recordException(error);
        console.error('❌ [OTel] Failed to remove item from cart:', error);
        throw error;
      } finally {
        span.end();
      }
    });
  };

  /**
   * Update product quantity in cart
   */
  const updateQuantity = (productId, quantity) => {
    return tracer.startActiveSpan('cart.updateQuantity', (span) => {
      try {
        span.setAttribute('product.id', productId);
        span.setAttribute('cart.newQuantity', quantity);
        
        // Handle removal case
        if (quantity <= 0) {
          span.addEvent('quantity_zero_removing_item');
          span.end(); // End this span before starting child span
          removeFromCart(productId);
          return;
        }
        
        // Find current item
        const currentItem = cartItems.find(item => item.id === productId);
        if (currentItem) {
          span.setAttribute('product.name', currentItem.name);
          span.setAttribute('cart.previousQuantity', currentItem.quantity);
          span.setAttribute('cart.quantityDelta', quantity - currentItem.quantity);
        }
        
        setCartItems((prevItems) =>
          prevItems.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          )
        );
        
        span.addEvent('quantity_updated', {
          'product.id': productId,
          'new.quantity': quantity,
        });
        
        // Track quantity update metric
        businessMetrics.cartAdditions.add(quantity - (currentItem?.quantity || 0), {
          'product.id': productId.toString(),
          'action': 'quantity_update'
        });
        
        // Log quantity update
        logger.info('Cart quantity updated', {
          'product.id': productId,
          'new.quantity': quantity,
          'previous.quantity': currentItem?.quantity || 0
        });
        
        span.setStatus({ code: SpanStatusCode.OK });
        
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.recordException(error);
        
        logger.error('Failed to update quantity', {
          'error.message': error.message,
          'product.id': productId
        });
        throw error;
      } finally {
        span.end();
      }
    });
  };

  /**
   * Clear entire cart
   */
  const clearCart = () => {
    return tracer.startActiveSpan('cart.clear', (span) => {
      try {
        const itemCount = cartItems.length;
        const totalQuantity = getCartCount();
        const totalValue = getCartTotal();
        
        span.setAttribute('cart.itemCount', itemCount);
        span.setAttribute('cart.totalQuantity', totalQuantity);
        span.setAttribute('cart.totalValue', totalValue);
        
        setCartItems([]);
        
        span.addEvent('cart_cleared', {
          'items.removed': itemCount,
          'total.value': totalValue,
        });
        
        // Track cart clearing
        businessMetrics.cartAbandonment.add(1, {
          'items.count': itemCount.toString(),
          'total.value': totalValue.toString()
        });
        
        // Log cart cleared
        logger.info('Cart cleared', {
          'items.removed': itemCount,
          'total.value': totalValue
        });
        
        span.setStatus({ code: SpanStatusCode.OK });
        
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.recordException(error);
        
        logger.error('Failed to clear cart', {
          'error.message': error.message
        });
        throw error;
      } finally {
        span.end();
      }
    });
  };

  /**
   * Calculate cart total
   * Note: This is called frequently, so we don't trace it
   * Only trace operations that have side effects or are expensive
   */
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  /**
   * Get total item count in cart
   */
  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

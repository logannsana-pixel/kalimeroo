import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export type EventCategory = 
  | 'navigation'
  | 'restaurant'
  | 'menu'
  | 'cart'
  | 'checkout'
  | 'auth'
  | 'search'
  | 'filter'
  | 'interaction';

export type EventType =
  // Navigation
  | 'page_view'
  // Restaurant
  | 'restaurant_view'
  | 'restaurant_favorite'
  | 'restaurant_unfavorite'
  // Menu
  | 'menu_item_view'
  | 'menu_item_detail_open'
  | 'category_click'
  // Cart
  | 'cart_add'
  | 'cart_remove'
  | 'cart_update_quantity'
  | 'cart_view'
  // Checkout
  | 'checkout_start'
  | 'checkout_step'
  | 'checkout_complete'
  | 'checkout_abandon'
  // Auth
  | 'login'
  | 'login_failed'
  | 'signup'
  | 'signup_failed'
  | 'logout'
  // Search
  | 'search'
  | 'search_result_click'
  // Filter
  | 'filter_apply'
  | 'filter_clear'
  // Interaction
  | 'button_click'
  | 'link_click'
  | 'modal_open'
  | 'modal_close';

interface TrackEventParams {
  eventType: EventType;
  eventCategory: EventCategory;
  eventData?: Record<string, any>;
}

export const useAnalytics = () => {
  const { user } = useAuth();
  const sessionId = useRef(getSessionId());

  const trackEvent = useCallback(async ({
    eventType,
    eventCategory,
    eventData = {}
  }: TrackEventParams) => {
    try {
      const { error } = await supabase.from('analytics_events').insert({
        user_id: user?.id || null,
        session_id: sessionId.current,
        event_type: eventType,
        event_category: eventCategory,
        event_data: eventData,
        page_url: window.location.href,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent
      });

      if (error) {
        console.error('Analytics tracking error:', error);
      }
    } catch (err) {
      console.error('Failed to track event:', err);
    }
  }, [user?.id]);

  // Track page views automatically
  const trackPageView = useCallback((pageName?: string) => {
    trackEvent({
      eventType: 'page_view',
      eventCategory: 'navigation',
      eventData: {
        page_name: pageName || document.title,
        path: window.location.pathname
      }
    });
  }, [trackEvent]);

  // Restaurant tracking
  const trackRestaurantView = useCallback((restaurantId: string, restaurantName: string) => {
    trackEvent({
      eventType: 'restaurant_view',
      eventCategory: 'restaurant',
      eventData: { restaurant_id: restaurantId, restaurant_name: restaurantName }
    });
  }, [trackEvent]);

  const trackFavorite = useCallback((restaurantId: string, action: 'add' | 'remove') => {
    trackEvent({
      eventType: action === 'add' ? 'restaurant_favorite' : 'restaurant_unfavorite',
      eventCategory: 'restaurant',
      eventData: { restaurant_id: restaurantId }
    });
  }, [trackEvent]);

  // Menu tracking
  const trackMenuItemView = useCallback((itemId: string, itemName: string, price: number) => {
    trackEvent({
      eventType: 'menu_item_detail_open',
      eventCategory: 'menu',
      eventData: { item_id: itemId, item_name: itemName, price }
    });
  }, [trackEvent]);

  const trackCategoryClick = useCallback((categoryName: string) => {
    trackEvent({
      eventType: 'category_click',
      eventCategory: 'menu',
      eventData: { category_name: categoryName }
    });
  }, [trackEvent]);

  // Cart tracking
  const trackCartAdd = useCallback((itemId: string, itemName: string, quantity: number, price: number) => {
    trackEvent({
      eventType: 'cart_add',
      eventCategory: 'cart',
      eventData: { item_id: itemId, item_name: itemName, quantity, price, total: quantity * price }
    });
  }, [trackEvent]);

  const trackCartRemove = useCallback((itemId: string, itemName: string) => {
    trackEvent({
      eventType: 'cart_remove',
      eventCategory: 'cart',
      eventData: { item_id: itemId, item_name: itemName }
    });
  }, [trackEvent]);

  // Checkout tracking
  const trackCheckoutStart = useCallback((cartTotal: number, itemCount: number) => {
    trackEvent({
      eventType: 'checkout_start',
      eventCategory: 'checkout',
      eventData: { cart_total: cartTotal, item_count: itemCount }
    });
  }, [trackEvent]);

  const trackCheckoutStep = useCallback((step: number, stepName: string) => {
    trackEvent({
      eventType: 'checkout_step',
      eventCategory: 'checkout',
      eventData: { step, step_name: stepName }
    });
  }, [trackEvent]);

  const trackCheckoutComplete = useCallback((orderId: string, total: number) => {
    trackEvent({
      eventType: 'checkout_complete',
      eventCategory: 'checkout',
      eventData: { order_id: orderId, total }
    });
  }, [trackEvent]);

  const trackCheckoutAbandon = useCallback((step: number, cartTotal: number) => {
    trackEvent({
      eventType: 'checkout_abandon',
      eventCategory: 'checkout',
      eventData: { step, cart_total: cartTotal }
    });
  }, [trackEvent]);

  // Auth tracking
  const trackAuth = useCallback((action: 'login' | 'signup' | 'logout', success: boolean, method?: string) => {
    trackEvent({
      eventType: success ? action : `${action}_failed` as EventType,
      eventCategory: 'auth',
      eventData: { method, success }
    });
  }, [trackEvent]);

  // Search tracking
  const trackSearch = useCallback((query: string, resultsCount: number) => {
    trackEvent({
      eventType: 'search',
      eventCategory: 'search',
      eventData: { query, results_count: resultsCount }
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackRestaurantView,
    trackFavorite,
    trackMenuItemView,
    trackCategoryClick,
    trackCartAdd,
    trackCartRemove,
    trackCheckoutStart,
    trackCheckoutStep,
    trackCheckoutComplete,
    trackCheckoutAbandon,
    trackAuth,
    trackSearch
  };
};

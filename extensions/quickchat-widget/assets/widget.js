/**
 * QuickChat Widget JavaScript
 * Handles widget interactivity, triggers, business hours, and analytics
 */

(function () {
  'use strict';

  // Prevent double initialization
  if (window.QuickChatInitialized) {
    console.log('[QuickChat] Already initialized, skipping');
    return;
  }
  window.QuickChatInitialized = true;

  // Initialize widget when DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    const widget = document.getElementById('quickchat-widget');

    if (!widget) return;

    const button = widget.querySelector('.quickchat-button');
    const textSpan = widget.querySelector('.quickchat-text');
    const offlineMessageEl = widget.querySelector('.quickchat-offline-message');

    // Get data attributes
    const trigger = widget.dataset.trigger;
    const triggerDelay = parseInt(widget.dataset.triggerDelay, 10) || 3;
    const triggerScroll = parseInt(widget.dataset.triggerScroll, 10) || 25;

    // Business hours settings
    const hasBusinessHours = widget.dataset.businessHours === 'true';
    const hoursStart = widget.dataset.hoursStart || '09:00';
    const hoursEnd = widget.dataset.hoursEnd || '17:00';
    const offlineMessage = widget.dataset.offlineMessage || "We're currently offline";
    const hideWhenOffline = widget.dataset.hideWhenOffline === 'true';

    let isOffline = false;

    // Check business hours
    if (hasBusinessHours) {
      const isOnline = checkBusinessHours(hoursStart, hoursEnd);

      if (!isOnline) {
        console.log('[QuickChat] Outside business hours');
        isOffline = true;

        if (hideWhenOffline) {
          // Hide the entire widget
          widget.style.display = 'none';
          console.log('[QuickChat] Widget hidden (outside business hours)');
          return;
        } else {
          // Show offline state - CSS handles the visual changes
          widget.classList.add('quickchat-offline');

          // For single agent mode - update text span
          if (textSpan) {
            textSpan.textContent = 'Offline';
          }

          // For multi-agent mode - set data attribute for CSS to display
          const agentsList = widget.querySelector('.quickchat-agents-list');
          if (agentsList) {
            agentsList.dataset.offlineMessage = offlineMessage;
          }

          console.log('[QuickChat] Showing offline mode');
        }
      } else {
        console.log('[QuickChat] Within business hours');
      }
    }

    // Handle trigger-based visibility (Pro feature)
    if (trigger && trigger !== 'immediate') {
      // Hide widget initially
      widget.style.opacity = '0';
      widget.style.transform = 'translateY(20px)';
      widget.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

      if (trigger === 'delay') {
        // Show after delay
        setTimeout(function () {
          showWidget(widget);
        }, triggerDelay * 1000);
      } else if (trigger === 'scroll') {
        // Show after scroll percentage
        let hasShown = false;
        window.addEventListener('scroll', function () {
          if (hasShown) return;

          const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
          if (scrollPercent >= triggerScroll) {
            showWidget(widget);
            hasShown = true;
          }
        });
      }
    }

    // Multi-agent mode handling
    const isMultiAgent = widget.dataset.multiAgent === 'true';
    const mainBtn = widget.querySelector('.quickchat-main-btn');

    if (isMultiAgent && mainBtn) {
      // On mobile, toggle agents on tap
      mainBtn.addEventListener('click', function (e) {
        e.preventDefault();
        widget.classList.toggle('agents-open');
        console.log('[QuickChat] Multi-agent toggled');
      });

      // Close when clicking outside
      document.addEventListener('click', function (e) {
        if (!widget.contains(e.target)) {
          widget.classList.remove('agents-open');
        }
      });

      console.log('[QuickChat] Multi-agent mode active');
    }

    // Handle click - for single button, handle offline message on mobile
    if (button && !isMultiAgent) {
      let mobileMessageShown = false;

      button.addEventListener('click', function (e) {
        console.log('[QuickChat] Widget clicked');

        // On mobile, if offline, show message first before redirect
        if (isOffline && isMobile() && offlineMessageEl && !mobileMessageShown) {
          e.preventDefault();
          offlineMessageEl.classList.add('active');
          mobileMessageShown = true;

          // Auto-hide after 3 seconds and allow next click to redirect
          setTimeout(function () {
            offlineMessageEl.classList.remove('active');
            // Next click will redirect
          }, 3000);

          return false;
        }
      });
    }

    console.log('[QuickChat] Widget initialized', trigger ? `with ${trigger} trigger` : '');

    // Context-aware messages (Pro feature)
    if (widget.dataset.contextMessages === 'true') {
      updateContextAwareLinks(widget);
    }

    // Track impression (Pro feature)
    if (widget.dataset.analyticsEnabled === 'true') {
      trackEvent('impression');
    }
  });

  // Update WhatsApp links based on page context
  function updateContextAwareLinks(widget) {
    const productTemplate = widget.dataset.productMessage || '';
    const collectionTemplate = widget.dataset.collectionMessage || '';
    const cartTemplate = widget.dataset.cartMessage || '';
    const defaultMessage = widget.dataset.defaultMessage || '';
    const phone = widget.dataset.phone || '';

    let message = defaultMessage;
    const path = window.location.pathname;

    // Detect page type and get context
    if (path.includes('/products/')) {
      // Product page - get product name
      const productName = getProductName();
      if (productName && productTemplate) {
        message = productTemplate.replace('{{product_name}}', productName);
      }
    } else if (path.includes('/collections/') && !path.includes('/products/')) {
      // Collection page - get collection name
      const collectionName = getCollectionName();
      if (collectionName && collectionTemplate) {
        message = collectionTemplate.replace('{{collection_name}}', collectionName);
      }
    } else if (path.includes('/cart')) {
      // Cart page
      message = cartTemplate || defaultMessage;
    }

    // Update all WhatsApp links
    const encodedMessage = encodeURIComponent(message);
    const newUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

    // Update main button link if exists
    const mainLink = widget.querySelector('.quickchat-button[href]');
    if (mainLink) {
      mainLink.href = newUrl;
    }

    // Update agent links if multi-agent
    const agentLinks = widget.querySelectorAll('.quickchat-agent-btn');
    agentLinks.forEach(link => {
      const originalUrl = new URL(link.href);
      const agentPhone = originalUrl.pathname.replace('/', '');
      link.href = `https://wa.me/${agentPhone}?text=${encodedMessage}`;
    });

    console.log('[QuickChat] Context-aware message applied:', message);
  }

  function getProductName() {
    // Try multiple methods to get product name
    // 1. Try meta tag
    const metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle) return metaTitle.content;

    // 2. Try product title element (common Shopify selectors)
    const productTitle = document.querySelector('.product__title, .product-title, h1.title, [data-product-title]');
    if (productTitle) return productTitle.textContent.trim();

    // 3. Try page title
    const h1 = document.querySelector('h1');
    if (h1) return h1.textContent.trim();

    return null;
  }

  function getCollectionName() {
    // Try multiple methods to get collection name
    // 1. Try meta tag
    const metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle) return metaTitle.content;

    // 2. Try collection title element
    const collectionTitle = document.querySelector('.collection__title, .collection-title, h1.title');
    if (collectionTitle) return collectionTitle.textContent.trim();

    // 3. Try h1
    const h1 = document.querySelector('h1');
    if (h1) return h1.textContent.trim();

    return null;
  }

  function showWidget(widget) {
    widget.style.opacity = '1';
    widget.style.transform = 'translateY(0)';
  }

  function isMobile() {
    return window.innerWidth <= 768 ||
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0);
  }

  function checkBusinessHours(startTime, endTime) {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    // Parse start time
    const [startHour, startMin] = startTime.split(':').map(Number);
    const startInMinutes = startHour * 60 + startMin;

    // Parse end time
    const [endHour, endMin] = endTime.split(':').map(Number);
    const endInMinutes = endHour * 60 + endMin;

    // Check if current time is within business hours
    if (endInMinutes > startInMinutes) {
      // Normal case: start and end on same day
      return currentTimeInMinutes >= startInMinutes && currentTimeInMinutes < endInMinutes;
    } else {
      // Overnight case: e.g., 22:00 to 06:00
      return currentTimeInMinutes >= startInMinutes || currentTimeInMinutes < endInMinutes;
    }
  }

  // Analytics tracking - sends events to Supabase
  function trackEvent(eventType) {
    try {
      const widget = document.getElementById('quickchat-widget');
      if (!widget) return;

      // Get Supabase config from widget data attributes
      const supabaseUrl = widget.dataset.supabaseUrl;
      const supabaseKey = widget.dataset.supabaseKey;

      if (!supabaseUrl || !supabaseKey) {
        console.log('[QuickChat] Analytics not configured');
        return;
      }

      // Get page type from URL
      const path = window.location.pathname;
      let pageType = 'other';
      if (path.includes('/products/')) {
        pageType = 'product';
      } else if (path.includes('/collections/')) {
        pageType = 'collection';
      } else if (path.includes('/cart')) {
        pageType = 'cart';
      } else if (path === '/' || path === '') {
        pageType = 'home';
      }

      // Get shop domain
      const shop = window.location.hostname;

      // Send to Supabase REST API
      fetch(`${supabaseUrl}/rest/v1/analytics_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          shop: shop,
          event_type: eventType,
          page_type: pageType,
          page_path: path
        }),
      }).then(response => {
        if (response.ok) {
          console.log('[QuickChat] Analytics recorded:', eventType, pageType);
        } else {
          console.log('[QuickChat] Analytics failed:', response.status);
        }
      }).catch(err => {
        console.log('[QuickChat] Analytics error:', err);
      });
    } catch (e) {
      console.log('[QuickChat] Analytics exception:', e);
    }
  }

  // Track clicks globally for all widget button types
  let lastClickTime = 0;
  document.addEventListener('click', function (e) {
    const widget = document.getElementById('quickchat-widget');
    if (!widget || widget.dataset.analyticsEnabled !== 'true') return;

    // Debounce - prevent double clicks within 500ms
    const now = Date.now();
    if (now - lastClickTime < 500) {
      console.log('[QuickChat] Click debounced');
      return;
    }

    // Check if clicked on an agent button or the main button link
    const agentBtn = e.target.closest('.quickchat-agent-btn');
    const mainBtn = e.target.closest('.quickchat-button[href]');

    if (agentBtn || mainBtn) {
      lastClickTime = now;
      trackEvent('click');
    }
  });
})();

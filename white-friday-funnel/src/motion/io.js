/* ===================================
   IntersectionObserver Utility
   Lightweight alternative to AOS
   ================================== */

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  threshold: 0.15,
  rootMargin: '0px',
  once: true,
  className: 'is-in',
  animationDelay: 0,
  animationDuration: 300,
  animationEasing: 'ease-out'
};

/**
 * Active observers registry
 */
const observers = new Map();

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ===================================
   1. Core Observe Function
   ================================== */

/**
 * Observe elements and trigger callback when they enter viewport
 * @param {string|Element|NodeList|Array} selector - Elements to observe
 * @param {number|object} thresholdOrOptions - Threshold (0-1) or full options object
 * @param {function} callback - Optional callback function
 * @returns {IntersectionObserver} Observer instance
 */
export function observe(selector, thresholdOrOptions = DEFAULT_CONFIG.threshold, callback = null) {
  // Parse options
  let options = { ...DEFAULT_CONFIG };

  if (typeof thresholdOrOptions === 'number') {
    options.threshold = thresholdOrOptions;
  } else if (typeof thresholdOrOptions === 'object') {
    options = { ...DEFAULT_CONFIG, ...thresholdOrOptions };
  }

  // Get elements
  let elements = [];

  if (typeof selector === 'string') {
    elements = Array.from(document.querySelectorAll(selector));
  } else if (selector instanceof Element) {
    elements = [selector];
  } else if (selector instanceof NodeList || Array.isArray(selector)) {
    elements = Array.from(selector);
  }

  if (elements.length === 0) {
    console.warn('IntersectionObserver: No elements found for selector', selector);
    return null;
  }

  // If reduced motion, immediately add class and skip observer
  if (prefersReducedMotion() && !callback) {
    elements.forEach(el => {
      el.classList.add(options.className);
    });
    return null;
  }

  // Create observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        handleIntersection(entry.target, options, callback, observer);
      } else if (!options.once) {
        handleExit(entry.target, options, callback);
      }
    });
  }, {
    threshold: options.threshold,
    rootMargin: options.rootMargin
  });

  // Observe all elements
  elements.forEach(el => {
    observer.observe(el);

    // Store observer reference
    if (!observers.has(el)) {
      observers.set(el, []);
    }
    observers.get(el).push(observer);
  });

  return observer;
}

/**
 * Handle element entering viewport
 */
function handleIntersection(element, options, callback, observer) {
  // Add class
  element.classList.add(options.className);

  // Apply animation attributes
  if (options.animationDuration) {
    element.style.animationDuration = `${options.animationDuration}ms`;
  }
  if (options.animationDelay) {
    element.style.animationDelay = `${options.animationDelay}ms`;
  }
  if (options.animationEasing) {
    element.style.animationTimingFunction = options.animationEasing;
  }

  // Call custom callback
  if (callback && typeof callback === 'function') {
    callback(element, true);
  }

  // Unobserve if once=true
  if (options.once) {
    observer.unobserve(element);
  }
}

/**
 * Handle element exiting viewport
 */
function handleExit(element, options, callback) {
  // Remove class
  element.classList.remove(options.className);

  // Call custom callback
  if (callback && typeof callback === 'function') {
    callback(element, false);
  }
}

/* ===================================
   2. Unobserve Function
   ================================== */

/**
 * Stop observing element(s)
 * @param {string|Element|NodeList|Array} selector - Elements to unobserve
 */
export function unobserve(selector) {
  let elements = [];

  if (typeof selector === 'string') {
    elements = Array.from(document.querySelectorAll(selector));
  } else if (selector instanceof Element) {
    elements = [selector];
  } else if (selector instanceof NodeList || Array.isArray(selector)) {
    elements = Array.from(selector);
  }

  elements.forEach(el => {
    const elementObservers = observers.get(el);
    if (elementObservers) {
      elementObservers.forEach(observer => {
        observer.unobserve(el);
      });
      observers.delete(el);
    }
  });
}

/* ===================================
   3. Observe with Animation Presets
   ================================== */

/**
 * Observe elements with fade-in animation
 * @param {string|Element|NodeList|Array} selector - Elements to observe
 * @param {object} options - Options
 */
export function observeFadeIn(selector, options = {}) {
  const elements = getElements(selector);

  elements.forEach(el => {
    // Set initial state
    el.style.opacity = '0';
    el.style.transition = `opacity ${options.duration || 300}ms ${options.easing || 'ease-out'}`;
  });

  return observe(selector, {
    ...options,
    className: options.className || 'is-in'
  }, (element, isIntersecting) => {
    if (isIntersecting) {
      element.style.opacity = '1';
    } else {
      element.style.opacity = '0';
    }
  });
}

/**
 * Observe elements with slide-up animation
 * @param {string|Element|NodeList|Array} selector - Elements to observe
 * @param {object} options - Options
 */
export function observeSlideUp(selector, options = {}) {
  const elements = getElements(selector);

  elements.forEach(el => {
    // Set initial state
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity ${options.duration || 300}ms ${options.easing || 'ease-out'}, transform ${options.duration || 300}ms ${options.easing || 'ease-out'}`;
  });

  return observe(selector, {
    ...options,
    className: options.className || 'is-in'
  }, (element, isIntersecting) => {
    if (isIntersecting) {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    } else {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
    }
  });
}

/**
 * Observe elements with scale animation
 * @param {string|Element|NodeList|Array} selector - Elements to observe
 * @param {object} options - Options
 */
export function observeScale(selector, options = {}) {
  const elements = getElements(selector);

  elements.forEach(el => {
    // Set initial state
    el.style.opacity = '0';
    el.style.transform = 'scale(0.95)';
    el.style.transition = `opacity ${options.duration || 300}ms ${options.easing || 'ease-out'}, transform ${options.duration || 300}ms ${options.easing || 'ease-out'}`;
  });

  return observe(selector, {
    ...options,
    className: options.className || 'is-in'
  }, (element, isIntersecting) => {
    if (isIntersecting) {
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
    } else {
      element.style.opacity = '0';
      element.style.transform = 'scale(0.95)';
    }
  });
}

/* ===================================
   4. Staggered Observation
   ================================== */

/**
 * Observe elements with staggered delay
 * @param {string|Element|NodeList|Array} selector - Elements to observe
 * @param {object} options - Options
 */
export function observeStagger(selector, options = {}) {
  const elements = getElements(selector);
  const staggerDelay = options.staggerDelay || 100; // ms between each element

  elements.forEach((el, index) => {
    const delay = index * staggerDelay;

    observe(el, {
      ...options,
      animationDelay: delay
    });
  });
}

/* ===================================
   5. Auto-Initialize from Data Attributes
   ================================== */

/**
 * Initialize observers from data attributes
 * Usage: <div data-observe="fadeIn" data-threshold="0.2">
 */
export function initFromDOM() {
  // Find all elements with data-observe attribute
  const elements = document.querySelectorAll('[data-observe]');

  elements.forEach(el => {
    const animationType = el.getAttribute('data-observe') || 'fadeIn';
    const threshold = parseFloat(el.getAttribute('data-threshold')) || 0.15;
    const once = el.getAttribute('data-once') !== 'false'; // Default true
    const delay = parseInt(el.getAttribute('data-delay')) || 0;
    const duration = parseInt(el.getAttribute('data-duration')) || 300;

    const options = {
      threshold,
      once,
      animationDelay: delay,
      animationDuration: duration
    };

    // Apply appropriate animation
    switch (animationType) {
      case 'fadeIn':
        observeFadeIn(el, options);
        break;
      case 'slideUp':
        observeSlideUp(el, options);
        break;
      case 'scale':
        observeScale(el, options);
        break;
      default:
        observe(el, options);
    }
  });

  console.log(`✨ Initialized ${elements.length} IntersectionObservers from DOM`);
}

/* ===================================
   6. Utility Functions
   ================================== */

/**
 * Get elements from selector
 */
function getElements(selector) {
  if (typeof selector === 'string') {
    return Array.from(document.querySelectorAll(selector));
  } else if (selector instanceof Element) {
    return [selector];
  } else if (selector instanceof NodeList || Array.isArray(selector)) {
    return Array.from(selector);
  }
  return [];
}

/**
 * Disconnect all observers
 */
export function disconnectAll() {
  observers.forEach((observerList, element) => {
    observerList.forEach(observer => {
      observer.disconnect();
    });
  });
  observers.clear();
  console.log('✨ All IntersectionObservers disconnected');
}

/**
 * Get stats about active observers
 */
export function getStats() {
  return {
    totalElements: observers.size,
    totalObservers: Array.from(observers.values()).reduce((sum, list) => sum + list.length, 0)
  };
}

/* ===================================
   7. Advanced: Lazy Loading Images
   ================================== */

/**
 * Lazy load images when they enter viewport
 * Usage: <img data-src="image.jpg" class="lazy">
 * @param {string} selector - Image selector
 */
export function observeLazyImages(selector = 'img[data-src]') {
  const images = document.querySelectorAll(selector);

  observe(images, {
    threshold: 0.01,
    once: true
  }, (img) => {
    const src = img.getAttribute('data-src');
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
      img.classList.add('loaded');
    }
  });

  console.log(`✨ Lazy loading ${images.length} images`);
}

/* ===================================
   8. Advanced: Parallax Effect
   ================================== */

/**
 * Apply parallax effect to elements
 * @param {string|Element|NodeList|Array} selector - Elements
 * @param {number} speed - Parallax speed (0.1 to 1)
 */
export function observeParallax(selector, speed = 0.5) {
  const elements = getElements(selector);

  // Skip if reduced motion
  if (prefersReducedMotion()) return;

  elements.forEach(el => {
    observe(el, {
      threshold: 0,
      once: false
    }, (element, isIntersecting) => {
      if (!isIntersecting) return;

      // Update on scroll
      const updateParallax = () => {
        const rect = element.getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const elementTop = rect.top + scrolled;
        const windowHeight = window.innerHeight;
        const scrollPercent = (scrolled - elementTop + windowHeight) / (windowHeight + rect.height);

        const translateY = (scrollPercent - 0.5) * 100 * speed;

        element.style.transform = `translateY(${translateY}px)`;
      };

      window.addEventListener('scroll', updateParallax, { passive: true });
      updateParallax();
    });
  });
}

/* ===================================
   9. Auto-Initialize
   ================================== */

// Auto-initialize on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFromDOM);
} else {
  initFromDOM();
}

// Export all functions
export default {
  observe,
  unobserve,
  observeFadeIn,
  observeSlideUp,
  observeScale,
  observeStagger,
  observeLazyImages,
  observeParallax,
  initFromDOM,
  disconnectAll,
  getStats
};

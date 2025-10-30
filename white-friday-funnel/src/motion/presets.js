/* ===================================
   Motion Presets & Animation Helpers
   Uses: Motion One (primary), GSAP (card hovers)
   ================================== */

// Check if user prefers reduced motion
const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Get safe duration based on user preference
const getSafeDuration = (duration) => {
  return prefersReducedMotion() ? 0.05 : duration; // 50ms if reduced motion
};

// Check if RTL
const isRTL = () => {
  return document.documentElement.getAttribute('dir') === 'rtl';
};

/* ===================================
   1. Fade In Animation
   ================================== */

/**
 * Fade in animation using Motion One
 * @param {Element|string} el - Element or selector
 * @param {object} options - Animation options
 * @returns {Animation} Motion One animation instance
 */
export function fadeIn(el, options = {}) {
  if (!el) return null;

  const element = typeof el === 'string' ? document.querySelector(el) : el;
  if (!element) return null;

  // Skip animation if reduced motion
  if (prefersReducedMotion()) {
    element.style.opacity = '1';
    return null;
  }

  const {
    duration = 0.3,
    delay = 0,
    easing = 'ease-out',
    ...rest
  } = options;

  // Use Motion One animate
  if (window.animate && typeof window.animate === 'function') {
    return window.animate(
      element,
      { opacity: [0, 1] },
      {
        duration: getSafeDuration(duration),
        delay,
        easing,
        ...rest
      }
    );
  }

  // Fallback: instant opacity
  element.style.opacity = '1';
  return null;
}

/* ===================================
   2. Slide In (RTL-Aware)
   ================================== */

/**
 * Slide in animation, aware of RTL direction
 * @param {Element|string} el - Element or selector
 * @param {string} direction - 'start', 'end', 'up', 'down'
 * @param {object} options - Animation options
 * @returns {Animation} Motion One animation instance
 */
export function slideInX(el, direction = 'start', options = {}) {
  if (!el) return null;

  const element = typeof el === 'string' ? document.querySelector(el) : el;
  if (!element) return null;

  // Skip animation if reduced motion
  if (prefersReducedMotion()) {
    element.style.transform = 'none';
    element.style.opacity = '1';
    return null;
  }

  const {
    duration = 0.3,
    delay = 0,
    easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
    distance = 50,
    ...rest
  } = options;

  // Calculate transform based on direction and RTL
  let translateX = 0;
  let translateY = 0;

  if (direction === 'start') {
    // Start = right in RTL, left in LTR
    translateX = isRTL() ? distance : -distance;
  } else if (direction === 'end') {
    // End = left in RTL, right in LTR
    translateX = isRTL() ? -distance : distance;
  } else if (direction === 'up') {
    translateY = distance;
  } else if (direction === 'down') {
    translateY = -distance;
  }

  // Use Motion One animate
  if (window.animate && typeof window.animate === 'function') {
    return window.animate(
      element,
      {
        transform: [
          `translate(${translateX}px, ${translateY}px)`,
          'translate(0, 0)'
        ],
        opacity: [0, 1]
      },
      {
        duration: getSafeDuration(duration),
        delay,
        easing,
        ...rest
      }
    );
  }

  // Fallback
  element.style.transform = 'none';
  element.style.opacity = '1';
  return null;
}

/* ===================================
   3. Float Glow (Card Hover Effect)
   ================================== */

/**
 * Smooth glow effect on hover using GSAP
 * @param {Element|string} el - Element or selector
 * @param {object} options - Animation options
 */
export function floatGlow(el, options = {}) {
  if (!el) return;

  const element = typeof el === 'string' ? document.querySelector(el) : el;
  if (!element) return;

  // Skip if reduced motion
  if (prefersReducedMotion()) return;

  const {
    glowColor = 'rgba(108, 99, 255, 0.3)',
    scale = 1.02,
    yOffset = -4,
    duration = 0.3,
    ease = 'power2.out'
  } = options;

  // Check if GSAP is available
  if (!window.gsap) {
    console.warn('GSAP not loaded. floatGlow effect skipped.');
    return;
  }

  const gsap = window.gsap;

  // Hover enter
  element.addEventListener('mouseenter', () => {
    gsap.to(element, {
      scale,
      y: yOffset,
      boxShadow: `0 8px 32px ${glowColor}`,
      duration: getSafeDuration(duration),
      ease
    });
  });

  // Hover leave
  element.addEventListener('mouseleave', () => {
    gsap.to(element, {
      scale: 1,
      y: 0,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      duration: getSafeDuration(duration),
      ease
    });
  });
}

/* ===================================
   4. Count Up (Number Tween)
   ================================== */

/**
 * Animate number from start to end value
 * @param {Element|string} el - Element or selector
 * @param {number} from - Starting value
 * @param {number} to - Ending value
 * @param {number} duration - Duration in seconds
 * @param {object} options - Additional options
 * @returns {Animation|null} Animation instance
 */
export function countUp(el, from, to, duration = 0.8, options = {}) {
  if (!el) return null;

  const element = typeof el === 'string' ? document.querySelector(el) : el;
  if (!element) return null;

  const {
    decimals = 0,
    prefix = '',
    suffix = '',
    separator = ',',
    locale = 'ar-SA',
    easing = 'ease-out',
    onUpdate = null,
    onComplete = null
  } = options;

  // Skip animation if reduced motion - show final value immediately
  if (prefersReducedMotion()) {
    const formatted = formatNumber(to, decimals, separator, locale);
    element.textContent = `${prefix}${formatted}${suffix}`;
    if (onComplete) onComplete(to);
    return null;
  }

  // Use Motion One for the tween
  if (window.animate && typeof window.animate === 'function') {
    const obj = { value: from };

    const animation = window.animate(
      obj,
      { value: [from, to] },
      {
        duration: getSafeDuration(duration),
        easing
      }
    );

    // Update on each frame
    const updateInterval = setInterval(() => {
      const currentValue = obj.value;
      const formatted = formatNumber(currentValue, decimals, separator, locale);
      element.textContent = `${prefix}${formatted}${suffix}`;

      if (onUpdate) onUpdate(currentValue);

      // Check if animation is finished
      if (currentValue >= to * 0.99) {
        clearInterval(updateInterval);
        element.textContent = `${prefix}${formatNumber(to, decimals, separator, locale)}${suffix}`;
        if (onComplete) onComplete(to);
      }
    }, 16); // ~60fps

    return animation;
  }

  // Fallback: use requestAnimationFrame
  const startTime = performance.now();
  const safeDuration = getSafeDuration(duration) * 1000; // Convert to ms

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / safeDuration, 1);

    // Easing function (ease-out)
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    const currentValue = from + (to - from) * easedProgress;
    const formatted = formatNumber(currentValue, decimals, separator, locale);
    element.textContent = `${prefix}${formatted}${suffix}`;

    if (onUpdate) onUpdate(currentValue);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      element.textContent = `${prefix}${formatNumber(to, decimals, separator, locale)}${suffix}`;
      if (onComplete) onComplete(to);
    }
  }

  requestAnimationFrame(animate);
  return null;
}

/**
 * Format number with locale and separators
 * @param {number} value - Number to format
 * @param {number} decimals - Decimal places
 * @param {string} separator - Thousands separator
 * @param {string} locale - Locale code
 * @returns {string} Formatted number
 */
function formatNumber(value, decimals = 0, separator = ',', locale = 'ar-SA') {
  // Use Intl.NumberFormat for proper Arabic number formatting
  try {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: separator !== ''
    });
    return formatter.format(value);
  } catch (e) {
    // Fallback
    return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  }
}

/* ===================================
   5. Stagger Animation
   ================================== */

/**
 * Stagger animation for multiple elements
 * @param {NodeList|Array|string} elements - Elements to animate
 * @param {function} animationFn - Animation function (fadeIn, slideInX, etc.)
 * @param {object} options - Animation options
 */
export function stagger(elements, animationFn, options = {}) {
  let elementList;

  if (typeof elements === 'string') {
    elementList = document.querySelectorAll(elements);
  } else if (elements instanceof NodeList || Array.isArray(elements)) {
    elementList = elements;
  } else {
    return;
  }

  const {
    delay = 0,
    staggerDelay = 0.1,
    ...animOptions
  } = options;

  elementList.forEach((el, index) => {
    const totalDelay = delay + (index * staggerDelay);
    animationFn(el, { ...animOptions, delay: totalDelay });
  });
}

/* ===================================
   6. Scroll Reveal
   ================================== */

/**
 * Reveal elements on scroll (alternative to AOS)
 * @param {Element|string} el - Element or selector
 * @param {object} options - Animation options
 */
export function scrollReveal(el, options = {}) {
  if (!el) return;

  const element = typeof el === 'string' ? document.querySelector(el) : el;
  if (!element) return;

  // Skip if reduced motion
  if (prefersReducedMotion()) {
    element.style.opacity = '1';
    element.classList.add('is-in');
    return;
  }

  const {
    threshold = 0.15,
    animationFn = fadeIn,
    once = true,
    ...animOptions
  } = options;

  // Set initial state
  element.style.opacity = '0';

  // Create observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Animate element
        animationFn(element, animOptions);
        element.classList.add('is-in');

        // Unobserve if once=true
        if (once) {
          observer.unobserve(element);
        }
      } else if (!once) {
        element.classList.remove('is-in');
      }
    });
  }, { threshold });

  observer.observe(element);
}

/* ===================================
   7. Pulse Animation
   ================================== */

/**
 * Pulse animation (for attention-grabbing)
 * @param {Element|string} el - Element or selector
 * @param {object} options - Animation options
 */
export function pulse(el, options = {}) {
  if (!el) return;

  const element = typeof el === 'string' ? document.querySelector(el) : el;
  if (!element) return;

  // Skip if reduced motion
  if (prefersReducedMotion()) return;

  const {
    scale = 1.05,
    duration = 0.5,
    iterations = 3,
    easing = 'ease-in-out'
  } = options;

  if (window.animate && typeof window.animate === 'function') {
    window.animate(
      element,
      {
        transform: ['scale(1)', `scale(${scale})`, 'scale(1)']
      },
      {
        duration: getSafeDuration(duration),
        iterations,
        easing
      }
    );
  }
}

/* ===================================
   8. Shake Animation (Error States)
   ================================== */

/**
 * Shake animation for error feedback
 * @param {Element|string} el - Element or selector
 * @param {object} options - Animation options
 */
export function shake(el, options = {}) {
  if (!el) return;

  const element = typeof el === 'string' ? document.querySelector(el) : el;
  if (!element) return;

  // Skip if reduced motion
  if (prefersReducedMotion()) {
    // Just flash red border
    element.style.borderColor = 'red';
    setTimeout(() => {
      element.style.borderColor = '';
    }, 200);
    return;
  }

  const {
    distance = 10,
    duration = 0.4,
    easing = 'ease-in-out'
  } = options;

  if (window.animate && typeof window.animate === 'function') {
    window.animate(
      element,
      {
        transform: [
          'translateX(0)',
          `translateX(-${distance}px)`,
          `translateX(${distance}px)`,
          `translateX(-${distance}px)`,
          `translateX(${distance}px)`,
          'translateX(0)'
        ]
      },
      {
        duration: getSafeDuration(duration),
        easing
      }
    );
  }
}

/* ===================================
   9. Initialize All Animations
   ================================== */

/**
 * Initialize animations on page load
 */
export function initMotionPresets() {
  // Auto-apply scroll reveal to elements with data-reveal attribute
  document.querySelectorAll('[data-reveal]').forEach(el => {
    const animationType = el.getAttribute('data-reveal') || 'fadeIn';
    const delay = parseFloat(el.getAttribute('data-delay')) || 0;

    let animationFn = fadeIn;
    if (animationType === 'slideInX') {
      animationFn = (element, opts) => slideInX(element, 'start', opts);
    }

    scrollReveal(el, { animationFn, delay });
  });

  // Auto-apply float glow to cards with data-glow attribute
  document.querySelectorAll('[data-glow]').forEach(el => {
    floatGlow(el);
  });

  console.log('✨ Motion presets initialized');
}

// Auto-initialize on DOMContentLoaded if not already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMotionPresets);
} else {
  initMotionPresets();
}

// Export utility functions
export {
  prefersReducedMotion,
  getSafeDuration,
  isRTL,
  formatNumber
};

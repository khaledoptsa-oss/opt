// ===================================
// Lightweight Icon System
// Inline SVG with minimal paths
// ===================================

const iconPaths = {
  check: 'M20 6L9 17l-5-5',
  chevron: 'M9 18l6-6-6-6',
  sparkle: 'M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z',
  building: 'M3 21h18M5 21V7l8-4v18M19 21V10l-6-3',
  map: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z',
  help: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 17v.01M12 13.5a1.5 1.5 0 011.5-1.5 1.5 1.5 0 11-1.5 1.5v1.5',
  gift: 'M20 12v10H4V12M2 7h20v5H2V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z',
  phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  message: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z',
  lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
  x: 'M18 6L6 18M6 6l12 12',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  lightbulb: 'M15 18v3H9v-3M12 2v1M4.22 4.22l.707.707M1 12h1M4.22 19.78l.707-.707M18.36 5.64l.707-.707M23 12h-1M18.36 18.36l.707.707M9 21h6M12 7a5 5 0 013 9v2H9v-2a5 5 0 013-9z',
  info: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  calendar: 'M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18',
  trendingUp: 'M23 6l-9.5 9.5-5-5L1 18M23 6h-7M23 6v7',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M13 7a4 4 0 11-8 0 4 4 0 018 0zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75'
};

/**
 * Generate inline SVG icon
 * @param {string} name - Icon name from iconPaths
 * @param {object} attrs - Additional attributes (class, style, etc.)
 * @returns {string} SVG markup
 */
export function Icon(name, attrs = {}) {
  const path = iconPaths[name];
  if (!path) {
    console.warn(`Icon "${name}" not found`);
    return '';
  }

  const {
    size = 24,
    className = '',
    strokeWidth = 2,
    color = 'currentColor',
    fill = 'none',
    ...rest
  } = attrs;

  const attrString = Object.entries(rest)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  return `
    <svg
      width="${size}"
      height="${size}"
      viewBox="0 0 24 24"
      fill="${fill}"
      stroke="${color}"
      stroke-width="${strokeWidth}"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon ${className}"
      aria-hidden="true"
      ${attrString}
    >
      <path d="${path}" />
    </svg>
  `.trim();
}

/**
 * Get icon as DOM element
 * @param {string} name - Icon name
 * @param {object} attrs - Attributes
 * @returns {Element} SVG element
 */
export function IconElement(name, attrs = {}) {
  const div = document.createElement('div');
  div.innerHTML = Icon(name, attrs);
  return div.firstElementChild;
}

/**
 * Common icon presets
 */
export const Icons = {
  check: (attrs) => Icon('check', { className: 'icon-check', ...attrs }),
  chevron: (attrs) => Icon('chevron', { className: 'icon-chevron flip-on-rtl', ...attrs }),
  sparkle: (attrs) => Icon('sparkle', { className: 'icon-sparkle', ...attrs }),
  info: (attrs) => Icon('info', { className: 'icon-info', ...attrs }),
  help: (attrs) => Icon('help', { className: 'icon-help', ...attrs })
};

// Make available globally
if (typeof window !== 'undefined') {
  window.Icon = Icon;
  window.IconElement = IconElement;
  window.Icons = Icons;
}

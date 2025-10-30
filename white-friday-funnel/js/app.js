// ===================================
// White Friday Funnel App
// ===================================

// Global State
const AppState = {
  data: null,
  currentStep: 0,
  selectedSector: null,
  answers: {},
  selectedBundles: [],
  billingPeriod: 'm1',
  isLoading: false
};

// Constants
const WHATSAPP_NUMBER = '966569269336';
const STORAGE_KEY = 'whiteFridayFunnelState';

// ===================================
// Data Loading
// ===================================
async function loadSectorsData() {
  try {
    showLoading(true);
    const response = await fetch('./data/sectors.json');
    if (!response.ok) throw new Error('فشل تحميل البيانات');
    AppState.data = await response.json();
    restoreState();
    initApp();
  } catch (error) {
    showToast('حدث خطأ في تحميل البيانات. يرجى إعادة تحميل الصفحة.', 'error');
    console.error(error);
  } finally {
    showLoading(false);
  }
}

// ===================================
// Initialization
// ===================================
function initApp() {
  renderSectorSelection();
  setupEventListeners();
  updateStepper();
}

function setupEventListeners() {
  // Language toggle
  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', toggleLanguage);
  }

  // CTA buttons
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      scrollToElement('funnel-container');
    });
  }

  // WhatsApp CTA
  const whatsappBtn = document.getElementById('whatsappBtn');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', sendToWhatsApp);
  }

  // Book Call CTA
  const bookCallBtn = document.getElementById('bookCallBtn');
  if (bookCallBtn) {
    bookCallBtn.addEventListener('click', () => {
      window.open('https://calendly.com/optarget', '_blank');
    });
  }

  // Download PDF
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', generatePDF);
  }

  // Billing period change
  const billingPeriodSelect = document.getElementById('billingPeriod');
  if (billingPeriodSelect) {
    billingPeriodSelect.addEventListener('change', (e) => {
      AppState.billingPeriod = e.target.value;
      updatePricingDisplay();
      saveState();
    });
  }
}

// ===================================
// Step Navigation
// ===================================
function goToStep(step) {
  AppState.currentStep = step;
  updateStepper();

  switch(step) {
    case 0:
      renderSectorSelection();
      break;
    case 1:
      renderCitySelection();
      break;
    case 2:
      renderQuestionsStep();
      break;
    case 3:
      renderBundlesStep();
      break;
  }

  saveState();
  scrollToElement('funnel-container');
}

function nextStep() {
  if (AppState.currentStep < 3) {
    goToStep(AppState.currentStep + 1);
  }
}

function previousStep() {
  if (AppState.currentStep > 0) {
    goToStep(AppState.currentStep - 1);
  }
}

// ===================================
// Stepper UI
// ===================================
function updateStepper() {
  const steps = [
    { label: 'اختر مجالك', icon: '🎯' },
    { label: 'اختر مدينتك', icon: '📍' },
    { label: 'معلومات إضافية', icon: '❓' },
    { label: 'الباقات المقترحة', icon: '🎁' }
  ];

  const stepperContainer = document.getElementById('stepper');
  if (!stepperContainer) return;

  stepperContainer.innerHTML = steps.map((step, index) => {
    const isActive = index === AppState.currentStep;
    const isCompleted = index < AppState.currentStep;
    const statusClass = isActive ? 'active' : isCompleted ? 'completed' : 'pending';

    return `
      <div class="step-item ${statusClass}" data-step="${index}">
        <div class="step-number">${isCompleted ? '✓' : step.icon}</div>
        <div class="step-label">${step.label}</div>
      </div>
    `;
  }).join('');
}

// ===================================
// Step 1: Sector Selection
// ===================================
function renderSectorSelection() {
  const container = document.getElementById('step-content');
  if (!container) return;

  const sectors = AppState.data.sectors;

  container.innerHTML = `
    <div class="step-container animate-fade-in">
      <h2 class="text-center mb-lg">اختر مجال نشاطك</h2>
      <p class="text-center text-secondary mb-xl">ابدأ بخطوة ذكية واختر المجال المناسب</p>

      <div class="sector-grid">
        ${sectors.map(sector => `
          <div class="sector-card card" data-sector="${sector.id}" role="button" tabindex="0" aria-label="اختر ${sector.label}">
            <div class="sector-icon">${sector.icon}</div>
            <h3>${sector.label}</h3>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Add click handlers
  const sectorCards = container.querySelectorAll('.sector-card');
  sectorCards.forEach(card => {
    card.addEventListener('click', () => selectSector(card.dataset.sector));
    card.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        selectSector(card.dataset.sector);
      }
    });
  });
}

function selectSector(sectorId) {
  AppState.selectedSector = AppState.data.sectors.find(s => s.id === sectorId);
  AppState.answers = {};
  AppState.selectedBundles = [];
  nextStep();
}

// ===================================
// Step 2: City Selection
// ===================================
function renderCitySelection() {
  const container = document.getElementById('step-content');
  if (!container || !AppState.selectedSector) return;

  const cityQuestion = AppState.selectedSector.questions.find(q => q.id === 'city');
  if (!cityQuestion) {
    nextStep();
    return;
  }

  container.innerHTML = `
    <div class="step-container animate-fade-in">
      <h2 class="text-center mb-lg">${cityQuestion.label}</h2>
      <p class="text-center text-secondary mb-xl">اختر المدينة التي يعمل فيها نشاطك</p>

      <div class="city-grid">
        ${cityQuestion.options.map(city => `
          <div class="city-card card" data-city="${city}" role="button" tabindex="0" aria-label="اختر ${city}">
            <div class="city-icon">📍</div>
            <h3>${city}</h3>
          </div>
        `).join('')}
      </div>

      <div class="nav-buttons">
        <button class="btn btn-outline" onclick="previousStep()">
          السابق
        </button>
      </div>
    </div>
  `;

  // Add click handlers
  const cityCards = container.querySelectorAll('.city-card');
  cityCards.forEach(card => {
    card.addEventListener('click', () => selectCity(card.dataset.city));
    card.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        selectCity(card.dataset.city);
      }
    });
  });
}

function selectCity(city) {
  AppState.answers.city = city;
  nextStep();
}

// ===================================
// Step 3: Additional Questions
// ===================================
function renderQuestionsStep() {
  const container = document.getElementById('step-content');
  if (!container || !AppState.selectedSector) return;

  const questions = AppState.selectedSector.questions.filter(q => q.type === 'boolean');

  if (questions.length === 0) {
    nextStep();
    return;
  }

  container.innerHTML = `
    <div class="step-container animate-fade-in">
      <h2 class="text-center mb-lg">معلومات إضافية</h2>
      <p class="text-center text-secondary mb-xl">ساعدنا نعرف وضعك الحالي لنقترح الأنسب</p>

      <div class="questions-container">
        ${questions.map(q => `
          <div class="question-card card">
            <h3 class="mb-md">${q.label}</h3>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" name="${q.id}" value="true" ${AppState.answers[q.id] === true ? 'checked' : ''}>
                <span>نعم</span>
              </label>
              <label class="radio-option">
                <input type="radio" name="${q.id}" value="false" ${AppState.answers[q.id] === false ? 'checked' : ''}>
                <span>لا</span>
              </label>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="nav-buttons">
        <button class="btn btn-outline" onclick="previousStep()">السابق</button>
        <button class="btn btn-primary" onclick="submitQuestions()">التالي</button>
      </div>
    </div>
  `;

  // Add change handlers
  questions.forEach(q => {
    const radios = container.querySelectorAll(`input[name="${q.id}"]`);
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        AppState.answers[q.id] = e.target.value === 'true';
        saveState();
      });
    });
  });
}

function submitQuestions() {
  nextStep();
}

// ===================================
// Step 4: Bundles Selection
// ===================================
function renderBundlesStep() {
  const container = document.getElementById('step-content');
  if (!container || !AppState.selectedSector) return;

  const bundles = AppState.selectedSector.bundles;
  const hookBundle = bundles.find(b => b.id === 'hook');

  // Auto-select hook bundle if not selected
  if (!AppState.selectedBundles.includes(hookBundle.id)) {
    AppState.selectedBundles = [hookBundle.id];
  }

  container.innerHTML = `
    <div class="step-container animate-fade-in">
      <h2 class="text-center mb-md">الباقات المقترحة لك</h2>
      <p class="text-center text-secondary mb-lg">ابدأ بالباقة الأساسية وارفع توفيرك بإضافة المزيد</p>

      <!-- Savings Bar -->
      <div id="savingsBar" class="savings-bar"></div>

      <!-- Billing Period Selector -->
      <div class="billing-selector card mb-lg">
        <h3 class="mb-md">مدة الفوترة</h3>
        <p class="text-secondary mb-md">التزام أطول = توفير أكبر</p>
        <select id="billingPeriod" class="billing-select">
          <option value="m1">شهر واحد</option>
          <option value="m3">3 أشهر - وفر 10%</option>
          <option value="m6">6 أشهر - وفر 18%</option>
          <option value="y12">12 شهر - وفر 35%</option>
        </select>
      </div>

      <!-- Bundles Grid -->
      <div class="bundles-grid" id="bundlesGrid">
        ${renderBundleCards(bundles)}
      </div>

      <!-- Pricing Summary -->
      <div id="pricingSummary" class="pricing-summary card card-highlight"></div>

      <!-- CTA Buttons -->
      <div class="cta-buttons">
        <button class="btn btn-accent btn-lg" id="whatsappBtn">
          <span>أكمل عبر واتساب الآن</span>
          <span>💬</span>
        </button>
        <button class="btn btn-outline btn-lg" id="downloadPdfBtn">
          <span>تحميل العرض PDF</span>
          <span>📄</span>
        </button>
        <button class="btn btn-primary" id="bookCallBtn">
          <span>احجز مكالمة مع مستشار</span>
          <span>📞</span>
        </button>
      </div>

      <div class="nav-buttons">
        <button class="btn btn-outline" onclick="previousStep()">السابق</button>
      </div>
    </div>
  `;

  setupBundlesEventListeners();
  updatePricingDisplay();
}

function renderBundleCards(bundles) {
  return bundles.map((bundle, index) => {
    const isSelected = AppState.selectedBundles.includes(bundle.id);
    const isHook = bundle.id === 'hook';
    const isLocked = !isHook && !isBundleUnlocked(bundle);

    return `
      <div class="bundle-card card ${isSelected ? 'card-highlight selected' : ''} ${isLocked ? 'locked' : ''}"
           data-bundle-id="${bundle.id}"
           style="animation-delay: ${index * 0.1}s">
        ${bundle.badge ? `<span class="badge">${bundle.badge}</span>` : ''}
        ${isLocked ? '<div class="lock-icon">🔒</div>' : ''}

        <h3 class="mb-sm">${bundle.title}</h3>
        <div class="bundle-price mb-md">
          <span class="price-amount">${formatPrice(bundle.monthly)}</span>
          <span class="price-period">/ شهر</span>
        </div>

        <ul class="bundle-features mb-md">
          ${bundle.features.map(f => `<li>✓ ${f}</li>`).join('')}
        </ul>

        ${isHook ? `
          <button class="btn btn-primary btn-sm" disabled>محددة تلقائياً</button>
        ` : isLocked ? `
          <button class="btn btn-outline btn-sm" disabled>غير متاحة حالياً</button>
        ` : `
          <button class="btn ${isSelected ? 'btn-accent' : 'btn-primary'} btn-sm"
                  onclick="toggleBundle('${bundle.id}')">
            ${isSelected ? 'إلغاء الاختيار' : 'أضف للتوفير'}
          </button>
        `}
      </div>
    `;
  }).join('');
}

function isBundleUnlocked(bundle) {
  if (bundle.id === 'hook') return true;

  const bundles = AppState.selectedSector.bundles;

  for (const selectedId of AppState.selectedBundles) {
    const selectedBundle = bundles.find(b => b.id === selectedId);
    if (selectedBundle && selectedBundle.unlocks && selectedBundle.unlocks.includes(bundle.id)) {
      return true;
    }
  }

  return false;
}

function toggleBundle(bundleId) {
  const index = AppState.selectedBundles.indexOf(bundleId);

  if (index > -1) {
    // Remove bundle and any dependent bundles
    AppState.selectedBundles.splice(index, 1);
    removeLockedBundles();
  } else {
    // Add bundle
    AppState.selectedBundles.push(bundleId);
  }

  saveState();
  renderBundlesStep();
}

function removeLockedBundles() {
  const bundles = AppState.selectedSector.bundles;
  AppState.selectedBundles = AppState.selectedBundles.filter(id => {
    const bundle = bundles.find(b => b.id === id);
    return bundle && (bundle.id === 'hook' || isBundleUnlocked(bundle));
  });
}

function setupBundlesEventListeners() {
  const billingSelect = document.getElementById('billingPeriod');
  if (billingSelect) {
    billingSelect.value = AppState.billingPeriod;
    billingSelect.addEventListener('change', (e) => {
      AppState.billingPeriod = e.target.value;
      updatePricingDisplay();
      saveState();
    });
  }

  const whatsappBtn = document.getElementById('whatsappBtn');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', sendToWhatsApp);
  }

  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', generatePDF);
  }

  const bookCallBtn = document.getElementById('bookCallBtn');
  if (bookCallBtn) {
    bookCallBtn.addEventListener('click', () => {
      window.open('https://calendly.com/optarget', '_blank');
    });
  }
}

// ===================================
// Pricing Calculations
// ===================================
function calculatePricing() {
  const bundles = AppState.selectedSector.bundles;
  const selectedBundlesData = AppState.selectedBundles
    .map(id => bundles.find(b => b.id === id))
    .filter(Boolean);

  const monthlyTotal = selectedBundlesData.reduce((sum, b) => sum + b.monthly, 0);

  const discount = AppState.data.billing_discounts[AppState.billingPeriod] || 0;
  const periodMonths = getPeriodMonths(AppState.billingPeriod);

  const subtotal = monthlyTotal * periodMonths;
  const discountAmount = subtotal * discount;
  const total = subtotal - discountAmount;

  return {
    monthlyTotal,
    periodMonths,
    subtotal,
    discount,
    discountAmount,
    total,
    bundlesCount: selectedBundlesData.length
  };
}

function getPeriodMonths(period) {
  const map = { m1: 1, m3: 3, m6: 6, y12: 12 };
  return map[period] || 1;
}

function getPeriodLabel(period) {
  const map = {
    m1: 'شهر واحد',
    m3: '3 أشهر',
    m6: '6 أشهر',
    y12: '12 شهر'
  };
  return map[period] || 'شهر واحد';
}

function updatePricingDisplay() {
  const pricing = calculatePricing();

  // Update Savings Bar
  updateSavingsBar(pricing);

  // Update Pricing Summary
  updatePricingSummary(pricing);
}

function updateSavingsBar(pricing) {
  const savingsBar = document.getElementById('savingsBar');
  if (!savingsBar) return;

  const savingsPercent = (pricing.discount * 100).toFixed(0);
  const progressWidth = Math.min((pricing.bundlesCount / 4) * 100, 100);

  savingsBar.innerHTML = `
    <div class="savings-content">
      <div class="savings-label">
        <span>💰 توفيرك الحالي</span>
        ${pricing.discountAmount > 0 ? `<span class="savings-badge">${savingsPercent}%</span>` : ''}
      </div>
      <div class="savings-amount text-gradient-accent">${formatPrice(pricing.discountAmount)}</div>
    </div>
    <div class="savings-progress">
      <div class="savings-progress-bar" style="width: ${progressWidth}%"></div>
    </div>
    <p class="savings-hint">أضف المزيد من الخدمات لزيادة التوفير</p>
  `;
}

function updatePricingSummary(pricing) {
  const summary = document.getElementById('pricingSummary');
  if (!summary) return;

  summary.innerHTML = `
    <h3 class="mb-md">ملخص العرض</h3>
    <div class="pricing-breakdown">
      <div class="pricing-row">
        <span>عدد الخدمات:</span>
        <span class="font-bold">${pricing.bundlesCount}</span>
      </div>
      <div class="pricing-row">
        <span>المدة:</span>
        <span class="font-bold">${getPeriodLabel(AppState.billingPeriod)}</span>
      </div>
      <div class="pricing-row">
        <span>السعر قبل الخصم:</span>
        <span class="font-bold">${formatPrice(pricing.subtotal)}</span>
      </div>
      ${pricing.discountAmount > 0 ? `
        <div class="pricing-row success">
          <span>التوفير:</span>
          <span class="font-bold text-gradient-success">- ${formatPrice(pricing.discountAmount)}</span>
        </div>
      ` : ''}
      <div class="pricing-divider"></div>
      <div class="pricing-row total">
        <span>الإجمالي:</span>
        <span class="font-bold text-gradient-primary">${formatPrice(pricing.total)}</span>
      </div>
    </div>
  `;
}

// ===================================
// WhatsApp Integration
// ===================================
function sendToWhatsApp() {
  const pricing = calculatePricing();
  const bundles = AppState.selectedSector.bundles;
  const selectedBundlesData = AppState.selectedBundles
    .map(id => bundles.find(b => b.id === id))
    .filter(Boolean);

  const bundlesTitles = selectedBundlesData.map(b => b.title).join('\n  • ');

  const message = `مرحباً فريق الهدف الأمثل،

أود الاستفسار عن عرض الجمعة البيضاء:

📋 التفاصيل:
• النشاط: ${AppState.selectedSector.label}
• المدينة: ${AppState.answers.city || 'غير محدد'}
• مدة التعاقد: ${getPeriodLabel(AppState.billingPeriod)}

🎁 الخدمات المختارة:
  • ${bundlesTitles}

💰 الأسعار:
• السعر قبل التوفير: ${formatPrice(pricing.subtotal)}
• التوفير: ${formatPrice(pricing.discountAmount)}
• الإجمالي بعد الخصم: ${formatPrice(pricing.total)}

أود إتمام العرض أو التحدث مع مستشار.`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
}

// ===================================
// PDF Generation (Placeholder)
// ===================================
function generatePDF() {
  showToast('جاري تجهيز ملف PDF...', 'info');

  // This will be implemented in pdf.js
  if (typeof window.generateOfferPDF === 'function') {
    const pricing = calculatePricing();
    const bundles = AppState.selectedSector.bundles;
    const selectedBundlesData = AppState.selectedBundles
      .map(id => bundles.find(b => b.id === id))
      .filter(Boolean);

    const data = {
      sector: AppState.selectedSector.label,
      city: AppState.answers.city,
      bundles: selectedBundlesData,
      period: getPeriodLabel(AppState.billingPeriod),
      pricing
    };

    window.generateOfferPDF(data);
  } else {
    showToast('ميزة PDF قريباً!', 'warning');
  }
}

// ===================================
// State Management
// ===================================
function saveState() {
  const state = {
    currentStep: AppState.currentStep,
    selectedSector: AppState.selectedSector?.id,
    answers: AppState.answers,
    selectedBundles: AppState.selectedBundles,
    billingPeriod: AppState.billingPeriod
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving state:', e);
  }
}

function restoreState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const state = JSON.parse(saved);

    if (state.selectedSector) {
      AppState.selectedSector = AppState.data.sectors.find(s => s.id === state.selectedSector);
    }

    AppState.currentStep = state.currentStep || 0;
    AppState.answers = state.answers || {};
    AppState.selectedBundles = state.selectedBundles || [];
    AppState.billingPeriod = state.billingPeriod || 'm1';
  } catch (e) {
    console.error('Error restoring state:', e);
  }
}

function resetState() {
  AppState.currentStep = 0;
  AppState.selectedSector = null;
  AppState.answers = {};
  AppState.selectedBundles = [];
  AppState.billingPeriod = 'm1';

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing state:', e);
  }

  initApp();
}

// ===================================
// UI Utilities
// ===================================
function formatPrice(amount) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' ر.س';
}

function scrollToElement(id) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function showLoading(show) {
  AppState.isLoading = show;
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = show ? 'flex' : 'none';
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} animate-slide-in-left`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function toggleLanguage() {
  showToast('ميزة تبديل اللغة قريباً!', 'info');
}

// ===================================
// Initialize on DOM Load
// ===================================
document.addEventListener('DOMContentLoaded', () => {
  loadSectorsData();
});

// Export functions for global access
window.previousStep = previousStep;
window.nextStep = nextStep;
window.submitQuestions = submitQuestions;
window.toggleBundle = toggleBundle;
window.resetState = resetState;

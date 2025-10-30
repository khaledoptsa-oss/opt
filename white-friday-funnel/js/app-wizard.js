// ===================================
// White Friday Funnel - Wizard Version
// 5-Stage Strict Wizard with BenefitChat
// ===================================

// ===================================
// Global State
// ===================================
const WizardState = {
  // Data
  sectors: null,
  cities: null,
  probes: null,
  explainers: null,

  // Current stage (0-4)
  currentStage: 0,

  // User selections
  sector: null,
  customSector: null,
  city: null,
  customCity: null,
  probeAnswers: {},
  selectedBundles: [],
  billingPeriod: 'm1',

  // UI state
  isLoading: false,
  validationErrors: {}
};

// Constants
const WHATSAPP_NUMBER = '966569269336';
const STORAGE_KEY = 'wizardFunnelState';
const TOTAL_STAGES = 5;
const SEARCH_DEBOUNCE_MS = 150;

// Event emitter for BenefitChat
const Events = {
  listeners: {},

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
};

// ===================================
// Data Loading
// ===================================
async function loadAllData() {
  try {
    showLoading(true);

    const [sectors, cities, probes, explainers] = await Promise.all([
      fetch('./data/sectors.json').then(r => r.json()),
      fetch('./data/cities-sa.json').then(r => r.json()),
      fetch('./data/probes.json').then(r => r.json()),
      fetch('./data/explainers.json').then(r => r.json())
    ]);

    WizardState.sectors = sectors;
    WizardState.cities = cities;
    WizardState.probes = probes;
    WizardState.explainers = explainers;

    restoreState();
    initWizard();

  } catch (error) {
    showToast('حدث خطأ في تحميل البيانات', 'error');
    console.error(error);
  } finally {
    showLoading(false);
  }
}

// ===================================
// Initialization
// ===================================
function initWizard() {
  setupGlobalEventListeners();
  initBenefitChat();
  renderCurrentStage();
  updateStageProgress();
}

function setupGlobalEventListeners() {
  // Start button in hero
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      goToStage(0);
      scrollToElement('wizard-container');
    });
  }
}

// ===================================
// Stage Navigation
// ===================================
function goToStage(stage) {
  if (stage < 0 || stage >= TOTAL_STAGES) return;

  // Validate current stage before moving forward
  if (stage > WizardState.currentStage) {
    if (!validateCurrentStage()) {
      return;
    }
  }

  WizardState.currentStage = stage;
  renderCurrentStage();
  updateStageProgress();
  saveState();

  // Emit event for BenefitChat
  Events.emit('stageChange', { stage, state: WizardState });

  scrollToElement('wizard-container');
}

function nextStage() {
  if (validateCurrentStage()) {
    goToStage(WizardState.currentStage + 1);
  }
}

function previousStage() {
  goToStage(WizardState.currentStage - 1);
}

// ===================================
// Stage Rendering
// ===================================
function renderCurrentStage() {
  const container = document.getElementById('wizard-content');
  if (!container) return;

  // Add slide transition
  container.classList.add('stage-exit');

  setTimeout(() => {
    switch (WizardState.currentStage) {
      case 0:
        renderStage1_Sector(container);
        break;
      case 1:
        renderStage2_City(container);
        break;
      case 2:
        renderStage3_Probe(container);
        break;
      case 3:
        renderStage4_Offers(container);
        break;
      case 4:
        renderStage5_Recap(container);
        break;
    }

    container.classList.remove('stage-exit');
    container.classList.add('stage-enter');

    setTimeout(() => {
      container.classList.remove('stage-enter');
    }, 300);

  }, 250);
}

// ===================================
// STAGE 1: Sector Selection
// ===================================
function renderStage1_Sector(container) {
  const sectors = WizardState.sectors.sectors;

  container.innerHTML = `
    <div class="wizard-stage">
      <h2 class="stage-title">اختر مجال نشاطك</h2>
      <p class="stage-subtitle">سنقترح الباقات الأنسب لقطاعك</p>

      <div class="sector-list">
        ${sectors.map(sector => `
          <div class="sector-option ${WizardState.sector === sector.id ? 'selected' : ''}"
               data-sector="${sector.id}"
               role="button"
               tabindex="0">
            <div class="sector-icon">${sector.icon}</div>
            <div class="sector-info">
              <h3>${sector.label}</h3>
              <p>${getSectorDescription(sector.id)}</p>
            </div>
            <div class="sector-check">✓</div>
          </div>
        `).join('')}

        <div class="sector-option ${WizardState.sector === 'other' ? 'selected' : ''}"
             data-sector="other"
             role="button"
             tabindex="0">
          <div class="sector-icon">📋</div>
          <div class="sector-info">
            <h3>أخرى</h3>
            <p>مجال نشاط مختلف</p>
          </div>
          <div class="sector-check">✓</div>
        </div>
      </div>

      ${WizardState.sector === 'other' ? `
        <div class="custom-input-wrapper animate-fade-in">
          <label>اكتب مجال نشاطك</label>
          <input type="text"
                 id="customSectorInput"
                 class="custom-input"
                 placeholder="مثال: صالون تجميل، مغسلة سيارات..."
                 value="${WizardState.customSector || ''}"
                 autofocus>
        </div>
      ` : ''}

      <div class="stage-nav">
        <button class="btn btn-primary btn-lg"
                onclick="nextStage()"
                ${!isStage1Valid() ? 'disabled' : ''}>
          التالي
        </button>
      </div>
    </div>
  `;

  // Add event listeners
  container.querySelectorAll('.sector-option').forEach(el => {
    el.addEventListener('click', () => selectSector(el.dataset.sector));
    el.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        selectSector(el.dataset.sector);
      }
    });
  });

  // Custom sector input
  if (WizardState.sector === 'other') {
    const input = document.getElementById('customSectorInput');
    if (input) {
      input.addEventListener('input', (e) => {
        WizardState.customSector = e.target.value;
        updateStageNavigation();
        saveState();
      });
    }
  }
}

function selectSector(sectorId) {
  WizardState.sector = sectorId;

  // Reset if switching away from other
  if (sectorId !== 'other') {
    WizardState.customSector = null;
  }

  // Reset subsequent stages
  WizardState.probeAnswers = {};
  WizardState.selectedBundles = [];

  renderStage1_Sector(document.getElementById('wizard-content'));
  Events.emit('sectorSelected', { sector: sectorId });
}

function getSectorDescription(sectorId) {
  const descriptions = {
    'restaurants': 'مطاعم ومقاهي وخدمات ضيافة',
    'clinics': 'عيادات ومراكز طبية',
    'recruitment': 'مكاتب استقدام وتوظيف',
    'realestate': 'عقارات ووساطة عقارية',
    'contracting': 'مقاولات وإنشاءات',
    'ecommerce': 'متاجر إلكترونية وتجارة رقمية'
  };
  return descriptions[sectorId] || '';
}

function isStage1Valid() {
  if (!WizardState.sector) return false;
  if (WizardState.sector === 'other' && (!WizardState.customSector || WizardState.customSector.trim().length < 3)) {
    return false;
  }
  return true;
}

// ===================================
// STAGE 2: City Selection
// ===================================
let citySearchDebounce = null;

function renderStage2_City(container) {
  const regions = WizardState.cities.regions;

  container.innerHTML = `
    <div class="wizard-stage">
      <h2 class="stage-title">اختر مدينتك</h2>
      <p class="stage-subtitle">نفهم السوق المحلي والمنافسة في منطقتك</p>

      <div class="city-search-wrapper">
        <input type="text"
               id="citySearch"
               class="city-search"
               placeholder="ابحث عن مدينتك..."
               autocomplete="off">
        <span class="search-icon">🔍</span>
      </div>

      <div class="city-list" id="cityList">
        ${renderCityOptions(regions)}
      </div>

      ${WizardState.city === 'other' ? `
        <div class="custom-input-wrapper animate-fade-in">
          <label>اكتب اسم مدينتك</label>
          <input type="text"
                 id="customCityInput"
                 class="custom-input"
                 placeholder="اكتب اسم المدينة..."
                 value="${WizardState.customCity || ''}"
                 autofocus>
        </div>
      ` : ''}

      <div class="stage-nav">
        <button class="btn btn-outline" onclick="previousStage()">السابق</button>
        <button class="btn btn-primary btn-lg"
                onclick="nextStage()"
                ${!isStage2Valid() ? 'disabled' : ''}>
          التالي
        </button>
      </div>
    </div>
  `;

  // Search functionality
  const searchInput = document.getElementById('citySearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(citySearchDebounce);
      citySearchDebounce = setTimeout(() => {
        filterCities(e.target.value);
      }, SEARCH_DEBOUNCE_MS);
    });
  }

  // City selection
  setupCityListeners();

  // Custom city input
  if (WizardState.city === 'other') {
    const input = document.getElementById('customCityInput');
    if (input) {
      input.addEventListener('input', (e) => {
        WizardState.customCity = e.target.value;
        updateStageNavigation();
        saveState();
      });
    }
  }
}

function renderCityOptions(regions, filterText = '') {
  let html = '';

  regions.forEach(region => {
    const filteredCities = filterText
      ? region.cities.filter(city => city.includes(filterText))
      : region.cities;

    if (filteredCities.length > 0 || !filterText) {
      html += `
        <div class="city-region">
          <div class="city-region-name">${region.name}</div>
          <div class="city-region-cities">
            ${filteredCities.map(city => `
              <div class="city-option ${WizardState.city === city ? 'selected' : ''}"
                   data-city="${city}"
                   role="button"
                   tabindex="0">
                ${city}
                <span class="city-check">✓</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  });

  // Add "Other" option
  html += `
    <div class="city-region">
      <div class="city-region-name">أخرى</div>
      <div class="city-region-cities">
        <div class="city-option ${WizardState.city === 'other' ? 'selected' : ''}"
             data-city="other"
             role="button"
             tabindex="0">
          مدينة أخرى
          <span class="city-check">✓</span>
        </div>
      </div>
    </div>
  `;

  return html;
}

function filterCities(searchText) {
  const cityList = document.getElementById('cityList');
  if (!cityList) return;

  const regions = WizardState.cities.regions;
  cityList.innerHTML = renderCityOptions(regions, searchText);
  setupCityListeners();
}

function setupCityListeners() {
  document.querySelectorAll('.city-option').forEach(el => {
    el.addEventListener('click', () => selectCity(el.dataset.city));
    el.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        selectCity(el.dataset.city);
      }
    });
  });
}

function selectCity(city) {
  WizardState.city = city;

  if (city !== 'other') {
    WizardState.customCity = null;
  }

  renderStage2_City(document.getElementById('wizard-content'));
  Events.emit('citySelected', { city });
}

function isStage2Valid() {
  if (!WizardState.city) return false;
  if (WizardState.city === 'other' && (!WizardState.customCity || WizardState.customCity.trim().length < 2)) {
    return false;
  }
  return true;
}

// ===================================
// STAGE 3: Quick Probe
// ===================================
function renderStage3_Probe(container) {
  const sectorId = WizardState.sector === 'other' ? 'other' : WizardState.sector;
  const questions = WizardState.probes.sectors[sectorId] || [];

  container.innerHTML = `
    <div class="wizard-stage">
      <h2 class="stage-title">أسئلة سريعة</h2>
      <p class="stage-subtitle">تساعدنا نخصص العرض لوضعك الحالي</p>

      <div class="probe-questions">
        ${questions.map((q, idx) => renderProbeQuestion(q, idx)).join('')}
      </div>

      <div class="stage-nav">
        <button class="btn btn-outline" onclick="previousStage()">السابق</button>
        <button class="btn btn-primary btn-lg"
                onclick="nextStage()"
                ${!isStage3Valid() ? 'disabled' : ''}>
          التالي
        </button>
      </div>
    </div>
  `;

  setupProbeListeners();
}

function renderProbeQuestion(question, index) {
  const answer = WizardState.probeAnswers[question.id];

  // Check dependency
  if (question.dependsOn) {
    const [depId, depValue] = Object.entries(question.dependsOn)[0];
    if (WizardState.probeAnswers[depId] !== depValue) {
      return ''; // Hide dependent question
    }
  }

  let html = `<div class="probe-question" data-question-id="${question.id}">`;

  html += `<label class="probe-label">${question.label}</label>`;

  switch (question.type) {
    case 'boolean':
      html += `
        <div class="probe-boolean">
          <button class="probe-bool-btn ${answer === true ? 'selected' : ''}"
                  data-question="${question.id}"
                  data-value="true">
            نعم
          </button>
          <button class="probe-bool-btn ${answer === false ? 'selected' : ''}"
                  data-question="${question.id}"
                  data-value="false">
            لا
          </button>
        </div>
      `;
      break;

    case 'url':
      html += `
        <input type="url"
               class="probe-input"
               data-question="${question.id}"
               placeholder="${question.placeholder || 'https://example.com'}"
               value="${answer || ''}"
               ${question.required ? 'required' : ''}>
        ${question.hint ? `<p class="probe-hint">${question.hint}</p>` : ''}
        <div class="probe-error" id="error-${question.id}"></div>
      `;
      break;

    case 'select':
      html += `
        <select class="probe-select" data-question="${question.id}">
          <option value="">اختر...</option>
          ${question.options.map(opt => `
            <option value="${opt}" ${answer === opt ? 'selected' : ''}>${opt}</option>
          `).join('')}
          ${question.otherAllowed ? '<option value="__other__">أخرى</option>' : ''}
        </select>
      `;

      if (question.otherAllowed && answer === '__other__') {
        html += `
          <input type="text"
                 class="probe-input mt-sm"
                 data-question="${question.id}-other"
                 placeholder="اكتب الإجابة..."
                 value="${WizardState.probeAnswers[question.id + '_custom'] || ''}">
        `;
      }
      break;
  }

  html += `</div>`;
  return html;
}

function setupProbeListeners() {
  // Boolean buttons
  document.querySelectorAll('.probe-bool-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const questionId = e.target.dataset.question;
      const value = e.target.dataset.value === 'true';
      WizardState.probeAnswers[questionId] = value;
      renderStage3_Probe(document.getElementById('wizard-content'));
      Events.emit('probeAnswered', { questionId, value });
      saveState();
    });
  });

  // URL inputs
  document.querySelectorAll('.probe-input[type="url"]').forEach(input => {
    input.addEventListener('blur', (e) => {
      const questionId = e.target.dataset.question;
      const value = e.target.value;

      if (value && !isValidUrl(value)) {
        document.getElementById(`error-${questionId}`).textContent = 'رابط غير صحيح. يجب أن يبدأ بـ http:// أو https://';
        e.target.classList.add('error');
      } else {
        document.getElementById(`error-${questionId}`).textContent = '';
        e.target.classList.remove('error');
        WizardState.probeAnswers[questionId] = value;
        Events.emit('urlEntered', { questionId, value });
        saveState();
        updateStageNavigation();
      }
    });
  });

  // Select
  document.querySelectorAll('.probe-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const questionId = e.target.dataset.question;
      const value = e.target.value;
      WizardState.probeAnswers[questionId] = value;
      renderStage3_Probe(document.getElementById('wizard-content'));
      Events.emit('probeAnswered', { questionId, value });
      saveState();
    });
  });

  // Text inputs (for "other" options)
  document.querySelectorAll('.probe-input[type="text"]').forEach(input => {
    input.addEventListener('input', (e) => {
      const questionId = e.target.dataset.question;
      WizardState.probeAnswers[questionId] = e.target.value;
      saveState();
      updateStageNavigation();
    });
  });
}

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function isStage3Valid() {
  const sectorId = WizardState.sector === 'other' ? 'other' : WizardState.sector;
  const questions = WizardState.probes.sectors[sectorId] || [];

  for (const q of questions) {
    // Check dependency
    if (q.dependsOn) {
      const [depId, depValue] = Object.entries(q.dependsOn)[0];
      if (WizardState.probeAnswers[depId] !== depValue) {
        continue; // Skip dependent questions that shouldn't be shown
      }
    }

    if (q.required) {
      const answer = WizardState.probeAnswers[q.id];

      if (answer === undefined || answer === null || answer === '') {
        return false;
      }

      if (q.type === 'url' && answer && !isValidUrl(answer)) {
        return false;
      }
    }
  }

  return true;
}

// ===================================
// STAGE 4: Offers
// ===================================
function renderStage4_Offers(container) {
  const sectorId = WizardState.sector === 'other' ? 'restaurants' : WizardState.sector;
  const sector = WizardState.sectors.sectors.find(s => s.id === sectorId);

  if (!sector) {
    container.innerHTML = '<p>لم نتمكن من تحميل الباقات</p>';
    return;
  }

  const bundles = sector.bundles;
  const hookBundle = bundles.find(b => b.id === 'hook');

  // Auto-select hook if not selected
  if (!WizardState.selectedBundles.includes('hook')) {
    WizardState.selectedBundles = ['hook'];
  }

  container.innerHTML = `
    <div class="wizard-stage">
      <h2 class="stage-title">الباقات المقترحة</h2>
      <p class="stage-subtitle">ابدأ بالأساسية وأضف ما تحتاجه</p>

      <!-- Savings Bar -->
      <div id="savingsBarWizard" class="savings-bar-wizard"></div>

      <!-- Billing Period -->
      <div class="billing-selector-wizard card">
        <h3 class="mb-sm">مدة الفوترة</h3>
        <p class="text-secondary text-sm mb-md">التزام أطول = توفير أكبر</p>
        <select id="billingPeriodWizard" class="billing-select">
          <option value="m1" ${WizardState.billingPeriod === 'm1' ? 'selected' : ''}>شهر واحد</option>
          <option value="m3" ${WizardState.billingPeriod === 'm3' ? 'selected' : ''}>3 أشهر - وفر 10%</option>
          <option value="m6" ${WizardState.billingPeriod === 'm6' ? 'selected' : ''}>6 أشهر - وفر 18%</option>
          <option value="y12" ${WizardState.billingPeriod === 'y12' ? 'selected' : ''}>12 شهر - وفر 35%</option>
        </select>
      </div>

      <!-- Bundles Grid -->
      <div class="bundles-grid-wizard">
        ${bundles.map(bundle => renderBundleCardWizard(bundle, sector)).join('')}
      </div>

      <!-- Pricing Summary -->
      <div id="pricingSummaryWizard" class="pricing-summary-wizard card"></div>

      <div class="stage-nav">
        <button class="btn btn-outline" onclick="previousStage()">السابق</button>
        <button class="btn btn-primary btn-lg"
                onclick="nextStage()"
                ${!isStage4Valid() ? 'disabled' : ''}>
          التالي
        </button>
      </div>
    </div>
  `;

  // Setup listeners
  const billingSelect = document.getElementById('billingPeriodWizard');
  if (billingSelect) {
    billingSelect.addEventListener('change', (e) => {
      WizardState.billingPeriod = e.target.value;
      updateWizardPricing();
      Events.emit('durationChanged', { period: e.target.value });
      saveState();
    });
  }

  updateWizardPricing();
}

function renderBundleCardWizard(bundle, sector) {
  const isSelected = WizardState.selectedBundles.includes(bundle.id);
  const isHook = bundle.id === 'hook';
  const isLocked = !isHook && !isBundleUnlockedWizard(bundle, sector);

  return `
    <div class="bundle-card-wizard card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}"
         data-bundle-id="${bundle.id}">
      ${bundle.badge ? `<span class="badge">${bundle.badge}</span>` : ''}
      ${isLocked ? '<div class="lock-overlay"><span class="lock-icon">🔒</span></div>' : ''}

      <h3 class="bundle-title">${bundle.title}</h3>
      <div class="bundle-price">
        <span class="price-amount">${formatPrice(bundle.monthly)}</span>
        <span class="price-period">/ شهر</span>
      </div>

      <ul class="bundle-features">
        ${bundle.features.slice(0, 3).map(f => `<li>✓ ${f}</li>`).join('')}
      </ul>

      <button class="bundle-why-btn"
              onclick="showExplainer('${sector.id}', '${bundle.id}')">
        💡 ليش هذا مفيد؟
      </button>

      ${isHook ? `
        <button class="btn btn-sm btn-primary" disabled>محددة تلقائياً</button>
      ` : isLocked ? `
        <button class="btn btn-sm btn-outline" disabled>غير متاحة</button>
      ` : `
        <button class="btn btn-sm ${isSelected ? 'btn-accent' : 'btn-primary'}"
                onclick="toggleBundleWizard('${bundle.id}')">
          ${isSelected ? 'إلغاء' : 'إضافة'}
        </button>
      `}
    </div>
  `;
}

function isBundleUnlockedWizard(bundle, sector) {
  if (bundle.id === 'hook') return true;

  for (const selectedId of WizardState.selectedBundles) {
    const selectedBundle = sector.bundles.find(b => b.id === selectedId);
    if (selectedBundle && selectedBundle.unlocks && selectedBundle.unlocks.includes(bundle.id)) {
      return true;
    }
  }

  return false;
}

function toggleBundleWizard(bundleId) {
  const index = WizardState.selectedBundles.indexOf(bundleId);

  if (index > -1) {
    WizardState.selectedBundles.splice(index, 1);
  } else {
    WizardState.selectedBundles.push(bundleId);
  }

  Events.emit('bundleToggled', { bundleId, selected: index === -1 });
  renderStage4_Offers(document.getElementById('wizard-content'));
  saveState();
}

function updateWizardPricing() {
  const sectorId = WizardState.sector === 'other' ? 'restaurants' : WizardState.sector;
  const sector = WizardState.sectors.sectors.find(s => s.id === sectorId);

  if (!sector) return;

  const selectedBundlesData = WizardState.selectedBundles
    .map(id => sector.bundles.find(b => b.id === id))
    .filter(Boolean);

  const monthlyTotal = selectedBundlesData.reduce((sum, b) => sum + b.monthly, 0);
  const discount = WizardState.sectors.billing_discounts[WizardState.billingPeriod] || 0;
  const periodMonths = getPeriodMonths(WizardState.billingPeriod);

  const subtotal = monthlyTotal * periodMonths;
  const discountAmount = subtotal * discount;
  const total = subtotal - discountAmount;

  // Update savings bar
  const savingsBar = document.getElementById('savingsBarWizard');
  if (savingsBar) {
    const savingsPercent = (discount * 100).toFixed(0);
    const progressWidth = Math.min((WizardState.selectedBundles.length / 4) * 100, 100);

    savingsBar.innerHTML = `
      <div class="savings-content">
        <div class="savings-label">
          <span>💰 توفيرك الحالي</span>
          ${discountAmount > 0 ? `<span class="savings-badge">${savingsPercent}%</span>` : ''}
        </div>
        <div class="savings-amount text-gradient-accent">${formatPrice(discountAmount)}</div>
      </div>
      <div class="savings-progress">
        <div class="savings-progress-bar" style="width: ${progressWidth}%"></div>
      </div>
      <p class="savings-hint">أضف المزيد من الخدمات لزيادة التوفير</p>
    `;
  }

  // Update pricing summary
  const summary = document.getElementById('pricingSummaryWizard');
  if (summary) {
    summary.innerHTML = `
      <h3 class="mb-md">ملخص العرض</h3>
      <div class="pricing-breakdown">
        <div class="pricing-row">
          <span>عدد الخدمات:</span>
          <span class="font-bold">${WizardState.selectedBundles.length}</span>
        </div>
        <div class="pricing-row">
          <span>المدة:</span>
          <span class="font-bold">${getPeriodLabel(WizardState.billingPeriod)}</span>
        </div>
        <div class="pricing-row">
          <span>السعر قبل الخصم:</span>
          <span class="font-bold">${formatPrice(subtotal)}</span>
        </div>
        ${discountAmount > 0 ? `
          <div class="pricing-row success">
            <span>التوفير:</span>
            <span class="font-bold text-gradient-success">- ${formatPrice(discountAmount)}</span>
          </div>
        ` : ''}
        <div class="pricing-divider"></div>
        <div class="pricing-row total">
          <span>الإجمالي:</span>
          <span class="font-bold text-gradient-primary">${formatPrice(total)}</span>
        </div>
      </div>
    `;
  }
}

function isStage4Valid() {
  return WizardState.selectedBundles.length > 0;
}

// ===================================
// STAGE 5: Recap
// ===================================
function renderStage5_Recap(container) {
  const sectorLabel = WizardState.sector === 'other'
    ? WizardState.customSector
    : WizardState.sectors.sectors.find(s => s.id === WizardState.sector)?.label;

  const cityLabel = WizardState.city === 'other'
    ? WizardState.customCity
    : WizardState.city;

  const sectorId = WizardState.sector === 'other' ? 'restaurants' : WizardState.sector;
  const sector = WizardState.sectors.sectors.find(s => s.id === sectorId);

  const selectedBundlesData = WizardState.selectedBundles
    .map(id => sector?.bundles.find(b => b.id === id))
    .filter(Boolean);

  const pricing = calculateFinalPricing();

  container.innerHTML = `
    <div class="wizard-stage">
      <h2 class="stage-title">ملخص طلبك</h2>
      <p class="stage-subtitle">راجع اختياراتك وأكمل الطلب</p>

      <div class="recap-card card">
        <h3 class="recap-section-title">معلومات النشاط</h3>
        <div class="recap-info">
          <div class="recap-item">
            <span class="recap-label">المجال:</span>
            <span class="recap-value">${sectorLabel}</span>
          </div>
          <div class="recap-item">
            <span class="recap-label">المدينة:</span>
            <span class="recap-value">${cityLabel}</span>
          </div>
          ${WizardState.probeAnswers.site_url || WizardState.probeAnswers.store_url ? `
            <div class="recap-item">
              <span class="recap-label">الموقع:</span>
              <span class="recap-value">
                <a href="${WizardState.probeAnswers.site_url || WizardState.probeAnswers.store_url}"
                   target="_blank" class="recap-link">
                  ${WizardState.probeAnswers.site_url || WizardState.probeAnswers.store_url}
                </a>
              </span>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="recap-card card">
        <h3 class="recap-section-title">الخدمات المختارة</h3>
        <div class="recap-bundles">
          ${selectedBundlesData.map(b => `
            <div class="recap-bundle">
              <div class="recap-bundle-info">
                <span class="recap-bundle-title">${b.title}</span>
                <span class="recap-bundle-price">${formatPrice(b.monthly)}/شهر</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="recap-card card card-highlight">
        <h3 class="recap-section-title">الأسعار</h3>
        <div class="pricing-breakdown">
          <div class="pricing-row">
            <span>المدة:</span>
            <span class="font-bold">${getPeriodLabel(WizardState.billingPeriod)}</span>
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
      </div>

      <div class="recap-cta">
        <button class="btn btn-accent btn-lg" onclick="sendToWhatsAppWizard()">
          <span>أكمل عبر واتساب</span>
          <span>💬</span>
        </button>

        <button class="btn btn-outline btn-lg" onclick="downloadPDFWizard()">
          <span>تحميل العرض PDF</span>
          <span>📄</span>
        </button>

        <button class="btn btn-primary" onclick="bookCallWizard()">
          <span>احجز مكالمة مع مستشار</span>
          <span>📞</span>
        </button>
      </div>

      <div class="stage-nav">
        <button class="btn btn-outline" onclick="previousStage()">السابق</button>
        <button class="btn btn-sm" onclick="resetWizard()">إعادة البدء</button>
      </div>
    </div>
  `;
}

function calculateFinalPricing() {
  const sectorId = WizardState.sector === 'other' ? 'restaurants' : WizardState.sector;
  const sector = WizardState.sectors.sectors.find(s => s.id === sectorId);

  const selectedBundlesData = WizardState.selectedBundles
    .map(id => sector?.bundles.find(b => b.id === id))
    .filter(Boolean);

  const monthlyTotal = selectedBundlesData.reduce((sum, b) => sum + b.monthly, 0);
  const discount = WizardState.sectors.billing_discounts[WizardState.billingPeriod] || 0;
  const periodMonths = getPeriodMonths(WizardState.billingPeriod);

  const subtotal = monthlyTotal * periodMonths;
  const discountAmount = subtotal * discount;
  const total = subtotal - discountAmount;

  return { monthlyTotal, periodMonths, subtotal, discount, discountAmount, total };
}

function sendToWhatsAppWizard() {
  const sectorLabel = WizardState.sector === 'other'
    ? WizardState.customSector
    : WizardState.sectors.sectors.find(s => s.id === WizardState.sector)?.label;

  const cityLabel = WizardState.city === 'other'
    ? WizardState.customCity
    : WizardState.city;

  const sectorId = WizardState.sector === 'other' ? 'restaurants' : WizardState.sector;
  const sector = WizardState.sectors.sectors.find(s => s.id === sectorId);

  const selectedBundlesData = WizardState.selectedBundles
    .map(id => sector?.bundles.find(b => b.id === id))
    .filter(Boolean);

  const pricing = calculateFinalPricing();

  const bundlesTitles = selectedBundlesData.map(b => b.title).join('\n  • ');

  const websiteInfo = WizardState.probeAnswers.site_url || WizardState.probeAnswers.store_url
    ? `\n• الموقع الحالي: ${WizardState.probeAnswers.site_url || WizardState.probeAnswers.store_url}`
    : '';

  const message = `مرحباً فريق الهدف الأمثل،

أود الاستفسار عن عرض الجمعة البيضاء:

📋 التفاصيل:
• النشاط: ${sectorLabel}
• المدينة: ${cityLabel}${websiteInfo}
• مدة التعاقد: ${getPeriodLabel(WizardState.billingPeriod)}

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
  Events.emit('whatsappSent', {});
}

function downloadPDFWizard() {
  if (typeof window.generateOfferPDF === 'function') {
    const sectorLabel = WizardState.sector === 'other'
      ? WizardState.customSector
      : WizardState.sectors.sectors.find(s => s.id === WizardState.sector)?.label;

    const cityLabel = WizardState.city === 'other'
      ? WizardState.customCity
      : WizardState.city;

    const sectorId = WizardState.sector === 'other' ? 'restaurants' : WizardState.sector;
    const sector = WizardState.sectors.sectors.find(s => s.id === sectorId);

    const selectedBundlesData = WizardState.selectedBundles
      .map(id => sector?.bundles.find(b => b.id === id))
      .filter(Boolean);

    const pricing = calculateFinalPricing();

    const data = {
      sector: sectorLabel,
      city: cityLabel,
      bundles: selectedBundlesData,
      period: getPeriodLabel(WizardState.billingPeriod),
      pricing
    };

    window.generateOfferPDF(data);
  } else {
    showToast('ميزة PDF قريباً!', 'warning');
  }
}

function bookCallWizard() {
  window.open('https://calendly.com/optarget', '_blank');
}

function resetWizard() {
  if (confirm('هل تريد إعادة البدء من جديد؟ سيتم مسح جميع اختياراتك.')) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
}

// ===================================
// Validation
// ===================================
function validateCurrentStage() {
  switch (WizardState.currentStage) {
    case 0: return isStage1Valid();
    case 1: return isStage2Valid();
    case 2: return isStage3Valid();
    case 3: return isStage4Valid();
    case 4: return true;
    default: return false;
  }
}

function updateStageNavigation() {
  const nextBtn = document.querySelector('.stage-nav .btn-primary');
  if (nextBtn) {
    nextBtn.disabled = !validateCurrentStage();
  }
}

// ===================================
// Stage Progress
// ===================================
function updateStageProgress() {
  const progressEl = document.getElementById('stageProgress');
  if (!progressEl) return;

  const stageLabels = [
    'المجال',
    'المدينة',
    'الأسئلة',
    'الباقات',
    'المراجعة'
  ];

  progressEl.innerHTML = `
    <div class="stage-counter">${WizardState.currentStage + 1}/${TOTAL_STAGES}</div>
    <div class="stage-progress-label">${stageLabels[WizardState.currentStage]}</div>
    <div class="stage-progress-bar">
      <div class="stage-progress-fill" style="width: ${((WizardState.currentStage + 1) / TOTAL_STAGES) * 100}%"></div>
    </div>
  `;
}

// ===================================
// BenefitChat Component
// ===================================
const BenefitChat = {
  messages: [],
  maxVisible: 3,

  init() {
    // Listen to events
    Events.on('stageChange', (data) => this.onStageChange(data));
    Events.on('sectorSelected', (data) => this.onSectorSelected(data));
    Events.on('citySelected', (data) => this.onCitySelected(data));
    Events.on('bundleToggled', (data) => this.onBundleToggled(data));
    Events.on('durationChanged', (data) => this.onDurationChanged(data));
    Events.on('urlEntered', (data) => this.onUrlEntered(data));
  },

  addMessage(text, type = 'info') {
    this.messages.push({ text, type, timestamp: Date.now() });

    // Keep only last N messages
    if (this.messages.length > 10) {
      this.messages = this.messages.slice(-10);
    }

    this.render();
  },

  onStageChange(data) {
    const explainers = WizardState.explainers;
    if (!explainers) return;

    const stageMessages = {
      0: explainers.stages.sector_welcome,
      1: explainers.stages.city_welcome,
      2: explainers.stages.probe_welcome,
      3: explainers.stages.offers_welcome,
      4: explainers.stages.recap_welcome
    };

    if (stageMessages[data.stage]) {
      this.addMessage(stageMessages[data.stage]);
    }
  },

  onSectorSelected(data) {
    // Future: add sector-specific welcome
  },

  onCitySelected(data) {
    const sectorId = WizardState.sector === 'other' ? 'restaurants' : WizardState.sector;
    const explainers = WizardState.explainers;

    if (explainers && explainers[sectorId] && explainers[sectorId].city_context) {
      const cityContext = explainers[sectorId].city_context[data.city];
      if (cityContext) {
        this.addMessage(cityContext);
      }
    }
  },

  onBundleToggled(data) {
    if (!data.selected) return; // Only show when adding

    const sectorId = WizardState.sector === 'other' ? 'restaurants' : WizardState.sector;
    const explainers = WizardState.explainers;

    if (explainers && explainers[sectorId]) {
      const message = explainers[sectorId][data.bundleId];
      if (message) {
        this.addMessage(message, 'bundle');
      }
    }
  },

  onDurationChanged(data) {
    const explainers = WizardState.explainers;
    if (!explainers) return;

    const message = explainers.global.duration_tip[data.period];
    if (message) {
      this.addMessage(message, 'duration');
    }
  },

  onUrlEntered(data) {
    this.addMessage('ممتاز! رابط موقعك سيساعدنا نفهم وضعك الحالي بشكل أفضل.', 'success');
  },

  render() {
    const chatEl = document.getElementById('benefitChat');
    if (!chatEl) return;

    const visibleMessages = this.messages.slice(-this.maxVisible);

    chatEl.innerHTML = `
      <div class="benefit-chat-header">
        <span class="chat-avatar">💡</span>
        <span class="chat-title">مساعدك الذكي</span>
      </div>
      <div class="benefit-chat-messages">
        ${visibleMessages.map(msg => `
          <div class="chat-message animate-slide-in-left">
            <div class="chat-message-text">${msg.text}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
};

function initBenefitChat() {
  BenefitChat.init();

  // Add initial welcome
  if (WizardState.explainers) {
    BenefitChat.addMessage(WizardState.explainers.global.welcome);
  }
}

function showExplainer(sectorId, bundleId) {
  const explainers = WizardState.explainers;
  if (!explainers || !explainers[sectorId]) return;

  const message = explainers[sectorId][bundleId];
  if (message) {
    BenefitChat.addMessage(message, 'explainer');
    scrollToElement('benefitChat');
  }
}

// ===================================
// Utilities
// ===================================
function formatPrice(amount) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' ر.س';
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

function scrollToElement(id) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function showLoading(show) {
  WizardState.isLoading = show;
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

// ===================================
// State Management
// ===================================
function saveState() {
  const state = {
    currentStage: WizardState.currentStage,
    sector: WizardState.sector,
    customSector: WizardState.customSector,
    city: WizardState.city,
    customCity: WizardState.customCity,
    probeAnswers: WizardState.probeAnswers,
    selectedBundles: WizardState.selectedBundles,
    billingPeriod: WizardState.billingPeriod
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

    WizardState.currentStage = state.currentStage || 0;
    WizardState.sector = state.sector;
    WizardState.customSector = state.customSector;
    WizardState.city = state.city;
    WizardState.customCity = state.customCity;
    WizardState.probeAnswers = state.probeAnswers || {};
    WizardState.selectedBundles = state.selectedBundles || [];
    WizardState.billingPeriod = state.billingPeriod || 'm1';
  } catch (e) {
    console.error('Error restoring state:', e);
  }
}

// ===================================
// Initialize on DOM Load
// ===================================
document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
});

// Export functions for global access
window.nextStage = nextStage;
window.previousStage = previousStage;
window.selectSector = selectSector;
window.selectCity = selectCity;
window.toggleBundleWizard = toggleBundleWizard;
window.sendToWhatsAppWizard = sendToWhatsAppWizard;
window.downloadPDFWizard = downloadPDFWizard;
window.bookCallWizard = bookCallWizard;
window.resetWizard = resetWizard;
window.showExplainer = showExplainer;

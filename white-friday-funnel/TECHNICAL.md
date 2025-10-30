# 🔧 التوثيق الفني - Technical Documentation

## 📐 معمارية المشروع (Architecture)

### نمط المعمارية: State-Driven UI

المشروع يتبع نمط **State-Driven UI** حيث:
- حالة واحدة مركزية (`AppState`)
- كل تغيير في الحالة يُحدّث الواجهة
- استمرارية الحالة عبر LocalStorage

```javascript
AppState = {
  data: null,              // البيانات المحملة من sectors.json
  currentStep: 0,          // الخطوة الحالية (0-3)
  selectedSector: null,    // القطاع المختار
  answers: {},             // إجابات المستخدم
  selectedBundles: [],     // الباقات المختارة
  billingPeriod: 'm1',     // مدة الفوترة
  isLoading: false         // حالة التحميل
}
```

---

## 📁 هيكل الملفات والمسؤوليات

```
white-friday-funnel/
│
├── index.html (11KB)
│   ├── SEO & Meta Tags
│   ├── Schema.org Markup
│   ├── HTML Structure
│   └── External CDN Links
│
├── css/
│   ├── styles.css (9.5KB)
│   │   ├── Design Tokens (CSS Variables)
│   │   ├── Base Styles
│   │   ├── Typography
│   │   ├── Buttons
│   │   ├── Cards
│   │   ├── Animations
│   │   └── Utilities
│   │
│   └── components.css (17KB)
│       ├── Loader
│       ├── Header
│       ├── Hero
│       ├── Stepper
│       ├── Sector/City Selection
│       ├── Questions
│       ├── Bundles Grid
│       ├── Savings Bar
│       ├── Pricing Summary
│       ├── Trust Section
│       ├── Footer
│       └── Toast Notifications
│
├── js/
│   ├── app.js (23KB) - المنطق الرئيسي
│   │   ├── State Management
│   │   ├── Data Loading (fetch sectors.json)
│   │   ├── Step Navigation (4 steps)
│   │   ├── UI Rendering
│   │   ├── Bundle Unlock Logic
│   │   ├── Pricing Calculations
│   │   ├── WhatsApp Integration
│   │   ├── LocalStorage Persistence
│   │   └── Event Handlers
│   │
│   └── pdf.js (8KB) - تصدير PDF
│       ├── jsPDF Integration
│       ├── PDF Layout & Styling
│       ├── RTL Text Handling
│       └── Fallback Text Export
│
└── data/
    └── sectors.json (13KB)
        ├── 6 Sectors
        ├── Questions per Sector
        ├── Bundles with Unlock Logic
        └── Billing Discounts
```

**إجمالي الحجم:**
- HTML: 11KB
- CSS: 26.5KB
- JavaScript: 31KB
- JSON: 13KB
- **Total: ~81.5KB** ✅

---

## 🔄 دورة حياة التطبيق (Application Lifecycle)

### 1. التحميل الأولي (Initial Load)

```mermaid
DOMContentLoaded
    ↓
loadSectorsData()
    ↓
fetch('./data/sectors.json')
    ↓
AppState.data = response
    ↓
restoreState() // من LocalStorage
    ↓
initApp()
    ↓
renderSectorSelection()
    ↓
setupEventListeners()
```

### 2. التنقل بين الخطوات (Step Navigation)

```javascript
// Stepper Flow
Step 0: Sector Selection
   ↓ selectSector(id)
Step 1: City Selection
   ↓ selectCity(name)
Step 2: Questions
   ↓ submitQuestions()
Step 3: Bundles & Pricing
   ↓ toggleBundle(id)
   ↓ updatePricingDisplay()
```

### 3. حساب الأسعار (Pricing Calculation)

```javascript
calculatePricing() {
  // 1. جمع أسعار الباقات المختارة
  monthlyTotal = sum(selectedBundles.map(b => b.monthly))

  // 2. حساب الفترة
  periodMonths = getPeriodMonths(billingPeriod)

  // 3. المجموع قبل الخصم
  subtotal = monthlyTotal * periodMonths

  // 4. الخصم
  discount = billing_discounts[billingPeriod]
  discountAmount = subtotal * discount

  // 5. الإجمالي بعد الخصم
  total = subtotal - discountAmount

  return { monthlyTotal, subtotal, discountAmount, total }
}
```

**مثال:**
```
3 باقات: 1199 + 2299 + 3499 = 6,997 ر.س/شهر
الفترة: 12 شهر
المجموع: 6997 × 12 = 83,964 ر.س
الخصم 35%: 83964 × 0.35 = 29,387 ر.س
الإجمالي: 83964 - 29387 = 54,577 ر.س
```

---

## 🔓 نظام Unlock Logic

### المبدأ

كل باقة تحتوي على `unlocks: [...]` تحدد الباقات التي تفتحها:

```json
{
  "id": "hook",
  "unlocks": ["web_pro", "mkt_pro", "washeej_growth"]
}
```

### الخوارزمية

```javascript
function isBundleUnlocked(bundle) {
  // 1. Hook دائماً مفتوح
  if (bundle.id === 'hook') return true;

  // 2. تحقق من كل باقة مختارة
  for (const selectedId of selectedBundles) {
    const selectedBundle = bundles.find(b => b.id === selectedId);

    // 3. إذا الباقة المختارة تفتح هذه الباقة
    if (selectedBundle.unlocks?.includes(bundle.id)) {
      return true;
    }
  }

  // 4. إذا لم تفتح، ترجع false
  return false;
}
```

### مثال تطبيقي

```
المستخدم اختار: [hook]
  → hook.unlocks = [web_pro, mkt_pro, washeej_growth]
  → الباقات المتاحة: web_pro, mkt_pro, washeej_growth

المستخدم أضاف: web_pro
  → web_pro.unlocks = [mkt_pro]
  → لا باقات جديدة (mkt_pro مفتوحة أصلاً)

المستخدم أزال: web_pro
  → removeLockedBundles()
  → إذا كانت هناك باقات تعتمد فقط على web_pro، تُزال
```

---

## 💾 نظام LocalStorage

### البيانات المحفوظة

```javascript
const storageKey = 'whiteFridayFunnelState';

const savedState = {
  currentStep: 3,
  selectedSector: 'restaurants',
  answers: {
    city: 'المدينة المنورة',
    has_site: false,
    has_social: true
  },
  selectedBundles: ['hook', 'web_pro', 'mkt_pro'],
  billingPeriod: 'y12'
};

localStorage.setItem(storageKey, JSON.stringify(savedState));
```

### استراتيجية الحفظ

- **متى يحفظ؟**
  - بعد كل تغيير في الحالة
  - عند اختيار قطاع/مدينة
  - عند إضافة/إزالة باقة
  - عند تغيير مدة الفوترة

- **متى يُستعاد؟**
  - عند تحميل الصفحة (DOMContentLoaded)
  - بعد تحميل `sectors.json`

### معالجة الأخطاء

```javascript
function saveState() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    // QuotaExceededError
    console.error('LocalStorage full', e);
  }
}

function restoreState() {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const state = JSON.parse(saved);
      // Validate & restore
    }
  } catch (e) {
    // JSON.parse error
    console.error('Invalid saved state', e);
    localStorage.removeItem(key);
  }
}
```

---

## 📞 تكامل واتساب

### بناء الرسالة

```javascript
const message = `
مرحباً فريق الهدف الأمثل،

📋 التفاصيل:
• النشاط: ${sector}
• المدينة: ${city}
• مدة التعاقد: ${period}

🎁 الخدمات المختارة:
${bundles.map(b => '  • ' + b.title).join('\n')}

💰 الأسعار:
• السعر قبل التوفير: ${subtotal}
• التوفير: ${discount}
• الإجمالي بعد الخصم: ${total}

أود إتمام العرض أو التحدث مع مستشار.
`;
```

### تشفير URL

```javascript
const encodedMessage = encodeURIComponent(message);
const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
window.open(whatsappUrl, '_blank');
```

### التوافق

- **Desktop**: يفتح واتساب ديسكتوب أو ويب
- **Mobile**: يفتح تطبيق واتساب مباشرة
- **Fallback**: إذا لم يعمل، نسخ الرسالة للكليبورد

---

## 📄 نظام PDF

### المكتبة المستخدمة

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

### بنية PDF

```javascript
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

// Header (40mm)
doc.setFillColor(11, 16, 35);
doc.rect(0, 0, pageWidth, 40, 'F');
doc.text('الهدف الأمثل', x, y);

// Content (معلومات النشاط + الخدمات)
// Pricing Summary (بوكس ملون)
// Footer (خط فاصل + معلومات تواصل)
```

### دعم RTL

```javascript
doc.setLanguage('ar');
doc.setR2L(true);
doc.text(text, x, y, { align: 'right' });
```

### Fallback

إذا فشل تحميل jsPDF:

```javascript
if (typeof window.jspdf === 'undefined') {
  // Fallback to text file
  generateSimplePDFText(data);
}
```

---

## 🎨 نظام التصميم (Design System)

### CSS Variables Strategy

```css
:root {
  /* Primitive tokens */
  --color-blue-900: #0B1023;
  --color-purple-500: #6C63FF;

  /* Semantic tokens */
  --bg-start: var(--color-blue-900);
  --primary: var(--color-purple-500);

  /* Component tokens */
  --btn-bg: var(--primary);
  --card-bg: var(--bg-card);
}
```

### Naming Convention

```
[prefix]-[component]-[element]-[modifier]
```

**أمثلة:**
- `.btn-primary-lg`
- `.card-highlight`
- `.savings-bar-progress`

### Animation System

```css
/* Define once */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Use everywhere */
.animate-fade-in {
  animation: fadeIn var(--transition-base) ease-out;
}
```

**استخدام JavaScript:**
```javascript
element.classList.add('animate-fade-in');
```

---

## ⚡ تحسينات الأداء (Performance)

### 1. تقليل DOM Operations

**❌ سيء:**
```javascript
bundles.forEach(b => {
  const div = document.createElement('div');
  div.innerHTML = `<h3>${b.title}</h3>`;
  container.appendChild(div); // DOM operation لكل باقة
});
```

**✅ جيد:**
```javascript
const html = bundles.map(b => `<h3>${b.title}</h3>`).join('');
container.innerHTML = html; // DOM operation واحدة
```

### 2. Event Delegation

**❌ سيء:**
```javascript
buttons.forEach(btn => {
  btn.addEventListener('click', handler); // listener لكل زر
});
```

**✅ جيد:**
```javascript
container.addEventListener('click', (e) => {
  if (e.target.matches('button')) {
    handler(e);
  }
});
```

### 3. Debouncing للحسابات

```javascript
let timeout;
function updatePricing() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    calculatePricing();
    renderPricingSummary();
  }, 200);
}
```

### 4. Lazy Loading

```javascript
// تحميل البيانات فقط عند الحاجة
async function loadSectorData(sectorId) {
  if (!cache[sectorId]) {
    cache[sectorId] = await fetch(`./data/${sectorId}.json`);
  }
  return cache[sectorId];
}
```

---

## 🧪 استراتيجيات الاختبار

### Unit Testing (مقترح)

```javascript
// tests/pricing.test.js
describe('calculatePricing', () => {
  test('3 bundles, 12 months, 35% discount', () => {
    const bundles = [
      { monthly: 1199 },
      { monthly: 2299 },
      { monthly: 3499 }
    ];
    const result = calculatePricing(bundles, 'y12');

    expect(result.monthlyTotal).toBe(6997);
    expect(result.subtotal).toBe(83964);
    expect(result.discountAmount).toBe(29387);
    expect(result.total).toBe(54577);
  });
});
```

### Integration Testing

```javascript
// tests/funnel.test.js
test('Complete funnel flow', async () => {
  // 1. Load page
  await page.goto('http://localhost:8000');

  // 2. Select sector
  await page.click('[data-sector="restaurants"]');

  // 3. Select city
  await page.click('[data-city="المدينة المنورة"]');

  // 4. Answer questions
  await page.click('input[name="has_site"][value="false"]');
  await page.click('button:has-text("التالي")');

  // 5. Select bundles
  await page.click('[data-bundle-id="web_pro"]');

  // 6. Check pricing
  const total = await page.textContent('.pricing-row.total');
  expect(total).toContain('ر.س');
});
```

### Performance Testing

```javascript
// tests/performance.test.js
test('Load time < 2s', async () => {
  const start = Date.now();
  await page.goto('http://localhost:8000');
  const loadTime = Date.now() - start;

  expect(loadTime).toBeLessThan(2000);
});
```

---

## 🔒 الأمان (Security)

### XSS Prevention

```javascript
// ✅ استخدام textContent بدلاً من innerHTML للنصوص
element.textContent = userInput;

// ✅ Sanitize HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### LocalStorage Security

```javascript
// ❌ لا تحفظ بيانات حساسة
localStorage.setItem('password', 'secret'); // NO!

// ✅ فقط بيانات الحالة العامة
localStorage.setItem('selectedBundles', JSON.stringify([...])); // OK
```

### CORS

```javascript
// في الإنتاج، استخدم نفس النطاق
// أو ضبط CORS headers على الخادم
Access-Control-Allow-Origin: https://optarget.sa
```

---

## 🚀 النشر (Deployment)

### البيئات

**Development:**
```bash
npm run dev
# http://localhost:8000
```

**Production:**
```bash
# 1. Upload to server
scp -r . user@server:/var/www/white-friday

# 2. Configure Nginx
location /white-friday {
  alias /var/www/white-friday;
  try_files $uri $uri/ /index.html;
}

# 3. Enable HTTPS
certbot --nginx -d optarget.sa
```

### CDN Optimization

```html
<!-- استخدام CDN للمكتبات -->
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1"></script>

<!-- Preconnect للخطوط -->
<link rel="preconnect" href="https://fonts.gstatic.com">
```

### Caching Strategy

```nginx
# Nginx config
location ~* \.(css|js|json)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location = /index.html {
  expires -1;
  add_header Cache-Control "no-cache";
}
```

---

## 📊 المقاييس والتحليلات

### Custom Events

```javascript
// تتبع الخطوات
function trackStep(step) {
  gtag('event', 'funnel_step', {
    step_number: step,
    step_name: getStepName(step)
  });
}

// تتبع الباقات
function trackBundleSelection(bundleId, action) {
  gtag('event', 'bundle_interaction', {
    bundle_id: bundleId,
    action: action // 'add' or 'remove'
  });
}

// تتبع التحويلات
function trackConversion(type) {
  gtag('event', 'conversion', {
    type: type // 'whatsapp', 'pdf', 'call'
  });
}
```

### KPIs المهمة

```
1. Funnel Completion Rate
   = (users_reached_step_4 / total_users) × 100

2. Average Bundles per User
   = sum(bundles_selected) / users_reached_step_4

3. WhatsApp Conversion Rate
   = (whatsapp_clicks / users_reached_step_4) × 100

4. Average Deal Value
   = sum(total_prices) / whatsapp_clicks
```

---

## 🔮 التطويرات المستقبلية

### Phase 2 Features

- [ ] دعم اللغة الإنجليزية
- [ ] تكامل مع بوابات الدفع
- [ ] Dashboard للإحصائيات
- [ ] A/B Testing مدمج
- [ ] Chatbot ذكي
- [ ] حساب شخصي للمستخدم

### Technical Improvements

- [ ] TypeScript migration
- [ ] React/Vue version
- [ ] PWA support
- [ ] Offline mode
- [ ] Unit tests
- [ ] CI/CD pipeline

---

**آخر تحديث: 2025-10-30**
